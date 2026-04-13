# Workout History & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic workout log history list with a modern 4-tab analytics dashboard (Overview / History / Progress / Exercises) that competes with Hevy and MyFitnessPal.

**Architecture:** A new `GET /workout-logs/analytics` endpoint in train-service runs two MongoDB `$facet` aggregation pipelines (range-based and all-time) and returns pre-computed stats. The frontend calls this endpoint plus the existing `GET /workout-logs` history endpoint — no client-side number crunching. A separate `GET /workout-logs/analytics/exercises/:name` powers the per-exercise strength curve in the Progress tab.

**Tech Stack:** React 19 + TypeScript, custom CSS with `.wla-` prefix, recharts for bar/line charts, React Query for caching, MongoDB aggregation pipelines in train-service on the `ng-workout` branch. train-core on `main` branch.

---

## File Structure

### train-core (`main` branch)
- Modify: `src/core/dto/program.dto.ts` — add 9 analytics interfaces
- No new files needed; existing barrel export (`src/core/dto/index.ts`) already re-exports everything

### train-service (`ng-workout` branch)
- Modify: `src/infrastructure/database/models/programs/workoutLogModel.ts` — add compound index
- Modify: `src/infrastructure/database/repositories/programs/WorkoutLogRepository.ts` — add `runAggregatePipeline` method + update interface
- Create: `src/app/workoutLogs/WorkoutLogAnalyticsService.ts` — owns all aggregation logic
- Modify: `src/app/workoutLogs/WorkoutLogService.ts` — add `getWorkoutAnalytics` + `getExerciseProgress` + update interface
- Modify: `src/app/workoutLogs/WorkoutLogController.ts` — add `getWorkoutAnalytics` + `getExerciseProgress` handlers
- Modify: `src/routes/workout-logs.routes.ts` — add two analytics routes **before** `/:logId`
- Create: `tests/unit/app/workoutLogs/WorkoutLogAnalyticsService.test.ts`

### train-web-app (`ng-test` branch)
- Modify: `src/services/apiHooks.ts` — add `useWorkoutAnalytics` + `useExerciseProgress`
- Create: `src/app/workout-logs/components/analytics/WorkoutAnalytics.css`
- Create: `src/app/workout-logs/components/analytics/StatCard.tsx`
- Create: `src/app/workout-logs/components/analytics/ActivityHeatmap.tsx`
- Create: `src/app/workout-logs/components/analytics/VolumeBarChart.tsx`
- Create: `src/app/workout-logs/components/analytics/StrengthLineChart.tsx`
- Create: `src/app/workout-logs/components/analytics/OverviewTab.tsx`
- Create: `src/app/workout-logs/components/analytics/HistoryTab.tsx`
- Create: `src/app/workout-logs/components/analytics/ProgressTab.tsx`
- Create: `src/app/workout-logs/components/analytics/ExercisesTab.tsx`
- Create: `src/app/workout-logs/pages/WorkoutAnalytics.tsx`
- Modify: `src/pages/Dashboard.tsx` — swap `WorkoutLogHistory` import/route for `WorkoutAnalytics`
- Create: `src/app/workout-logs/components/analytics/StatCard.test.tsx`
- Create: `src/app/workout-logs/components/analytics/ActivityHeatmap.test.tsx`
- Create: `src/app/workout-logs/components/analytics/WorkoutAnalytics.test.tsx`

---

## Task 1: Add analytics interfaces to train-core

**Repo:** train-core (`main` branch)

**Files:**
- Modify: `src/core/dto/program.dto.ts`
- Modify: `package.json` (bump version)

- [ ] **Step 1: Add 9 interfaces to the end of `src/core/dto/program.dto.ts`**

Append after the last interface in the file:

```typescript
export interface ActivityDay {
  date: string;           // ISO date "2026-04-12"
  count: number;          // workouts logged that day
}

export interface VolumeTrendPoint {
  label: string;          // "Mon", "1", "Jan" etc.
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
  activityByDay: ActivityDay[];
  volumeTrend: VolumeTrendPoint[];
  personalRecords: ExercisePR[];
  muscleGroups: MuscleGroupStat[];
  exerciseStats: ExerciseSummary[];
}

export interface ExerciseProgressPoint {
  date: string;
  estimatedOneRepMax: number;  // Brzycki: weight * (36 / (37 - reps))
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

- [ ] **Step 2: Bump version in `package.json`**

Change `"version": "0.0.13"` → `"version": "0.0.14"`.

- [ ] **Step 3: Commit and push to main (triggers GitHub Actions publish)**

```bash
cd /Users/noahgross/train/train-core
git add src/core/dto/program.dto.ts package.json
git commit -m "feat: add workout analytics response interfaces"
git push origin main
```

Wait for the GitHub Actions publish to complete (check Actions tab) before proceeding to Task 2.

---

## Task 2: Install updated train-core in downstream repos

**Repos:** train-service (`ng-workout`) and train-web-app (`ng-test`)

- [ ] **Step 1: Update train-service package.json**

In `/Users/noahgross/train/train-service/package.json`, change:
```json
"@trainapp-io/train-core": "^0.0.13"
```
to:
```json
"@trainapp-io/train-core": "^0.0.14"
```

- [ ] **Step 2: Update train-web-app package.json**

In `/Users/noahgross/train/train-web-app/package.json`, change:
```json
"@trainapp-io/train-core": "^0.0.13"
```
to:
```json
"@trainapp-io/train-core": "^0.0.14"
```

- [ ] **Step 3: Verify `.npmrc` token in both repos**

The `${GITHUB_TOKEN}` substitution in `.npmrc` only works when the variable is exported in your shell — it does NOT read from `.env`. If install fails with 401, paste the actual GitHub PAT value directly into `.npmrc` temporarily.

- [ ] **Step 4: Install in train-service**

```bash
cd /Users/noahgross/train/train-service
npm install
```

Expected: installs without error, `node_modules/@trainapp-io/train-core` shows version 0.0.14.

- [ ] **Step 5: Install in train-web-app**

```bash
cd /Users/noahgross/train/train-web-app
npm install
```

Expected: installs without error.

- [ ] **Step 6: Commit both**

```bash
cd /Users/noahgross/train/train-service
git add package.json package-lock.json
git commit -m "chore: upgrade train-core to 0.0.14"

cd /Users/noahgross/train/train-web-app
git add package.json package-lock.json
git commit -m "chore: upgrade train-core to 0.0.14"
```

---

## Task 3: MongoDB index + WorkoutLogRepository aggregate method

**Repo:** train-service (`ng-workout` branch)

**Files:**
- Modify: `src/infrastructure/database/models/programs/workoutLogModel.ts`
- Modify: `src/infrastructure/database/repositories/programs/WorkoutLogRepository.ts`
- Create: `tests/unit/app/workoutLogs/WorkoutLogRepository.aggregate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/app/workoutLogs/WorkoutLogRepository.aggregate.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkoutLogRepository from '../../../../src/infrastructure/database/repositories/programs/WorkoutLogRepository.js';

const mockExec = vi.fn().mockResolvedValue([{ _id: 'result' }]);
const mockAggregate = vi.fn().mockReturnValue({ exec: mockExec });
const mockModel = { aggregate: mockAggregate } as any;

describe('WorkoutLogRepository.runAggregatePipeline', () => {
  let repo: WorkoutLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new WorkoutLogRepository(mockModel);
  });

  it('delegates pipeline to model.aggregate and returns results', async () => {
    const pipeline = [{ $match: { userId: 'abc' } }];
    const result = await repo.runAggregatePipeline(pipeline);
    expect(mockAggregate).toHaveBeenCalledWith(pipeline);
    expect(result).toEqual([{ _id: 'result' }]);
  });

  it('returns empty array when aggregate returns nothing', async () => {
    mockExec.mockResolvedValueOnce([]);
    const result = await repo.runAggregatePipeline([]);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /Users/noahgross/train/train-service
npx vitest run tests/unit/app/workoutLogs/WorkoutLogRepository.aggregate.test.ts
```

Expected: FAIL — `runAggregatePipeline is not a function`

- [ ] **Step 3: Add compound index to workoutLogModel.ts**

At the bottom of `src/infrastructure/database/models/programs/workoutLogModel.ts`, before `export const WorkoutLogModel`, add:

```typescript
WorkoutLogSchema.index({ userId: 1, actualStartDate: -1 });
```

The file currently ends with:
```typescript
export const WorkoutLogModel = model<WorkoutLogDocument>(
  "WorkoutLog",
  WorkoutLogSchema
);
```

Add the index line so it becomes:
```typescript
WorkoutLogSchema.index({ userId: 1, actualStartDate: -1 });

export const WorkoutLogModel = model<WorkoutLogDocument>(
  "WorkoutLog",
  WorkoutLogSchema
);
```

- [ ] **Step 4: Add `runAggregatePipeline` to the repository interface and class**

In `src/infrastructure/database/repositories/programs/WorkoutLogRepository.ts`:

Add `PipelineStage` to the mongoose import at the top:
```typescript
import { Model, PipelineStage } from "mongoose";
```

Update `IWorkoutLogRepository` to add the new method:
```typescript
export interface IWorkoutLogRepository
  extends IBaseRepository<WorkoutLog, WorkoutLogDocument> {
  toEntity(doc: WorkoutLogDocument): WorkoutLog;
  toDocument(request: WorkoutLogRequest): Partial<WorkoutLogDocument>;
  toResponse(workoutLog: WorkoutLog): WorkoutLogResponse;
  getUserWorkoutLogs(userId: Types.ObjectId): Promise<WorkoutLogDocument[]>;
  runAggregatePipeline(pipeline: PipelineStage[]): Promise<any[]>;
}
```

Add the implementation after `getUserWorkoutLogs`:
```typescript
public async runAggregatePipeline(pipeline: PipelineStage[]): Promise<any[]> {
  try {
    return await this.workoutLogModel.aggregate(pipeline).exec();
  } catch (error) {
    this.logger.error("Error running analytics pipeline", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
cd /Users/noahgross/train/train-service
npx vitest run tests/unit/app/workoutLogs/WorkoutLogRepository.aggregate.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/noahgross/train/train-service
git add src/infrastructure/database/models/programs/workoutLogModel.ts \
        src/infrastructure/database/repositories/programs/WorkoutLogRepository.ts \
        tests/unit/app/workoutLogs/WorkoutLogRepository.aggregate.test.ts
git commit -m "feat: add compound index and runAggregatePipeline to WorkoutLogRepository"
```

---

## Task 4: Create WorkoutLogAnalyticsService

**Repo:** train-service (`ng-workout` branch)

**Files:**
- Create: `src/app/workoutLogs/WorkoutLogAnalyticsService.ts`
- Create: `tests/unit/app/workoutLogs/WorkoutLogAnalyticsService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/app/workoutLogs/WorkoutLogAnalyticsService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import WorkoutLogAnalyticsService from '../../../../src/app/workoutLogs/WorkoutLogAnalyticsService.js';

const mockRepo = { runAggregatePipeline: vi.fn() } as any;

describe('WorkoutLogAnalyticsService', () => {
  let service: WorkoutLogAnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WorkoutLogAnalyticsService(mockRepo);
  });

  // ---- computeStreaks ----

  describe('computeStreaks', () => {
    it('returns zero streaks for empty input', () => {
      expect(service.computeStreaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
    });

    it('returns streak of 1 for a single date equal to today', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = service.computeStreaks([today]);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it('returns streak of 1 for a single date equal to yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const result = service.computeStreaks([yesterday]);
      expect(result.currentStreak).toBe(1);
    });

    it('returns correct streak for 5 consecutive days ending today', () => {
      const today = new Date();
      const dates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        return d.toISOString().split('T')[0];
      });
      const result = service.computeStreaks(dates);
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(5);
    });

    it('resets current streak on a 2-day gap, keeps longestStreak', () => {
      const today = new Date();
      const dates = [
        today.toISOString().split('T')[0],                                           // today
        new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0],       // 2 days ago (gap)
        new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0],       // 3 days ago
        new Date(today.getTime() - 4 * 86400000).toISOString().split('T')[0],       // 4 days ago
      ];
      const result = service.computeStreaks(dates);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(3);
    });

    it('returns currentStreak=0 when most recent date is 5 days ago', () => {
      const dates = [
        new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      ];
      const result = service.computeStreaks(dates);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(2);
    });

    it('deduplicates dates (two workouts on same day count once)', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const result = service.computeStreaks([today, today, yesterday]);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });
  });

  // ---- brzycki ----

  describe('brzycki', () => {
    it('computes 1RM for 225 lbs x 8 reps correctly', () => {
      // 225 * (36 / (37 - 8)) = 225 * (36 / 29) ≈ 279
      expect(service.brzycki(225, 8)).toBe(Math.round(225 * (36 / 29)));
    });

    it('returns the weight itself for 1 rep', () => {
      // 300 * (36 / 36) = 300
      expect(service.brzycki(300, 1)).toBe(300);
    });

    it('returns weight (clamped) when reps >= 37', () => {
      expect(service.brzycki(100, 37)).toBe(100);
      expect(service.brzycki(100, 50)).toBe(100);
    });

    it('returns 0 when weight is 0', () => {
      expect(service.brzycki(0, 10)).toBe(0);
    });

    it('returns 0 when reps is 0', () => {
      expect(service.brzycki(100, 0)).toBe(0);
    });
  });

  // ---- getRangeBounds ----

  describe('getRangeBounds', () => {
    it('week: rangeStart is 6 days before now at midnight', () => {
      const now = new Date('2026-04-12T15:00:00Z');
      const { rangeStart } = service.getRangeBounds('week', now);
      expect(rangeStart.toISOString().split('T')[0]).toBe('2026-04-06');
      expect(rangeStart.getHours()).toBe(0);
    });

    it('month: rangeStart is the 1st of the current month', () => {
      const now = new Date('2026-04-12T15:00:00Z');
      const { rangeStart } = service.getRangeBounds('month', now);
      expect(rangeStart.getFullYear()).toBe(2026);
      expect(rangeStart.getMonth()).toBe(3); // April = 3
      expect(rangeStart.getDate()).toBe(1);
    });

    it('year: rangeStart is Jan 1 of the current year', () => {
      const now = new Date('2026-04-12T15:00:00Z');
      const { rangeStart } = service.getRangeBounds('year', now);
      expect(rangeStart.getFullYear()).toBe(2026);
      expect(rangeStart.getMonth()).toBe(0);
      expect(rangeStart.getDate()).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
cd /Users/noahgross/train/train-service
npx vitest run tests/unit/app/workoutLogs/WorkoutLogAnalyticsService.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/app/workoutLogs/WorkoutLogAnalyticsService.ts`**

```typescript
import { Types, PipelineStage } from 'mongoose';
import {
  WorkoutAnalyticsResponse,
  ExerciseProgressResponse,
  ActivityDay,
  VolumeTrendPoint,
  ExerciseSummary,
  MuscleGroupStat,
  ExerciseProgressPoint,
  ExerciseSessionDetail,
} from '@trainapp-io/train-core';
import { IWorkoutLogRepository } from '../../infrastructure/database/repositories/programs/WorkoutLogRepository.js';
import { Logger } from '../../common/logger.js';

type Range = 'week' | 'month' | 'year';

export default class WorkoutLogAnalyticsService {
  private logger: Logger;

  constructor(private readonly workoutLogRepository: IWorkoutLogRepository) {
    this.logger = Logger.getInstance();
  }

  async getAnalytics(userId: Types.ObjectId, range: Range): Promise<WorkoutAnalyticsResponse> {
    const now = new Date();
    const { rangeStart } = this.getRangeBounds(range, now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [rangeData, allTimeData] = await Promise.all([
      this.workoutLogRepository.runAggregatePipeline(
        this.buildRangePipeline(userId, rangeStart, now, range)
      ),
      this.workoutLogRepository.runAggregatePipeline(
        this.buildAllTimePipeline(userId, startOfMonth)
      ),
    ]);

    const rangeResult = rangeData[0] ?? {};
    const allTimeResult = allTimeData[0] ?? {};

    const summary = rangeResult.summary?.[0] ?? {
      totalWorkouts: 0,
      totalDurationMin: 0,
      sessionDates: [],
    };

    const { currentStreak, longestStreak } = this.computeStreaks(summary.sessionDates ?? []);

    const activityByDay: ActivityDay[] = (allTimeResult.activityByDay ?? []).map((d: any) => ({
      date: d._id as string,
      count: d.count as number,
    }));

    const volumeTrend = this.buildVolumeTrend(
      rangeResult.volumeTrend ?? [],
      range,
      rangeStart,
      now
    );

    const muscleGroups = this.buildMuscleGroups(rangeResult.muscleGroups ?? []);

    const rangeExercisePRSet = new Set<string>(
      (rangeResult.rangeExercisePRs ?? []).map((p: any) => p._id as string)
    );

    const exerciseStats: ExerciseSummary[] = (allTimeResult.exerciseStats ?? []).map(
      (e: any) => ({
        name: e._id,
        sessionCount: e.sessionCount ?? 0,
        allTimePRWeight: e.allTimePRWeight ?? 0,
        allTimePRReps: e.allTimePRReps ?? 0,
        lastSessionWeight: e.lastSessionWeight ?? 0,
        lastSessionReps: e.lastSessionReps ?? 0,
        lastLoggedAt: e.lastLoggedAt ?? '',
        totalVolumeLbs: e.totalVolumeLbs ?? 0,
        isNewPR: rangeExercisePRSet.has(e._id),
      })
    );
    exerciseStats.sort((a, b) => b.lastLoggedAt.localeCompare(a.lastLoggedAt));

    const personalRecords = exerciseStats
      .filter((e) => e.allTimePRWeight > 0)
      .sort((a, b) => b.allTimePRWeight - a.allTimePRWeight)
      .slice(0, 5)
      .map((e) => ({
        exerciseName: e.name,
        maxWeight: e.allTimePRWeight,
        reps: e.allTimePRReps,
        sets: 0,
        date: e.lastLoggedAt,
        isNewPR: e.isNewPR,
      }));

    const totalVolumeLbs =
      (rangeResult.totalVolume?.[0]?.total as number | undefined) ?? 0;

    return {
      range,
      totalWorkouts: summary.totalWorkouts ?? 0,
      totalDurationSec: (summary.totalDurationMin ?? 0) * 60,
      totalVolumeLbs,
      currentStreak,
      longestStreak,
      activityByDay,
      volumeTrend,
      personalRecords,
      muscleGroups,
      exerciseStats,
    };
  }

  async getExerciseProgress(
    userId: Types.ObjectId,
    exerciseName: string
  ): Promise<ExerciseProgressResponse> {
    const pipeline = this.buildExerciseProgressPipeline(userId, exerciseName);
    const results = await this.workoutLogRepository.runAggregatePipeline(pipeline);

    const sessionHistory: ExerciseSessionDetail[] = results.map((r: any) => ({
      date: r._id as string,
      sets: (r.sets ?? []).map((s: any) => ({
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
        isCompleted: s.isCompleted ?? false,
        note: s.note,
      })),
      totalVolumeLbs: r.totalVolumeLbs ?? 0,
    }));

    const progressOverTime: ExerciseProgressPoint[] = sessionHistory.map((s) => {
      const best = s.sets.reduce(
        (top, set) => (set.weight > top.weight ? set : top),
        s.sets[0] ?? { weight: 0, reps: 0 }
      );
      return {
        date: s.date,
        estimatedOneRepMax: this.brzycki(best.weight, best.reps),
        maxWeight: best.weight,
        reps: best.reps,
      };
    });

    const allTimePRPoint =
      progressOverTime.length > 0
        ? progressOverTime.reduce((best, p) =>
            p.estimatedOneRepMax > best.estimatedOneRepMax ? p : best
          )
        : { estimatedOneRepMax: 0, maxWeight: 0, reps: 0, date: '' };

    return {
      exerciseName,
      allTimePR: {
        weight: allTimePRPoint.maxWeight,
        reps: allTimePRPoint.reps,
        date: allTimePRPoint.date,
        estimatedOneRepMax: allTimePRPoint.estimatedOneRepMax,
      },
      progressOverTime,
      sessionHistory,
    };
  }

  // --- Public helpers (tested directly) ---

  getRangeBounds(range: Range, now: Date): { rangeStart: Date } {
    let rangeStart: Date;
    switch (range) {
      case 'week':
        rangeStart = new Date(now);
        rangeStart.setDate(now.getDate() - 6);
        rangeStart.setHours(0, 0, 0, 0);
        break;
      case 'month':
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'year':
        rangeStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
    }
    return { rangeStart };
  }

  computeStreaks(dateStrings: string[]): { currentStreak: number; longestStreak: number } {
    if (dateStrings.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const unique = [...new Set(dateStrings)].sort((a, b) => b.localeCompare(a)); // desc

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];

    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 0; i < unique.length - 1; i++) {
      const curr = new Date(unique[i] + 'T00:00:00Z');
      const next = new Date(unique[i + 1] + 'T00:00:00Z');
      const diffDays = Math.round((curr.getTime() - next.getTime()) / 86400000);
      if (diffDays === 1) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        currentRun = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentRun);

    // Current streak only counts if it ends today or yesterday
    let currentStreak = 0;
    if (unique[0] === todayStr || unique[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 0; i < unique.length - 1; i++) {
        const curr = new Date(unique[i] + 'T00:00:00Z');
        const next = new Date(unique[i + 1] + 'T00:00:00Z');
        const diffDays = Math.round((curr.getTime() - next.getTime()) / 86400000);
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak, longestStreak };
  }

  brzycki(weight: number, reps: number): number {
    if (weight <= 0 || reps <= 0) return 0;
    if (reps >= 37) return weight; // formula undefined at 37+
    return Math.round(weight * (36 / (37 - reps)));
  }

  // --- Private pipeline builders ---

  private buildRangePipeline(
    userId: Types.ObjectId,
    rangeStart: Date,
    now: Date,
    range: Range
  ): PipelineStage[] {
    const bucketFormat =
      range === 'year' ? '%Y-%m' : '%Y-%m-%d';

    return [
      {
        $match: {
          userId,
          actualStartDate: { $gte: rangeStart, $lte: now },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalWorkouts: { $sum: 1 },
                totalDurationMin: { $sum: '$actualDuration' },
                sessionDates: {
                  $push: {
                    $dateToString: { format: '%Y-%m-%d', date: '$actualStartDate' },
                  },
                },
              },
            },
          ],
          totalVolume: [
            { $unwind: { path: '$blockLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs.setLogs', preserveNullAndEmptyArrays: true } },
            { $match: { 'blockLogs.exerciseLogs.setLogs.isCompleted': true } },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualWeight', 0] },
                      { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualReps', 0] },
                    ],
                  },
                },
              },
            },
          ],
          volumeTrend: [
            { $unwind: { path: '$blockLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs.setLogs', preserveNullAndEmptyArrays: true } },
            { $match: { 'blockLogs.exerciseLogs.setLogs.isCompleted': true } },
            {
              $group: {
                _id: {
                  bucket: {
                    $dateToString: { format: bucketFormat, date: '$actualStartDate' },
                  },
                  logId: '$_id',
                },
                volumeLbs: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualWeight', 0] },
                      { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualReps', 0] },
                    ],
                  },
                },
              },
            },
            {
              $group: {
                _id: '$_id.bucket',
                volumeLbs: { $sum: '$volumeLbs' },
                workoutCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          muscleGroups: [
            {
              $unwind: {
                path: '$workoutSnapshot.category',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: '$workoutSnapshot.category',
                sessionCount: { $sum: 1 },
              },
            },
          ],
          rangeExercisePRs: [
            { $unwind: { path: '$blockLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs.setLogs', preserveNullAndEmptyArrays: true } },
            { $match: { 'blockLogs.exerciseLogs.setLogs.isCompleted': true } },
            {
              $group: {
                _id: '$blockLogs.exerciseLogs.name',
                maxWeightInRange: { $max: '$blockLogs.exerciseLogs.setLogs.actualWeight' },
              },
            },
            { $match: { _id: { $ne: null } } },
          ],
        },
      },
    ];
  }

  private buildAllTimePipeline(
    userId: Types.ObjectId,
    startOfMonth: Date
  ): PipelineStage[] {
    return [
      { $match: { userId } },
      {
        $facet: {
          activityByDay: [
            { $match: { actualStartDate: { $gte: startOfMonth } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$actualStartDate' } },
                count: { $sum: 1 },
              },
            },
          ],
          exerciseStats: [
            { $unwind: { path: '$blockLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$blockLogs.exerciseLogs.setLogs', preserveNullAndEmptyArrays: true } },
            { $match: { 'blockLogs.exerciseLogs.setLogs.isCompleted': true, 'blockLogs.exerciseLogs.name': { $ne: null } } },
            {
              $group: {
                _id: {
                  exerciseName: '$blockLogs.exerciseLogs.name',
                  sessionDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$actualStartDate' },
                  },
                },
                maxWeight: { $max: '$blockLogs.exerciseLogs.setLogs.actualWeight' },
                maxReps: { $max: '$blockLogs.exerciseLogs.setLogs.actualReps' },
                sessionVolume: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualWeight', 0] },
                      { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualReps', 0] },
                    ],
                  },
                },
              },
            },
            {
              $group: {
                _id: '$_id.exerciseName',
                sessionCount: { $sum: 1 },
                allTimePRWeight: { $max: '$maxWeight' },
                allTimePRReps: { $max: '$maxReps' },
                totalVolumeLbs: { $sum: '$sessionVolume' },
                lastLoggedAt: { $max: '$_id.sessionDate' },
                allSessions: {
                  $push: {
                    date: '$_id.sessionDate',
                    maxWeight: '$maxWeight',
                    maxReps: '$maxReps',
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                sessionCount: 1,
                allTimePRWeight: 1,
                allTimePRReps: 1,
                totalVolumeLbs: 1,
                lastLoggedAt: 1,
                lastSessionData: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$allSessions',
                        as: 'sw',
                        cond: { $eq: ['$$sw.date', '$lastLoggedAt'] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                sessionCount: 1,
                allTimePRWeight: 1,
                allTimePRReps: 1,
                totalVolumeLbs: 1,
                lastLoggedAt: 1,
                lastSessionWeight: { $ifNull: ['$lastSessionData.maxWeight', 0] },
                lastSessionReps: { $ifNull: ['$lastSessionData.maxReps', 0] },
              },
            },
          ],
        },
      },
    ];
  }

  private buildExerciseProgressPipeline(
    userId: Types.ObjectId,
    exerciseName: string
  ): PipelineStage[] {
    return [
      {
        $match: {
          userId,
          'blockLogs.exerciseLogs.name': exerciseName,
        },
      },
      { $unwind: '$blockLogs' },
      { $unwind: '$blockLogs.exerciseLogs' },
      { $match: { 'blockLogs.exerciseLogs.name': exerciseName } },
      { $unwind: '$blockLogs.exerciseLogs.setLogs' },
      { $match: { 'blockLogs.exerciseLogs.setLogs.isCompleted': true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$actualStartDate' } },
          sets: {
            $push: {
              weight: '$blockLogs.exerciseLogs.setLogs.actualWeight',
              reps: '$blockLogs.exerciseLogs.setLogs.actualReps',
              isCompleted: '$blockLogs.exerciseLogs.setLogs.isCompleted',
              note: '$blockLogs.exerciseLogs.setLogs.note',
            },
          },
          totalVolumeLbs: {
            $sum: {
              $multiply: [
                { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualWeight', 0] },
                { $ifNull: ['$blockLogs.exerciseLogs.setLogs.actualReps', 0] },
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];
  }

  private buildVolumeTrend(
    raw: any[],
    range: Range,
    rangeStart: Date,
    now: Date
  ): VolumeTrendPoint[] {
    const byBucket: Record<string, { volumeLbs: number; workoutCount: number }> = {};
    for (const item of raw) {
      byBucket[item._id] = { volumeLbs: item.volumeLbs, workoutCount: item.workoutCount };
    }

    const points: VolumeTrendPoint[] = [];

    if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const data = byBucket[key] ?? { volumeLbs: 0, workoutCount: 0 };
        points.push({ label, volumeLbs: data.volumeLbs, workoutCount: data.workoutCount });
      }
    } else if (range === 'month') {
      for (let day = 1; day <= now.getDate(); day++) {
        const d = new Date(now.getFullYear(), now.getMonth(), day);
        const key = d.toISOString().split('T')[0];
        const data = byBucket[key] ?? { volumeLbs: 0, workoutCount: 0 };
        points.push({ label: String(day), volumeLbs: data.volumeLbs, workoutCount: data.workoutCount });
      }
    } else {
      for (let month = 0; month < 12; month++) {
        const d = new Date(now.getFullYear(), month, 1);
        const key = `${now.getFullYear()}-${String(month + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const data = byBucket[key] ?? { volumeLbs: 0, workoutCount: 0 };
        points.push({ label, volumeLbs: data.volumeLbs, workoutCount: data.workoutCount });
      }
    }

    return points;
  }

  private buildMuscleGroups(raw: any[]): MuscleGroupStat[] {
    const total = raw.reduce((sum: number, item: any) => sum + item.sessionCount, 0);
    if (total === 0) return [];
    return raw.map((item: any) => ({
      group: item._id as string,
      percentage: Math.round((item.sessionCount / total) * 100),
      sessionCount: item.sessionCount as number,
    }));
  }
}
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
cd /Users/noahgross/train/train-service
npx vitest run tests/unit/app/workoutLogs/WorkoutLogAnalyticsService.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/noahgross/train/train-service
git add src/app/workoutLogs/WorkoutLogAnalyticsService.ts \
        tests/unit/app/workoutLogs/WorkoutLogAnalyticsService.test.ts
git commit -m "feat: add WorkoutLogAnalyticsService with MongoDB aggregation pipelines"
```

---

## Task 5: Wire analytics into WorkoutLogService, Controller, and routes

**Repo:** train-service (`ng-workout` branch)

**Files:**
- Modify: `src/app/workoutLogs/WorkoutLogService.ts`
- Modify: `src/app/workoutLogs/WorkoutLogController.ts`
- Modify: `src/routes/workout-logs.routes.ts`

- [ ] **Step 1: Update `WorkoutLogService.ts`**

Add imports at the top of the file:
```typescript
import {
  WorkoutLogRequest,
  WorkoutLogResponse,
  WorkoutAnalyticsResponse,
  ExerciseProgressResponse,
} from "@trainapp-io/train-core";
import WorkoutLogAnalyticsService from "./WorkoutLogAnalyticsService.js";
```

Update the `IWorkoutLogService` interface to add two new methods:
```typescript
export interface IWorkoutLogService {
  createWorkoutLog(workoutLogRequest: WorkoutLogRequest): Promise<WorkoutLogResponse>;
  getWorkoutLogHistory(userId: Types.ObjectId): Promise<WorkoutLogResponse[]>;
  getWorkoutLog(logId: Types.ObjectId): Promise<WorkoutLogResponse>;
  updateWorkoutLog(logId: Types.ObjectId, workoutLogRequest: WorkoutLogRequest): Promise<void>;
  deleteWorkoutLog(logId: Types.ObjectId): Promise<void>;
  getWorkoutAnalytics(userId: Types.ObjectId, range: 'week' | 'month' | 'year'): Promise<WorkoutAnalyticsResponse>;
  getExerciseProgress(userId: Types.ObjectId, exerciseName: string): Promise<ExerciseProgressResponse>;
}
```

Add `analyticsService` field and update the constructor:
```typescript
export default class WorkoutLogService implements IWorkoutLogService {
  private workoutLogRepository: IWorkoutLogRepository;
  private workoutRepository: IWorkoutRepository;
  private analyticsService: WorkoutLogAnalyticsService;
  private logger: Logger;

  constructor(
    workoutLogRepository: IWorkoutLogRepository,
    workoutRepository: IWorkoutRepository
  ) {
    this.workoutLogRepository = workoutLogRepository;
    this.workoutRepository = workoutRepository;
    this.analyticsService = new WorkoutLogAnalyticsService(workoutLogRepository);
    this.logger = Logger.getInstance();
  }
```

Add two new methods at the end of the class (before the closing `}`):
```typescript
  public async getWorkoutAnalytics(
    userId: Types.ObjectId,
    range: 'week' | 'month' | 'year'
  ): Promise<WorkoutAnalyticsResponse> {
    try {
      return await this.analyticsService.getAnalytics(userId, range);
    } catch (error) {
      this.logger.error("Error retrieving workout analytics", {
        userId: userId.toString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw APIError.InternalServerError("Failed to retrieve workout analytics");
    }
  }

  public async getExerciseProgress(
    userId: Types.ObjectId,
    exerciseName: string
  ): Promise<ExerciseProgressResponse> {
    try {
      return await this.analyticsService.getExerciseProgress(userId, exerciseName);
    } catch (error) {
      this.logger.error("Error retrieving exercise progress", {
        userId: userId.toString(),
        exerciseName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw APIError.InternalServerError("Failed to retrieve exercise progress");
    }
  }
```

- [ ] **Step 2: Update `WorkoutLogController.ts`**

Add `WorkoutAnalyticsResponse` and `ExerciseProgressResponse` to the train-core import:
```typescript
import {
  WorkoutLogRequest,
  WorkoutLogResponse,
  WorkoutAnalyticsResponse,
  ExerciseProgressResponse,
} from "@trainapp-io/train-core";
```

Add two new handler methods at the end of the class (before the closing `}`):
```typescript
  public getWorkoutAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.getId();
      const range = (req.query.range as string) || 'week';

      if (!['week', 'month', 'year'].includes(range)) {
        throw APIError.BadRequest("range must be 'week', 'month', or 'year'");
      }

      const analytics: WorkoutAnalyticsResponse =
        await this.workoutLogService.getWorkoutAnalytics(
          userId,
          range as 'week' | 'month' | 'year'
        );

      this.logger.info("Workout analytics retrieved", { range });
      return res.status(HttpStatusCode.OK).json(analytics);
    } catch (error) {
      next(error);
    }
  };

  public getExerciseProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.getId();
      const exerciseName = decodeURIComponent(req.params.exerciseName);

      if (!exerciseName) {
        throw APIError.BadRequest("exerciseName is required");
      }

      const progress: ExerciseProgressResponse =
        await this.workoutLogService.getExerciseProgress(userId, exerciseName);

      this.logger.info("Exercise progress retrieved", { exerciseName });
      return res.status(HttpStatusCode.OK).json(progress);
    } catch (error) {
      next(error);
    }
  };
```

- [ ] **Step 3: Add routes in `workout-logs.routes.ts`**

Add the two analytics routes **before** the existing `router.get("/:logId", ...)` line.

After the `router.get("/", ...)` block and before `router.get("/:logId", ...)`, insert:

```typescript
router.get(
  "/analytics",
  authMiddleware.authenticateToken,
  workoutLogController.getWorkoutAnalytics
);

router.get(
  "/analytics/exercises/:exerciseName",
  authMiddleware.authenticateToken,
  workoutLogController.getExerciseProgress
);
```

These routes MUST appear before `router.get("/:logId", ...)` to prevent the string `"analytics"` from being matched as a logId.

- [ ] **Step 4: Run all unit tests to check nothing broke**

```bash
cd /Users/noahgross/train/train-service
npx vitest run tests/unit
```

Expected: all existing tests + new tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/noahgross/train/train-service
git add src/app/workoutLogs/WorkoutLogService.ts \
        src/app/workoutLogs/WorkoutLogController.ts \
        src/routes/workout-logs.routes.ts
git commit -m "feat: wire analytics endpoints into WorkoutLogService, Controller, routes"
```

---

## Task 6: Analytics API hooks in train-web-app

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Modify: `src/services/apiHooks.ts`

- [ ] **Step 1: Add the two new hooks to `src/services/apiHooks.ts`**

Add to the imports at the top of the file:
```typescript
import {
  UserProfileRequest,
  UserProfileResponse,
  CreateGroupRequest,
  GroupResponse,
  EventRequest,
  EventResponse,
  SearchProfilesResponse,
  CertificationResponse,
  CustomSectionRequest,
  CustomSectionResponse,
  WorkoutLogRequest,
  WorkoutLogResponse,
  WorkoutAnalyticsResponse,
  ExerciseProgressResponse,
} from '@trainapp-io/train-core';
```

Add the two new hooks at the end of the file:

```typescript
// WORKOUT ANALYTICS API HOOKS

/**
 * Hook to fetch workout analytics for the current user
 */
export function useWorkoutAnalytics(range: 'week' | 'month' | 'year', options?: any) {
  return useApiQuery<WorkoutAnalyticsResponse>(
    ['workoutAnalytics', range],
    '/workout-logs/analytics',
    { range },
    options
  );
}

/**
 * Hook to fetch per-exercise progress (strength curve + session history)
 */
export function useExerciseProgress(exerciseName: string, enabled: boolean, options?: any) {
  return useApiQuery<ExerciseProgressResponse>(
    ['exerciseProgress', exerciseName],
    `/workout-logs/analytics/exercises/${encodeURIComponent(exerciseName)}`,
    undefined,
    { enabled, ...options }
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/noahgross/train/train-web-app
npm run build
```

Expected: no TypeScript errors

- [ ] **Step 3: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/services/apiHooks.ts
git commit -m "feat: add useWorkoutAnalytics and useExerciseProgress hooks"
```

---

## Task 7: CSS and StatCard component

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/WorkoutAnalytics.css`
- Create: `src/app/workout-logs/components/analytics/StatCard.tsx`
- Create: `src/app/workout-logs/components/analytics/StatCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/workout-logs/components/analytics/StatCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard value="42" label="Workouts" />);
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Workouts')).toBeDefined();
  });

  it('applies default class when no variant given', () => {
    const { container } = render(<StatCard value="5d" label="Streak" />);
    const card = container.querySelector('.wla-stat-card');
    expect(card).not.toBeNull();
    expect(card!.classList.contains('wla-stat-card--primary')).toBe(false);
  });

  it('applies primary variant class', () => {
    const { container } = render(<StatCard value="5d" label="Streak" variant="primary" />);
    expect(container.querySelector('.wla-stat-card--primary')).not.toBeNull();
  });

  it('applies pr variant class', () => {
    const { container } = render(<StatCard value="225 lbs" label="Bench Press" variant="pr" />);
    expect(container.querySelector('.wla-stat-card--pr')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/analytics/StatCard.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `WorkoutAnalytics.css`**

Create `src/app/workout-logs/components/analytics/WorkoutAnalytics.css`:

```css
/* ============================================================
   Workout Log Analytics — .wla- prefix
   Purple design system: #7c3aed primary, #f7f7fa bg
   ============================================================ */

.wla-page {
  max-width: 640px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f7f7fa;
  font-family: inherit;
  position: relative;
}

/* ---- Header ---- */
.wla-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #f0f0f3;
  padding: 14px 16px 0;
}

.wla-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.wla-header__title {
  font-size: 20px;
  font-weight: 800;
  color: #111;
  margin: 0;
}

/* ---- Range toggle ---- */
.wla-range-toggle {
  display: flex;
  background: #f3f0fe;
  border-radius: 20px;
  padding: 2px;
  gap: 2px;
}

.wla-range-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 18px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.wla-range-btn--active {
  background: #7c3aed;
  color: #fff;
}

/* ---- Tabs ---- */
.wla-tabs {
  display: flex;
  margin: 0 -16px;
  padding: 0 16px;
}

.wla-tab {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  padding: 10px 14px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s;
}

.wla-tab--active {
  color: #7c3aed;
  font-weight: 700;
  border-bottom-color: #7c3aed;
}

/* ---- Body ---- */
.wla-body {
  padding: 12px 14px 80px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ---- Generic card ---- */
.wla-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f0f3;
  padding: 14px;
  overflow: hidden;
}

.wla-card__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  margin-bottom: 10px;
}

/* ---- Stat grid ---- */
.wla-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.wla-stat-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f0f3;
  padding: 14px;
  text-align: center;
}

.wla-stat-card--primary {
  background: #7c3aed;
  border-color: #7c3aed;
}

.wla-stat-card--primary .wla-stat-card__value,
.wla-stat-card--primary .wla-stat-card__label {
  color: #fff;
}

.wla-stat-card--pr {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.wla-stat-card--pr .wla-stat-card__value {
  color: #16a34a;
}

.wla-stat-card__value {
  font-size: 22px;
  font-weight: 800;
  color: #111;
  line-height: 1;
}

.wla-stat-card__label {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---- Heatmap ---- */
.wla-heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.wla-heatmap-day-label {
  font-size: 9px;
  font-weight: 600;
  color: #9ca3af;
  text-align: center;
  padding-bottom: 2px;
}

.wla-heatmap-day {
  aspect-ratio: 1;
  border-radius: 4px;
  background: #ede9fe;
}

.wla-heatmap-day--empty {
  background: transparent;
}

.wla-heatmap-day[data-intensity="0"] { background: #ede9fe; }
.wla-heatmap-day[data-intensity="1"] { background: #c4b5fd; }
.wla-heatmap-day[data-intensity="2"] { background: #7c3aed; }
.wla-heatmap-day[data-intensity="future"] { background: #e5e7eb; }

.wla-heatmap-day--today {
  outline: 2px solid #7c3aed;
  outline-offset: 1px;
}

/* ---- PR row ---- */
.wla-pr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f9f8ff;
}

.wla-pr-row:last-child { border-bottom: none; }

.wla-pr-row__name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.wla-pr-row__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wla-pr-row__weight {
  font-size: 14px;
  font-weight: 700;
  color: #7c3aed;
}

.wla-pr-row__badge {
  background: #22c55e;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

/* ---- Muscle bars ---- */
.wla-muscle-row { margin-bottom: 8px; }

.wla-muscle-row:last-child { margin-bottom: 0; }

.wla-muscle-row__header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.wla-muscle-bar {
  height: 6px;
  background: #f3f0fe;
  border-radius: 3px;
  overflow: hidden;
}

.wla-muscle-bar__fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 3px;
}

/* ---- History ---- */
.wla-history-group__label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 0 4px;
}

.wla-history-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f0f3;
  padding: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.wla-history-card:hover { border-color: #c4b5fd; }

.wla-history-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.wla-history-card__name {
  font-size: 14px;
  font-weight: 700;
  color: #111;
}

.wla-history-card__pr {
  background: #22c55e;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 10px;
}

.wla-history-card__meta {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.wla-history-card__stats {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  flex-wrap: wrap;
}

.wla-status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.wla-status-badge--done { background: #f0fdf4; color: #16a34a; }
.wla-status-badge--partial { background: #fff7ed; color: #ea580c; }

/* ---- Progress ---- */
.wla-exercise-select {
  width: 100%;
  border: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  background: transparent;
  appearance: none;
  cursor: pointer;
  padding: 4px 0;
}

.wla-exercise-pr-card {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-radius: 14px;
  padding: 18px;
  color: #fff;
}

.wla-exercise-pr-card__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  margin-bottom: 6px;
}

.wla-exercise-pr-card__weight {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.wla-exercise-pr-card__1rm {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.wla-set-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.wla-set-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f3;
}

.wla-set-table td {
  padding: 8px 0;
  border-bottom: 1px solid #f9f8ff;
  color: #374151;
}

.wla-set-table__row--incomplete td {
  color: #9ca3af;
  text-decoration: line-through;
}

/* ---- Exercises ---- */
.wla-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.wla-chips::-webkit-scrollbar { display: none; }

.wla-chip {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #374151;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.wla-chip--active {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}

.wla-exercise-list {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f0f3;
  overflow: hidden;
}

.wla-exercise-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #f9f8ff;
  cursor: pointer;
}

.wla-exercise-row:last-child { border-bottom: none; }
.wla-exercise-row:hover { background: #faf5ff; }

.wla-exercise-row__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #faf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #7c3aed;
  flex-shrink: 0;
}

.wla-exercise-row__info {
  flex: 1;
  min-width: 0;
}

.wla-exercise-row__name {
  font-size: 13px;
  font-weight: 700;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wla-exercise-row__meta {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

.wla-exercise-row__right { text-align: right; flex-shrink: 0; }

.wla-exercise-row__pr {
  font-size: 14px;
  font-weight: 800;
  color: #7c3aed;
}

.wla-exercise-row__new-pr {
  font-size: 9px;
  font-weight: 800;
  color: #22c55e;
}

/* ---- Search ---- */
.wla-search__input {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
  color: #374151;
  box-sizing: border-box;
}

.wla-search__input:focus {
  outline: none;
  border-color: #7c3aed;
}

/* ---- Empty states ---- */
.wla-empty {
  text-align: center;
  padding: 32px 16px;
  font-size: 14px;
  color: #9ca3af;
}

.wla-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 8px;
  text-align: center;
}

.wla-empty-state__icon { font-size: 40px; }

.wla-empty-state__title {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin: 0;
}

.wla-empty-state__sub {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* ---- Skeleton loading ---- */
.wla-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wla-skeleton-card {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f3 25%, #e8e5f0 50%, #f0f0f3 75%);
  background-size: 200% 100%;
  border-radius: 14px;
  animation: wla-shimmer 1.4s infinite;
}

@keyframes wla-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- Load more ---- */
.wla-load-more {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #7c3aed;
  font-family: inherit;
  cursor: pointer;
}

/* ---- Chart empty ---- */
.wla-chart-empty {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  padding: 20px;
}

/* ---- History group ---- */
.wla-history { display: flex; flex-direction: column; gap: 0; }
.wla-exercises { display: flex; flex-direction: column; gap: 10px; }
.wla-overview { display: flex; flex-direction: column; gap: 10px; }
.wla-progress { display: flex; flex-direction: column; gap: 10px; }
```

- [ ] **Step 4: Create `StatCard.tsx`**

Create `src/app/workout-logs/components/analytics/StatCard.tsx`:

```tsx
interface StatCardProps {
  value: string;
  label: string;
  variant?: 'default' | 'primary' | 'pr';
}

export default function StatCard({ value, label, variant = 'default' }: StatCardProps) {
  const cls = variant === 'default'
    ? 'wla-stat-card'
    : `wla-stat-card wla-stat-card--${variant}`;
  return (
    <div className={cls}>
      <div className="wla-stat-card__value">{value}</div>
      <div className="wla-stat-card__label">{label}</div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/analytics/StatCard.test.tsx
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/components/analytics/WorkoutAnalytics.css \
        src/app/workout-logs/components/analytics/StatCard.tsx \
        src/app/workout-logs/components/analytics/StatCard.test.tsx
git commit -m "feat: add WorkoutAnalytics CSS and StatCard component"
```

---

## Task 8: ActivityHeatmap component

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/ActivityHeatmap.tsx`
- Create: `src/app/workout-logs/components/analytics/ActivityHeatmap.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/app/workout-logs/components/analytics/ActivityHeatmap.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivityHeatmap from './ActivityHeatmap';
import type { ActivityDay } from '@trainapp-io/train-core';

// April 2026: starts on Wednesday (day 2), 30 days
const april2026 = new Date(2026, 3, 1); // month is 0-indexed

describe('ActivityHeatmap', () => {
  it('renders 7 day-of-week labels', () => {
    const { container } = render(
      <ActivityHeatmap activityByDay={[]} month={april2026} />
    );
    const labels = container.querySelectorAll('.wla-heatmap-day-label');
    expect(labels.length).toBe(7);
  });

  it('renders padding cells + 30 day cells for April 2026', () => {
    // April 1 is Wednesday (0=Sun,1=Mon,2=Tue,3=Wed) → 3 padding cells
    const { container } = render(
      <ActivityHeatmap activityByDay={[]} month={april2026} />
    );
    const dayCells = container.querySelectorAll('.wla-heatmap-day:not(.wla-heatmap-day-label)');
    // 3 padding + 30 days = 33 cells
    expect(dayCells.length).toBe(33);
  });

  it('applies intensity-1 to a day with 1 workout', () => {
    const activity: ActivityDay[] = [{ date: '2026-04-05', count: 1 }];
    const { container } = render(
      <ActivityHeatmap activityByDay={activity} month={april2026} />
    );
    expect(container.querySelector('[data-intensity="1"]')).not.toBeNull();
  });

  it('applies intensity-2 to a day with 3 workouts', () => {
    const activity: ActivityDay[] = [{ date: '2026-04-10', count: 3 }];
    const { container } = render(
      <ActivityHeatmap activityByDay={activity} month={april2026} />
    );
    expect(container.querySelector('[data-intensity="2"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/analytics/ActivityHeatmap.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `ActivityHeatmap.tsx`**

Create `src/app/workout-logs/components/analytics/ActivityHeatmap.tsx`:

```tsx
import type { ActivityDay } from '@trainapp-io/train-core';

interface Props {
  activityByDay: ActivityDay[];
  month: Date;
}

function getIntensity(count: number): 0 | 1 | 2 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  return 2;
}

export default function ActivityHeatmap({ activityByDay, month }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDate: Record<string, number> = {};
  for (const d of activityByDay) {
    byDate[d.date] = d.count;
  }

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startPad = firstDay.getDay(); // 0=Sun

  const cells: Array<{ date: Date | null; count: number }> = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ date: null, count: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIdx, d);
    const key = date.toISOString().split('T')[0];
    cells.push({ date, count: byDate[key] ?? 0 });
  }

  return (
    <div className="wla-heatmap-grid" aria-label="Activity heatmap">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
        <div key={i} className="wla-heatmap-day-label">{label}</div>
      ))}
      {cells.map((cell, i) => {
        if (!cell.date) {
          return <div key={`pad-${i}`} className="wla-heatmap-day wla-heatmap-day--empty" />;
        }
        const isFuture = cell.date > today;
        const isToday = cell.date.getTime() === today.getTime();
        const intensity = isFuture ? 'future' : getIntensity(cell.count);
        return (
          <div
            key={i}
            className={`wla-heatmap-day${isToday ? ' wla-heatmap-day--today' : ''}`}
            data-intensity={intensity}
            title={`${cell.date.toLocaleDateString()}: ${cell.count} workout${cell.count !== 1 ? 's' : ''}`}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/analytics/ActivityHeatmap.test.tsx
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/components/analytics/ActivityHeatmap.tsx \
        src/app/workout-logs/components/analytics/ActivityHeatmap.test.tsx
git commit -m "feat: add ActivityHeatmap component"
```

---

## Task 9: Install recharts + chart components

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/VolumeBarChart.tsx`
- Create: `src/app/workout-logs/components/analytics/StrengthLineChart.tsx`

- [ ] **Step 1: Install recharts**

```bash
cd /Users/noahgross/train/train-web-app
npm install recharts
```

recharts ships its own TypeScript types — no `@types/recharts` needed.

Expected: installs without error

- [ ] **Step 2: Create `VolumeBarChart.tsx`**

Create `src/app/workout-logs/components/analytics/VolumeBarChart.tsx`:

```tsx
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { VolumeTrendPoint } from '@trainapp-io/train-core';

interface Props {
  data: VolumeTrendPoint[];
}

export default function VolumeBarChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="wla-chart-empty">No volume data for this period</div>;
  }

  const maxVol = Math.max(...data.map((d) => d.volumeLbs));
  const maxIdx = data.findIndex((d) => d.volumeLbs === maxVol);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toLocaleString()} lbs`, 'Volume']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f3' }}
        />
        <Bar dataKey="volumeLbs" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={index === maxIdx ? '#7c3aed' : '#c4b5fd'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Create `StrengthLineChart.tsx`**

Create `src/app/workout-logs/components/analytics/StrengthLineChart.tsx`:

```tsx
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip, Dot } from 'recharts';
import type { ExerciseProgressPoint } from '@trainapp-io/train-core';

interface Props {
  data: ExerciseProgressPoint[];
}

export default function StrengthLineChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="wla-chart-empty">Log more sessions to see your strength curve</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) =>
            new Date(v + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          }
        />
        <Tooltip
          formatter={(value: number) => [`${value} lbs`, 'Est. 1RM']}
          labelFormatter={(label: string) =>
            new Date(label + 'T00:00:00').toLocaleDateString()
          }
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f3' }}
        />
        <Line
          type="monotone"
          dataKey="estimatedOneRepMax"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={{ fill: '#7c3aed', r: 4 }}
          activeDot={{ r: 6, fill: '#5b21b6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/noahgross/train/train-web-app
npm run build
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add package.json package-lock.json \
        src/app/workout-logs/components/analytics/VolumeBarChart.tsx \
        src/app/workout-logs/components/analytics/StrengthLineChart.tsx
git commit -m "feat: add recharts and VolumeBarChart + StrengthLineChart components"
```

---

## Task 10: OverviewTab component

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/OverviewTab.tsx`

- [ ] **Step 1: Create `OverviewTab.tsx`**

```tsx
import type { WorkoutAnalyticsResponse } from '@trainapp-io/train-core';
import StatCard from './StatCard';
import ActivityHeatmap from './ActivityHeatmap';
import VolumeBarChart from './VolumeBarChart';

interface Props {
  data: WorkoutAnalyticsResponse;
}

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function OverviewTab({ data }: Props) {
  const latestPR = data.personalRecords[0];

  return (
    <div className="wla-overview">
      <div className="wla-stat-grid">
        <StatCard value={String(data.totalWorkouts)} label="Workouts" />
        <StatCard value={formatDuration(data.totalDurationSec)} label="Total Time" />
        <StatCard value={`${data.currentStreak}d`} label="Streak" variant="primary" />
        {latestPR ? (
          <StatCard
            value={`${latestPR.maxWeight} lbs`}
            label={latestPR.exerciseName}
            variant="pr"
          />
        ) : (
          <StatCard value="—" label="Latest PR" />
        )}
      </div>

      <div className="wla-card">
        <div className="wla-card__title">This Month</div>
        <ActivityHeatmap activityByDay={data.activityByDay} month={new Date()} />
      </div>

      <div className="wla-card">
        <div className="wla-card__title">Volume</div>
        <VolumeBarChart data={data.volumeTrend} />
      </div>

      {data.personalRecords.length > 0 && (
        <div className="wla-card">
          <div className="wla-card__title">Personal Records</div>
          {data.personalRecords.map((pr) => (
            <div key={pr.exerciseName} className="wla-pr-row">
              <div className="wla-pr-row__name">{pr.exerciseName}</div>
              <div className="wla-pr-row__right">
                <span className="wla-pr-row__weight">
                  {pr.maxWeight} lbs × {pr.reps}
                </span>
                {pr.isNewPR && <span className="wla-pr-row__badge">NEW PR</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.muscleGroups.length > 0 && (
        <div className="wla-card">
          <div className="wla-card__title">Muscle Groups</div>
          {data.muscleGroups.map((mg) => (
            <div key={mg.group} className="wla-muscle-row">
              <div className="wla-muscle-row__header">
                <span>{mg.group}</span>
                <span>{mg.percentage}%</span>
              </div>
              <div className="wla-muscle-bar">
                <div
                  className="wla-muscle-bar__fill"
                  style={{ width: `${mg.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/noahgross/train/train-web-app
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/components/analytics/OverviewTab.tsx
git commit -m "feat: add OverviewTab component"
```

---

## Task 11: HistoryTab component

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/HistoryTab.tsx`

- [ ] **Step 1: Create `HistoryTab.tsx`**

```tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { WorkoutLogResponse, WorkoutAnalyticsResponse } from '@trainapp-io/train-core';

interface Props {
  logs: WorkoutLogResponse[];
  analytics: WorkoutAnalyticsResponse;
}

const PAGE_SIZE = 20;

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getExerciseCount(log: WorkoutLogResponse): number {
  if (log.blockLogs?.length) {
    return log.blockLogs.reduce((sum, b) => sum + (b.exerciseLogs?.length ?? 0), 0);
  }
  return log.exerciseLogs?.length ?? 0;
}

function getLogVolume(log: WorkoutLogResponse): number {
  let vol = 0;
  const processSets = (exerciseLogs: typeof log.exerciseLogs) => {
    for (const ex of exerciseLogs ?? []) {
      for (const s of (ex as any).setLogs ?? []) {
        if (s.isCompleted) vol += (s.actualWeight ?? 0) * (s.actualReps ?? 0);
      }
    }
  };
  if (log.blockLogs?.length) {
    for (const block of log.blockLogs) processSets(block.exerciseLogs);
  } else {
    processSets(log.exerciseLogs);
  }
  return vol;
}

export default function HistoryTab({ logs, analytics }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const newPRExercises = new Set(
    analytics.personalRecords.filter((pr) => pr.isNewPR).map((pr) => pr.exerciseName)
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) => l.workoutSnapshot.name.toLowerCase().includes(q));
  }, [logs, search]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > visible.length;

  const grouped = useMemo(() => {
    const groups: Record<string, WorkoutLogResponse[]> = {};
    for (const log of visible) {
      const key = new Date(log.actualStartDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    }
    return groups;
  }, [visible]);

  const hasPR = (log: WorkoutLogResponse): boolean => {
    const names = new Set<string>();
    if (log.blockLogs?.length) {
      for (const b of log.blockLogs) {
        for (const e of b.exerciseLogs ?? []) names.add(e.name);
      }
    } else {
      for (const e of log.exerciseLogs ?? []) names.add(e.name);
    }
    return [...names].some((n) => newPRExercises.has(n));
  };

  return (
    <div className="wla-history">
      <input
        className="wla-search__input"
        placeholder="Search workouts..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {filtered.length === 0 ? (
        <div className="wla-empty">No workouts found</div>
      ) : (
        <>
          {Object.entries(grouped).map(([month, monthLogs]) => (
            <div key={month} className="wla-history-group">
              <div className="wla-history-group__label">{month}</div>
              {monthLogs.map((log) => {
                const volume = getLogVolume(log);
                const exerciseCount = getExerciseCount(log);
                return (
                  <div
                    key={log.id}
                    className="wla-history-card"
                    onClick={() => navigate(`/workout-logs/${log.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/workout-logs/${log.id}`)}
                  >
                    <div className="wla-history-card__header">
                      <span className="wla-history-card__name">
                        {log.workoutSnapshot.name}
                      </span>
                      {hasPR(log) && (
                        <span className="wla-history-card__pr">PR</span>
                      )}
                    </div>
                    <div className="wla-history-card__meta">
                      {formatDate(log.actualStartDate)} · {formatTime(log.actualStartDate)}
                    </div>
                    <div className="wla-history-card__stats">
                      <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
                      {volume > 0 && <span>{volume.toLocaleString()} lbs</span>}
                      <span
                        className={`wla-status-badge wla-status-badge--${
                          log.isCompleted ? 'done' : 'partial'
                        }`}
                      >
                        {log.isCompleted ? 'Done' : 'Partial'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {hasMore && (
            <button className="wla-load-more" onClick={() => setPage((p) => p + 1)}>
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/noahgross/train/train-web-app
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/components/analytics/HistoryTab.tsx
git commit -m "feat: add HistoryTab with search, month grouping, and pagination"
```

---

## Task 12: ProgressTab component

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/ProgressTab.tsx`

- [ ] **Step 1: Create `ProgressTab.tsx`**

```tsx
import type { WorkoutAnalyticsResponse } from '@trainapp-io/train-core';
import { useExerciseProgress } from '../../../../services/apiHooks';
import StrengthLineChart from './StrengthLineChart';
import VolumeBarChart from './VolumeBarChart';
import type { VolumeTrendPoint } from '@trainapp-io/train-core';

interface Props {
  analytics: WorkoutAnalyticsResponse;
  selectedExercise: string;
  onSelectExercise: (name: string) => void;
}

export default function ProgressTab({ analytics, selectedExercise, onSelectExercise }: Props) {
  const { data: progressData, isLoading } = useExerciseProgress(
    selectedExercise,
    !!selectedExercise
  );

  const exerciseNames = analytics.exerciseStats.map((e) => e.name);

  const volumeChartData: VolumeTrendPoint[] =
    progressData?.sessionHistory.map((s) => ({
      label: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      volumeLbs: s.totalVolumeLbs,
      workoutCount: 1,
    })) ?? [];

  const mostRecentSession =
    progressData?.sessionHistory[progressData.sessionHistory.length - 1];

  return (
    <div className="wla-progress">
      <div className="wla-card">
        <select
          className="wla-exercise-select"
          value={selectedExercise}
          onChange={(e) => onSelectExercise(e.target.value)}
          aria-label="Select exercise"
        >
          <option value="">Select an exercise...</option>
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {!selectedExercise && (
        <div className="wla-empty">Select an exercise to see your progress</div>
      )}

      {selectedExercise && isLoading && (
        <div className="wla-skeleton-card" aria-label="Loading progress" />
      )}

      {selectedExercise && !isLoading && !progressData && (
        <div className="wla-empty">
          No data yet — log this exercise to see your progress
        </div>
      )}

      {progressData && progressData.progressOverTime.length > 0 && (
        <>
          <div className="wla-exercise-pr-card">
            <div className="wla-exercise-pr-card__title">All-Time PR</div>
            <div className="wla-exercise-pr-card__weight">
              {progressData.allTimePR.weight} lbs × {progressData.allTimePR.reps}
            </div>
            <div className="wla-exercise-pr-card__1rm">
              Est. 1RM: {progressData.allTimePR.estimatedOneRepMax} lbs
            </div>
          </div>

          <div className="wla-card">
            <div className="wla-card__title">Estimated 1RM Over Time</div>
            <StrengthLineChart data={progressData.progressOverTime} />
          </div>

          <div className="wla-card">
            <div className="wla-card__title">Volume Per Session</div>
            <VolumeBarChart data={volumeChartData} />
          </div>

          {mostRecentSession && (
            <div className="wla-card">
              <div className="wla-card__title">
                Last Session —{' '}
                {new Date(mostRecentSession.date + 'T00:00:00').toLocaleDateString()}
              </div>
              <table className="wla-set-table">
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>Weight</th>
                    <th>Reps</th>
                  </tr>
                </thead>
                <tbody>
                  {mostRecentSession.sets.map((set, i) => (
                    <tr
                      key={i}
                      className={
                        !set.isCompleted ? 'wla-set-table__row--incomplete' : undefined
                      }
                    >
                      <td>{i + 1}</td>
                      <td>{set.weight} lbs</td>
                      <td>{set.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/noahgross/train/train-web-app
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/components/analytics/ProgressTab.tsx
git commit -m "feat: add ProgressTab with exercise picker and strength curve"
```

---

## Task 13: ExercisesTab component

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/components/analytics/ExercisesTab.tsx`

- [ ] **Step 1: Create `ExercisesTab.tsx`**

```tsx
import { useState, useMemo } from 'react';
import type { WorkoutAnalyticsResponse } from '@trainapp-io/train-core';

interface Props {
  analytics: WorkoutAnalyticsResponse;
  onSelectExercise: (name: string) => void;
}

export default function ExercisesTab({ analytics, onSelectExercise }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return analytics.exerciseStats;
    const q = search.toLowerCase();
    return analytics.exerciseStats.filter((e) => e.name.toLowerCase().includes(q));
  }, [analytics.exerciseStats, search]);

  return (
    <div className="wla-exercises">
      <input
        className="wla-search__input"
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="wla-exercise-list">
        {filtered.length === 0 ? (
          <div className="wla-empty">No exercises found</div>
        ) : (
          filtered.map((exercise) => (
            <div
              key={exercise.name}
              className="wla-exercise-row"
              onClick={() => onSelectExercise(exercise.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectExercise(exercise.name)}
            >
              <div className="wla-exercise-row__avatar">
                {exercise.name.charAt(0).toUpperCase()}
              </div>
              <div className="wla-exercise-row__info">
                <div className="wla-exercise-row__name">{exercise.name}</div>
                <div className="wla-exercise-row__meta">
                  {exercise.sessionCount} session{exercise.sessionCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="wla-exercise-row__right">
                <div className="wla-exercise-row__pr">
                  {exercise.allTimePRWeight > 0 ? `${exercise.allTimePRWeight} lbs` : '—'}
                </div>
                {exercise.isNewPR && (
                  <div className="wla-exercise-row__new-pr">NEW PR</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/noahgross/train/train-web-app
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/components/analytics/ExercisesTab.tsx
git commit -m "feat: add ExercisesTab with search and PR indicators"
```

---

## Task 14: WorkoutAnalytics page + routing + integration tests

**Repo:** train-web-app (`ng-test` branch)

**Files:**
- Create: `src/app/workout-logs/pages/WorkoutAnalytics.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Create: `src/app/workout-logs/components/analytics/WorkoutAnalytics.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

Create `src/app/workout-logs/components/analytics/WorkoutAnalytics.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import WorkoutAnalytics from '../../pages/WorkoutAnalytics';

vi.mock('../../../../services/apiHooks', () => ({
  useWorkoutAnalytics: () => ({ data: undefined, isLoading: true }),
  useWorkoutLogHistory: () => ({ data: [] }),
  useExerciseProgress: () => ({ data: undefined, isLoading: false }),
}));

describe('WorkoutAnalytics (loading state)', () => {
  it('shows loading skeleton when analytics is loading', () => {
    render(
      <MemoryRouter>
        <WorkoutAnalytics />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Loading analytics')).toBeDefined();
  });
});

const mockAnalytics = {
  range: 'week' as const,
  totalWorkouts: 0,
  totalDurationSec: 0,
  totalVolumeLbs: 0,
  currentStreak: 0,
  longestStreak: 0,
  activityByDay: [],
  volumeTrend: [],
  personalRecords: [],
  muscleGroups: [],
  exerciseStats: [],
};

vi.mock('../../../../services/apiHooks', () => ({
  useWorkoutAnalytics: () => ({ data: mockAnalytics, isLoading: false }),
  useWorkoutLogHistory: () => ({ data: [] }),
  useExerciseProgress: () => ({ data: undefined, isLoading: false }),
}));

describe('WorkoutAnalytics (empty state)', () => {
  it('shows empty state when totalWorkouts is 0', () => {
    render(
      <MemoryRouter>
        <WorkoutAnalytics />
      </MemoryRouter>
    );
    expect(screen.getByText('No workouts yet')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/analytics/WorkoutAnalytics.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `WorkoutAnalytics.tsx`**

Create `src/app/workout-logs/pages/WorkoutAnalytics.tsx`:

```tsx
import { useState } from 'react';
import { useWorkoutAnalytics, useWorkoutLogHistory } from '../../../services/apiHooks';
import OverviewTab from '../components/analytics/OverviewTab';
import HistoryTab from '../components/analytics/HistoryTab';
import ProgressTab from '../components/analytics/ProgressTab';
import ExercisesTab from '../components/analytics/ExercisesTab';
import '../components/analytics/WorkoutAnalytics.css';

type Tab = 'overview' | 'history' | 'progress' | 'exercises';
type Range = 'week' | 'month' | 'year';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' },
  { id: 'exercises', label: 'Exercises' },
];

export default function WorkoutAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [range, setRange] = useState<Range>('week');
  const [selectedExercise, setSelectedExercise] = useState('');

  const { data: analytics, isLoading: analyticsLoading } = useWorkoutAnalytics(range);
  const { data: logs } = useWorkoutLogHistory();

  const handleExerciseSelect = (name: string) => {
    setSelectedExercise(name);
    setActiveTab('progress');
  };

  return (
    <div className="wla-page">
      <div className="wla-header">
        <div className="wla-header__top">
          <h1 className="wla-header__title">My Progress</h1>
          <div className="wla-range-toggle">
            {(['week', 'month', 'year'] as Range[]).map((r) => (
              <button
                key={r}
                className={`wla-range-btn${range === r ? ' wla-range-btn--active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r === 'week' ? 'W' : r === 'month' ? 'M' : 'Y'}
              </button>
            ))}
          </div>
        </div>
        <div className="wla-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`wla-tab${activeTab === tab.id ? ' wla-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wla-body">
        {analyticsLoading && (
          <div className="wla-skeleton" aria-label="Loading analytics">
            <div className="wla-skeleton-card" />
            <div className="wla-skeleton-card" />
            <div className="wla-skeleton-card" />
          </div>
        )}

        {!analyticsLoading && analytics && analytics.totalWorkouts === 0 && (
          <div className="wla-empty-state">
            <div className="wla-empty-state__icon">🏋️</div>
            <h2 className="wla-empty-state__title">No workouts yet</h2>
            <p className="wla-empty-state__sub">
              Log your first workout to see your progress
            </p>
          </div>
        )}

        {!analyticsLoading && analytics && analytics.totalWorkouts > 0 && (
          <>
            {activeTab === 'overview' && <OverviewTab data={analytics} />}
            {activeTab === 'history' && (
              <HistoryTab logs={logs ?? []} analytics={analytics} />
            )}
            {activeTab === 'progress' && (
              <ProgressTab
                analytics={analytics}
                selectedExercise={selectedExercise}
                onSelectExercise={setSelectedExercise}
              />
            )}
            {activeTab === 'exercises' && (
              <ExercisesTab
                analytics={analytics}
                onSelectExercise={handleExerciseSelect}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/pages/Dashboard.tsx`**

Change:
```tsx
import WorkoutLogHistory from "../app/workout-logs/pages/WorkoutLogHistory";
```
to:
```tsx
import WorkoutAnalytics from "../app/workout-logs/pages/WorkoutAnalytics";
```

Change the route:
```tsx
<Route path="/workout-logs/history" element={<WorkoutLogHistory />} />
```
to:
```tsx
<Route path="/workout-logs/history" element={<WorkoutAnalytics />} />
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/analytics/WorkoutAnalytics.test.tsx
```

Expected: PASS

- [ ] **Step 6: Run all tests**

```bash
cd /Users/noahgross/train/train-web-app
npm test
```

Expected: all tests PASS

- [ ] **Step 7: Start dev server and smoke-test manually**

```bash
cd /Users/noahgross/train/train-web-app
npm run dev
```

Navigate to `/workout-logs/history`. Verify:
- "My Progress" header renders with range toggle (W/M/Y) and four tabs
- Tabs switch: Overview / History / Progress / Exercises
- Loading skeleton appears while analytics API call is in flight
- With no workout logs: empty state shows "No workouts yet"

- [ ] **Step 8: Commit**

```bash
cd /Users/noahgross/train/train-web-app
git add src/app/workout-logs/pages/WorkoutAnalytics.tsx \
        src/app/workout-logs/components/analytics/WorkoutAnalytics.test.tsx \
        src/pages/Dashboard.tsx
git commit -m "feat: add WorkoutAnalytics page and replace WorkoutLogHistory route"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| 4-tab layout: Overview / History / Progress / Exercises | Task 14 (WorkoutAnalytics page) |
| W/M/Y range toggle | Task 14 |
| MongoDB compound index `{ userId, actualStartDate }` | Task 3 |
| `GET /workout-logs/analytics?range=` endpoint | Task 5 |
| `GET /workout-logs/analytics/exercises/:name` endpoint | Task 5 |
| Analytics routes before `/:logId` (no collision) | Task 5 |
| `$facet` range pipeline: summary, volumeTrend, muscleGroups | Task 4 |
| All-time pipeline: activityByDay (current month), exerciseStats | Task 4 |
| Brzycki formula for estimated 1RM | Task 4 |
| Streak calculation (consecutive days) | Task 4 |
| `WorkoutAnalyticsResponse` + 8 supporting interfaces in train-core | Task 1 |
| StatCard, ActivityHeatmap CSS heatmap | Tasks 7–8 |
| VolumeBarChart (recharts BarChart) | Task 9 |
| StrengthLineChart (recharts LineChart) | Task 9 |
| OverviewTab: stat grid + heatmap + volume chart + PRs + muscle groups | Task 10 |
| HistoryTab: search + month grouping + pagination + PR badge | Task 11 |
| ProgressTab: exercise picker + PR card + strength curve + set table | Task 12 |
| ExercisesTab: search + exercise rows + PR indicators | Task 13 |
| Tap exercise in ExercisesTab → switches to ProgressTab | Task 14 (`handleExerciseSelect`) |
| Loading skeleton (shimmer animation) | Task 7 (CSS) + Task 14 |
| Empty state (zero workouts) | Task 14 |
| Routing: swap WorkoutLogHistory → WorkoutAnalytics at `/workout-logs/history` | Task 14 |

### Placeholder scan

No TBD, TODO, or vague steps. All code is complete.

### Type consistency

- `WorkoutAnalyticsResponse` defined in Task 1, used in Tasks 6, 10, 11, 12, 13, 14 — consistent.
- `ExerciseProgressResponse` defined in Task 1, used in Tasks 6, 12 — consistent.
- `useExerciseProgress(name, enabled)` defined in Task 6, used in Task 12 — signature matches.
- `runAggregatePipeline(pipeline: PipelineStage[])` defined in Task 3, used in Task 4 — consistent.
- `getWorkoutAnalytics(userId, range)` defined in Task 5 (service interface), implemented in service, called from controller — consistent.
