# Log Workout UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the workout logging UI to a modern hybrid model where the active exercise expands into a focused card, completed exercises collapse to summary rows, and users can jump to any exercise freely.

**Architecture:** `WorkoutLogForm` owns `activeBlockIndex` state and passes it down; `ExerciseItem` and `CircuitItem` render one of four visual states (active/done/in-progress/upcoming) based on that prop plus their own `setLogs` data. All layout (sticky header, scrollable body, fixed bottom bar) lives in `WorkoutLogForm` at `max-width: 640px` centered.

**Tech Stack:** React 19, TypeScript 5.7, CSS custom properties (no MUI for new styles), `react-icons/lu` (already imported), SVG for rest timer progress ring, Vitest for unit tests.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts` | Modify | Add `getInitialActiveBlock()` pure function |
| `src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts` | Modify | Tests for `getInitialActiveBlock()` |
| `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx` | Modify | Add `activeBlockIndex` state, `handleJumpTo`, new layout structure |
| `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.css` | Rewrite | All new styles: page layout, header, body, exercise states, bottom bar |
| `src/app/workout-logs/pages/WorkoutLogCreate.tsx` | Modify | Remove `.workout-log-page` wrapper div around `WorkoutLogForm` |
| `src/app/workout-logs/pages/WorkoutLogEdit.tsx` | Modify | Remove `.workout-log-page` wrapper div around `WorkoutLogForm` |
| `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogHeader.tsx` | Modify | Compact sticky header: name + timer + pause/play, small mode toggle |
| `src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx` | Modify | SVG progress ring, rest card layout, idle/active states |
| `src/app/programs/components/workoutBuilder/ExerciseItem.tsx` | Modify | Log mode: four visual states (active/done/in-progress/upcoming) |
| `src/app/programs/components/workoutBuilder/CircuitItem.tsx` | Modify | Log mode: collapsed/expanded group card, round progress, correct badge colors |

---

## Task 1: Add `getInitialActiveBlock` to workoutLogHelpers

**Files:**
- Modify: `src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts`
- Test: `src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `workoutLogHelpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { snapshotToBlock, blockToLog, BlockWithLogs, getInitialActiveBlock } from '../workoutLogHelpers';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND };

// ... existing tests ...

describe('getInitialActiveBlock', () => {
  it('returns 0 when blocks are empty', () => {
    expect(getInitialActiveBlock([])).toBe(0);
  });

  it('returns 0 when first block has incomplete sets', () => {
    const blocks: BlockWithLogs[] = [
      {
        type: BlockType.SINGLE, order: 0, targetSets: 1,
        exercises: [{ name: 'A', order: 0, measurement: baseMeasurement, setLogs: [{ actualReps: 0, isCompleted: false }] }],
      },
    ];
    expect(getInitialActiveBlock(blocks)).toBe(0);
  });

  it('skips blocks where all sets are completed', () => {
    const blocks: BlockWithLogs[] = [
      {
        type: BlockType.SINGLE, order: 0, targetSets: 1,
        exercises: [{ name: 'A', order: 0, measurement: baseMeasurement, setLogs: [{ actualReps: 8, isCompleted: true }] }],
      },
      {
        type: BlockType.SINGLE, order: 1, targetSets: 1,
        exercises: [{ name: 'B', order: 0, measurement: baseMeasurement, setLogs: [{ actualReps: 0, isCompleted: false }] }],
      },
    ];
    expect(getInitialActiveBlock(blocks)).toBe(1);
  });

  it('returns 0 when all sets are completed (no incomplete block found)', () => {
    const blocks: BlockWithLogs[] = [
      {
        type: BlockType.SINGLE, order: 0, targetSets: 1,
        exercises: [{ name: 'A', order: 0, measurement: baseMeasurement, setLogs: [{ actualReps: 8, isCompleted: true }] }],
      },
    ];
    expect(getInitialActiveBlock(blocks)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts
```

Expected: FAIL — `getInitialActiveBlock` is not exported

- [ ] **Step 3: Add `getInitialActiveBlock` to workoutLogHelpers.ts**

Add this export at the bottom of `src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts`:

```typescript
/**
 * Returns the index of the first block that has at least one incomplete set log.
 * Falls back to 0 if all blocks are complete or the array is empty.
 */
export function getInitialActiveBlock(blocks: BlockWithLogs[]): number {
  if (blocks.length === 0) return 0;
  const idx = blocks.findIndex((block) =>
    block.exercises.some((ex) =>
      ((ex as ExerciseWithLogs).setLogs ?? []).some((s) => !s.isCompleted)
    )
  );
  return idx === -1 ? 0 : idx;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/workout-logs/components/WorkoutLogForm/workoutLogHelpers.ts \
        src/app/workout-logs/components/WorkoutLogForm/__tests__/workoutLogHelpers.test.ts
git commit -m "feat: add getInitialActiveBlock helper with tests"
```

---

## Task 2: Add active block state + jump logic to WorkoutLogForm

**Files:**
- Modify: `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx`

- [ ] **Step 1: Add `activeBlockIndex` state and `handleJumpTo`**

After the existing `const [blocks, setBlocks] = useState<BlockWithLogs[]>([]);` line (line 39), add:

```typescript
const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
```

After the existing `useEffect` that calls `setBlocks(...)` (lines 50–54), add a second effect to initialize the active block once blocks load:

```typescript
useEffect(() => {
  if (blocks.length > 0) {
    setActiveBlockIndex(getInitialActiveBlock(blocks));
  }
}, [blocks.length]);
```

Add the import at the top:
```typescript
import { snapshotToBlock, blockToLog, BlockWithLogs, getInitialActiveBlock } from './workoutLogHelpers';
```

Add the handler after `handleUpdateBlock`:
```typescript
const handleJumpTo = (blockIndex: number) => {
  setActiveBlockIndex(blockIndex);
};
```

- [ ] **Step 2: Update the JSX layout in WorkoutLogForm**

Replace the current `return (...)` block (starting at line 130) with:

```tsx
return (
  <div className="wl-page">
    <WorkoutLogHeader
      workoutSnapshot={workoutSnapshot}
      isLive={isLive}
      isTimerRunning={isTimerRunning}
      elapsedSeconds={elapsedSeconds}
      actualStartDate={actualStartDate}
      manualDuration={manualDuration}
      onModeToggle={handleModeToggle}
      onStartDateChange={setActualStartDate}
      onManualDurationChange={(field, value) =>
        setManualDuration((prev) => ({ ...prev, [field]: Math.max(0, value) }))
      }
      onFinish={handleSubmit}
    />

    <div className="wl-body">
      {blocks.map((block, index) => (
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
          isBlockActive={activeBlockIndex === index}
          onJumpTo={() => handleJumpTo(index)}
          activeExerciseIndex={0}
        />
      ))}
    </div>

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
  </div>
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 3 errors — `onFinish` on WorkoutLogHeader (fixed in Task 5), `isBlockActive` and `onJumpTo` on CircuitItem (fixed in Task 8). These are forward references; proceed to the next task.

- [ ] **Step 4: Commit**

```bash
git add src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.tsx
git commit -m "feat: add activeBlockIndex state and jump logic to WorkoutLogForm"
```

---

## Task 3: Rewrite WorkoutLogForm.css

**Files:**
- Rewrite: `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.css`

- [ ] **Step 1: Replace the entire file**

```css
/* ── Page container ── */
.wl-page {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f7f7fa;
  position: relative;
}

/* ── Sticky header ── */
.wl-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #f0f0f3;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  padding: 14px 18px 12px;
}

.wl-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.wl-header__name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary, #111);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
}

.wl-header__finish-btn {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #7c3aed;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  flex-shrink: 0;
}

.wl-header__finish-btn:hover { background: #6d28d9; }

.wl-timer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.wl-pause-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f3f0ff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #7c3aed;
  flex-shrink: 0;
}

.wl-pause-btn:hover { background: #ede9fe; }

.wl-elapsed {
  font-size: 32px;
  font-weight: 800;
  color: #7c3aed;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

.wl-elapsed--paused { color: var(--text-secondary, #9ca3af); }

.wl-mode-toggle {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.wl-mode-link {
  font-size: 11px;
  color: var(--text-secondary, #9ca3af);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
  padding: 0;
}

/* Historical mode inputs (shown when isLive = false) */
.wl-historical {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--bg-primary, #f7f7fa);
  border-radius: 10px;
  border: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wl-historical label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 4px;
}

.wl-historical input[type="datetime-local"],
.wl-historical input[type="number"] {
  padding: 7px 10px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: var(--text-primary, #111);
  outline: none;
  font-family: inherit;
}

.wl-historical input:focus { border-color: #7c3aed; }

.wl-duration-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.wl-duration-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wl-duration-group input {
  width: 64px;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
}

.wl-duration-unit {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

/* ── Scrollable body ── */
.wl-body {
  padding: 12px 14px 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Exercise state rows (non-active) ── */
.ex-log-done {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.65;
  border: 1px solid #f0f0f3;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ex-log-done:hover { opacity: 0.85; }

.ex-log-done__check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.ex-log-done__name {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex: 1;
  min-width: 0;
}

.ex-log-done__summary {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.ex-log-inprogress {
  background: #fffbeb;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #fde68a;
  cursor: pointer;
  transition: background 0.15s;
}

.ex-log-inprogress:hover { background: #fef3c7; }

.ex-log-inprogress__badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  flex-shrink: 0;
}

.ex-log-inprogress__name {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  flex: 1;
  min-width: 0;
}

.ex-log-inprogress__status {
  font-size: 12px;
  color: #d97706;
  font-weight: 600;
  flex-shrink: 0;
}

.ex-log-upcoming {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #f0f0f3;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ex-log-upcoming:hover { opacity: 0.8; }

.ex-log-upcoming__num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  flex-shrink: 0;
}

.ex-log-upcoming__name {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  flex: 1;
  min-width: 0;
}

.ex-log-upcoming__meta {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.ex-log-upcoming__jump {
  font-size: 11px;
  color: #7c3aed;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
  margin-left: 4px;
}

.ex-log-upcoming:hover .ex-log-upcoming__jump { opacity: 1; }

/* ── Active exercise card override ── */
.ex-card-v2--log {
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(124,58,237,0.10), 0 0 0 2px rgba(124,58,237,0.15);
}

/* ── Fixed bottom bar ── */
.wl-tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 640px;
  background: #fff;
  border-top: 1px solid #f0f0f3;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 20;
}

/* Rest timer — idle */
.wl-rest-idle {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary, #f7f7fa);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 14px;
  padding: 10px 16px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.wl-rest-idle:hover { background: #ede9fe; border-color: #c4b5fd; }

.wl-rest-idle__icon { color: var(--text-secondary, #9ca3af); }
.wl-rest-idle:hover .wl-rest-idle__icon { color: #7c3aed; }

.wl-rest-idle__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
}

.wl-rest-idle:hover .wl-rest-idle__label { color: #7c3aed; }

/* Rest timer — active */
.wl-rest-card {
  flex: 1;
  background: #faf5ff;
  border: 1.5px solid #c4b5fd;
  border-radius: 14px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
}

.wl-rest-card:hover { background: #ede9fe; }

.wl-rest-ring {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  position: relative;
}

.wl-rest-ring svg { display: block; }

.wl-rest-ring__label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8px;
  font-weight: 800;
  color: #7c3aed;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.wl-rest-info { flex: 1; }

.wl-rest-info__title {
  font-size: 10px;
  font-weight: 700;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.wl-rest-info__countdown {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary, #111);
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.wl-rest-info__done {
  font-size: 18px;
  font-weight: 800;
  color: #22c55e;
}

.wl-rest-skip {
  font-size: 12px;
  font-weight: 700;
  color: #7c3aed;
  flex-shrink: 0;
}

/* Finish button */
.wl-finish-btn {
  background: #7c3aed;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  border-radius: 12px;
  padding: 14px 20px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  flex-shrink: 0;
}

.wl-finish-btn:hover { background: #6d28d9; }
.wl-finish-btn:disabled { opacity: 0.6; cursor: default; }
```

- [ ] **Step 2: Verify no TypeScript errors introduced**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/workout-logs/components/WorkoutLogForm/WorkoutLogForm.css
git commit -m "feat: rewrite WorkoutLogForm.css for new log workout UI"
```

---

## Task 4: Remove `.workout-log-page` wrapper from WorkoutLogCreate and WorkoutLogEdit

**Files:**
- Modify: `src/app/workout-logs/pages/WorkoutLogCreate.tsx` (line 144–151)
- Modify: `src/app/workout-logs/pages/WorkoutLogEdit.tsx` (line 76–88)

- [ ] **Step 1: Update WorkoutLogCreate.tsx**

Replace the final `return (...)` block at line 144:

```tsx
return (
  <WorkoutLogForm
    onSubmit={handleSubmit}
    onCancel={handleCancel}
    isSaving={createWorkoutLogMutation.isPending}
  />
);
```

- [ ] **Step 2: Update WorkoutLogEdit.tsx**

Replace the final `return (...)` block at line 76:

```tsx
return (
  <WorkoutLogForm
    initialData={initialData}
    onSubmit={handleSubmit}
    onCancel={handleCancel}
    isSaving={updateWorkoutLogMutation.isPending}
  />
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/workout-logs/pages/WorkoutLogCreate.tsx \
        src/app/workout-logs/pages/WorkoutLogEdit.tsx
git commit -m "feat: remove workout-log-page wrapper so WorkoutLogForm owns its layout"
```

---

## Task 5: Redesign WorkoutLogHeader

**Files:**
- Modify: `src/app/workout-logs/components/WorkoutLogForm/WorkoutLogHeader.tsx`

- [ ] **Step 1: Add `onFinish` prop and rewrite the component**

Replace the entire file:

```tsx
import React from 'react';
import { WorkoutSnapshot } from '@trainapp-io/train-core';
import { LuPlay, LuPause } from 'react-icons/lu';
import './WorkoutLogForm.css';

interface WorkoutLogHeaderProps {
  workoutSnapshot: WorkoutSnapshot;
  isLive: boolean;
  isTimerRunning: boolean;
  elapsedSeconds: number;
  actualStartDate: Date;
  manualDuration: { hours: number; minutes: number };
  onModeToggle: () => void;
  onStartDateChange: (date: Date) => void;
  onManualDurationChange: (field: 'hours' | 'minutes', value: number) => void;
  onFinish: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const WorkoutLogHeader: React.FC<WorkoutLogHeaderProps> = ({
  workoutSnapshot,
  isLive,
  isTimerRunning,
  elapsedSeconds,
  actualStartDate,
  manualDuration,
  onModeToggle,
  onStartDateChange,
  onManualDurationChange,
  onFinish,
}) => {
  return (
    <div className="wl-header">
      {/* Row 1: name + finish */}
      <div className="wl-header__top">
        <span className="wl-header__name">{workoutSnapshot.name}</span>
        <button className="wl-header__finish-btn" onClick={onFinish} type="button">
          Finish
        </button>
      </div>

      {/* Row 2: pause/play + timer */}
      {isLive && (
        <div className="wl-timer-row">
          <button
            className="wl-pause-btn"
            type="button"
            aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
          >
            {isTimerRunning ? <LuPause size={16} /> : <LuPlay size={16} />}
          </button>
          <span className={`wl-elapsed${!isTimerRunning ? ' wl-elapsed--paused' : ''}`}>
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* Mode toggle — less prominent */}
      <div className="wl-mode-toggle">
        <button className="wl-mode-link" onClick={onModeToggle} type="button">
          {isLive ? 'Switch to historical entry' : 'Switch to live timer'}
        </button>
      </div>

      {/* Historical entry fields */}
      {!isLive && (
        <div className="wl-historical">
          <div>
            <label htmlFor="wl-start-time">Workout Date &amp; Time</label>
            <input
              id="wl-start-time"
              type="datetime-local"
              value={formatDateTimeLocal(actualStartDate)}
              onChange={(e) => onStartDateChange(new Date(e.target.value))}
            />
          </div>
          <div>
            <label>Duration</label>
            <div className="wl-duration-row">
              <div className="wl-duration-group">
                <input
                  type="number" min={0}
                  value={manualDuration.hours}
                  onChange={(e) => onManualDurationChange('hours', parseInt(e.target.value) || 0)}
                  aria-label="Hours"
                />
                <span className="wl-duration-unit">hr</span>
              </div>
              <div className="wl-duration-group">
                <input
                  type="number" min={0} max={59}
                  value={manualDuration.minutes}
                  onChange={(e) => onManualDurationChange('minutes', parseInt(e.target.value) || 0)}
                  aria-label="Minutes"
                />
                <span className="wl-duration-unit">min</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogHeader;
```

Note: the pause/play button in the header is visual only — the actual start/pause callbacks are on `CompletionFooter`. To wire up the pause button in the header, add `onPausePlay` prop. For now, keep it simpler: remove the pause button from the header and keep the timer display only. The start/pause control stays in the bottom bar.

Replace the header timer row with:

```tsx
{/* Row 2: timer display only */}
{isLive && (
  <div className="wl-timer-row">
    <span className={`wl-elapsed${!isTimerRunning ? ' wl-elapsed--paused' : ''}`}>
      {formatElapsed(elapsedSeconds)}
    </span>
  </div>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: error about `onFinish` prop missing from WorkoutLogForm.tsx call — already added in Task 2.

- [ ] **Step 3: Commit**

```bash
git add src/app/workout-logs/components/WorkoutLogForm/WorkoutLogHeader.tsx
git commit -m "feat: redesign WorkoutLogHeader — compact sticky with mode toggle"
```

---

## Task 6: Redesign CompletionFooter with SVG progress ring

**Files:**
- Modify: `src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { LuPlay, LuPause, LuTimer } from 'react-icons/lu';
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

const RING_RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 119.4

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
  const [restDuration, setRestDuration] = useState<number>(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-start rest when restSeconds prop changes to > 0
  useEffect(() => {
    if (restSeconds > 0) {
      if (restRef.current) clearInterval(restRef.current);
      setRestRemaining(restSeconds);
      setRestDuration(restSeconds);
    }
  }, [restSeconds]);

  // Countdown tick
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
      // Cancel active rest
      setRestRemaining(null);
    } else {
      setRestRemaining(60);
      setRestDuration(60);
    }
  };

  const formatRest = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const restIdle = restRemaining === null;
  const restDone = restRemaining === 0;

  // Progress ring: full when just started, empty when done
  const progress = restDuration > 0 && restRemaining !== null
    ? restRemaining / restDuration
    : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="wl-tabbar">
      {/* Start / Pause — only in live mode */}
      {isLive && (
        <button
          className="wl-pause-btn"
          onClick={isTimerRunning ? onPause : onStart}
          type="button"
          aria-label={isTimerRunning ? 'Pause workout timer' : 'Start workout timer'}
        >
          {isTimerRunning ? <LuPause size={18} /> : <LuPlay size={18} />}
        </button>
      )}

      {/* Rest timer */}
      {restIdle ? (
        <button className="wl-rest-idle" onClick={startManualRest} type="button">
          <LuTimer size={18} className="wl-rest-idle__icon" />
          <span className="wl-rest-idle__label">Rest</span>
        </button>
      ) : (
        <div className="wl-rest-card" onClick={startManualRest} role="button" tabIndex={0}>
          <div className="wl-rest-ring">
            <svg
              width="46"
              height="46"
              viewBox="0 0 46 46"
              style={{ transform: 'rotate(-90deg)' }}
              aria-hidden="true"
            >
              <circle
                cx="23" cy="23" r={RING_RADIUS}
                fill="none" stroke="#ede9fe" strokeWidth="4"
              />
              <circle
                cx="23" cy="23" r={RING_RADIUS}
                fill="none" stroke="#7c3aed" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="wl-rest-ring__label">REST</div>
          </div>
          <div className="wl-rest-info">
            <div className="wl-rest-info__title">Resting</div>
            {restDone ? (
              <div className="wl-rest-info__done">Go!</div>
            ) : (
              <div className="wl-rest-info__countdown">
                {formatRest(restRemaining!)}
              </div>
            )}
          </div>
          <span className="wl-rest-skip">Skip →</span>
        </div>
      )}

      {/* Finish */}
      <button
        className="wl-finish-btn"
        onClick={onFinish}
        disabled={isSaving}
        type="button"
      >
        {isSaving ? 'Saving…' : 'Finish'}
      </button>
    </div>
  );
};

export default CompletionFooter;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/workout-logs/components/WorkoutLogForm/CompletionFooter.tsx
git commit -m "feat: redesign CompletionFooter with SVG progress ring rest timer"
```

---

## Task 7: ExerciseItem — four log mode visual states

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/ExerciseItem.tsx`

- [ ] **Step 1: Replace the log mode section (lines 179–295)**

The log mode section starts at `if (logMode) {` and ends before the edit mode. Replace the entire log mode block with:

```tsx
// ── Log mode ──────────────────────────────────────────────────────────────
if (logMode) {
  const setLogs = getSetLogs(exercise);
  const allCompleted = setLogs.length > 0 && setLogs.every((s) => s.isCompleted);
  const someCompleted = setLogs.some((s) => s.isCompleted);
  const isCurrentlyActive = isActive === true;

  // Determine visual state
  const logState: 'active' | 'done' | 'inProgress' | 'upcoming' =
    isCurrentlyActive ? 'active'
    : allCompleted ? 'done'
    : someCompleted ? 'inProgress'
    : 'upcoming';

  // ── Completed row ──
  if (logState === 'done') {
    const weights = setLogs.map((s) => s.actualWeight).filter((w): w is number => w != null && w > 0);
    const weightStr = weights.length === 0 ? ''
      : weights.length === 1 || Math.min(...weights) === Math.max(...weights)
        ? `${weights[0]} lbs`
        : `${Math.min(...weights)}–${Math.max(...weights)} lbs`;
    const summary = [
      `${setLogs.length} ×`,
      weightStr,
    ].filter(Boolean).join(' ');

    return (
      <div ref={setNodeRef} style={style} className="ex-log-done" onClick={onSelect}>
        <div className="ex-log-done__check">✓</div>
        <span className="ex-log-done__name">{exercise.name || 'Untitled'}</span>
        <span className="ex-log-done__summary">{summary}</span>
      </div>
    );
  }

  // ── In-progress row ──
  if (logState === 'inProgress') {
    const completedCount = setLogs.filter((s) => s.isCompleted).length;
    return (
      <div ref={setNodeRef} style={style} className="ex-log-inprogress" onClick={onSelect}>
        <div className="ex-log-inprogress__badge">
          {completedCount}/{setLogs.length}
        </div>
        <span className="ex-log-inprogress__name">{exercise.name || 'Untitled'}</span>
        <span className="ex-log-inprogress__status">In progress · tap to resume</span>
      </div>
    );
  }

  // ── Upcoming row ──
  if (logState === 'upcoming') {
    const first = setLogs[0];
    const metricVal = measurementType === MeasurementType.TIME
      ? first?.actualDurationSec
      : measurementType === MeasurementType.DISTANCE
        ? first?.actualDistance
        : first?.actualReps;
    const metricLabel = MEASUREMENT_LABELS[measurementType];
    const weightStr = hasWeight && first?.actualWeight
      ? ` · ${first.actualWeight} ${weightUnit}`
      : '';
    const meta = `${setLogs.length} × ${metricVal ?? '?'} ${metricLabel}${weightStr}`;

    return (
      <div ref={setNodeRef} style={style} className="ex-log-upcoming" onClick={onSelect}>
        <div className="ex-log-upcoming__num">{exerciseIndex + 1}</div>
        <span className="ex-log-upcoming__name">{exercise.name || 'Untitled'}</span>
        <span className="ex-log-upcoming__meta">{meta}</span>
        <span className="ex-log-upcoming__jump">Jump to →</span>
      </div>
    );
  }

  // ── Active expanded card ──
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

  const addLogSet = () => {
    const last = setLogs[setLogs.length - 1] || {};
    update({ setLogs: [...setLogs, { ...last, isCompleted: false }] } as any);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="ex-card-v2 ex-card-v2--log"
    >
      <div className="ex-card-v2__header">
        <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
          {initial}
        </div>
        <span className="ex-card-v2__name-static">{exercise.name || 'Untitled'}</span>
        <span className="ex-active__progress" style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
          {setLogs.filter(s => s.isCompleted).length} / {setLogs.length} sets
        </span>
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
                      value={rawKey(i, 'weight') in rawValues ? rawValues[rawKey(i, 'weight')] : (sl.actualWeight ?? 0).toString()}
                      onChange={(e) => onRawChange(i, 'weight', e.target.value)}
                      onBlur={(e) => {
                        const parsed = parseFloat(e.target.value);
                        const next = setLogs.map((s, idx) =>
                          idx === i ? { ...s, actualWeight: isNaN(parsed) ? 0 : parsed } : s
                        );
                        update({ setLogs: next } as any);
                        setRawValues((prev) => { const n = { ...prev }; delete n[rawKey(i, 'weight')]; return n; });
                      }}
                      onFocus={(e) => e.target.select()}
                      aria-label={`Set ${i + 1} weight`}
                    />
                  </td>
                )}
                <td>
                  <input
                    className="ex-set-input"
                    type="number" min={0}
                    value={
                      measurementType === MeasurementType.TIME
                        ? (rawKey(i, 'dur') in rawValues ? rawValues[rawKey(i, 'dur')] : (sl.actualDurationSec ?? 0).toString())
                        : measurementType === MeasurementType.DISTANCE
                          ? (rawKey(i, 'dist') in rawValues ? rawValues[rawKey(i, 'dist')] : (sl.actualDistance ?? 0).toString())
                          : (rawKey(i, 'reps') in rawValues ? rawValues[rawKey(i, 'reps')] : (sl.actualReps ?? 0).toString())
                    }
                    onChange={(e) => {
                      const field = measurementType === MeasurementType.TIME ? 'dur'
                        : measurementType === MeasurementType.DISTANCE ? 'dist' : 'reps';
                      onRawChange(i, field, e.target.value);
                    }}
                    onBlur={(e) => {
                      const parsed = parseFloat(e.target.value);
                      const field: keyof SetLog = measurementType === MeasurementType.TIME ? 'actualDurationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'actualDistance' : 'actualReps';
                      const next = setLogs.map((s, idx) =>
                        idx === i ? { ...s, [field]: isNaN(parsed) ? 0 : parsed } : s
                      );
                      update({ setLogs: next } as any);
                      const rawField = measurementType === MeasurementType.TIME ? 'dur'
                        : measurementType === MeasurementType.DISTANCE ? 'dist' : 'reps';
                      setRawValues((prev) => { const n = { ...prev }; delete n[rawKey(i, rawField)]; return n; });
                    }}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Set ${i + 1} ${MEASUREMENT_LABELS[measurementType]}`}
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
        <button className="ex-add-set" onClick={addLogSet} type="button">
          + Add Set
        </button>
      </div>
    </div>
  );
}
```

Also add `SetLog` to the import from `@trainapp-io/train-core` if not already imported (it is — check line 5).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/programs/components/workoutBuilder/ExerciseItem.tsx
git commit -m "feat: ExerciseItem log mode — four visual states (active/done/in-progress/upcoming)"
```

---

## Task 8: CircuitItem — collapsed group card in log mode

**Files:**
- Modify: `src/app/programs/components/workoutBuilder/CircuitItem.tsx`

- [ ] **Step 1: Add `isBlockActive` and `onJumpTo` props; update `getGroupLabel` colors; add collapsed log mode rendering**

Replace the entire file:

```tsx
import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LuX, LuPlus } from 'react-icons/lu';
import ExerciseItem from './ExerciseItem';
import { Block, BlockType, WorkoutRequest, MeasurementType, MeasurementUnit, SetLog } from '@trainapp-io/train-core';

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
  /** Whether this block is the currently focused/expanded block in log mode */
  isBlockActive?: boolean;
  /** Called when user taps a collapsed block to jump to it */
  onJumpTo?: () => void;
}

function getGroupLabel(count: number): { label: string; color: string; bg: string } {
  if (count === 2) return { label: 'Superset', color: '#6d28d9', bg: '#faf5ff' };
  if (count === 3) return { label: 'Tri-set', color: '#9d174d', bg: '#fce7f3' };
  return { label: 'Circuit', color: '#065f46', bg: '#d1fae5' };
}

const CircuitItem: React.FC<Props> = ({
  block,
  blockNumber: _blockNumber,
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
  isBlockActive = true,
  onJumpTo,
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

  // ── Log mode collapsed state for groups ──
  if (logMode && !isSingle && !isBlockActive) {
    const { label, color, bg } = getGroupLabel(block.exercises.length);
    const allExLogs = block.exercises.map((ex) =>
      ((ex as any).setLogs as SetLog[] | undefined) ?? []
    );
    const allCompleted = allExLogs.every((logs) => logs.length > 0 && logs.every((s) => s.isCompleted));
    const someCompleted = allExLogs.some((logs) => logs.some((s) => s.isCompleted));
    const completedRounds = allExLogs.length > 0
      ? Math.min(...allExLogs.map((logs) => logs.filter((s) => s.isCompleted).length))
      : 0;
    const totalRounds = block.targetSets || 1;

    if (allCompleted) {
      return (
        <div className="ex-log-done" onClick={onJumpTo} role="button" tabIndex={0}>
          <div className="ex-log-done__check">✓</div>
          <span
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
              padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
              background: bg, color, flexShrink: 0,
            }}
          >
            {label}
          </span>
          <span className="ex-log-done__name">{block.name || label}</span>
          <span className="ex-log-done__summary">{completedRounds} rounds</span>
        </div>
      );
    }

    if (someCompleted) {
      return (
        <div className="ex-log-inprogress" onClick={onJumpTo} role="button" tabIndex={0}>
          <div className="ex-log-inprogress__badge">{completedRounds}/{totalRounds}</div>
          <span
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
              padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
              background: bg, color, flexShrink: 0,
            }}
          >
            {label}
          </span>
          <span className="ex-log-inprogress__name">{block.name || label}</span>
          <span className="ex-log-inprogress__status">In progress · tap to resume</span>
        </div>
      );
    }

    return (
      <div className="ex-log-upcoming" onClick={onJumpTo} role="button" tabIndex={0}>
        <div className="ex-log-upcoming__num">
          {block.exercises.length}
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
            padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
            background: bg, color, flexShrink: 0,
          }}
        >
          {label}
        </span>
        <span className="ex-log-upcoming__name">{block.name || label}</span>
        <span className="ex-log-upcoming__meta">{totalRounds} rounds</span>
        <span className="ex-log-upcoming__jump">Jump to →</span>
      </div>
    );
  }

  // ── SINGLE block: render ExerciseItem directly ──
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
                isActive={logMode ? (isBlockActive && activeExerciseIndex === exerciseIndex) : undefined}
                onSelect={logMode ? onJumpTo : undefined}
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
                  isActive={logMode ? (isBlockActive && activeExerciseIndex === exerciseIndex) : undefined}
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

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/programs/components/workoutBuilder/CircuitItem.tsx
git commit -m "feat: CircuitItem log mode — collapsed group card, correct badge colors, jump support"
```

---

## Task 9: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Navigate to a workout log create page and verify:
1. Sticky header shows workout name + elapsed timer
2. First exercise is active (expanded with purple glow)
3. Other exercises show as upcoming (faded rows with "Jump to →" on hover)
4. Checking a set dims that row and activates the next
5. Checking the last set of an exercise triggers rest timer in bottom bar
6. Tapping an upcoming exercise makes it active (previous goes amber)
7. Tapping the amber in-progress row resumes it
8. Bottom bar shows rest card with progress ring when resting, idle "Rest" button otherwise
9. Desktop (widen browser): layout stays max 640px centered
