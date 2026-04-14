# Flexible Workout Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend workout creation to support swimming, CrossFit, track & field, and any other sport via Sections, a measurement-type dropdown, CALORIES/PERCENTAGE measurement types, a Group Exercise button, a rest unit toggle on group headers, and a workout type tag — all with backward-compatible data model changes.

**Architecture:** Three-repo change. train-core (main) owns the shared TypeScript types. train-service (ng-workout) stores and retrieves the new fields through Mongoose. train-web-app (ng-test) renders the new UI. Each layer builds on the previous one, so tasks must be executed in order: core → service → web.

**Tech Stack:** TypeScript 5, Mongoose 8, React 19, @dnd-kit/sortable, MUI v7, Vitest + @testing-library/react

---

## File Map

### train-core (branch: `main`)
| File | Change |
|------|--------|
| `src/core/enums/program.enums.ts` | Add `CALORIES`, `PERCENTAGE` to `MeasurementType`; `CALORIE`, `PERCENT` to `MeasurementUnit` |
| `src/core/dto/program.dto.ts` | New `Section`, `SectionSnapshot` interfaces; add `sections?`, `workoutType?` to `WorkoutRequest`/`WorkoutResponse`; add `sectionSnapshot?` to `WorkoutSnapshot` |

### train-service (branch: `ng-workout`)
| File | Change |
|------|--------|
| `src/infrastructure/database/models/programs/workoutModel.ts` | Add `SectionSchema`, `sections`/`workoutType` fields to `WorkoutDocument` + `WorkoutSchema` |
| `src/infrastructure/database/entity/program/Workout.ts` | Add `sections`/`workoutType` private fields, getters, and builder setters |
| `src/infrastructure/database/repositories/programs/WorkoutRepository.ts` | Include `sections`/`workoutType` in `toEntity`, `toDocument`, `toResponse` |
| `src/infrastructure/database/models/programs/workoutLogModel.ts` | Add `SectionSnapshotSchema` and `sectionSnapshot` to `WorkoutSnapshotSchema`/`WorkoutSnapshot` interface |

### train-web-app (branch: `ng-test`)
| File | Change |
|------|--------|
| `src/app/workouts/contexts/WorkoutContext.tsx` | Include `sections`/`workoutType` in `responseToRequest`; update `createDefaultWorkoutRequest` |
| `src/app/programs/components/workoutBuilder/ExerciseItem.tsx` | Replace cycle button with measurement dropdown; add `onGroupExercise` prop; update column logic for BODYWEIGHT/CALORIES/PERCENTAGE |
| `src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx` | Update cycling test → dropdown test; add column-visibility tests |
| `src/app/programs/components/workoutBuilder/CircuitItem.tsx` | Add rest unit toggle to group header; add `promoteToGroup` for SINGLE blocks; pass `onGroupExercise` to ExerciseItem |
| `src/app/programs/components/workoutBuilder/SectionItem.tsx` | **New** — Section container card |
| `src/app/programs/components/workoutBuilder/__tests__/SectionItem.test.tsx` | **New** — Section component tests |
| `src/app/programs/components/workoutBuilder/WorkoutBuilderBlocks.tsx` | Replace "Add Circuit" with "Add Section"; render `SectionItem`; merge-sort blocks + sections by order |
| `src/app/programs/components/workoutBuilder/WorkoutDetailsSection.tsx` | Add workout type pill row below duration |
| `src/app/workout-logs/pages/WorkoutLogCreate.tsx` | Flatten sections into `blockSnapshot`; add `sectionSnapshot` |
| `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx` | Render section name dividers before appropriate blocks |

---

## Task 1: Add measurement enum values and Section types to train-core

**Branch:** `main` in `train-core/`

**Files:**
- Modify: `train-core/src/core/enums/program.enums.ts`
- Modify: `train-core/src/core/dto/program.dto.ts`

- [ ] **Step 1: Update MeasurementType and MeasurementUnit enums**

In `train-core/src/core/enums/program.enums.ts`, add two values to each enum:

```typescript
export enum MeasurementType {
  REPS = "reps",
  TIME = "time",
  DISTANCE = "distance",
  BODYWEIGHT = "bodyweight",
  CALORIES = "calories",    // NEW
  PERCENTAGE = "percentage", // NEW
}

export enum MeasurementUnit {
  POUND = "lb",
  KILOGRAM = "kg",
  METER = "m",
  KILOMETER = "km",
  MILE = "mi",
  YARD = "yd",
  FOOT = "ft",
  HOUR = "hr",
  MINUTE = "min",
  SECOND = "sec",
  CALORIE = "cal",   // NEW
  PERCENT = "%",     // NEW
}
```

- [ ] **Step 2: Add Section and SectionSnapshot interfaces to program.dto.ts**

After the `Block` interface (line ~69), add:

```typescript
export interface Section {
  name: string;
  description?: string;
  blocks: Block[];
  order: number;
}

export interface SectionSnapshot {
  name: string;
  order: number;
  blockOrders: number[];
}
```

- [ ] **Step 3: Add sections and workoutType to WorkoutRequest and WorkoutResponse**

In `WorkoutRequest` (starts line ~54), add after `blocks?`:
```typescript
  sections?: Section[];
  workoutType?: string;
```

In `WorkoutResponse` (starts line ~119), add after `blocks?`:
```typescript
  sections?: Section[];
  workoutType?: string;
```

- [ ] **Step 4: Add sectionSnapshot to WorkoutSnapshot**

In `WorkoutSnapshot` (starts line ~173), add after `blockSnapshot?`:
```typescript
  sectionSnapshot?: SectionSnapshot[];
```

- [ ] **Step 5: Build the package to verify no TypeScript errors**

```bash
cd train-core && npm run build
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd train-core
git add src/core/enums/program.enums.ts src/core/dto/program.dto.ts
git commit -m "feat: add CALORIES/PERCENTAGE measurement types, Section and SectionSnapshot interfaces"
```

---

## Task 2: Update train-service workout model and entity

**Branch:** `ng-workout` in `train-service/`

**Files:**
- Modify: `src/infrastructure/database/models/programs/workoutModel.ts`
- Modify: `src/infrastructure/database/entity/program/Workout.ts`
- Modify: `src/infrastructure/database/repositories/programs/WorkoutRepository.ts`

- [ ] **Step 1: Check out ng-workout branch**

```bash
cd train-service && git checkout ng-workout
```
Expected: `Switched to branch 'ng-workout'`

- [ ] **Step 2: Pull updated train-core package**

```bash
cd train-service && npm install @trainapp-io/train-core@latest
```
If the package registry is not updated yet (train-core is a monorepo local package), skip this step — the import types will be updated when you link it. Proceed anyway.

- [ ] **Step 3: Add SectionSchema and update WorkoutDocument/WorkoutSchema in workoutModel.ts**

After `BlockSchema` (ends around line ~156) and before the `WorkoutDocument` interface, add:

```typescript
export interface Section {
  name: string;
  description?: string;
  blocks: Block[];
  order: number;
}

const SectionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    blocks: { type: [BlockSchema], required: true, default: [] },
    order: { type: Number, required: true },
  },
  { _id: false }
);
```

In the `WorkoutDocument` interface (starts line ~158), add after `blocks?`:
```typescript
  sections?: Section[];
  workoutType?: string;
```

In `WorkoutSchema` (the `new Schema({...})` call starting line ~175), add after the `blocks` field:
```typescript
    sections: {
      type: [SectionSchema],
      required: false,
    },
    workoutType: {
      type: String,
      required: false,
    },
```

- [ ] **Step 4: Compile to verify no TypeScript errors**

```bash
cd train-service && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Update Workout entity to carry sections and workoutType**

In `src/infrastructure/database/entity/program/Workout.ts`, add private fields after `blocks?`:
```typescript
  private sections?: Section[];
  private workoutType?: string;
```

Add the import at the top (the `Section` type comes from the local workoutModel):
```typescript
import { Exercise, Block, Section } from "../../models/programs/workoutModel.js";
```

In the constructor body, add after `this.blocks`:
```typescript
    this.sections = builder.sections;
    this.workoutType = builder.workoutType;
```

Add getters after `getBlocks()`:
```typescript
  public getSections(): Section[] | undefined {
    return this.sections;
  }
  public getWorkoutType(): string | undefined {
    return this.workoutType;
  }
```

In `WorkoutBuilder` class, add public fields after `blocks?`:
```typescript
  sections?: Section[];
  workoutType?: string;
```

Add setter methods after `setBlocks()`:
```typescript
  public setSections(sections?: Section[]): this {
    this.sections = sections;
    return this;
  }
  public setWorkoutType(workoutType?: string): this {
    this.workoutType = workoutType;
    return this;
  }
```

- [ ] **Step 6: Update WorkoutRepository to include sections and workoutType**

In `src/infrastructure/database/repositories/programs/WorkoutRepository.ts`:

In `toEntity`, add after `.setBlocks(doc.blocks)`:
```typescript
      .setSections(doc.sections)
      .setWorkoutType(doc.workoutType)
```

In `toResponse`, add after `blocks: workout.getBlocks() || [],`:
```typescript
      sections: workout.getSections() || [],
      workoutType: workout.getWorkoutType(),
```

- [ ] **Step 7: Compile to verify no TypeScript errors**

```bash
cd train-service && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 8: Run tests**

```bash
cd train-service && npm test
```
Expected: All tests pass (no existing tests cover workout model; this is a green-field addition).

- [ ] **Step 9: Commit**

```bash
cd train-service
git add src/infrastructure/database/models/programs/workoutModel.ts \
        src/infrastructure/database/entity/program/Workout.ts \
        src/infrastructure/database/repositories/programs/WorkoutRepository.ts
git commit -m "feat: add sections and workoutType to workout model, entity, and repository"
```

---

## Task 3: Update train-service workout log model

**Branch:** `ng-workout` in `train-service/`

**Files:**
- Modify: `src/infrastructure/database/models/programs/workoutLogModel.ts`

- [ ] **Step 1: Add SectionSnapshotSchema and sectionSnapshot field**

In `workoutLogModel.ts`, after the `BlockSnapshotSchema` definition (around line ~80), add:

```typescript
const SectionSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    blockOrders: { type: [Number], required: true },
  },
  { _id: false }
);
```

In the `WorkoutSnapshot` interface (starts line ~82), add after `blockSnapshot?`:
```typescript
  sectionSnapshot?: {
    name: string;
    order: number;
    blockOrders: number[];
  }[];
```

In `WorkoutSnapshotSchema` (the `new Schema({...})` starting around line ~96), add after the `blockSnapshot` field:
```typescript
    sectionSnapshot: { type: [SectionSnapshotSchema], required: false },
```

- [ ] **Step 2: Compile and test**

```bash
cd train-service && npx tsc --noEmit && npm test
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd train-service
git add src/infrastructure/database/models/programs/workoutLogModel.ts
git commit -m "feat: add SectionSnapshot schema to workout log model"
```

---

## Task 4: Update WorkoutContext to include sections and workoutType

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/workouts/contexts/WorkoutContext.tsx`

- [ ] **Step 1: Check out ng-test branch**

```bash
cd train-web-app && git checkout ng-test
```
Expected: `Switched to branch 'ng-test'`

- [ ] **Step 2: Update createDefaultWorkoutRequest to include sections**

In `WorkoutContext.tsx`, find `createDefaultWorkoutRequest` (line ~6) and update the return object to include:
```typescript
function createDefaultWorkoutRequest(): WorkoutRequest {
  return {
    name: '',
    description: '',
    category: [],
    difficulty: WorkoutDifficulty.BEGINNER,
    duration: 0,
    blocks: [],
    sections: [],      // ADD
    exercises: [],
    accessType: ProfileAccess.Public,
    createdBy: '',
    startDate: new Date(),
    endDate: new Date(),
  };
}
```

- [ ] **Step 3: Update responseToRequest to carry sections and workoutType**

Find `responseToRequest` (line ~310) in the `workoutUtils` object and update:
```typescript
  responseToRequest: (response: WorkoutResponse, userId: string): WorkoutRequest => {
    return {
      name: response.name || '',
      description: response.description || '',
      category: response.category || [],
      difficulty: response.difficulty || WorkoutDifficulty.BEGINNER,
      duration: response.duration || 0,
      blocks: response.blocks || [],
      sections: response.sections || [],   // ADD
      workoutType: response.workoutType,   // ADD
      exercises: response.exercises || [],
      accessType: response.accessType || ProfileAccess.Public,
      createdBy: userId,
      startDate: response.startDate ? new Date(response.startDate) : new Date(),
      endDate: response.endDate ? new Date(response.endDate) : new Date(),
    };
  },
```

Also update the `Section` import at line ~3 — change the import to include `Section`:
```typescript
import { WorkoutRequest, ProfileAccess, WorkoutDifficulty, WorkoutResponse, Exercise, Block,
  MeasurementType, MeasurementUnit, Section } from '@trainapp-io/train-core';
```

- [ ] **Step 4: Run existing WorkoutContext tests (if any)**

```bash
cd train-web-app && npx vitest run src/app/workouts/contexts/ --reporter=verbose 2>/dev/null || echo "No tests found"
```
Expected: Tests pass or no tests found (context has no unit tests currently).

- [ ] **Step 5: Commit**

```bash
cd train-web-app
git add src/app/workouts/contexts/WorkoutContext.tsx
git commit -m "feat: include sections and workoutType in WorkoutContext responseToRequest"
```

---

## Task 5: Update ExerciseItem — measurement dropdown and Group Exercise button

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/ExerciseItem.tsx`
- Modify: `src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx`

The key changes to `ExerciseItem.tsx`:
1. Extend `MEASUREMENT_TYPES` array and `MEASUREMENT_LABELS` map to include all 6 types
2. Replace `cycleMeasurement` + the `ex-toggle-chip` measurement button with a dropdown popover
3. Update `hasWeight` logic: only REPS shows weight column (remove DISTANCE from the condition)
4. Add BODYWEIGHT / CALORIES / PERCENTAGE column handling in both edit and log set tables
5. Add `onGroupExercise?: () => void` prop + `+ Group Exercise` button in the card footer

- [ ] **Step 1: Write failing tests for the new behavior**

Replace the content of `src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx` with:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseItem from '../ExerciseItem';
import { MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

function makeExercise(overrides = {}) {
  return {
    name: 'Squat',
    order: 0,
    rest: 0,
    targetReps: 10,
    targetDurationSec: 0,
    targetWeight: 0,
    targetDistance: 0,
    notes: '',
    sets: 3,
    hasSuperset: false,
    measurement: {
      measurementType: MeasurementType.REPS,
      measurementUnit: MeasurementUnit.POUND,
    },
    setData: [{ reps: 10, weight: 100, rest: 60 }],
    ...overrides,
  };
}

describe('ExerciseItem — measurement dropdown', () => {
  it('shows the current measurement type as a chip label', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /reps/i })).toBeInTheDocument();
  });

  it('opens a dropdown listing all 6 measurement types when chip is clicked', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /reps/i }));
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Bodyweight')).toBeInTheDocument();
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('% Effort')).toBeInTheDocument();
  });

  it('calls update with new measurement type when a dropdown option is selected', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /reps/i }));
    fireEvent.click(screen.getByText('Calories'));
    expect(update).toHaveBeenCalledWith(0, 0, expect.objectContaining({
      measurement: expect.objectContaining({ measurementType: MeasurementType.CALORIES }),
    }));
  });
});

describe('ExerciseItem — column visibility', () => {
  it('shows weight column for REPS', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('columnheader', { name: /lbs/i })).toBeInTheDocument();
  });

  it('hides weight column for BODYWEIGHT', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({
          measurement: { measurementType: MeasurementType.BODYWEIGHT, measurementUnit: MeasurementUnit.POUND },
          setData: [{ reps: 10, rest: 60 }],
        })}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('columnheader', { name: /lbs/i })).not.toBeInTheDocument();
  });

  it('shows CAL column header for CALORIES', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({
          measurement: { measurementType: MeasurementType.CALORIES, measurementUnit: MeasurementUnit.CALORIE },
          setData: [{ reps: 50, rest: 60 }],
        })}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('columnheader', { name: /lbs/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /cal/i })).toBeInTheDocument();
  });

  it('shows % column header for PERCENTAGE', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise({
          measurement: { measurementType: MeasurementType.PERCENTAGE, measurementUnit: MeasurementUnit.PERCENT },
          setData: [{ reps: 70, rest: 60 }],
        })}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('columnheader', { name: /lbs/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /%/i })).toBeInTheDocument();
  });
});

describe('ExerciseItem — Group Exercise button', () => {
  it('renders + Group Exercise button when onGroupExercise prop is provided', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
        onGroupExercise={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /group exercise/i })).toBeInTheDocument();
  });

  it('does not render + Group Exercise button when onGroupExercise is not provided', () => {
    const update = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /group exercise/i })).not.toBeInTheDocument();
  });

  it('calls onGroupExercise when the button is clicked', () => {
    const update = vi.fn();
    const onGroup = vi.fn();
    render(
      <ExerciseItem
        exercise={makeExercise()}
        editMode={true}
        blockIndex={0}
        exerciseIndex={0}
        updateExerciseInBlockPartial={update}
        removeExerciseFromBlock={vi.fn()}
        onGroupExercise={onGroup}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /group exercise/i }));
    expect(onGroup).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd train-web-app && npx vitest run src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx --reporter=verbose
```
Expected: Several tests FAIL (dropdown doesn't exist yet, Group Exercise button doesn't exist yet).

- [ ] **Step 3: Update ExerciseItem.tsx — extend MEASUREMENT_TYPES and LABELS**

At the top of `ExerciseItem.tsx` (after the imports), replace the two const declarations:

```typescript
const MEASUREMENT_TYPES = [
  MeasurementType.REPS,
  MeasurementType.TIME,
  MeasurementType.DISTANCE,
  MeasurementType.BODYWEIGHT,
  MeasurementType.CALORIES,
  MeasurementType.PERCENTAGE,
];

const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'reps',
  [MeasurementType.TIME]: 'sec',
  [MeasurementType.DISTANCE]: 'dist',
  [MeasurementType.BODYWEIGHT]: 'bw',
  [MeasurementType.CALORIES]: 'cal',
  [MeasurementType.PERCENTAGE]: '%',
};

const MEASUREMENT_DISPLAY: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'Reps',
  [MeasurementType.TIME]: 'Time',
  [MeasurementType.DISTANCE]: 'Distance',
  [MeasurementType.BODYWEIGHT]: 'Bodyweight',
  [MeasurementType.CALORIES]: 'Calories',
  [MeasurementType.PERCENTAGE]: '% Effort',
};
```

- [ ] **Step 4: Update ExerciseItem Props to add onGroupExercise**

In the `Props` interface, add after `setColumnLabel?`:
```typescript
  /** Called to add a new exercise to the same block (promotes SINGLE → group or appends to group) */
  onGroupExercise?: () => void;
```

In the destructuring in `const ExerciseItem: React.FC<Props> = ({`, add `onGroupExercise` after `setColumnLabel = 'Set'`:
```typescript
  onGroupExercise,
```

- [ ] **Step 5: Update hasWeight logic and add dropdown state**

Find the line:
```typescript
  const hasWeight = measurementType === MeasurementType.REPS || measurementType === MeasurementType.DISTANCE;
```
Replace with:
```typescript
  const hasWeight = measurementType === MeasurementType.REPS;
  const [measureDropdownOpen, setMeasureDropdownOpen] = useState(false);
```

Also remove the now-unused `cycleMeasurement` function (lines ~134-137):
```typescript
  // DELETE these lines:
  const cycleMeasurement = () => {
    const next = MEASUREMENT_TYPES[(MEASUREMENT_TYPES.indexOf(measurementType) + 1) % MEASUREMENT_TYPES.length];
    update({ measurement: { ...exercise.measurement, measurementType: next } });
  };
```

- [ ] **Step 6: Replace the measurement cycle button with a dropdown in edit mode**

In the `ex-card-v2__toggles` div (around line ~488), replace the measurement `ex-toggle-chip` button and surrounding div:

```tsx
        <div className="ex-card-v2__toggles">
          {hasWeight && (
            <button className="ex-toggle-chip" onClick={cycleWeight} type="button">
              {weightUnit} <span style={{ fontSize: 9 }}>⟳</span>
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button
              className="ex-toggle-chip"
              onClick={() => setMeasureDropdownOpen((o) => !o)}
              type="button"
              aria-label={`Measurement type: ${MEASUREMENT_DISPLAY[measurementType]}`}
            >
              {MEASUREMENT_LABELS[measurementType]} <span style={{ fontSize: 9 }}>▾</span>
            </button>
            {measureDropdownOpen && (
              <div
                className="ex-measure-dropdown"
                style={{
                  position: 'absolute', right: 0, top: '110%', zIndex: 100,
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 160, padding: '4px 0',
                }}
              >
                {MEASUREMENT_TYPES.map((mt) => (
                  <button
                    key={mt}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13,
                      fontWeight: mt === measurementType ? 700 : 400,
                      color: mt === measurementType ? '#6d28d9' : '#111827',
                    }}
                    onClick={() => {
                      update({ measurement: { ...exercise.measurement, measurementType: mt } });
                      setMeasureDropdownOpen(false);
                    }}
                    type="button"
                  >
                    {mt === measurementType && '✓ '}{MEASUREMENT_DISPLAY[mt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
```

- [ ] **Step 7: Update the edit-mode table header for CALORIES and PERCENTAGE columns**

Find the `<thead>` in the edit-mode table (~line ~513). Replace the measurement column header:
```tsx
              <th>
                {measurementType === MeasurementType.CALORIES ? 'CAL'
                  : measurementType === MeasurementType.PERCENTAGE ? '%'
                  : MEASUREMENT_LABELS[measurementType].toUpperCase()}
              </th>
```

- [ ] **Step 8: Update the edit-mode table body to handle reps field for all no-weight types**

In the metric cell `<td>` in the edit-mode `setData.map` loop (around line ~539), the reps/time/distance switch needs to handle CALORIES and PERCENTAGE (which also store their value in the `reps` field):

```tsx
                <td>
                  <input className="ex-set-input" type="number" min={0}
                    value={
                      measurementType === MeasurementType.TIME ? rawVal(i, 'durationSec', set.durationSec)
                      : measurementType === MeasurementType.DISTANCE ? rawVal(i, 'distance', set.distance)
                      : rawVal(i, 'reps', set.reps)
                    }
                    onChange={(e) => {
                      const field =
                        measurementType === MeasurementType.TIME ? 'durationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'distance'
                        : 'reps';
                      onRawChange(i, field, e.target.value);
                    }}
                    onBlur={(e) => {
                      const field =
                        measurementType === MeasurementType.TIME ? 'durationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'distance'
                        : 'reps';
                      onRawBlur(i, field as keyof SetTarget, e.target.value);
                    }}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Set ${i + 1} ${MEASUREMENT_LABELS[measurementType]}`}
                  />
                </td>
```

(This is unchanged from the current code — CALORIES and PERCENTAGE both fall through to the `reps` branch, which is correct since we store those values in `reps`.)

- [ ] **Step 9: Add + Group Exercise button to the edit-mode card footer**

Find the edit-mode footer (around line ~612):
```tsx
      {/* Footer */}
      <div className="ex-card-v2__footer">
        <button className="ex-add-set" onClick={addSet} type="button">
          + Add Set
        </button>
      </div>
```

Replace with:
```tsx
      {/* Footer */}
      <div className="ex-card-v2__footer">
        <button className="ex-add-set" onClick={addSet} type="button">
          + Add Set
        </button>
        {onGroupExercise && (
          <button
            className="ex-group-ex-btn"
            onClick={onGroupExercise}
            type="button"
            aria-label="Group Exercise"
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: '#6d28d9',
              background: 'none',
              border: '1px solid #ede9fe',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            + Group Exercise
          </button>
        )}
      </div>
```

- [ ] **Step 10: Run tests to confirm they pass**

```bash
cd train-web-app && npx vitest run src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx --reporter=verbose
```
Expected: All tests PASS.

- [ ] **Step 11: Commit**

```bash
cd train-web-app
git add src/app/programs/components/workoutBuilder/ExerciseItem.tsx \
        src/app/programs/components/workoutBuilder/__tests__/ExerciseItem.test.tsx
git commit -m "feat: replace measurement cycle button with dropdown; add Group Exercise button to ExerciseItem"
```

---

## Task 6: Update CircuitItem — rest unit toggle and Group Exercise wiring

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/CircuitItem.tsx`

Changes:
1. Add `restUnit` state to group header + s⟳/min⟳ toggle button
2. For SINGLE blocks: define `promoteToGroup` and pass it as `onGroupExercise` to the ExerciseItem
3. For group blocks: pass `addExercise` as `onGroupExercise` to each ExerciseItem

- [ ] **Step 1: Write failing tests for CircuitItem changes**

Replace the contents of `src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx` with:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CircuitItem from '../CircuitItem';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
}));
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null }),
  verticalListSortingStrategy: {},
  arrayMove: vi.fn(),
}));
vi.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

function makeBlock(overrides = {}) {
  return {
    type: BlockType.SINGLE,
    name: 'Block 1',
    targetSets: 3,
    rest: 0,
    order: 0,
    exercises: [
      {
        name: 'Push-up',
        order: 0,
        rest: 0,
        targetReps: 10,
        targetDurationSec: 0,
        targetWeight: 0,
        targetDistance: 0,
        notes: '',
        sets: 3,
        hasSuperset: false,
        measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
        setData: [{ reps: 10, weight: 0, rest: 0 }],
      },
    ],
    ...overrides,
  };
}

function makeWorkout(blocks: any[] = []) {
  return { blocks, sections: [] };
}

describe('CircuitItem — SINGLE block Group Exercise button', () => {
  it('passes onGroupExercise to ExerciseItem which promotes block to CIRCUIT', () => {
    const onUpdateBlock = vi.fn();
    const block = makeBlock();
    render(
      <CircuitItem
        block={block}
        blockNumber={1}
        editMode={true}
        workout={makeWorkout([block]) as any}
        onUpdateBlock={onUpdateBlock}
        onRemoveBlock={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    // The + Group Exercise button should appear on the exercise card
    const groupBtn = screen.getByRole('button', { name: /group exercise/i });
    fireEvent.click(groupBtn);
    expect(onUpdateBlock).toHaveBeenCalledWith(expect.objectContaining({
      type: BlockType.CIRCUIT,
      exercises: expect.arrayContaining([
        expect.objectContaining({ name: 'Push-up' }),
        expect.objectContaining({ name: '' }), // new empty exercise
      ]),
    }));
  });
});

describe('CircuitItem — group block rest unit toggle', () => {
  it('shows s⟳ toggle button in group header', () => {
    const block = makeBlock({
      type: BlockType.CIRCUIT,
      rest: 90,
      exercises: [
        makeBlock().exercises[0],
        { ...makeBlock().exercises[0], name: 'Squat', order: 1 },
      ],
    });
    render(
      <CircuitItem
        block={block}
        blockNumber={1}
        editMode={true}
        workout={makeWorkout([block]) as any}
        onUpdateBlock={vi.fn()}
        onRemoveBlock={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /s ⟳|min ⟳/i })).toBeInTheDocument();
  });

  it('toggles between seconds and minutes display', () => {
    const block = makeBlock({
      type: BlockType.CIRCUIT,
      rest: 120,
      exercises: [
        makeBlock().exercises[0],
        { ...makeBlock().exercises[0], name: 'Squat', order: 1 },
      ],
    });
    render(
      <CircuitItem
        block={block}
        blockNumber={1}
        editMode={true}
        workout={makeWorkout([block]) as any}
        onUpdateBlock={vi.fn()}
        onRemoveBlock={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    const toggleBtn = screen.getByRole('button', { name: /s ⟳/i });
    expect(toggleBtn).toHaveTextContent('s ⟳');
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /min ⟳/i })).toHaveTextContent('min ⟳');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd train-web-app && npx vitest run src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx --reporter=verbose
```
Expected: Tests FAIL (Group Exercise button not wired, rest toggle missing).

- [ ] **Step 3: Add restUnit state and toggle to CircuitItem**

In `CircuitItem.tsx`, after the `const isSingle = block.type === BlockType.SINGLE;` line, add:

```typescript
  const [restUnit, setRestUnit] = useState<'seconds' | 'minutes'>('seconds');

  const displayGroupRest = () => {
    if (!restSeconds) return '';
    return restUnit === 'minutes' ? String(+(restSeconds / 60).toFixed(1)) : String(restSeconds);
  };

  const parseGroupRest = (val: string) => {
    const n = parseFloat(val) || 0;
    return restUnit === 'minutes' ? Math.round(n * 60) : n;
  };
```

In the group header, find the rest `<div className="ex-m">` block (around line ~241):
```tsx
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
```

Replace with:
```tsx
            <div className="ex-m" style={{ marginLeft: 8 }}>
              <input
                className="ex-m__input"
                type="number" min={0}
                value={displayGroupRest()}
                onChange={(e) => {
                  const stored = parseGroupRest(e.target.value);
                  onUpdateBlock({ ...block, rest: stored } as any);
                }}
                placeholder="0"
                aria-label="Rest between rounds"
              />
              <button
                className="ex-rest-unit"
                onClick={() => setRestUnit((u) => u === 'seconds' ? 'minutes' : 'seconds')}
                type="button"
                aria-label={restUnit === 'seconds' ? 's ⟳' : 'min ⟳'}
              >
                {restUnit === 'seconds' ? 's ⟳' : 'min ⟳'}
              </button>
            </div>
```

- [ ] **Step 4: Add promoteToGroup for SINGLE blocks and wire Group Exercise to ExerciseItem**

In `CircuitItem.tsx`, add `createEmptyExercise` helper after the `addExercise` function:

```typescript
  const createEmptyExercise = (order: number) => ({
    name: '',
    rest: 0,
    targetReps: 10,
    targetDurationSec: 0,
    targetWeight: 0,
    targetDistance: 0,
    measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
    notes: '',
    order,
    sets: 3,
    hasSuperset: false,
    setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
  });

  const promoteToGroup = () => {
    onUpdateBlock({
      ...block,
      type: BlockType.CIRCUIT,
      exercises: [
        ...block.exercises,
        createEmptyExercise(block.exercises.length),
      ],
    });
  };
```

In the SINGLE block render (around line ~178), update the `ExerciseItem` to pass `onGroupExercise`:
```tsx
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
                isActive={logMode ? (isBlockActive && activeExerciseIndex === exerciseIndex) : undefined}
                onSelect={logMode ? onJumpTo : undefined}
                onSetCompleted={onSetCompleted}
                setColumnLabel="Set"
                onGroupExercise={editMode && !logMode ? promoteToGroup : undefined}
              />
```

In the group block render (around line ~284), update each `ExerciseItem` to pass `onGroupExercise`:
```tsx
                <ExerciseItem
                  exercise={exercise}
                  editMode={editMode}
                  logMode={logMode}
                  blockIndex={blockIndex}
                  exerciseIndex={exerciseIndex}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                  isActive={logMode ? (isBlockActive && groupActiveExIdx === exerciseIndex) : undefined}
                  onSelect={logMode ? () => setGroupActiveExIdx(exerciseIndex) : undefined}
                  onSetCompleted={logMode ? (restSecs) => {
                    const nextIdx = exerciseIndex + 1;
                    if (nextIdx < block.exercises.length) {
                      setGroupActiveExIdx(nextIdx);
                    } else {
                      setGroupActiveExIdx(0);
                      onSetCompleted?.(restSecs);
                    }
                  } : onSetCompleted}
                  setColumnLabel="Rnd"
                  onGroupExercise={editMode && !logMode ? addExercise : undefined}
                />
```

Also remove the old "Add Exercise inside group" button at the bottom of the group render (around line ~314) since ExerciseItem now carries the Group Exercise button:
```tsx
      {/* Add exercise inside group — REMOVE THIS BLOCK */}
      {editMode && !logMode && (
        <div style={{ padding: '6px 12px 12px' }}>
          <button className="block-card__add-ex" onClick={addExercise} style={{ borderColor: `${color}55`, color }}>
            <LuPlus aria-hidden="true" /> Add Exercise
          </button>
        </div>
      )}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd train-web-app && npx vitest run src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx --reporter=verbose
```
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
cd train-web-app
git add src/app/programs/components/workoutBuilder/CircuitItem.tsx \
        src/app/programs/components/workoutBuilder/__tests__/CircuitItem.test.tsx
git commit -m "feat: add rest unit toggle to group header; wire Group Exercise button through CircuitItem"
```

---

## Task 7: Create SectionItem component

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Create: `src/app/programs/components/workoutBuilder/SectionItem.tsx`
- Create: `src/app/programs/components/workoutBuilder/__tests__/SectionItem.test.tsx`

`SectionItem` renders one Section: a header (SECTION badge, editable name, remove button) and a body (the section's blocks rendered as CircuitItems plus an "+ Add Exercise to Section" button).

- [ ] **Step 1: Write failing tests**

Create `src/app/programs/components/workoutBuilder/__tests__/SectionItem.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionItem from '../SectionItem';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
}));
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null }),
  verticalListSortingStrategy: {},
  arrayMove: vi.fn(),
}));
vi.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

function makeSection(name = 'W/U (400)') {
  return {
    name,
    order: 0,
    blocks: [],
  };
}

function makeWorkout() {
  return { blocks: [], sections: [] };
}

describe('SectionItem', () => {
  it('renders SECTION badge', () => {
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByText('SECTION')).toBeInTheDocument();
  });

  it('renders the section name in an editable input', () => {
    render(
      <SectionItem
        section={makeSection('Main Set')}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('Main Set')).toBeInTheDocument();
  });

  it('calls onUpdate when name is changed', () => {
    const onUpdate = vi.fn();
    render(
      <SectionItem
        section={makeSection('Main Set')}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.change(screen.getByDisplayValue('Main Set'), { target: { value: 'Cool Down' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cool Down' }));
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={onRemove}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /remove section/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders + Add Exercise to Section button in edit mode', () => {
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add exercise to section/i })).toBeInTheDocument();
  });

  it('adds a new SINGLE block when + Add Exercise to Section is clicked', () => {
    const onUpdate = vi.fn();
    render(
      <SectionItem
        section={makeSection()}
        editMode={true}
        workout={makeWorkout() as any}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        onSetHasUnsavedChanges={vi.fn()}
        updateExerciseInBlockPartial={vi.fn()}
        removeExerciseFromBlock={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add exercise to section/i }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      blocks: expect.arrayContaining([
        expect.objectContaining({ type: BlockType.SINGLE }),
      ]),
    }));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd train-web-app && npx vitest run src/app/programs/components/workoutBuilder/__tests__/SectionItem.test.tsx --reporter=verbose
```
Expected: FAIL (SectionItem does not exist).

- [ ] **Step 3: Implement SectionItem.tsx**

Create `src/app/programs/components/workoutBuilder/SectionItem.tsx`:

```tsx
import React, { useState } from 'react';
import { LuX, LuPlus, LuGripVertical } from 'react-icons/lu';
import { Block, BlockType, Exercise, MeasurementType, MeasurementUnit, Section, WorkoutRequest } from '@trainapp-io/train-core';
import CircuitItem from './CircuitItem';

interface Props {
  section: Section;
  editMode: boolean;
  workout: WorkoutRequest;
  onUpdate: (updated: Section) => void;
  onRemove: () => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
  updateExerciseInBlockPartial: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock: (blockIndex: number, exerciseIndex: number) => void;
}

function createEmptyExercise(order: number): Exercise {
  return {
    name: '',
    rest: 0,
    targetReps: 10,
    targetDurationSec: 0,
    targetWeight: 0,
    targetDistance: 0,
    measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
    notes: '',
    order,
    sets: 3,
    hasSuperset: false,
    setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
  };
}

const SectionItem: React.FC<Props> = ({
  section,
  editMode,
  workout,
  onUpdate,
  onRemove,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
}) => {
  const [isDragging, _setIsDragging] = useState(false);

  const addExerciseToSection = () => {
    const newBlock: Block = {
      type: BlockType.SINGLE,
      name: `Exercise ${section.blocks.length + 1}`,
      targetSets: 3,
      rest: 0,
      exercises: [createEmptyExercise(0)],
      order: section.blocks.length,
    };
    onUpdate({ ...section, blocks: [...section.blocks, newBlock] });
  };

  const handleUpdateBlock = (updated: Block) => {
    onUpdate({
      ...section,
      blocks: section.blocks.map((b) => b.order === updated.order ? updated : b),
    });
    onSetHasUnsavedChanges(true);
  };

  const handleRemoveBlock = (block: Block) => {
    onUpdate({
      ...section,
      blocks: section.blocks.filter((b) => b.order !== block.order),
    });
    onSetHasUnsavedChanges(true);
  };

  // Build a workout shell so CircuitItem can resolve blockIndex within the section
  const sectionWorkoutShell: WorkoutRequest = {
    ...workout,
    blocks: section.blocks,
  };

  return (
    <div
      className="section-card"
      style={{
        border: '1.5px solid #e5e7eb',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      {/* Section header */}
      <div
        className="section-card__header"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: '#f3f4f6',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {editMode && (
          <span style={{ color: '#d1d5db', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
            <LuGripVertical size={14} />
          </span>
        )}
        <span
          style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
            padding: '2px 8px', borderRadius: 5,
            background: '#e0f2fe', color: '#075985',
            textTransform: 'uppercase' as const, flexShrink: 0,
          }}
        >
          SECTION
        </span>
        {editMode ? (
          <input
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 600, color: '#111827',
              outline: 'none', minWidth: 0,
            }}
            value={section.name}
            onChange={(e) => {
              onUpdate({ ...section, name: e.target.value });
              onSetHasUnsavedChanges(true);
            }}
            placeholder="Section name…"
            aria-label="Section name"
          />
        ) : (
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>
            {section.name || 'Untitled Section'}
          </span>
        )}
        {editMode && (
          <button
            onClick={onRemove}
            aria-label="Remove section"
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
          >
            <LuX size={14} />
          </button>
        )}
      </div>

      {/* Section body */}
      <div style={{ padding: '8px 12px 4px' }}>
        {section.blocks.map((block, idx) => (
          <CircuitItem
            key={block.order}
            block={block}
            blockNumber={idx + 1}
            editMode={editMode}
            workout={sectionWorkoutShell}
            onUpdateBlock={handleUpdateBlock}
            onRemoveBlock={() => handleRemoveBlock(block)}
            onSetHasUnsavedChanges={onSetHasUnsavedChanges}
            updateExerciseInBlockPartial={updateExerciseInBlockPartial}
            removeExerciseFromBlock={removeExerciseFromBlock}
          />
        ))}

        {editMode && (
          <button
            onClick={addExerciseToSection}
            type="button"
            aria-label="Add Exercise to Section"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              width: '100%', padding: '7px 10px',
              fontSize: 12, fontWeight: 600, color: '#075985',
              background: 'none', border: '1px dashed #bae6fd',
              borderRadius: 8, cursor: 'pointer', marginBottom: 8,
              justifyContent: 'center',
            }}
          >
            <LuPlus size={13} aria-hidden="true" /> Add Exercise to Section
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionItem;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd train-web-app && npx vitest run src/app/programs/components/workoutBuilder/__tests__/SectionItem.test.tsx --reporter=verbose
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd train-web-app
git add src/app/programs/components/workoutBuilder/SectionItem.tsx \
        src/app/programs/components/workoutBuilder/__tests__/SectionItem.test.tsx
git commit -m "feat: create SectionItem component"
```

---

## Task 8: Update WorkoutBuilderBlocks — Add Section button and section rendering

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/WorkoutBuilderBlocks.tsx`

Changes:
1. Add `onSectionsChange` prop
2. Merge `workout.blocks` + `workout.sections[]` sorted by order into one list for rendering
3. Replace "Add Circuit" button with "Add Section"
4. Render `SectionItem` for sections, `CircuitItem` for blocks

- [ ] **Step 1: Update WorkoutBuilderBlocks.tsx**

Replace the full file content:

```tsx
import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuPlus } from 'react-icons/lu';
import { WorkoutRequest, Block, Section, BlockType, Exercise, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';
import CircuitItem from './CircuitItem';
import SectionItem from './SectionItem';
import EmptyState from './EmptyState';

interface Props {
  workout: WorkoutRequest;
  editMode: boolean;
  isOwner: boolean;
  onBlocksChange: (blocks: Block[]) => void;
  onSectionsChange?: (sections: Section[]) => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
  updateExerciseInBlockPartial: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock: (blockIndex: number, exerciseIndex: number) => void;
  onEditModeStart: () => void;
}

type OrderedItem =
  | { kind: 'block'; item: Block }
  | { kind: 'section'; item: Section };

function mergeByOrder(blocks: Block[], sections: Section[]): OrderedItem[] {
  const result: OrderedItem[] = [
    ...blocks.map((b): OrderedItem => ({ kind: 'block', item: b })),
    ...sections.map((s): OrderedItem => ({ kind: 'section', item: s })),
  ];
  return result.sort((a, b) => a.item.order - b.item.order);
}

const WorkoutBuilderBlocks: React.FC<Props> = ({
  workout,
  editMode,
  isOwner,
  onBlocksChange,
  onSectionsChange,
  onSetHasUnsavedChanges,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  onEditModeStart,
}) => {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const blocks = workout.blocks ?? [];
  const sections = workout.sections ?? [];
  const orderedItems = mergeByOrder(blocks, sections);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((c) => c.order === active.id);
    const newIndex = blocks.findIndex((c) => c.order === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onBlocksChange(arrayMove(blocks, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx })));
  };

  const addExercise = () => {
    const maxOrder = Math.max(-1, ...blocks.map((b) => b.order), ...sections.map((s) => s.order));
    onBlocksChange([
      ...blocks,
      {
        type: BlockType.SINGLE,
        name: `Exercise ${blocks.length + 1}`,
        targetSets: 3,
        rest: 0,
        exercises: [
          {
            name: '',
            rest: 0,
            targetReps: 10,
            targetDurationSec: 0,
            targetWeight: 0,
            targetDistance: 0,
            measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
            notes: '',
            order: 0,
            sets: 3,
            hasSuperset: false,
            setData: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, rest: 0 })),
          },
        ],
        order: maxOrder + 1,
      },
    ]);
  };

  const addSection = () => {
    if (!onSectionsChange) return;
    const maxOrder = Math.max(-1, ...blocks.map((b) => b.order), ...sections.map((s) => s.order));
    onSectionsChange([
      ...sections,
      {
        name: '',
        blocks: [],
        order: maxOrder + 1,
      },
    ]);
  };

  const isEmpty = orderedItems.length === 0;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="circuits-container">
        {!isEmpty ? (
          <SortableContext
            items={orderedItems.map((oi) => oi.item.order)}
            strategy={verticalListSortingStrategy}
          >
            {orderedItems.map((oi) => {
              if (oi.kind === 'section') {
                const section = oi.item as Section;
                return (
                  <SectionItem
                    key={`section-${section.order}`}
                    section={section}
                    editMode={editMode && isOwner}
                    workout={workout}
                    onUpdate={(updated) =>
                      onSectionsChange?.(sections.map((s) => s.order === updated.order ? updated : s))
                    }
                    onRemove={() =>
                      onSectionsChange?.(sections.filter((s) => s.order !== section.order))
                    }
                    onSetHasUnsavedChanges={onSetHasUnsavedChanges}
                    updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                    removeExerciseFromBlock={removeExerciseFromBlock}
                  />
                );
              }
              const block = oi.item as Block;
              return (
                <CircuitItem
                  key={`block-${block.order}`}
                  block={block}
                  blockNumber={orderedItems.indexOf(oi) + 1}
                  editMode={editMode && isOwner}
                  workout={workout}
                  onUpdateBlock={(updated) => onBlocksChange(blocks.map((c) => c.order === updated.order ? updated : c))}
                  onRemoveBlock={() => onBlocksChange(blocks.filter((c) => c.order !== block.order))}
                  onSetHasUnsavedChanges={onSetHasUnsavedChanges}
                  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                  removeExerciseFromBlock={removeExerciseFromBlock}
                />
              );
            })}
          </SortableContext>
        ) : (
          !editMode && <EmptyState onStart={onEditModeStart} isOwner={isOwner} />
        )}

        {editMode && isOwner && (
          <div className="add-block-row">
            <button className="add-circuit-btn" onClick={addExercise}>
              <LuPlus aria-hidden="true" /> Add Exercise
            </button>
            <button className="add-circuit-btn" onClick={addSection}>
              <LuPlus aria-hidden="true" /> Add Section
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default WorkoutBuilderBlocks;
```

- [ ] **Step 2: Find where WorkoutBuilderBlocks is rendered and add onSectionsChange**

Search for the WorkoutBuilderBlocks usage in the workout view:

```bash
cd train-web-app && grep -r "WorkoutBuilderBlocks" src/ --include="*.tsx" -l
```

- [ ] **Step 3: Update the view that renders WorkoutBuilderBlocks to pass onSectionsChange**

The view file (likely `src/app/workouts/views/WorkoutView.tsx` or similar) needs to pass:
```tsx
onSectionsChange={(sections) => updateWorkoutRequest({ sections })}
```

Find the `<WorkoutBuilderBlocks` usage and add this prop. Example:
```tsx
<WorkoutBuilderBlocks
  workout={state.workoutRequest}
  editMode={state.editMode}
  isOwner={state.isOwner}
  onBlocksChange={(blocks) => updateWorkoutRequest({ blocks })}
  onSectionsChange={(sections) => updateWorkoutRequest({ sections })}
  onSetHasUnsavedChanges={setHasUnsavedChanges}
  updateExerciseInBlockPartial={updateExerciseInBlockPartial}
  removeExerciseFromBlock={removeExerciseFromBlock}
  onEditModeStart={() => setEditMode(true)}
/>
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd train-web-app && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd train-web-app
git add src/app/programs/components/workoutBuilder/WorkoutBuilderBlocks.tsx
git add $(git diff --name-only src/app/workouts/)
git commit -m "feat: replace Add Circuit with Add Section; render SectionItem in WorkoutBuilderBlocks"
```

---

## Task 9: Add workout type pills to WorkoutDetailsSection

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/WorkoutDetailsSection.tsx`

- [ ] **Step 1: Update WorkoutDetailsSection.tsx**

Add the workout type pill row below the duration row. Replace the full file:

```tsx
import React, { useState } from 'react';
import { LuClock, LuRefreshCw } from 'react-icons/lu';
import { WorkoutRequest } from '@trainapp-io/train-core';

type DurationUnit = 'min' | 'hr';

const WORKOUT_TYPES = [
  { value: 'strength', label: 'Strength' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'track', label: 'Track' },
];

interface Props {
  workout: WorkoutRequest;
  editMode: boolean;
  onUpdate: (updates: Partial<WorkoutRequest>) => void;
  onSetHasUnsavedChanges: (v: boolean) => void;
}

const WorkoutDetailsSection: React.FC<Props> = ({ workout, editMode, onUpdate, onSetHasUnsavedChanges }) => {
  const [unit, setUnit] = useState<DurationUnit>('min');

  const storedMinutes = workout.duration || 0;
  const displayValue = unit === 'hr'
    ? (storedMinutes > 0 ? +(storedMinutes / 60).toFixed(2) : '')
    : (storedMinutes > 0 ? storedMinutes : '');

  if (!editMode) {
    return (
      <div className="wd-view">
        <h1 className="wd-view__name">{workout.name || 'Untitled Workout'}</h1>
        <div className="wd-view__row">
          {workout.description && <p className="wd-view__desc">{workout.description}</p>}
          {storedMinutes > 0 && (
            <span className="wd-view__duration">
              <LuClock aria-hidden="true" />
              {storedMinutes} min
            </span>
          )}
          {(workout as any).workoutType && (
            <span className="wd-view__type-pill">
              {WORKOUT_TYPES.find((t) => t.value === (workout as any).workoutType)?.label}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wd-edit">
      <input
        className="wd-edit__name"
        type="text"
        value={workout.name || ''}
        onChange={(e) => { onUpdate({ name: e.target.value }); onSetHasUnsavedChanges(true); }}
        placeholder="Workout name"
        aria-label="Workout name"
      />
      <textarea
        className="wd-edit__desc"
        value={workout.description || ''}
        onChange={(e) => { onUpdate({ description: e.target.value }); onSetHasUnsavedChanges(true); }}
        placeholder="Description (optional)"
        rows={2}
        aria-label="Workout description"
      />
      <div className="wd-edit__duration">
        <LuClock size={13} className="wd-edit__duration-icon" aria-hidden="true" />
        <div className="ex-m">
          <input
            className="ex-m__input wd-edit__duration-input"
            type="number"
            min={0}
            value={displayValue}
            onChange={(e) => {
              const n = parseFloat(e.target.value) || 0;
              const minutes = unit === 'hr' ? Math.round(n * 60) : Math.round(n);
              onUpdate({ duration: minutes });
              onSetHasUnsavedChanges(true);
            }}
            placeholder="0"
            aria-label="Duration"
          />
          <button className="ex-m__label--tap" onClick={() => setUnit(u => u === 'min' ? 'hr' : 'min')} title="Change unit">
            {unit}<LuRefreshCw size={9} />
          </button>
        </div>
      </div>

      {/* Workout type pills */}
      <div className="wd-edit__type-row" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {WORKOUT_TYPES.map((t) => {
          const isSelected = (workout as any).workoutType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              aria-label={`Workout type: ${t.label}`}
              aria-pressed={isSelected}
              onClick={() => {
                onUpdate({ workoutType: isSelected ? undefined : t.value } as any);
                onSetHasUnsavedChanges(true);
              }}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '4px 12px', borderRadius: 20,
                border: isSelected ? '1.5px solid #6d28d9' : '1.5px solid #e5e7eb',
                background: isSelected ? '#ede9fe' : '#fff',
                color: isSelected ? '#6d28d9' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutDetailsSection;
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd train-web-app && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd train-web-app
git add src/app/programs/components/workoutBuilder/WorkoutDetailsSection.tsx
git commit -m "feat: add workout type pill selector to WorkoutDetailsSection"
```

---

## Task 10: Update WorkoutLogCreate to flatten sections into blockSnapshot

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/workout-logs/pages/WorkoutLogCreate.tsx`

- [ ] **Step 1: Write a failing test**

Create `src/app/workout-logs/pages/__tests__/WorkoutLogCreate.snapshot.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

// Pure function extracted from WorkoutLogCreate — test it in isolation
function buildBlockSnapshot(workout: any) {
  const standaloneBlocks = workout.blocks ?? [];
  const sectionBlocks = (workout.sections ?? []).flatMap((s: any) => s.blocks);
  const allBlocks = [...standaloneBlocks, ...sectionBlocks].sort((a: any, b: any) => a.order - b.order);
  return allBlocks.map((block: any) => ({
    type: block.type,
    name: block.name,
    targetSets: block.targetSets,
    description: block.description,
    rest: block.rest,
    exerciseSnapshot: block.exercises.map((ex: any) => ({
      name: ex.name,
      rest: ex.rest,
      targetReps: ex.targetReps,
      targetDurationSec: ex.targetDurationSec,
      targetWeight: ex.targetWeight,
      targetDistance: ex.targetDistance,
      notes: ex.notes,
      order: ex.order,
      measurement: ex.measurement,
      setData: ex.setData,
      restUnit: ex.restUnit,
    })),
    order: block.order,
  }));
}

function buildSectionSnapshot(workout: any) {
  return (workout.sections ?? []).map((s: any) => ({
    name: s.name,
    order: s.order,
    blockOrders: s.blocks.map((b: any) => b.order),
  }));
}

const makeExercise = (order: number) => ({
  name: `Ex${order}`,
  rest: 0, targetReps: 10, targetDurationSec: 0, targetWeight: 0, targetDistance: 0,
  notes: '', order, sets: 3, hasSuperset: false,
  measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
  setData: [],
});

describe('buildBlockSnapshot', () => {
  it('includes exercises from both standalone blocks and section blocks, sorted by order', () => {
    const workout = {
      blocks: [
        { type: BlockType.SINGLE, name: 'A', targetSets: 3, rest: 0, order: 0, exercises: [makeExercise(0)] },
        { type: BlockType.SINGLE, name: 'C', targetSets: 3, rest: 0, order: 2, exercises: [makeExercise(2)] },
      ],
      sections: [
        {
          name: 'Main',
          order: 1,
          blocks: [
            { type: BlockType.SINGLE, name: 'B', targetSets: 3, rest: 0, order: 1, exercises: [makeExercise(1)] },
          ],
        },
      ],
    };
    const snapshot = buildBlockSnapshot(workout);
    expect(snapshot).toHaveLength(3);
    expect(snapshot[0].name).toBe('A');
    expect(snapshot[1].name).toBe('B');
    expect(snapshot[2].name).toBe('C');
  });

  it('works with no sections (backward compat)', () => {
    const workout = {
      blocks: [
        { type: BlockType.SINGLE, name: 'A', targetSets: 3, rest: 0, order: 0, exercises: [makeExercise(0)] },
      ],
    };
    const snapshot = buildBlockSnapshot(workout);
    expect(snapshot).toHaveLength(1);
  });
});

describe('buildSectionSnapshot', () => {
  it('captures section name, order, and block orders', () => {
    const workout = {
      sections: [
        {
          name: 'W/U',
          order: 0,
          blocks: [
            { order: 0, type: BlockType.SINGLE, exercises: [], targetSets: 3, rest: 0 },
            { order: 1, type: BlockType.SINGLE, exercises: [], targetSets: 3, rest: 0 },
          ],
        },
      ],
    };
    const snap = buildSectionSnapshot(workout);
    expect(snap).toHaveLength(1);
    expect(snap[0]).toMatchObject({ name: 'W/U', order: 0, blockOrders: [0, 1] });
  });

  it('returns empty array when no sections', () => {
    expect(buildSectionSnapshot({ blocks: [] })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to confirm it passes (pure logic test — no component dependency)**

```bash
cd train-web-app && npx vitest run src/app/workout-logs/pages/__tests__/WorkoutLogCreate.snapshot.test.ts --reporter=verbose
```
Expected: All tests PASS (pure function tests — no component rendering needed).

- [ ] **Step 3: Update WorkoutLogCreate.tsx to use the new logic**

In `WorkoutLogCreate.tsx`, find the snapshot building block inside `fetchWorkout` (around line ~41). Replace the current `blockSnapshot` mapping:

```typescript
        // Collect all blocks in order: standalone + from sections
        const standaloneBlocks = workout.blocks ?? [];
        const sectionBlocks = (workout.sections ?? []).flatMap((s) => s.blocks);
        const allBlocks = [...standaloneBlocks, ...sectionBlocks].sort((a, b) => a.order - b.order);

        const snapshot: WorkoutSnapshot = {
          name: workout.name,
          description: workout.description,
          category: workout.category,
          difficulty: workout.difficulty,
          duration: workout.duration,
          blockSnapshot: allBlocks.map((block): BlockSnapshot => ({
            type: block.type,
            name: block.name,
            targetSets: block.targetSets,
            description: block.description,
            rest: block.rest,
            exerciseSnapshot: block.exercises.map((exercise): ExerciseSnapshot => ({
              name: exercise.name,
              rest: exercise.rest,
              targetReps: exercise.targetReps,
              targetDurationSec: exercise.targetDurationSec,
              targetWeight: exercise.targetWeight,
              targetDistance: exercise.targetDistance,
              notes: exercise.notes,
              order: exercise.order,
              measurement: {
                measurementType: exercise.measurement?.measurementType || 'REPS',
                measurementUnit: exercise.measurement?.measurementUnit || 'COUNT',
              },
              setData: exercise.setData,
              restUnit: exercise.restUnit,
            })),
            order: block.order,
          })),
          sectionSnapshot: (workout.sections ?? []).map((s) => ({
            name: s.name,
            order: s.order,
            blockOrders: s.blocks.map((b) => b.order),
          })),
          accessType: workout.accessType,
          createdBy: workout.createdBy,
          startDate: workout.startDate,
          endDate: workout.endDate,
        };
```

Also update the import to include `SectionSnapshot` from train-core (it may already be there if the package is updated):
```typescript
import { WorkoutLogRequest, WorkoutSnapshot, BlockSnapshot, ExerciseSnapshot, SectionSnapshot } from '@trainapp-io/train-core';
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd train-web-app && npx tsc --noEmit
```
Expected: No errors (if train-core package is not yet updated with `SectionSnapshot`, you may temporarily cast `sectionSnapshot` as `any` until Task 1 is published).

- [ ] **Step 5: Commit**

```bash
cd train-web-app
git add src/app/workout-logs/pages/WorkoutLogCreate.tsx \
        src/app/workout-logs/pages/__tests__/WorkoutLogCreate.snapshot.test.ts
git commit -m "feat: flatten section blocks into blockSnapshot; add sectionSnapshot in WorkoutLogCreate"
```

---

## Task 11: Update WorkoutLogForm to render section dividers

**Branch:** `ng-test` in `train-web-app/`

**Files:**
- Modify: `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx`

- [ ] **Step 1: Update WorkoutLogForm.tsx to render section name dividers**

In `WorkoutLogForm.tsx`, update the blocks map inside the `wl-body` div (around line ~152):

```tsx
      <div className="wl-body">
        {blocks.map((block, index) => {
          const blockOrder = workoutSnapshot.blockSnapshot?.[index]?.order ?? index;
          const sectionForBlock = workoutSnapshot.sectionSnapshot?.find(
            (s) => s.blockOrders[0] === blockOrder
          );
          return (
            <React.Fragment key={block.order}>
              {sectionForBlock && (
                <div
                  className="wl-section-header"
                  style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                    color: '#075985', textTransform: 'uppercase' as const,
                    padding: '8px 4px 4px',
                    borderBottom: '1px solid #bae6fd',
                    marginBottom: 6,
                  }}
                >
                  {sectionForBlock.name}
                </div>
              )}
              <CircuitItem
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
                isBlockActive={activeBlockIndex === index}
                onJumpTo={() => handleJumpTo(index)}
                activeExerciseIndex={0}
              />
            </React.Fragment>
          );
        })}
      </div>
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd train-web-app && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Run full test suite**

```bash
cd train-web-app && npm test
```
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd train-web-app
git add src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx
git commit -m "feat: render section name dividers in WorkoutLogForm"
```

---

## Task 12: Final integration check

- [ ] **Step 1: Run full test suite in train-web-app**

```bash
cd train-web-app && npm test
```
Expected: All tests pass.

- [ ] **Step 2: Run TypeScript compiler across train-web-app**

```bash
cd train-web-app && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Run TypeScript compiler across train-service**

```bash
cd train-service && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Start the dev server and manually verify the golden path**

```bash
cd train-web-app && npm run dev
```

Manual checklist:
- [ ] Can create a workout with standalone exercises (Add Exercise button)
- [ ] Can add a Section and name it
- [ ] Can add exercises inside a section
- [ ] Clicking "+ Group Exercise" on an exercise promotes it to a Superset (2 exercises), Tri-set (3), Circuit (4+)
- [ ] Measurement dropdown opens and lets you jump directly to Calories or % Effort
- [ ] BODYWEIGHT hides the weight column; CALORIES shows CAL; PERCENTAGE shows %
- [ ] Workout type pill (Strength/Swimming/CrossFit/Track) is selectable in header
- [ ] Group header rest field has s⟳/min⟳ toggle
- [ ] Starting a workout log with sections shows section name dividers
- [ ] Old workouts without sections still log correctly

- [ ] **Step 5: Final commit**

```bash
cd train-web-app
git commit --allow-empty -m "chore: flexible workout builder implementation complete"
```
