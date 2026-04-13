# Flexible Workout Builder — Design Spec
**Date:** 2026-04-13  
**Status:** Approved

---

## Overview

Extend the workout creation feature to support any sport (swimming, CrossFit, track & field, strength, etc.) with an experience as intuitive as writing a workout on paper or in Excel. The core changes are:

1. Add **Sections** — optional named containers (e.g. "W/U (400)", "Main Set") that group exercises
2. Replace the "Add Circuit" button with **"+ Group Exercise"** on each exercise card to build supersets/tri-sets/circuits organically
3. Add a **workout type tag** to the header to auto-set measurement defaults
4. Add missing **measurement types** (Calories, % Effort) and wire up Bodyweight properly
5. Change the measurement type selector from a cycle button to a **dropdown**
6. Add a **rest unit toggle** (s ⟳ / min ⟳) to the group header rest field

---

## 1. Workout Structure

### Hierarchy

```
Workout
  ├── Block[]       (standalone exercises / groups — no section)
  └── Section[]     (named containers, optional)
        └── Block[] (exercises / groups inside the section)
```

Sections and standalone blocks coexist in the same workout. A simple Pull Day has zero sections. A swim workout uses sections like "W/U (400)", "Kick (200)", "Main (400)", "Fast (100)".

### Bottom toolbar (replaces current "Add Exercise" / "Add Circuit")

| Button | Behavior |
|--------|----------|
| `+ Add Exercise` | Creates a new standalone SINGLE block with one empty exercise |
| `+ Add Section` | Creates a new named section container |

The "Add Circuit" button is removed entirely. Circuits are now built organically via "Group Exercise" (see §3).

---

## 2. Header

### Unchanged fields
- Workout title (text input)
- Description (optional text input)
- Duration with unit toggle (min ⟳)

### New: Workout Type Tag

A set of pill buttons added inline next to duration. Selecting a type auto-sets the default `measurementType` and `measurementUnit` on newly created exercises. The user can still override per exercise.

| Type | Default measurement | Default unit |
|------|-------------------|--------------|
| Strength | Reps | lbs |
| Swimming | Distance | yd |
| CrossFit | Reps | lbs |
| Track | Distance | m |

Workout type is stored on the `WorkoutRequest` as `workoutType?: string`.

---

## 3. Exercise Card

### Unchanged
- Drag handle (reorder within context)
- Avatar (colored initial based on exercise name)
- Exercise name input with autocomplete
- lbs ⟳ / kg cycle toggle (weight unit — only 2 options, cycle is fine)
- Per-set table: SET / LBS / REPS (or DIST / TIME / CALS / %) / REST / notes / remove
- `+ Add Set` in footer
- Remove (×) button

### Changed: Measurement type selector

**Before:** `reps ⟳` cycle button — cycles through REPS → TIME → DISTANCE on each click.

**After:** `reps ▾` chip — clicking opens a small dropdown/popover listing all 6 measurement types. One tap to jump directly to any type.

```
┌─────────────────────────┐
│ MEASUREMENT TYPE        │
│ ✓ Reps   (+ weight)     │
│   Time                  │
│   Distance              │
│   Bodyweight  (no load) │
│   Calories              │
│   % Effort              │
└─────────────────────────┘
```

Selecting **Bodyweight** hides the weight (LBS/KG) column — only reps shown.  
Selecting **Calories** shows a CAL column, no weight column.  
Selecting **% Effort** shows a % column, no weight column.

### New: `+ Group Exercise` button

Located in the **card footer**, right-aligned next to `+ Add Set`.

Clicking it adds a new empty exercise to the same block, converting it from SINGLE to a group block. The group type label auto-updates based on exercise count:

| Exercise count | Label |
|---------------|-------|
| 2 | SUPERSET (purple) |
| 3 | TRI-SET (pink) |
| 4+ | CIRCUIT (green) |

This button also appears **inside group blocks** (in the group header area) to add further exercises to an existing group.

---

## 4. Group Block (Superset / Tri-set / Circuit)

### Header
- Drag handle
- Auto label badge (SUPERSET / TRI-SET / CIRCUIT — updates with exercise count)
- Editable name input
- Rounds input (`[ 3 ] rounds`)
- Rest input with **unit toggle**: `[ 2 ] min ⟳` — toggles between seconds and minutes (same pattern as per-set rest). Stored internally as seconds.
- Remove (×) button
- `+ Group Exercise` button (adds another exercise to this group)

### Body
- Each exercise in the group renders with its own full card (header + set table + footer)
- "THEN" separator between exercises (existing behavior, unchanged)
- Per-exercise `+ Group Exercise` button in each card footer — adds to the same parent group
- Rounds column label changes from "SET" to "RND"

---

## 5. Section

### Header
- Drag handle (reorder sections within the workout)
- "SECTION" pill badge
- Editable name input (e.g. "W/U (400)", "Main Set", "WARM-UP")
- Optional: distance/volume display pill (e.g. "400 yds") — computed from exercises inside
- Remove (×) button

### Body
- Contains its own list of Blocks (SINGLE or group) with the same add/group/reorder UX
- `+ Add Exercise to Section` button at the bottom of the section body

### Behavior
- Sections and standalone blocks can be freely mixed and reordered in the workout
- Exercises inside a section can still be grouped into supersets/circuits using `+ Group Exercise`

---

## 6. Measurement Types & Units

### New MeasurementType values (train-core)

| Value | Use case | Set table columns |
|-------|----------|-------------------|
| `CALORIES` | Rowing machine, assault bike, ski erg | CAL + REST |
| `PERCENTAGE` | Effort-based training (run at 70%) | % + REST |

### Wiring existing value

| Value | Fix needed |
|-------|-----------|
| `BODYWEIGHT` | Already in enum. Wire up in UI: hide weight column when selected |

### New MeasurementUnit values (train-core)

| Value | Symbol | Used with |
|-------|--------|-----------|
| `CALORIE` | cal | CALORIES type |
| `PERCENT` | % | PERCENTAGE type |

### Existing units (no change needed)
Weight: POUND (lb), KILOGRAM (kg)  
Distance: METER (m), KILOMETER (km), MILE (mi), YARD (yd), FOOT (ft)  
Time: HOUR (hr), MINUTE (min), SECOND (sec)

---

## 7. Data Model Changes

### train-core (`program.dto.ts` and `program.enums.ts`)

```typescript
// program.enums.ts — add to MeasurementType
CALORIES = "calories",
PERCENTAGE = "percentage",

// program.enums.ts — add to MeasurementUnit
CALORIE = "cal",
PERCENT = "%",

// program.dto.ts — new interface
export interface Section {
  name: string;
  description?: string;
  blocks: Block[];
  order: number;
}

// program.dto.ts — additions to WorkoutRequest / WorkoutResponse
sections?: Section[];
workoutType?: string;   // 'strength' | 'swimming' | 'crossfit' | 'track'
```

### train-service (`workoutModel.ts`)

- Add `CALORIES` and `PERCENTAGE` to `MeasurementType` enum validation
- Add `CALORIE` and `PERCENT` to `MeasurementUnit` enum validation
- Add `SectionSchema` (mirrors Block structure but contains `blocks` sub-array)
- Add `sections` field to `WorkoutSchema`
- Add `workoutType` field to `WorkoutSchema`

### Ordering between blocks and sections

Both `Block` and `Section` have an `order: number` field. The UI merges both arrays and sorts by `order` to produce a single ordered list for rendering. When saving, blocks and sections are split back into their respective arrays. This allows free interleaving (e.g. a standalone exercise at order 0, a section at order 1, another standalone exercise at order 2) without restructuring the data model into a discriminated union.

### Backwards compatibility

Existing workouts that only use `blocks` (no `sections`) continue to work unchanged. The `sections` field is optional. No migration needed.

---

## 8. Component Changes (train-web-app)

| Component | Change |
|-----------|--------|
| `WorkoutBuilderBlocks.tsx` | Replace "Add Circuit" button with "Add Section". Add `sections` state management. Render `SectionItem` for sections. |
| `CircuitItem.tsx` | Add rest unit toggle (s/min) to group header. Rename `addExercise` button in group to `+ Group Exercise`. |
| `ExerciseItem.tsx` | Replace `cycleMeasurement` with dropdown/popover. Add `+ Group Exercise` button to card footer. Wire BODYWEIGHT, CALORIES, PERCENTAGE column logic. |
| `SectionItem.tsx` | **New component.** Section container card with header (name, badge, distance pill, remove) and body (blocks list + "Add Exercise to Section" button). |
| `WorkoutContext.tsx` | Add section CRUD actions: `addSection`, `updateSection`, `removeSection`, `addBlockToSection`, etc. |
| `WorkoutDetailsSection.tsx` | Add workout type pill selector to header area. |
| `workoutService.ts` | Update request/response mapping to include `sections` and `workoutType`. |

---

## 9. Out of Scope

- Watts (W) measurement unit — niche, can be added later
- Section collapse/expand animation — can be added as a polish pass
- Distance/volume auto-computation for section pill — can be added later
- Workout type custom values — only the 4 preset types for now
