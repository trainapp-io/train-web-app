# Workout History & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic workout log history list with a modern 4-tab analytics dashboard (Overview / History / Progress / Exercises) that competes with Hevy and MyFitnessPal.

**Architecture:** A new `GET /workout-logs/analytics` endpoint in train-service runs a MongoDB `$facet` aggregation pipeline and returns pre-computed stats. The frontend calls this one endpoint plus the existing history list endpoint — no client-side number crunching. A separate `GET /workout-logs/analytics/exercises/:name` endpoint powers the per-exercise strength curve in the Progress tab.

**Tech Stack:** React 19 + TypeScript, custom CSS (matching existing `#7c3aed` purple design system), recharts for bar/line charts, React Query for caching, MongoDB aggregation pipelines in train-service on the `ng-workout` branch.

---

## Design Decisions

### What we are NOT building
- Coach client-selector view (Phase 2)
- Push notifications for streaks
- Social/sharing features
- Nutrition tracking

### Analytics are computed server-side
All aggregation runs in MongoDB via `$facet` pipelines. The frontend never iterates over raw log arrays to compute stats — it consumes the pre-aggregated response.

### Streak calculation
Streak (consecutive days with at least one completed workout) is computed in the service layer from the array of `actualStartDate` values returned by the aggregation, not in MongoDB. This keeps the pipeline simpler.

### Estimated 1-rep max
The Progress tab's strength curve uses the Brzycki formula: `weight × (36 / (37 - reps))`. Computed in the service layer, not stored.

### Muscle group distribution
Derived from `workoutSnapshot.category[]` across sessions in the selected range. If a session has no categories, it is excluded from the muscle group chart.

### Volume calculation
`totalVolumeLbs` for any session/exercise/set = `actualWeight × actualReps` for each **completed** set (`isCompleted: true`).

### Range semantics
- `week` → last 7 calendar days from today
- `month` → current calendar month (1st to today)  
- `year` → current calendar year (Jan 1 to today)

Volume trend bucketing:
- `week` → 7 daily bars (Mon–Sun)
- `month` → 4–5 weekly bars
- `year` → 12 monthly bars

---

## MongoDB Index

Add a compound index to `WorkoutLog` for analytics query performance:

```js
WorkoutLogSchema.index({ userId: 1, actualStartDate: -1 });
```

No new MongoDB collections are needed.

---

## train-core: New Types

Add to `@trainapp-io/train-core` `src/core/dto/program.dto.ts`:

```typescript
export interface ActivityDay {
  date: string;           // ISO date "2026-04-12"
  count: number;          // workouts logged that day
}

export interface VolumeTrendPoint {
  label: string;          // "Mon", "W1", "Jan" etc.
  volumeLbs: number;
  workoutCount: number;
}

export interface ExercisePR {
  exerciseName: string;
  maxWeight: number;
  reps: number;
  sets: number;
  date: string;           // ISO date
  previousMaxWeight?: number;
  isNewPR: boolean;       // PR set within the selected range
}

export interface ExerciseSummary {
  name: string;
  sessionCount: number;
  allTimePRWeight: number;
  allTimePRReps: number;
  lastSessionWeight: number;
  lastSessionReps: number;
  lastLoggedAt: string;   // ISO date
  totalVolumeLbs: number;
  isNewPR: boolean;
}

export interface MuscleGroupStat {
  group: string;
  percentage: number;
  sessionCount: number;
}

export interface WorkoutAnalyticsResponse {
  range: 'week' | 'month' | 'year';
  totalWorkouts: number;
  totalDurationSec: number;
  totalVolumeLbs: number;
  currentStreak: number;
  longestStreak: number;
  activityByDay: ActivityDay[];      // always current calendar month
  volumeTrend: VolumeTrendPoint[];
  personalRecords: ExercisePR[];     // top 5 by max weight
  muscleGroups: MuscleGroupStat[];
  exerciseStats: ExerciseSummary[];  // all exercises, sorted by lastLoggedAt desc
}

export interface ExerciseProgressPoint {
  date: string;
  estimatedOneRepMax: number;        // Brzycki: weight * (36 / (37 - reps))
  maxWeight: number;
  reps: number;
}

export interface ExerciseSessionSet {
  weight: number;
  reps: number;
  isCompleted: boolean;
  note?: string;
}

export interface ExerciseSessionDetail {
  date: string;
  sets: ExerciseSessionSet[];
  totalVolumeLbs: number;
}

export interface ExerciseProgressResponse {
  exerciseName: string;
  allTimePR: {
    weight: number;
    reps: number;
    date: string;
    estimatedOneRepMax: number;
  };
  progressOverTime: ExerciseProgressPoint[];
  sessionHistory: ExerciseSessionDetail[];
}
```

---

## Backend: train-service (ng-workout branch)

### New files

**`src/app/workoutLogs/WorkoutLogAnalyticsService.ts`**

Owns all aggregation logic. Exposes two methods:
- `getAnalytics(userId, range)` → `WorkoutAnalyticsResponse`
- `getExerciseProgress(userId, exerciseName)` → `ExerciseProgressResponse`

`getAnalytics` runs a single `$facet` aggregation with these sub-pipelines:
1. **summary** — count, total duration, array of all session dates (for streak)
2. **activityByDay** — group by `$dateToString` of `actualStartDate` → count per day
3. **volumeTrend** — unwind blockLogs → exerciseLogs → setLogs, filter `isCompleted: true`, group by date bucket, sum `weight × reps`
4. **exerciseStats** — unwind to setLogs, group by exercise name: maxWeight, totalVolume, sessionCount (via `$addToSet` on `_id`), lastLoggedAt
5. **muscleGroups** — unwind `workoutSnapshot.category`, group by category name, count

After the `$facet` result, the service computes:
- `currentStreak` and `longestStreak` from the dates array (sort desc, walk consecutive days)
- `estimatedOneRepMax` for each PR (Brzycki formula)
- `personalRecords` — top 5 exercises from exerciseStats sorted by `allTimePRWeight` desc
- `muscleGroups` as percentages

`getExerciseProgress` filters logs containing the named exercise, unwinds to setLogs, groups by session date, returns session-level detail and the progress curve.

### Modified files

**`src/infrastructure/database/repositories/programs/WorkoutLogRepository.ts`**

Add method:
```typescript
getAnalyticsAggregate(userId: Types.ObjectId, matchStage: object): Promise<any>
// Runs the aggregation pipeline and returns the raw $facet result
```

**`src/app/workoutLogs/WorkoutLogService.ts`**

Add dependency on `WorkoutLogAnalyticsService`. Delegate analytics calls to it:
```typescript
getWorkoutAnalytics(userId, range): Promise<WorkoutAnalyticsResponse>
getExerciseProgress(userId, exerciseName): Promise<ExerciseProgressResponse>
```

**`src/app/workoutLogs/WorkoutLogController.ts`**

Add two handler methods:
```typescript
getWorkoutAnalytics   // GET /workout-logs/analytics?range=
getExerciseProgress   // GET /workout-logs/analytics/exercises/:exerciseName
```

**`src/routes/workout-logs.routes.ts`**

Add two routes **before** the existing `/:logId` routes (to prevent "analytics" being treated as a logId):
```typescript
router.get('/analytics', authMiddleware.authenticateToken, workoutLogController.getWorkoutAnalytics);
router.get('/analytics/exercises/:exerciseName', authMiddleware.authenticateToken, workoutLogController.getExerciseProgress);
```

---

## Frontend: train-web-app

### Install recharts
```bash
npm install recharts
```
recharts ships its own TypeScript types — no `@types/recharts` needed.

### New files

**`src/app/workout-logs/services/analyticsService.ts`**

```typescript
class AnalyticsService extends BaseApiService<...> {
  getAnalytics(range: 'week' | 'month' | 'year'): Promise<WorkoutAnalyticsResponse>
  getExerciseProgress(exerciseName: string): Promise<ExerciseProgressResponse>
}
export const analyticsService = new AnalyticsService();
```

**`src/services/apiHooks.ts`** — add two hooks:

```typescript
export function useWorkoutAnalytics(range: 'week' | 'month' | 'year') {
  return useApiQuery<WorkoutAnalyticsResponse>(
    ['workoutAnalytics', range],
    `/workout-logs/analytics`,
    { range }
  );
}

export function useExerciseProgress(exerciseName: string, enabled: boolean) {
  return useApiQuery<ExerciseProgressResponse>(
    ['exerciseProgress', exerciseName],
    `/workout-logs/analytics/exercises/${encodeURIComponent(exerciseName)}`,
    undefined,
    { enabled }
  );
}
```

**`src/app/workout-logs/components/analytics/WorkoutAnalytics.css`**

All new CSS classes use `.wla-` prefix (workout log analytics). Matches the existing purple design system (`#7c3aed`, `#f7f7fa` background, `#f0f0f3` borders, 14px border-radius cards). Key classes:

```css
.wla-page              /* full page container, max-width 640px, margin auto */
.wla-header            /* sticky top header: title + range toggle */
.wla-range-toggle      /* W/M/Y pill toggle */
.wla-range-btn         /* individual range pill, --active variant */
.wla-tabs              /* tab bar row */
.wla-tab               /* individual tab, --active variant with purple underline */
.wla-body              /* scrollable content area, padding-bottom 80px */
.wla-stat-grid         /* 2-column CSS grid for stat cards */
.wla-stat-card         /* stat card base */
.wla-stat-card--primary  /* purple bg */
.wla-stat-card--pr       /* green tint bg for PRs */
.wla-card              /* generic white card with border */
.wla-card__title       /* uppercase label inside card */
.wla-heatmap-grid      /* 7-column CSS grid for activity heatmap */
.wla-heatmap-day       /* individual day cell, data-intensity 0/1/2 */
.wla-pr-row            /* exercise PR list row */
.wla-muscle-bar        /* horizontal bar for muscle group */
.wla-history-card      /* workout log card in History tab */
.wla-exercise-row      /* exercise row in Exercises tab */
.wla-exercise-pr-card  /* gradient PR highlight card in Progress tab */
```

**`src/app/workout-logs/components/analytics/StatCard.tsx`**

```typescript
interface StatCardProps {
  value: string;
  label: string;
  variant?: 'default' | 'primary' | 'pr';
}
```

**`src/app/workout-logs/components/analytics/ActivityHeatmap.tsx`**

Pure CSS grid — no library. Receives `activityByDay: ActivityDay[]` and `month: Date`. Renders a 7-column grid (Sun–Sat) for the current month. Days with count 0 = `#ede9fe` (faint), 1 = `#c4b5fd` (medium), 2+ = `#7c3aed` (full). Today gets a border ring. Future days = `#e5e7eb` (greyed out).

**`src/app/workout-logs/components/analytics/VolumeBarChart.tsx`**

Thin wrapper around `recharts` `BarChart`. Props: `data: VolumeTrendPoint[]`. Uses brand colors (`#7c3aed` for current period, `#c4b5fd` for past). Responsive via `ResponsiveContainer`. No axis labels on mobile — only the period label below each bar.

**`src/app/workout-logs/components/analytics/StrengthLineChart.tsx`**

Thin wrapper around `recharts` `LineChart`. Props: `data: ExerciseProgressPoint[]`. Single line for `estimatedOneRepMax`. Dots at each data point. Tooltip shows date + estimated 1RM + actual weight/reps.

**`src/app/workout-logs/components/analytics/OverviewTab.tsx`**

Renders (top to bottom):
1. `StatCard` grid — workouts in range, total time, streak, latest PR
2. `ActivityHeatmap` card — current month
3. `VolumeBarChart` card — weekly/monthly/yearly volume trend
4. Personal Records list — top 5 exercises with max weight, delta vs previous period
5. Muscle Groups — horizontal progress bars from `muscleGroups[]`

All data comes from `WorkoutAnalyticsResponse` passed as props. No data fetching inside.

**`src/app/workout-logs/components/analytics/HistoryTab.tsx`**

- Controlled search input (filters `workoutLogs` client-side by `workoutSnapshot.name`)
- Month-grouped list of `WorkoutLogResponse` cards
- Each card: name, date/time, duration, exercise count, total volume (computed from setLogs), status badge (Done / Partial)
- PR badge on cards where any exercise hit a new PR (cross-reference against `personalRecords` from analytics response)
- Tapping a card navigates to existing `/workout-logs/:logId` detail page
- Pagination: show 20 most recent, "Load more" appends next 20 from the already-loaded `workoutLogs` array (no extra API call)

**`src/app/workout-logs/components/analytics/ProgressTab.tsx`**

- Exercise picker dropdown (list of exercise names from `exerciseStats[]`)
- When an exercise is selected, calls `useExerciseProgress(name)` (React Query caches per name)
- PR highlight card (gradient purple, all-time best + "+X lbs since you started")
- `StrengthLineChart` — estimated 1RM over time
- `VolumeBarChart` — volume per session (uses `sessionHistory` data)
- Set breakdown table for the most recent session

**`src/app/workout-logs/components/analytics/ExercisesTab.tsx`**

- Search input (client-side filter on `exerciseStats[].name`)
- Scrollable filter chips for muscle groups (derived from `muscleGroups[]`)
- List of exercise rows from `exerciseStats[]`, sorted by `lastLoggedAt` desc
- Each row: avatar letter + name + muscle group + session count, PR weight, PR indicator, last/best/volume summary
- Tapping a row sets the selected exercise in `ProgressTab` and switches to the Progress tab

**`src/app/workout-logs/pages/WorkoutAnalytics.tsx`**

Top-level page component. Owns:
- `activeTab: 'overview' | 'history' | 'progress' | 'exercises'` state
- `range: 'week' | 'month' | 'year'` state (default `'week'`)
- `selectedExercise: string` state (shared between Exercises and Progress tabs)
- Calls `useWorkoutAnalytics(range)` and `useWorkoutLogHistory()` at the top
- Passes data down to active tab component
- Renders sticky header with title, range toggle, and tab bar
- On exercise tap in ExercisesTab: `setSelectedExercise(name); setActiveTab('progress')`

### Modified files

**Navigation routing** — replace `WorkoutLogHistory` with `WorkoutAnalytics` at `/workout-logs/history`. The existing `WorkoutLogDetail`, `WorkoutLogCreate`, and `WorkoutLogEdit` pages are unchanged.

Update `src/components/navigation/Navigation.tsx` and swap:
```typescript
// Before
import WorkoutLogHistory from '../workout-logs/pages/WorkoutLogHistory';
// route: <Route path="/workout-logs/history" element={<WorkoutLogHistory />} />

// After
import WorkoutAnalytics from '../workout-logs/pages/WorkoutAnalytics';
// route: <Route path="/workout-logs/history" element={<WorkoutAnalytics />} />
```

---

## File Summary

### train-service (ng-workout branch) — new
- `src/app/workoutLogs/WorkoutLogAnalyticsService.ts`

### train-service — modified
- `src/infrastructure/database/repositories/programs/WorkoutLogRepository.ts`
- `src/app/workoutLogs/WorkoutLogService.ts`
- `src/app/workoutLogs/WorkoutLogController.ts`
- `src/routes/workout-logs.routes.ts`
- `src/infrastructure/database/models/programs/workoutLogModel.ts` (add index)

### train-core — modified
- `src/core/dto/program.dto.ts` (add 9 new interfaces)

### train-web-app — new
- `src/app/workout-logs/services/analyticsService.ts`
- `src/app/workout-logs/pages/WorkoutAnalytics.tsx`
- `src/app/workout-logs/components/analytics/WorkoutAnalytics.css`
- `src/app/workout-logs/components/analytics/StatCard.tsx`
- `src/app/workout-logs/components/analytics/ActivityHeatmap.tsx`
- `src/app/workout-logs/components/analytics/VolumeBarChart.tsx`
- `src/app/workout-logs/components/analytics/StrengthLineChart.tsx`
- `src/app/workout-logs/components/analytics/OverviewTab.tsx`
- `src/app/workout-logs/components/analytics/HistoryTab.tsx`
- `src/app/workout-logs/components/analytics/ProgressTab.tsx`
- `src/app/workout-logs/components/analytics/ExercisesTab.tsx`

### train-web-app — modified
- `src/services/apiHooks.ts`
- Navigation routing file (swap WorkoutLogHistory → WorkoutAnalytics)

---

## Error & Loading States

- Analytics endpoint: show skeleton stat cards and chart placeholders (CSS animated shimmer) while loading
- Empty state (zero workouts logged): full-page empty state with a "Log your first workout" CTA button
- Exercise Progress with no data for selected exercise: "No data yet — log this exercise to see your progress"
- Network error: inline error card with retry button; do not crash the whole page

---

## Testing

Each component can be tested with Vitest + React Testing Library using mock `WorkoutAnalyticsResponse` fixtures. Key test cases:

- `ActivityHeatmap`: renders correct number of cells for a given month, applies correct intensity classes
- `StrengthLineChart`: renders without crashing with empty `progressOverTime` array
- `WorkoutAnalytics` page: shows loading skeleton when `isLoading: true`; shows empty state when `totalWorkouts === 0`; tab switching renders correct child component
- `WorkoutLogAnalyticsService` (backend): streak calculation — consecutive days with gaps; Brzycki formula edge case where reps >= 37 (clamp to 1 set)
