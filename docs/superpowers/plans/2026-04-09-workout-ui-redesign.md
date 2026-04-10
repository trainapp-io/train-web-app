# Workout UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign workout creation and logging UIs to use a per-set card layout with per-set notes, rest unit toggle, and a unified circuit/superset model, backed by additive schema changes in train-core and train-service.

**Architecture:** Add `SetTarget[]` and `SetLog[]` arrays to the existing `Exercise`/`ExerciseLog` types in train-core (additive — old fields kept for backward compat), mirror those in train-service Mongoose schemas, then rebuild `ExerciseItem` as a per-set card table and `CircuitItem` with auto-labeling (Superset / Tri-set / Circuit). Logging tracks per-set completions in `setLogs` on the exercise and submits them as `ExerciseLog.setLogs`.

**Tech Stack:** TypeScript, React 19, MUI v7, Vitest + @testing-library/react, Mongoose (MongoDB), GitHub Actions npm publish

---

## File Map

| Repo | File | Action |
|------|------|--------|
| train-core | `src/core/dto/program.dto.ts` | Add `SetTarget`, `SetLog`; extend `Exercise`, `ExerciseSnapshot`, `ExerciseLog` |
| train-core | `package.json` | Bump version 0.0.12 → 0.0.13 |
| train-service | `scripts/npm-install.sh` | Create — sources `.env` GITHUB_TOKEN before npm install |
| train-service | `src/infrastructure/database/models/programs/workoutModel.ts` | Add `SetTargetSchema`; extend `ExerciseSchema` + `Exercise` interface |
| train-service | `src/infrastructure/database/models/programs/workoutLogModel.ts` | Add `SetLogSchema`; extend `ExerciseLogSchema`, `ExerciseSnapshotSchema`, interfaces |
| train-service | `package.json` | Update `@trainapp-io/train-core` to `^0.0.13` |
| train-web-app | `scripts/npm-install.sh` | Create — same token helper |
| train-web-app | `package.json` | Update `@trainapp-io/train-core` to `^0.0.13` |
| train-web-app | `src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts` | Create — extract + update `snapshotToBlock`, `blockToLog` |
| train-web-app | `src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts` | Create — unit tests for helpers |
| train-web-app | `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx` | Import helpers; remove active-exercise state; wire rest callback |
| train-web-app | `src/app/programs/components/workoutBuilder/ExerciseItem.tsx` | Full redesign — per-set table, note dialog, log mode checkmarks |
| train-web-app | `src/app/programs/components/workoutBuilder/ExerciseItem.css` | Create — all styles for new card layout |
| train-web-app | `src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx` | Create — component tests |
| train-web-app | `src/app/programs/components/workoutBuilder/CircuitItem.tsx` | Auto-label badge; "then" connectors; "Rnd" column label |
| train-web-app | `src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx` | Create — badge and connector tests |
| train-web-app | `src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx` | Simplify to 3-button bar; add `restSeconds` prop |

---

## Task 1: train-core — Add SetTarget, SetLog types and extend interfaces

**Repo:** `/Users/noahgross/train/train-core` · **Branch:** `main`

**Files:**
- Modify: `src/core/dto/program.dto.ts`

- [ ] **Step 1: Add the two new interfaces after the `Measurement` interface**

In `src/core/dto/program.dto.ts`, after the `Measurement` interface (line ~83), add:

```ts
export interface SetTarget {
  reps?: number;
  weight?: number;
  durationSec?: number;
  distance?: number;
  rest?: number;
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

- [ ] **Step 2: Extend Exercise**

Add to the `Exercise` interface:
```ts
  setData?: SetTarget[];
  restUnit?: 'seconds' | 'minutes';
```

- [ ] **Step 3: Extend ExerciseSnapshot**

Add to the `ExerciseSnapshot` interface:
```ts
  setData?: SetTarget[];
  restUnit?: 'seconds' | 'minutes';
```

- [ ] **Step 4: Extend ExerciseLog**

Add to the `ExerciseLog` interface:
```ts
  setLogs?: SetLog[];
```

- [ ] **Step 5: Verify compilation**

```bash
cd /Users/noahgross/train/train-core
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Bump version to 0.0.13**

In `package.json` change `"version": "0.0.12"` to `"version": "0.0.13"`.

- [ ] **Step 7: Commit and push to trigger publish**

```bash
git add src/core/dto/program.dto.ts package.json
git commit -m "feat: add SetTarget and SetLog per-set interfaces"
git push origin main
```
Expected: GitHub Actions pipeline publishes `@trainapp-io/train-core@0.0.13` to the GitHub npm registry. Watch the Actions tab to confirm it completes before proceeding to Task 3.

---

## Task 2: npm auth helper scripts

Create a small shell script in each repo that reads `GITHUB_TOKEN` from `.env` and exports it before running npm, so the `${GITHUB_TOKEN}` substitution in `.npmrc` works.

**Repos:** train-service and train-web-app

- [ ] **Step 1: Create `scripts/npm-install.sh` in train-service**

```bash
mkdir -p /Users/noahgross/train/train-service/scripts
```

Create `/Users/noahgross/train/train-service/scripts/npm-install.sh`:
```bash
#!/bin/bash
set -e
if [ -f .env ]; then
  GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env | head -1 | cut -d'=' -f2-)
  export GITHUB_TOKEN
fi
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN not set in .env or environment"
  exit 1
fi
npm install "$@"
```

```bash
chmod +x /Users/noahgross/train/train-service/scripts/npm-install.sh
```

- [ ] **Step 2: Create `scripts/npm-install.sh` in train-web-app**

```bash
mkdir -p /Users/noahgross/train/train-web-app/scripts
```

Create `/Users/noahgross/train/train-web-app/scripts/npm-install.sh`:
```bash
#!/bin/bash
set -e
if [ -f .env ]; then
  GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env | head -1 | cut -d'=' -f2-)
  export GITHUB_TOKEN
fi
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN not set in .env or environment"
  exit 1
fi
npm install "$@"
```

```bash
chmod +x /Users/noahgross/train/train-web-app/scripts/npm-install.sh
```

- [ ] **Step 3: Commit both**

```bash
cd /Users/noahgross/train/train-service
git add scripts/npm-install.sh
git commit -m "chore: add npm-install helper that sources GITHUB_TOKEN from .env"

cd /Users/noahgross/train/train-web-app
git add scripts/npm-install.sh
git commit -m "chore: add npm-install helper that sources GITHUB_TOKEN from .env"
```

---

## Task 3: train-service — workoutModel.ts schema update

**Repo:** `/Users/noahgross/train/train-service` · **Branch:** `ng-workout`

**Files:**
- Modify: `src/infrastructure/database/models/programs/workoutModel.ts`
- Modify: `package.json`

- [ ] **Step 1: Update train-core version and install**

In `package.json` change `"@trainapp-io/train-core": "^0.0.12"` to `"@trainapp-io/train-core": "^0.0.13"`.

```bash
cd /Users/noahgross/train/train-service
bash scripts/npm-install.sh
```
Expected: installs successfully with the new train-core version.

- [ ] **Step 2: Add `SetTarget` import and `SetTargetSchema`**

At the top of `workoutModel.ts`, add `SetTarget` to the existing `@trainapp-io/train-core` import:
```ts
import {
  ProfileAccess,
  WorkoutDifficulty,
  MeasurementType,
  MeasurementUnit,
  BlockType,
  SetTarget,
} from "@trainapp-io/train-core";
```

After `MeasurementSchema`, add and export `SetTargetSchema`:
```ts
export const SetTargetSchema = new Schema(
  {
    reps: { type: Number, required: false },
    weight: { type: Number, required: false },
    durationSec: { type: Number, required: false },
    distance: { type: Number, required: false },
    rest: { type: Number, required: false },
    note: { type: String, required: false },
  },
  { _id: false },
);
```

- [ ] **Step 3: Extend the `Exercise` interface**

Add to the `Exercise` interface in `workoutModel.ts`:
```ts
  setData?: SetTarget[];
  restUnit?: 'seconds' | 'minutes';
```

- [ ] **Step 4: Extend `ExerciseSchema`**

Add to `ExerciseSchema` (after the `measurement` field):
```ts
    setData: { type: [SetTargetSchema], required: false },
    restUnit: { type: String, enum: ['seconds', 'minutes'], required: false },
```

- [ ] **Step 5: Verify TypeScript compilation**

```bash
cd /Users/noahgross/train/train-service
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json src/infrastructure/database/models/programs/workoutModel.ts
git commit -m "feat: add SetTarget schema and setData/restUnit fields to Exercise"
```

---

## Task 4: train-service — workoutLogModel.ts schema update

**Repo:** `/Users/noahgross/train/train-service` · **Branch:** `ng-workout`

**Files:**
- Modify: `src/infrastructure/database/models/programs/workoutLogModel.ts`

- [ ] **Step 1: Extend imports**

In `workoutLogModel.ts`, update the `@trainapp-io/train-core` import to include `SetLog` and `SetTarget`:
```ts
import {
  WorkoutDifficulty,
  ProfileAccess,
  BlockType,
  SetLog,
  SetTarget,
} from "@trainapp-io/train-core";
```

Update the import from `workoutModel.ts` to also pull in `SetTargetSchema`:
```ts
import { MeasurementSchema, Measurement, SetTargetSchema } from "./workoutModel.js";
```

- [ ] **Step 2: Add `SetLogSchema`**

After the import block, add:
```ts
const SetLogSchema = new Schema(
  {
    actualReps: { type: Number, required: false },
    actualWeight: { type: Number, required: false },
    actualDurationSec: { type: Number, required: false },
    actualDistance: { type: Number, required: false },
    actualRest: { type: Number, required: false },
    isCompleted: { type: Boolean, required: true },
    note: { type: String, required: false },
  },
  { _id: false },
);
```

- [ ] **Step 3: Extend `ExerciseLog` interface and `ExerciseLogSchema`**

Add to the `ExerciseLog` interface:
```ts
  setLogs?: SetLog[];
```

Add to `ExerciseLogSchema` (after the `hasSuperset` field):
```ts
    setLogs: { type: [SetLogSchema], required: false },
```

- [ ] **Step 4: Extend `ExerciseSnapshot` interface and `ExerciseSnapshotSchema`**

Add to the `ExerciseSnapshot` interface:
```ts
  setData?: SetTarget[];
  restUnit?: 'seconds' | 'minutes';
```

Add to `ExerciseSnapshotSchema` (after the `measurement` field):
```ts
    setData: { type: [SetTargetSchema], required: false },
    restUnit: { type: String, enum: ['seconds', 'minutes'], required: false },
```

- [ ] **Step 5: Verify TypeScript compilation**

```bash
cd /Users/noahgross/train/train-service
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/infrastructure/database/models/programs/workoutLogModel.ts
git commit -m "feat: add SetLog schema and setLogs/setData fields to log models"
```

---

## Task 5: train-web-app — Install train-core 0.0.13 and extract log helpers

**Repo:** `/Users/noahgross/train/train-web-app` · **Branch:** `ng-test`

**Files:**
- Modify: `package.json`
- Create: `src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts`
- Create: `src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts`
- Modify: `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx`

- [ ] **Step 1: Update train-core version and install**

In `package.json` change `"@trainapp-io/train-core": "^0.0.9"` to `"@trainapp-io/train-core": "^0.0.13"`.

```bash
cd /Users/noahgross/train/train-web-app
bash scripts/npm-install.sh
```

- [ ] **Step 2: Write failing tests for helpers**

Create `src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { snapshotToBlock, blockToLog } from '../workoutLogHelpers';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND };

describe('snapshotToBlock', () => {
  it('initializes setLogs from setData when present', () => {
    const bs = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 2,
      exerciseSnapshot: [{
        name: 'Squat',
        order: 0,
        measurement: baseMeasurement,
        setData: [
          { reps: 8, weight: 135, rest: 60 },
          { reps: 6, weight: 145, rest: 90 },
        ],
      }],
    };
    const block = snapshotToBlock(bs);
    expect(block.exercises[0].setLogs).toHaveLength(2);
    expect(block.exercises[0].setLogs[0]).toMatchObject({
      actualReps: 8,
      actualWeight: 135,
      actualRest: 60,
      isCompleted: false,
    });
    expect(block.exercises[0].setLogs[1]).toMatchObject({
      actualReps: 6,
      actualWeight: 145,
      actualRest: 90,
      isCompleted: false,
    });
  });

  it('falls back to single-value fields when setData is absent', () => {
    const bs = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 3,
      exerciseSnapshot: [{
        name: 'Pushup',
        order: 0,
        measurement: baseMeasurement,
        sets: 3,
        targetReps: 10,
        targetWeight: 0,
        rest: 30,
      }],
    };
    const block = snapshotToBlock(bs);
    expect(block.exercises[0].setLogs).toHaveLength(3);
    expect(block.exercises[0].setLogs[0]).toMatchObject({
      actualReps: 10,
      actualWeight: 0,
      actualRest: 30,
      isCompleted: false,
    });
  });
});

describe('blockToLog', () => {
  it('builds setLogs from exercise setLogs', () => {
    const block = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 2,
      exercises: [{
        name: 'Squat',
        order: 0,
        measurement: baseMeasurement,
        targetReps: 8,
        targetWeight: 135,
        setLogs: [
          { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: true },
          { actualReps: 6, actualWeight: 145, actualRest: 90, isCompleted: false },
        ],
      }],
    };
    const log = blockToLog(block as any, 0);
    expect(log.exerciseLogs[0].setLogs).toHaveLength(2);
    expect(log.exerciseLogs[0].setLogs![0].isCompleted).toBe(true);
    expect(log.exerciseLogs[0].setLogs![1].isCompleted).toBe(false);
  });

  it('marks exercise as completed when all sets are completed', () => {
    const block = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 2,
      exercises: [{
        name: 'Squat',
        order: 0,
        measurement: baseMeasurement,
        setLogs: [
          { actualReps: 8, actualWeight: 135, isCompleted: true },
          { actualReps: 8, actualWeight: 135, isCompleted: true },
        ],
      }],
    };
    const log = blockToLog(block as any, 0);
    expect(log.exerciseLogs[0].isCompleted).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
cd /Users/noahgross/train/train-web-app
npx vitest run src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 4: Create `workoutLogHelpers.ts`**

Create `src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts`:

```ts
import { Block, BlockLog, ExerciseLog, SetLog } from '@trainapp-io/train-core';

export function snapshotToBlock(bs: any): Block {
  return {
    ...bs,
    exercises: bs.exerciseSnapshot.map((es: any) => {
      const setLogs: SetLog[] = es.setData?.length
        ? es.setData.map((s: any) => ({
            actualReps: s.reps,
            actualWeight: s.weight,
            actualDurationSec: s.durationSec,
            actualDistance: s.distance,
            actualRest: s.rest,
            isCompleted: false,
            note: s.note,
          }))
        : Array.from({ length: es.sets ?? 3 }, () => ({
            actualReps: es.targetReps,
            actualWeight: es.targetWeight,
            actualDurationSec: es.targetDurationSec,
            actualDistance: es.targetDistance,
            actualRest: es.rest,
            isCompleted: false,
          }));
      return {
        ...es,
        sets: setLogs.length,
        hasSuperset: false,
        setLogs,
      };
    }),
  } as Block;
}

export function blockToLog(block: Block, order: number): BlockLog {
  return {
    actualSets: block.targetSets,
    actualRest: (block as any).rest || 0,
    exerciseLogs: block.exercises.map((ex): ExerciseLog => {
      const setLogs: SetLog[] = (ex as any).setLogs ?? [];
      return {
        name: ex.name,
        actualReps: ex.targetReps || 0,
        actualWeight: ex.targetWeight || 0,
        actualDurationSec: ex.targetDurationSec || 0,
        actualDistance: ex.targetDistance || 0,
        actualRest: ex.rest || 0,
        isCompleted: setLogs.length > 0
          ? setLogs.every((s) => s.isCompleted)
          : false,
        order: ex.order,
        setLogs,
      };
    }),
    order,
    isCompleted: false,
  };
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx vitest run src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts
```
Expected: all tests PASS.

- [ ] **Step 6: Update WorkoutLogForm.tsx to use the extracted helpers**

Replace the two inline function definitions (`snapshotToBlock` and `blockToLog`) in `WorkoutLogForm.tsx` with an import:

```ts
import { snapshotToBlock, blockToLog } from './workoutLogHelpers';
```

Remove the old inline definitions of `snapshotToBlock` and `blockToLog` from `WorkoutLogForm.tsx`.

- [ ] **Step 7: Verify build**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx
git commit -m "feat: update train-core to 0.0.13 and extract workout log helpers"
```

---

## Task 6: ExerciseItem — per-set card create mode

**Repo:** `/Users/noahgross/train/train-web-app` · **Branch:** `ng-test`

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/ExerciseItem.tsx`
- Create: `src/app/programs/components/workoutBuilder/ExerciseItem.css`
- Create: `src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx`

- [ ] **Step 1: Write failing tests for create mode**

Create `src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseItem from '../ExerciseItem';
import { MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND };

function makeExercise(overrides = {}) {
  return {
    name: 'Bench Press',
    order: 0,
    measurement: baseMeasurement,
    targetReps: 8,
    targetWeight: 135,
    rest: 60,
    sets: 3,
    hasSuperset: false,
    ...overrides,
  };
}

function makeProps(exerciseOverrides = {}, propOverrides = {}) {
  const updateFn = vi.fn();
  const removeFn = vi.fn();
  return {
    exercise: makeExercise(exerciseOverrides),
    editMode: true,
    logMode: false,
    blockIndex: 0,
    exerciseIndex: 0,
    updateExerciseInBlockPartial: updateFn,
    removeExerciseFromBlock: removeFn,
    ...propOverrides,
  };
}

describe('ExerciseItem create mode', () => {
  it('renders a set row for each set in setData', () => {
    const props = makeProps({
      setData: [
        { reps: 8, weight: 135, rest: 60 },
        { reps: 8, weight: 135, rest: 60 },
        { reps: 6, weight: 145, rest: 90 },
      ],
    });
    render(<ExerciseItem {...props} />);
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(4); // header + 3 data rows
  });

  it('falls back to sets count when setData is absent', () => {
    const props = makeProps({ sets: 2 });
    render(<ExerciseItem {...props} />);
    // 2 set rows + 1 header row
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('clicking Add Set calls updateExerciseInBlockPartial with one more set', () => {
    const props = makeProps({
      setData: [
        { reps: 8, weight: 135, rest: 60 },
        { reps: 8, weight: 135, rest: 60 },
      ],
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getByText(/add set/i));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({ setData: expect.arrayContaining([expect.any(Object)]) })
    );
    const call = props.updateExerciseInBlockPartial.mock.calls[0][2];
    expect(call.setData).toHaveLength(3);
  });

  it('clicking the rest unit chip calls update with toggled restUnit', () => {
    const props = makeProps({
      setData: [{ reps: 8, weight: 135, rest: 60 }],
      restUnit: 'seconds',
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getByText(/^s\s*⟳/i));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({ restUnit: 'minutes' })
    );
  });

  it('clicking the measurement toggle cycles the measurement type', () => {
    const props = makeProps({ setData: [{ reps: 8 }] });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getByText(/reps\s*⟳/i));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({ measurement: expect.objectContaining({ measurementType: MeasurementType.TIME }) })
    );
  });

  it('note dialog opens when note icon is clicked', () => {
    const props = makeProps({
      setData: [{ reps: 8, weight: 135, rest: 60, note: '' }],
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getAllByLabelText(/note for set/i)[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('saving a note calls update with the note in setData', () => {
    const props = makeProps({
      setData: [{ reps: 8, weight: 135, rest: 60 }],
    });
    render(<ExerciseItem {...props} />);
    fireEvent.click(screen.getAllByLabelText(/note for set/i)[0]);
    fireEvent.change(screen.getByPlaceholderText(/coaching note/i), {
      target: { value: 'Go slow on the way down' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(props.updateExerciseInBlockPartial).toHaveBeenCalledWith(
      0, 0,
      expect.objectContaining({
        setData: [expect.objectContaining({ note: 'Go slow on the way down' })],
      })
    );
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Create `ExerciseItem.css`**

Create `src/app/programs/components/workoutBuilder/ExerciseItem.css`:

```css
/* ── Exercise card ── */
.ex-card-v2 {
  background: var(--bg-primary, #fff);
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
  overflow: visible;
  margin-bottom: 2px;
}

/* Header */
.ex-card-v2__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 8px;
}
.ex-card-v2__avatar {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.ex-card-v2__name {
  flex: 1; border: none; outline: none;
  font-size: 14px; font-weight: 600;
  color: var(--text-primary, #111);
  background: transparent; min-width: 0;
}
.ex-card-v2__name-static {
  flex: 1; font-size: 14px; font-weight: 600;
  color: var(--text-primary, #111); min-width: 0;
}
.ex-card-v2__toggles { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }

/* Toggle chips */
.ex-toggle-chip {
  display: inline-flex; align-items: center; gap: 2px;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px; padding: 2px 7px;
  font-size: 11px; font-weight: 600;
  color: var(--text-secondary, #6b7280);
  cursor: pointer; white-space: nowrap; font-family: inherit;
}
.ex-toggle-chip:hover { background: #ede9fe; border-color: #c4b5fd; color: #6d28d9; }

/* Remove button */
.ex-card-v2__remove {
  width: 26px; height: 26px; border-radius: 6px;
  border: none; background: none; cursor: pointer;
  color: var(--text-tertiary, #d1d5db);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.ex-card-v2__remove:hover { background: #fee2e2; color: #ef4444; }

/* Set table */
.ex-set-table-wrap { padding: 0 14px 4px; }
.ex-set-table {
  width: 100%; border-collapse: collapse;
}
.ex-set-table th {
  font-size: 9.5px; font-weight: 700;
  color: var(--text-tertiary, #9ca3af);
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 5px 4px; text-align: center;
  border-bottom: 1px solid var(--border-color, #f3f4f6);
}
.ex-set-table th:first-child { text-align: left; width: 28px; }
.ex-set-table td { padding: 6px 4px; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
.ex-set-table tr:last-child td { border-bottom: none; }
.ex-set-num { font-size: 11px; color: var(--text-tertiary, #9ca3af); font-weight: 600; }

/* Inputs */
.ex-set-input {
  width: 50px; border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px; padding: 4px 5px;
  font-size: 13px; text-align: center;
  color: var(--text-primary, #111);
  background: var(--bg-secondary, #fafafa);
  outline: none; font-family: inherit;
}
.ex-set-input:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 2px rgba(124,58,237,0.1); }

/* Rest cell */
.ex-rest-cell { display: flex; align-items: center; gap: 3px; justify-content: center; }
.ex-rest-unit {
  font-size: 9.5px; font-weight: 700; color: #7c3aed;
  background: #f5f3ff; border: 1px solid #ddd6fe;
  border-radius: 4px; padding: 2px 5px; cursor: pointer;
  white-space: nowrap; font-family: inherit; border-radius: 4px;
}
.ex-rest-unit:hover { background: #ede9fe; }

/* Note button */
.ex-note-btn {
  width: 24px; height: 24px; border-radius: 5px; border: none;
  background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto; color: var(--text-tertiary, #d1d5db); font-size: 12px;
}
.ex-note-btn:hover, .ex-note-btn--active { color: #7c3aed; }

/* Remove set button */
.ex-remove-set {
  width: 20px; height: 20px; border-radius: 4px; border: none;
  background: none; cursor: pointer; color: var(--text-tertiary, #d1d5db);
  font-size: 13px; display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
}
.ex-remove-set:hover { background: #fee2e2; color: #ef4444; }

/* Footer */
.ex-card-v2__footer { padding: 8px 14px 12px; }
.ex-add-set {
  display: flex; align-items: center; gap: 4px;
  color: #7c3aed; font-size: 12px; font-weight: 600;
  background: none; border: none; cursor: pointer;
  padding: 0; font-family: inherit;
}
.ex-add-set:hover { color: #5b21b6; }

/* ── Log mode ── */
.ex-card-v2--log .ex-log-row--active td { background: #f0f9ff; }
.ex-card-v2--log .ex-log-row--active .ex-set-num { color: #2563eb; }
.ex-card-v2--log .ex-log-row--active .ex-set-input { color: #2563eb; font-weight: 700; }
.ex-card-v2--log .ex-log-row--done { opacity: 0.42; }

.ex-check-btn {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid var(--border-color, #d1d5db);
  background: #fff; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: transparent;
  margin: 0 auto; font-size: 12px; font-family: inherit;
  transition: all 0.12s;
}
.ex-check-btn:hover { border-color: #2563eb; color: #2563eb; }
.ex-check-btn--done { background: #2563eb; border-color: #2563eb; color: #fff; }

.ex-mark-all {
  display: block; width: 100%; text-align: center;
  color: #2563eb; font-size: 13px; font-weight: 700;
  background: none; border: none; cursor: pointer;
  padding: 8px; border-radius: 8px; font-family: inherit;
}
.ex-mark-all:hover { background: #eff6ff; }

/* View mode row (non-edit) */
.ex-row-v2 { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
.ex-row-v2__meta { font-size: 12px; color: var(--text-secondary, #6b7280); }

/* Suggestions dropdown */
.ex-suggestions-v2 {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
  background: #fff; border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 200px; overflow-y: auto;
}
.ex-suggestion-v2 {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; cursor: pointer; font-size: 13px; font-family: inherit;
  border: none; background: none; width: 100%; text-align: left;
}
.ex-suggestion-v2:hover { background: #faf5ff; }
.ex-suggestion-v2__tag { font-size: 11px; color: var(--text-secondary, #9ca3af); }
```

- [ ] **Step 4: Rewrite `ExerciseItem.tsx`**

Replace the entire contents of `src/app/programs/components/workoutBuilder/ExerciseItem.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuGripVertical, LuX } from 'react-icons/lu';
import { Exercise, MeasurementType, Unit, SetTarget, SetLog } from '@trainapp-io/train-core';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import './ExerciseItem.css';

interface Props {
  exercise: Exercise;
  editMode: boolean;
  logMode?: boolean;
  blockIndex: number;
  exerciseIndex: number;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
  isActive?: boolean;
  onSelect?: () => void;
  onAddSuperset?: () => void;
  /** Called when a set is checked in log mode; passes the rest duration in seconds */
  onSetCompleted?: (restSeconds: number) => void;
  /** Column label for set number — "Rnd" inside circuits */
  setColumnLabel?: string;
}

const AVATAR_COLORS = [
  { bg: '#ede9fe', color: '#6d28d9' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#dcfce7', color: '#15803d' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#e0f2fe', color: '#075985' },
  { bg: '#fee2e2', color: '#991b1b' },
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function isVideoUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.mov/i.test(url);
}

const MEASUREMENT_TYPES = [MeasurementType.REPS, MeasurementType.TIME, MeasurementType.DISTANCE];
const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'reps',
  [MeasurementType.TIME]: 'sec',
  [MeasurementType.DISTANCE]: 'dist',
  [MeasurementType.BODYWEIGHT]: 'bw',
};

/** Build initial setData from exercise, falling back to single-value fields */
function getSetData(exercise: Exercise): SetTarget[] {
  const data = (exercise as any).setData as SetTarget[] | undefined;
  if (data?.length) return data;
  const count = (exercise as any).sets || 3;
  return Array.from({ length: count }, () => ({
    reps: exercise.targetReps,
    weight: exercise.targetWeight,
    durationSec: exercise.targetDurationSec,
    distance: exercise.targetDistance,
    rest: exercise.rest,
  }));
}

/** Build initial setLogs from exercise, falling back to setData or single-value fields */
function getSetLogs(exercise: Exercise): SetLog[] {
  const logs = (exercise as any).setLogs as SetLog[] | undefined;
  if (logs?.length) return logs;
  return getSetData(exercise).map((s) => ({
    actualReps: s.reps,
    actualWeight: s.weight,
    actualDurationSec: s.durationSec,
    actualDistance: s.distance,
    actualRest: s.rest,
    isCompleted: false,
  }));
}

const ExerciseItem: React.FC<Props> = ({
  exercise,
  editMode,
  logMode = false,
  blockIndex,
  exerciseIndex,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  isActive,
  onSelect,
  onAddSuperset: _onAddSuperset,
  onSetCompleted,
  setColumnLabel = 'Set',
}) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: exercise.order });
  const style = { transform: CSS.Transform.toString(transform) };

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; setIndex: number; value: string }>({
    open: false, setIndex: 0, value: '',
  });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  if (!updateExerciseInBlockPartial || !removeExerciseFromBlock) return null;

  const measurementType = exercise.measurement?.measurementType || MeasurementType.REPS;
  const weightUnit = (exercise as any).weightUnit === Unit.KILOGRAM ? 'kg' : 'lbs';
  const restUnit: 'seconds' | 'minutes' = (exercise as any).restUnit || 'seconds';
  const avatar = getAvatarStyle(exercise.name || 'X');
  const initial = (exercise.name || '?').charAt(0).toUpperCase();
  const hasWeight = measurementType === MeasurementType.REPS || measurementType === MeasurementType.DISTANCE;

  const update = (updates: Partial<Exercise>) =>
    updateExerciseInBlockPartial(blockIndex, exerciseIndex, updates);

  const cycleMeasurement = () => {
    const next = MEASUREMENT_TYPES[(MEASUREMENT_TYPES.indexOf(measurementType) + 1) % MEASUREMENT_TYPES.length];
    update({ measurement: { ...exercise.measurement, measurementType: next } });
  };

  const cycleWeight = () => {
    const next = (exercise as any).weightUnit === Unit.KILOGRAM ? Unit.POUND : Unit.KILOGRAM;
    update({ weightUnit: next } as any);
  };

  const toggleRestUnit = () => {
    update({ restUnit: restUnit === 'seconds' ? 'minutes' : 'seconds' } as any);
  };

  const handleNameChange = (value: string) => {
    update({ name: value });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (!value || value.length < 2) return setSuggestions([]);
      const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      if (!apiKey) return;
      try {
        const res = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/name/${value}?limit=8`,
          { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' } }
        );
        if (res.ok) { setSuggestions(await res.json()); setShowSuggestions(true); }
      } catch { setSuggestions([]); }
    }, 300);
  };

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editMode) {
    const setData = getSetData(exercise);
    const summaryParts: string[] = [];
    const first = setData[0] || {};
    if (first.reps) summaryParts.push(`${first.reps} ${MEASUREMENT_LABELS[measurementType]}`);
    if (first.weight) summaryParts.push(`${first.weight} ${weightUnit}`);
    return (
      <div ref={setNodeRef} style={style} className="ex-row-v2" {...attributes}>
        <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{exercise.name || 'Untitled'}</div>
          {summaryParts.length > 0 && (
            <div className="ex-row-v2__meta">{setData.length} × {summaryParts.join(' · ')}</div>
          )}
        </div>
      </div>
    );
  }

  // ── Log mode ──────────────────────────────────────────────────────────────
  if (logMode) {
    const setLogs = getSetLogs(exercise);
    const activeIndex = setLogs.findIndex((s) => !s.isCompleted);

    const checkSet = (index: number) => {
      const wasCompleted = setLogs[index].isCompleted;
      const next = setLogs.map((s, i) =>
        i === index ? { ...s, isCompleted: !s.isCompleted } : s
      );
      update({ setLogs: next } as any);
      if (!wasCompleted && onSetCompleted) {
        onSetCompleted(setLogs[index].actualRest || 0);
      }
    };

    const markAll = () => {
      update({ setLogs: setLogs.map((s) => ({ ...s, isCompleted: true })) } as any);
    };

    return (
      <div
        className={`ex-card-v2 ex-card-v2--log${isActive === false ? ' ex-card-v2--inactive' : ''}`}
        onClick={isActive === false ? onSelect : undefined}
      >
        <div className="ex-card-v2__header">
          <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
            {initial}
          </div>
          <span className="ex-card-v2__name-static">{exercise.name || 'Untitled'}</span>
          <span className="ex-toggle-chip" style={{ cursor: 'default' }}>{weightUnit}</span>
        </div>

        <div className="ex-set-table-wrap">
          <table className="ex-set-table">
            <thead>
              <tr>
                <th>{setColumnLabel}</th>
                {hasWeight && <th>{weightUnit.toUpperCase()}</th>}
                <th>{MEASUREMENT_LABELS[measurementType].toUpperCase()}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {setLogs.map((sl, i) => (
                <tr
                  key={i}
                  className={
                    sl.isCompleted ? 'ex-log-row--done'
                    : i === activeIndex ? 'ex-log-row--active'
                    : ''
                  }
                >
                  <td><span className="ex-set-num">{i + 1}</span></td>
                  {hasWeight && (
                    <td>
                      <input
                        className="ex-set-input"
                        type="number" min={0}
                        value={sl.actualWeight ?? ''}
                        onChange={(e) => {
                          const next = setLogs.map((s, idx) =>
                            idx === i ? { ...s, actualWeight: parseFloat(e.target.value) || 0 } : s
                          );
                          update({ setLogs: next } as any);
                        }}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      className="ex-set-input"
                      type="number" min={0}
                      value={
                        measurementType === MeasurementType.TIME ? (sl.actualDurationSec ?? '')
                        : measurementType === MeasurementType.DISTANCE ? (sl.actualDistance ?? '')
                        : (sl.actualReps ?? '')
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const field =
                          measurementType === MeasurementType.TIME ? 'actualDurationSec'
                          : measurementType === MeasurementType.DISTANCE ? 'actualDistance'
                          : 'actualReps';
                        const next = setLogs.map((s, idx) =>
                          idx === i ? { ...s, [field]: val } : s
                        );
                        update({ setLogs: next } as any);
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className={`ex-check-btn${sl.isCompleted ? ' ex-check-btn--done' : ''}`}
                      onClick={(e) => { e.stopPropagation(); checkSet(i); }}
                      aria-label={sl.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      type="button"
                    >
                      ✓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ex-card-v2__footer">
          <button className="ex-mark-all" onClick={markAll} type="button">
            Mark All
          </button>
        </div>
      </div>
    );
  }

  // ── Edit (create) mode ────────────────────────────────────────────────────
  const setData = getSetData(exercise);

  const updateSet = (index: number, field: keyof SetTarget, value: number | string | undefined) => {
    const next = setData.map((s, i) => i === index ? { ...s, [field]: value } : s);
    update({ setData: next, sets: next.length } as any);
  };

  const addSet = () => {
    const last = setData[setData.length - 1] || {};
    const next = [...setData, { ...last, note: undefined }];
    update({ setData: next, sets: next.length } as any);
  };

  const removeSet = (index: number) => {
    if (setData.length <= 1) return;
    const next = setData.filter((_, i) => i !== index);
    update({ setData: next, sets: next.length } as any);
  };

  const openNote = (index: number) => {
    setNoteDialog({ open: true, setIndex: index, value: setData[index]?.note || '' });
  };

  const saveNote = () => {
    updateSet(noteDialog.setIndex, 'note', noteDialog.value);
    setNoteDialog((d) => ({ ...d, open: false }));
  };

  const displayRest = (rest: number | undefined) => {
    if (!rest) return '';
    return restUnit === 'minutes' ? String(+(rest / 60).toFixed(1)) : String(rest);
  };

  const parseRest = (val: string) => {
    const n = parseFloat(val) || 0;
    return restUnit === 'minutes' ? Math.round(n * 60) : n;
  };

  return (
    <div ref={setNodeRef} style={style} className="ex-card-v2" {...attributes}>
      {/* Header */}
      <div className="ex-card-v2__header">
        {!logMode && (
          <span className="ex-card-v2__drag" {...listeners} style={{ cursor: 'grab', color: '#d1d5db', display: 'flex', alignItems: 'center' }}>
            <LuGripVertical size={14} />
          </span>
        )}

        <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
          {initial}
        </div>

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <input
            className="ex-card-v2__name"
            type="text"
            value={exercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Exercise…"
            aria-label="Exercise name"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="ex-suggestions-v2">
              {suggestions.map((s, i) => (
                <button key={i} className="ex-suggestion-v2"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    update({ name: s.name, exerciseId: s.id } as any);
                    setShowSuggestions(false);
                  }}>
                  <span>{s.name}</span>
                  <span className="ex-suggestion-v2__tag">{s.target}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ex-card-v2__toggles">
          {hasWeight && (
            <button className="ex-toggle-chip" onClick={cycleWeight} type="button">
              {weightUnit} <span style={{ fontSize: 9 }}>⟳</span>
            </button>
          )}
          <button className="ex-toggle-chip" onClick={cycleMeasurement} type="button">
            {MEASUREMENT_LABELS[measurementType]} <span style={{ fontSize: 9 }}>⟳</span>
          </button>
        </div>

        <button
          className="ex-card-v2__remove"
          onClick={() => removeExerciseFromBlock(blockIndex, exerciseIndex)}
          aria-label="Remove exercise"
          type="button"
        >
          <LuX size={14} />
        </button>
      </div>

      {/* Set table */}
      <div className="ex-set-table-wrap">
        <table className="ex-set-table">
          <thead>
            <tr>
              <th>{setColumnLabel}</th>
              {hasWeight && <th>{weightUnit.toUpperCase()}</th>}
              <th>{MEASUREMENT_LABELS[measurementType].toUpperCase()}</th>
              <th>REST</th>
              <th aria-label="Notes">📝</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {setData.map((set, i) => (
              <tr key={i}>
                <td><span className="ex-set-num">{i + 1}</span></td>

                {hasWeight && (
                  <td>
                    <input className="ex-set-input" type="number" min={0}
                      value={set.weight ?? ''}
                      onChange={(e) => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                      aria-label={`Set ${i + 1} weight`}
                    />
                  </td>
                )}

                <td>
                  <input className="ex-set-input" type="number" min={0}
                    value={
                      measurementType === MeasurementType.TIME ? (set.durationSec ?? '')
                      : measurementType === MeasurementType.DISTANCE ? (set.distance ?? '')
                      : (set.reps ?? '')
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const field =
                        measurementType === MeasurementType.TIME ? 'durationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'distance'
                        : 'reps';
                      updateSet(i, field as keyof SetTarget, val);
                    }}
                    aria-label={`Set ${i + 1} ${MEASUREMENT_LABELS[measurementType]}`}
                  />
                </td>

                <td>
                  <div className="ex-rest-cell">
                    <input className="ex-set-input" type="number" min={0}
                      style={{ width: 44 }}
                      value={displayRest(set.rest)}
                      onChange={(e) => updateSet(i, 'rest', parseRest(e.target.value))}
                      aria-label={`Set ${i + 1} rest`}
                    />
                    <button className="ex-rest-unit" onClick={toggleRestUnit} type="button">
                      {restUnit === 'seconds' ? 's ⟳' : 'min ⟳'}
                    </button>
                  </div>
                </td>

                <td>
                  <button
                    className={`ex-note-btn${set.note ? ' ex-note-btn--active' : ''}`}
                    onClick={() => openNote(i)}
                    aria-label={`Note for set ${i + 1}`}
                    type="button"
                  >
                    📝
                  </button>
                </td>

                <td>
                  <button
                    className="ex-remove-set"
                    onClick={() => removeSet(i)}
                    aria-label={`Remove set ${i + 1}`}
                    type="button"
                  >
                    <LuX size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="ex-card-v2__footer">
        <button className="ex-add-set" onClick={addSet} type="button">
          ＋ Add Set
        </button>
      </div>

      {/* Note dialog */}
      <Dialog open={noteDialog.open} onClose={() => setNoteDialog((d) => ({ ...d, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>Note for Set {noteDialog.setIndex + 1}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline rows={3} fullWidth variant="outlined"
            placeholder="Add a coaching note for this set…"
            value={noteDialog.value}
            onChange={(e) => setNoteDialog((d) => ({ ...d, value: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog((d) => ({ ...d, open: false }))}>Cancel</Button>
          <Button onClick={saveNote} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExerciseItem;
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx vitest run src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/programs/components/workoutBuilder/ExerciseItem.tsx src/app/programs/components/workoutBuilder/ExerciseItem.css src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx
git commit -m "feat: redesign ExerciseItem with per-set table, note dialog, and log mode checkmarks"
```

---

## Task 7: CircuitItem — auto-label badge and "then" connectors

**Repo:** `/Users/noahgross/train/train-web-app` · **Branch:** `ng-test`

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/CircuitItem.tsx`
- Create: `src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CircuitItem from '../CircuitItem';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND };

function makeExercise(name: string, order: number) {
  return {
    name, order, measurement: baseMeasurement,
    targetReps: 10, targetWeight: 0, rest: 60, sets: 3, hasSuperset: false,
    setData: [{ reps: 10, weight: 0, rest: 60 }, { reps: 10, weight: 0, rest: 60 }, { reps: 10, weight: 0, rest: 60 }],
  };
}

function makeBlock(exercises: any[], type = BlockType.CIRCUIT) {
  return { type, name: 'Test Block', targetSets: 3, order: 0, exercises };
}

function makeProps(block: any) {
  return {
    block,
    blockNumber: 1,
    editMode: true,
    logMode: false,
    workout: { name: 'Test', blocks: [block] } as any,
    onUpdateBlock: vi.fn(),
    onRemoveBlock: vi.fn(),
    onSetHasUnsavedChanges: vi.fn(),
    updateExerciseInBlockPartial: vi.fn(),
    removeExerciseFromBlock: vi.fn(),
  };
}

describe('CircuitItem badge auto-labeling', () => {
  it('shows "Superset" badge for 2 exercises', () => {
    const block = makeBlock([makeExercise('Curl', 0), makeExercise('Extension', 1)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText('Superset')).toBeInTheDocument();
  });

  it('shows "Tri-set" badge for 3 exercises', () => {
    const block = makeBlock([makeExercise('A', 0), makeExercise('B', 1), makeExercise('C', 2)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText('Tri-set')).toBeInTheDocument();
  });

  it('shows "Circuit" badge for 4 or more exercises', () => {
    const block = makeBlock([makeExercise('A', 0), makeExercise('B', 1), makeExercise('C', 2), makeExercise('D', 3)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText('Circuit')).toBeInTheDocument();
  });

  it('shows "then" connector between exercises', () => {
    const block = makeBlock([makeExercise('Curl', 0), makeExercise('Extension', 1)]);
    render(<CircuitItem {...makeProps(block)} />);
    expect(screen.getByText(/then/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Update `CircuitItem.tsx`**

Add the auto-label helper and update the block header. Replace the existing `CircuitItem.tsx` content:

```tsx
import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuX, LuPlus } from 'react-icons/lu';
import ExerciseItem from './ExerciseItem';
import { Block, BlockType, WorkoutRequest, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

interface Props {
  block: Block;
  blockNumber: number;
  editMode: boolean;
  logMode?: boolean;
  workout: WorkoutRequest;
  onUpdateBlock: (updated: Block) => void;
  onRemoveBlock: () => void;
  onSetHasUnsavedChanges: (hasChanges: boolean) => void;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<any>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
  activeExerciseIndex?: number;
  onSelectExercise?: (exerciseIndex: number) => void;
  onSetCompleted?: (restSeconds: number) => void;
}

function getGroupLabel(count: number): { label: string; color: string; bg: string } {
  if (count === 2) return { label: 'Superset', color: '#1d4ed8', bg: '#eff6ff' };
  if (count === 3) return { label: 'Tri-set', color: '#6d28d9', bg: '#faf5ff' };
  return { label: 'Circuit', color: '#6d28d9', bg: '#faf5ff' };
}

const CircuitItem: React.FC<Props> = ({
  block,
  blockNumber,
  editMode,
  logMode = false,
  workout,
  onUpdateBlock,
  onRemoveBlock,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  activeExerciseIndex = -1,
  onSelectExercise,
  onSetCompleted,
}) => {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = block.exercises.findIndex((e) => e.order === active.id);
    const newIndex = block.exercises.findIndex((e) => e.order === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(block.exercises, oldIndex, newIndex).map((ex, i) => ({ ...ex, order: i }));
    onUpdateBlock({ ...block, exercises: reordered });
    onSetHasUnsavedChanges(true);
  };

  const addExercise = () => {
    onUpdateBlock({
      ...block,
      exercises: [
        ...block.exercises,
        {
          name: '',
          rest: 0,
          targetReps: 10,
          targetDurationSec: 0,
          targetWeight: 0,
          targetDistance: 0,
          measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
          notes: '',
          order: block.exercises.length,
          sets: 3,
          hasSuperset: false,
          setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
        },
      ],
    });
  };

  const blockIndex = workout.blocks?.findIndex((b) => b.order === block.order) ?? 0;
  const restSeconds = (block as any).rest || 0;
  const isSingle = block.type === BlockType.SINGLE;

  // ── SINGLE block: render ExerciseItem directly, no group card ──
  if (isSingle) {
    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
          <div className="block-card block-card--single">
            {block.exercises.map((exercise, exerciseIndex) => (
              <ExerciseItem
                key={exercise.order}
                exercise={exercise}
                editMode={editMode}
                logMode={logMode}
                blockIndex={blockIndex}
                exerciseIndex={exerciseIndex}
                updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                removeExerciseFromBlock={
                  exerciseIndex === 0
                    ? () => onRemoveBlock()
                    : removeExerciseFromBlock
                }
                isActive={logMode ? activeExerciseIndex === exerciseIndex : undefined}
                onSelect={logMode ? () => onSelectExercise?.(exerciseIndex) : undefined}
                onSetCompleted={onSetCompleted}
                setColumnLabel="Set"
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // ── Circuit / Superset / Tri-set: grouped card ──
  const { label, color, bg } = getGroupLabel(block.exercises.length);

  return (
    <div className="block-card block-card--group">
      {/* Group header */}
      <div className="block-card__header" style={{ background: bg, borderBottom: `1px solid ${color}22` }}>
        <span className="block-card__badge" style={{ background: color }}>
          {label}
        </span>

        {editMode ? (
          <>
            <input
              className="block-card__name-input"
              type="text"
              value={block.name}
              onChange={(e) => onUpdateBlock({ ...block, name: e.target.value })}
              placeholder="Group name…"
              aria-label="Block name"
              style={{ color }}
            />

            <div className="ex-m" style={{ marginLeft: 'auto' }}>
              <input
                className="ex-m__input"
                type="number" min={1}
                value={block.targetSets}
                onChange={(e) => onUpdateBlock({ ...block, targetSets: parseInt(e.target.value) || 1 })}
                aria-label="Rounds"
              />
              <span className="ex-m__label">rounds</span>
            </div>

            <div className="ex-m" style={{ marginLeft: 8 }}>
              <input
                className="ex-m__input"
                type="number" min={0}
                value={restSeconds || ''}
                onChange={(e) => onUpdateBlock({ ...block, rest: parseInt(e.target.value) || 0 } as any)}
                placeholder="0"
                aria-label="Rest seconds"
              />
              <span className="ex-m__label">s rest</span>
            </div>

            {!logMode && (
              <button className="ex-card__remove" onClick={onRemoveBlock} aria-label="Remove block">
                <LuX size={15} />
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="block-card__name" style={{ color }}>{block.name}</h3>
            <div className="block-card__pills">
              <span className="block-pill block-pill--sets">{block.targetSets} rounds</span>
              {restSeconds > 0 && (
                <span className="block-pill block-pill--rest">{restSeconds}s rest</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Exercises */}
      <div className="block-card__exercises" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={block.exercises.map((e) => e.order)} strategy={verticalListSortingStrategy}>
            {block.exercises.map((exercise, exerciseIndex) => (
              <React.Fragment key={exercise.order}>
                {exerciseIndex > 0 && (
                  <div className="block-card__connector" aria-hidden="true">
                    <div className="block-card__connector-line" style={{ borderColor: color }} />
                    <span className="block-card__connector-label">then</span>
                  </div>
                )}
                <ExerciseItem
                  exercise={exercise}
                  editMode={editMode}
                  logMode={logMode}
                  blockIndex={blockIndex}
                  exerciseIndex={exerciseIndex}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                  isActive={logMode ? activeExerciseIndex === exerciseIndex : undefined}
                  onSelect={logMode ? () => onSelectExercise?.(exerciseIndex) : undefined}
                  onSetCompleted={onSetCompleted}
                  setColumnLabel="Rnd"
                />
              </React.Fragment>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add exercise inside group */}
      {editMode && !logMode && (
        <div style={{ padding: '6px 12px 12px' }}>
          <button className="block-card__add-ex" onClick={addExercise} style={{ borderColor: `${color}55`, color }}>
            <LuPlus aria-hidden="true" /> Add Exercise
          </button>
        </div>
      )}
    </div>
  );
};

export default CircuitItem;
```

- [ ] **Step 4: Add connector styles to `WorkoutView.css`**

Append to the end of `src/app/programs/views/WorkoutView.css`:

```css
/* ── Circuit group card ── */
.block-card--group .block-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px 14px 0 0;
}

.block-card__badge {
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: 5px;
  padding: 2px 8px;
  flex-shrink: 0;
}

/* "then" connector between exercises inside a group */
.block-card__connector {
  display: flex;
  align-items: center;
  padding: 0 2px;
}
.block-card__connector-line {
  width: 0;
  height: 14px;
  border-left: 2px solid #ddd6fe;
  margin-left: 14px;
  margin-right: 10px;
}
.block-card__connector-label {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block-card__add-ex {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  background: none;
  border: 1px dashed #c4b5fd;
  border-radius: 8px;
  padding: 7px 14px;
  cursor: pointer;
  color: #7c3aed;
  font-family: inherit;
}
.block-card__add-ex:hover { background: #faf5ff; }
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx vitest run src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/programs/components/workoutBuilder/CircuitItem.tsx src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx src/app/programs/views/WorkoutView.css
git commit -m "feat: CircuitItem auto-labels (Superset/Tri-set/Circuit) with then connectors"
```

---

## Task 8: CompletionFooter and WorkoutLogForm wiring

**Repo:** `/Users/noahgross/train/train-web-app` · **Branch:** `ng-test`

**Files:**
- Modify: `src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx`
- Modify: `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx`

- [ ] **Step 1: Simplify `CompletionFooter.tsx` to 3 buttons with rest prop**

Replace the entire contents of `src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { LuPlay, LuPause, LuFlagTriangleRight, LuTimer } from 'react-icons/lu';
import './WorkoutLogForm.css';

interface CompletionFooterProps {
  isLive: boolean;
  isTimerRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onFinish: () => void;
  isSaving?: boolean;
  /** When > 0, immediately starts a rest countdown for this many seconds */
  restSeconds?: number;
}

const CompletionFooter: React.FC<CompletionFooterProps> = ({
  isLive,
  isTimerRunning,
  onStart,
  onPause,
  onFinish,
  isSaving = false,
  restSeconds = 0,
}) => {
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start rest countdown when restSeconds prop changes to > 0
  useEffect(() => {
    if (restSeconds > 0) {
      if (restRef.current) clearInterval(restRef.current);
      setRestRemaining(restSeconds);
    }
  }, [restSeconds]);

  useEffect(() => {
    if (restRef.current) clearInterval(restRef.current);
    if (restRemaining === null || restRemaining <= 0) {
      if (restRemaining === 0) {
        const t = setTimeout(() => setRestRemaining(null), 1200);
        return () => clearTimeout(t);
      }
      return;
    }
    restRef.current = setInterval(
      () => setRestRemaining((s) => (s !== null ? s - 1 : null)),
      1000
    );
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restRemaining]);

  const startManualRest = () => {
    if (restRemaining !== null && restRemaining > 0) {
      setRestRemaining(null);
    } else {
      setRestRemaining(60);
    }
  };

  const formatRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const restIdle = restRemaining === null;
  const restDone = restRemaining === 0;

  return (
    <div className="wl-tabbar">
      {/* Start / Pause */}
      {isLive && (
        <button
          className="wl-tab wl-tab--active"
          onClick={isTimerRunning ? onPause : onStart}
          type="button"
        >
          {isTimerRunning ? <LuPause size={22} /> : <LuPlay size={22} />}
          <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
        </button>
      )}

      {/* Rest */}
      <button
        className={`wl-tab wl-tab--mid${!restIdle && !restDone ? ' wl-tab--rest-active' : ''}`}
        onClick={startManualRest}
        type="button"
        title={restIdle ? 'Start rest timer' : 'Cancel rest'}
      >
        <LuTimer size={22} />
        <span>
          {restDone ? 'Go!' : restIdle ? 'Rest' : formatRest(restRemaining!)}
        </span>
      </button>

      {/* Finish */}
      <button
        className="wl-tab wl-tab--finish"
        onClick={onFinish}
        disabled={isSaving}
        type="button"
      >
        <LuFlagTriangleRight size={22} />
        <span>{isSaving ? 'Saving…' : 'Finish'}</span>
      </button>
    </div>
  );
};

export default CompletionFooter;
```

- [ ] **Step 2: Update `WorkoutLogForm.tsx` to remove active-exercise state and wire rest callback**

In `WorkoutLogForm.tsx`:

1. Remove `activeBlockIdx`, `activeExerciseIdx`, `setActiveBlockIdx`, `setActiveExerciseIdx` state declarations.
2. Remove `midButton`, `totalSets`, `defaultRestSeconds` derived variables.
3. Add a `restSeconds` state that gets set when a set is completed:

```ts
const [restSeconds, setRestSeconds] = useState(0);
const [restKey, setRestKey] = useState(0);

const handleSetCompleted = (seconds: number) => {
  setRestSeconds(seconds);
  setRestKey((k) => k + 1); // force useEffect to re-fire even for same duration
};
```

4. Update each `CircuitItem` call — remove `activeExerciseIndex` and `onSelectExercise` props, add `onSetCompleted`:

```tsx
<CircuitItem
  key={block.order}
  block={block}
  blockNumber={index + 1}
  editMode={true}
  logMode={true}
  workout={workoutShell}
  onUpdateBlock={(updated) => handleUpdateBlock(index, updated)}
  onRemoveBlock={() => {}}
  onSetHasUnsavedChanges={() => {}}
  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
  removeExerciseFromBlock={() => {}}
  onSetCompleted={handleSetCompleted}
/>
```

5. Update the `CompletionFooter` call — remove `midButton`, `totalSets`, `defaultRestSeconds`, add `restSeconds`:

```tsx
<CompletionFooter
  key={restKey}
  isLive={isLive}
  isTimerRunning={isTimerRunning}
  onStart={handleStartTimer}
  onPause={handlePauseTimer}
  onFinish={handleSubmit}
  isSaving={isSaving}
  restSeconds={restSeconds}
/>
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run src/
```
Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx
git commit -m "feat: simplify CompletionFooter to 3 buttons and wire per-set rest callback"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| SetTarget / SetLog interfaces in train-core | Task 1 |
| SetTargetSchema / SetLogSchema in train-service | Tasks 3–4 |
| Per-set table in ExerciseItem create mode | Task 6 |
| Rest unit toggle (s / min) | Task 6 |
| Measurement type toggle (reps / sec / dist) | Task 6 |
| Weight unit toggle (lbs / kg) | Task 6 |
| Note dialog per set | Task 6 |
| "+ Add Set" / "– Remove set" | Task 6 |
| Per-set checkmarks + Mark All in log mode | Task 6 |
| Active row highlighted blue in log mode | Task 6 (CSS) |
| Rest countdown triggered after set check | Tasks 6 + 8 |
| Circuit auto-label (Superset / Tri-set / Circuit) | Task 7 |
| "then" connector between grouped exercises | Task 7 |
| "Rnd" column label inside circuits | Task 6 (`setColumnLabel` prop) |
| CompletionFooter simplified to 3 buttons | Task 8 |
| npm auth helper script | Task 2 |
| Backward compat for exercises without setData | Tasks 5, 6 (`getSetData` fallback) |

All spec sections have a corresponding task. No placeholders found.
