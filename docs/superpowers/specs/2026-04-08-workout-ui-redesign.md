# Workout UI Redesign — Design Spec

**Date:** 2026-04-08  
**Scope:** Create Workout + Log Workout UI redesign with per-set data model

---

## Overview

Redesign the workout creation and logging flows to use a per-set card layout. Each exercise shows a table of individually editable rows — one per set — with notes, rest unit toggle, and measurement toggles. Supersets become 2-exercise circuits using a unified group model.

---

## 1. Data Model Changes

### Approach: Additive per-set arrays (backward-compatible)

Existing single-value fields (`targetReps`, `targetWeight`, `rest`, `sets`) are kept. New `setData` and `setLogs` arrays are added alongside them. When `setData` is absent, the UI initializes it from the existing fields for backward compatibility.

### train-core (`src/core/dto/program.dto.ts`)

Add two new interfaces:

```ts
export interface SetTarget {
  reps?: number;
  weight?: number;
  durationSec?: number;
  distance?: number;
  rest?: number;          // always stored in seconds
  note?: string;
}

export interface SetLog {
  actualReps?: number;
  actualWeight?: number;
  actualDurationSec?: number;
  actualDistance?: number;
  actualRest?: number;
  isCompleted: boolean;
  note?: string;
}
```

Add to `Exercise`:
```ts
setData?: SetTarget[];
restUnit?: 'seconds' | 'minutes';  // display toggle, stored per exercise
```

Add to `ExerciseSnapshot`:
```ts
setData?: SetTarget[];
restUnit?: 'seconds' | 'minutes';
```

Add to `ExerciseLog`:
```ts
setLogs?: SetLog[];
```

### train-service (MongoDB schemas)

**`workoutModel.ts`** — add `SetTargetSchema` and update `ExerciseSchema`:
```ts
const SetTargetSchema = new Schema({
  reps: { type: Number, required: false },
  weight: { type: Number, required: false },
  durationSec: { type: Number, required: false },
  distance: { type: Number, required: false },
  rest: { type: Number, required: false },
  note: { type: String, required: false },
}, { _id: false });

// In ExerciseSchema:
setData: { type: [SetTargetSchema], required: false },
restUnit: { type: String, enum: ['seconds', 'minutes'], required: false },
```

**`workoutLogModel.ts`** — add `SetLogSchema` and update `ExerciseLogSchema` and `ExerciseSnapshotSchema`. `SetTargetSchema` must be imported from `workoutModel.ts` (add it to the existing import of `MeasurementSchema`):
```ts
const SetLogSchema = new Schema({
  actualReps: { type: Number, required: false },
  actualWeight: { type: Number, required: false },
  actualDurationSec: { type: Number, required: false },
  actualDistance: { type: Number, required: false },
  actualRest: { type: Number, required: false },
  isCompleted: { type: Boolean, required: true },
  note: { type: String, required: false },
}, { _id: false });

// In ExerciseLogSchema:
setLogs: { type: [SetLogSchema], required: false },

// In ExerciseSnapshotSchema (SetTargetSchema imported from workoutModel.ts):
setData: { type: [SetTargetSchema], required: false },
restUnit: { type: String, enum: ['seconds', 'minutes'], required: false },
```

---

## 2. Create Workout UI

### Exercise Card Layout

Each exercise renders as a card with:

**Header row:** avatar (letter, color-hashed) · exercise name input · weight unit toggle chip (`lbs ⟳` / `kg ⟳`) · measurement type toggle chip (`reps ⟳` / `sec ⟳` / `dist ⟳`) · remove button

**Set table** (columns adapt to measurement type):
- `REPS` measurement: SET · LBS · REPS · REST · 📝 · ×
- `TIME` measurement: SET · SEC · REST · 📝 · ×
- `DISTANCE` measurement: SET · DIST · REST · 📝 · ×

Each set row:
- SET: row number (gray)
- Metric input: editable number field
- Weight input: editable number field (hidden for bodyweight/time/distance)
- REST: number input + rest unit chip (`s ⟳` toggles to `min ⟳`). The chip appears on every row for convenience but `restUnit` is stored at the exercise level — clicking the chip on any row updates all rows in that exercise simultaneously.
- 📝: icon button, gray when no note, purple when note exists — opens note dialog
- ×: remove this set row

**Footer:** `＋ Add Set` button (purple, left-aligned)

### Note Dialog

MUI Dialog triggered by 📝 icon. Contains:
- Title: "Note for Set N"
- Textarea: "Add a coaching note for this set…"
- Cancel / Save buttons

Note content stored in `setData[n].note`. Icon turns purple when a note exists.

### Backward Compatibility

When loading an existing exercise without `setData`, initialize from existing fields:
```ts
function initSetData(exercise: Exercise): SetTarget[] {
  return Array.from({ length: exercise.sets || 3 }, () => ({
    reps: exercise.targetReps,
    weight: exercise.targetWeight,
    durationSec: exercise.targetDurationSec,
    distance: exercise.targetDistance,
    rest: exercise.rest,
  }));
}
```

---

## 3. Circuit & Superset Model

### Unified Group Model

A "group" is a `Block` with `type !== BlockType.SINGLE`. The badge auto-labels based on exercise count:
- 2 exercises → **Superset** (blue badge)
- 3 exercises → **Tri-set** (purple badge)
- 4+ exercises → **Circuit** (purple badge)

### Circuit Card Layout

**Header:** badge · name input · rounds input + "rounds" label · rest input + rest unit chip · remove button  
Background: light purple (`#faf5ff`) with purple border

**Body:** exercise sub-cards using the same per-set card design. "then" connector (purple vertical line + gray label) between each exercise. Set column labeled "Rnd" instead of "Set".

**Footer:** `＋ Add Exercise` dashed button inside the circuit card.

### Creating Groups

The existing "Add Exercise" and "Add Circuit" buttons at the bottom of the workout builder remain. A superset is created by clicking "Add Circuit" and then adding exactly 2 exercises.

---

## 4. Log Workout UI

### Exercise Card Layout

**Header:** avatar · exercise name (read-only) · weight unit chip (read-only display)

**Set table** (same column logic as create, minus editable toggles):
- SET/RND · LBS · REPS/SEC/DIST · ✓ checkmark button

**Row states:**
- **Active** (next unchecked set): blue background, blue text, blue row number
- **Completed**: dimmed (opacity 0.45)
- **Pending** (future sets): normal styling

**Checkmark behavior:** tapping ✓ on a set:
1. Marks that row as completed (dimmed)
2. Advances the active highlight to the next unchecked row
3. Triggers rest countdown toast (using `setData[n].rest` value for that set)

**Footer:** `Mark All` button (blue text, centered) — marks all unchecked sets complete

### Rest Countdown Toast

Blue bar appearing below the timer after a set is checked:
- Shows countdown from the set's rest duration (e.g. `01:00`)
- "Skip →" button dismisses it immediately
- Auto-dismisses when countdown reaches 0

### Timer Bar

Sticky black bar at top of workout:
- Elapsed time display (`MM:SS`)
- ▶/⏸ play/pause button

### Bottom Tab Bar

3 buttons:
- **Start/Pause** — toggles workout timer (purple when active)
- **Rest** — manually triggers rest countdown (60s default)
- **Finish** — submits the log (black button)

### Superset Log Layout

Same grouped container as create view (Superset/Circuit badge, exercise sub-cards, "then" connectors). Each exercise inside tracks its own per-set completions independently. "Mark All" at the bottom of the group completes all sets across all exercises in the group.

### Data Mapping

When submitting a log, build `setLogs` from the UI state:
```ts
function buildSetLogs(rows: LogRowState[]): SetLog[] {
  return rows.map(r => ({
    actualReps: r.reps,
    actualWeight: r.weight,
    actualDurationSec: r.durationSec,
    actualDistance: r.distance,
    actualRest: r.rest,
    isCompleted: r.checked,
    note: r.note,
  }));
}
```

When initializing log rows from a snapshot, pre-fill from `setData` if present, otherwise fall back to single-value fields (same backward-compat logic as create).

---

## 5. Files to Change

| File | Change |
|------|--------|
| `train-core/src/core/dto/program.dto.ts` | Add `SetTarget`, `SetLog` interfaces; extend `Exercise`, `ExerciseSnapshot`, `ExerciseLog` |
| `train-service/src/infrastructure/database/models/programs/workoutModel.ts` | Add `SetTargetSchema`, extend `ExerciseSchema` |
| `train-service/src/infrastructure/database/models/programs/workoutLogModel.ts` | Add `SetLogSchema`, extend `ExerciseLogSchema` and `ExerciseSnapshotSchema` |
| `train-web-app/src/app/programs/components/workoutBuilder/ExerciseItem.tsx` | Full redesign — per-set table, note dialog, toggle chips |
| `train-web-app/src/app/programs/components/workoutBuilder/CircuitItem.tsx` | Auto-label badge (Superset/Tri-set/Circuit), "Rnd" column label, "then" connectors |
| `train-web-app/src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx` | Update `snapshotToBlock` and `blockToLog` to use `setData`/`setLogs` |
| `train-web-app/src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx` | Simplify to 3-button tabbar (Start/Pause, Rest, Finish) |
| `train-web-app/src/app/programs/components/workoutBuilder/*.css` | New styles for set table, note dialog, circuit card |

---

## 6. Out of Scope

- "Each side" checkbox (unilateral exercises)
- "0-0-0-0" quick-fill progression field
- Exercise video/image in log view header
- Per-exercise history / previous performance display
- Backend service layer changes (schemas are additive; no controller/route changes needed)
