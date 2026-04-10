# Log Workout UI — Design Spec

## Overview

Redesign the workout logging experience (`WorkoutLogForm`) to be modern, gym-friendly, and competitive with Hevy/Strong. The design uses a hybrid model: all exercises are visible in a scrollable list, but the active exercise expands into a focused card. Users can jump to any exercise at any time.

---

## Layout

- **Single-column layout**, `max-width: 640px`, centered on desktop, full-width on mobile
- Same design on both platforms — no separate desktop layout
- Three fixed zones: sticky header, scrollable body, fixed bottom bar

---

## Header (Sticky)

- Workout name (left) + Finish button (right, purple)
- Second row: pause/play button + large live elapsed timer (purple, tabular numerals)
- Stays visible while scrolling

---

## Exercise States

Each exercise in the list has one of four visual states:

### 1. Completed
- Collapsed to a single row
- Green checkmark circle + exercise name + summary (e.g. "4 × 135–145 lbs")
- Slightly faded (opacity ~0.65)
- Tappable to re-expand: it becomes the active card, the previously active exercise transitions to In-Progress

### 2. In-Progress (Skipped)
- Amber/yellow row with amber border
- Shows partial progress badge (e.g. "2/4") + exercise name + "tap to resume"
- Appears when user jumps to a different exercise before finishing this one

### 3. Active (Expanded)
- White card with purple glow/outline (`box-shadow` + `2px` purple ring)
- Header: avatar letter badge (purple bg), exercise name, "X / Y sets" progress
- Set table (see below)
- "+ Add Set" link in footer

### 4. Upcoming
- Faded row (opacity ~0.5), white card, grey border
- Shows exercise number circle, name, target summary (e.g. "4 × 15 reps")
- On hover (desktop): "Jump to →" label appears on the right
- Tap (both platforms) to make it the active exercise (previous active becomes In-Progress)

---

## Active Exercise — Set Table

Columns: **SET · LBS · REPS · ✓**

- All inputs pre-filled with target values from the workout snapshot
- Current set row: purple background tint, purple input borders
- Completed set rows: dimmed (opacity ~0.45)
- Pending set rows: normal styling, inputs readonly until it becomes the current row
- Check button (circle): tap to complete the set → row dims, next row activates, rest timer auto-starts
- `onFocus` selects all input text (existing pattern from ExerciseItem)
- Raw value pattern for inputs (existing pattern): track mid-edit string, commit on blur

---

## Grouped Exercises (Superset / Tri-Set / Circuit)

A group (block with multiple exercises) renders as a single expanded card:

- **Badge** in header: "SUPERSET" (purple), "TRI-SET" (pink), "CIRCUIT" (green)
- Header also shows: "Round X of Y" + completed count
- Each exercise stacked inside the card with its own set row for the current round
- **"then" connector** between exercises (faint line + "then" label)
- Exercise avatar colors match the badge color scheme
- Column label: **"RND"** not "SET"
- **Rest fires only after the last exercise in the round is checked** — not between exercises
- Check flow: Ex 1 check → Ex 2 activates → ... → last exercise checked → rest starts

---

## Skip / Jump Behavior

- Tap any upcoming exercise → it becomes the active card
- The previously active exercise transitions to In-Progress (amber) state, preserving all set data entered so far
- Tap the amber In-Progress row to resume — it re-expands as the active card
- Multiple exercises can be In-Progress simultaneously (user can jump around freely)

---

## Bottom Bar (Fixed)

Always visible, fixed to the bottom of the viewport, max-width 640px centered.

### Rest Timer — Active State
- Purple card with progress ring (SVG circle) + large countdown (e.g. "1:24")
- "RESTING" label above countdown
- "Skip →" link to cancel early
- Auto-starts when a set checkmark is tapped (or when the last exercise in a group round is checked)
- Ring animates from full to empty over the rest duration

### Rest Timer — Idle State
- Small "Rest" button with timer icon — user can manually start a 60s rest
- Tapping while active cancels the countdown

### Finish Button
- Always visible alongside rest timer
- Purple, rounded — triggers workout submission

---

## Components Affected

| Component | Change |
|---|---|
| `WorkoutLogForm.tsx` | Track `activeBlockIndex` + `activeExerciseIndex` state; handle jump logic |
| `WorkoutLogHeader.tsx` | Redesign: larger timer, pause button inline, remove Live/Historical toggle from header |
| `CompletionFooter.tsx` | Redesign: rest timer with progress ring, idle/active/done states |
| `WorkoutLogForm.css` | Full rewrite — all new exercise state styles (done, in-progress, upcoming, active) |
| `CircuitItem.tsx` | Log mode: group card with badge, "then" connectors, round labels |
| `ExerciseItem.tsx` | Log mode: active/in-progress/done/upcoming visual states |

### Live/Historical Toggle
The Live/Historical mode toggle moves out of the header into a less prominent location (e.g. a small link under the timer or in a settings sheet). It is not a primary action during a workout.

---

## Data Flow

- `WorkoutLogForm` owns `activeBlockIndex` + `activeExerciseIndex` — passed down to `CircuitItem` and `ExerciseItem`
- Jumping to an exercise: `setActiveBlockIndex(b)` + `setActiveExerciseIndex(e)` — no data is lost
- Set completion: existing `onSetCompleted(seconds)` callback triggers rest timer
- All actual values stored in `blocks: BlockWithLogs[]` state (unchanged data model)

---

## What Does Not Change

- `workoutLogHelpers.ts` — `snapshotToBlock`, `blockToLog`, `BlockWithLogs` types unchanged
- Backend API — no changes needed
- `train-core` types — no changes needed
- The per-set data model (`SetLog`, `SetTarget`) — unchanged
