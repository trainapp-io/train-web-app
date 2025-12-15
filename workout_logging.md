# Workout Logging Feature Specification

**Frontend:** React + Vite  
**DTO Source:** Shared DTO Library (Authoritative)

---

## 1. Overview

This document specifies the implementation details for the **Workout Logging** feature.

The feature allows users to log completed workouts while preserving a **snapshot** of the workout definition at a specific version. All data models are sourced from a shared DTO library and must be used **as-is**.

This document is intended to be consumed by an agent implementing the feature end-to-end.

---

## 2. Data Ownership & Constraints

### Authoritative Source
- All DTOs are defined in a **shared library**
- The frontend **must import DTOs directly**

### Hard Rules
- Do **NOT** recreate DTOs locally
- Do **NOT** rename or reshape fields
- Do **NOT** stringify `Date` fields manually
- Do **NOT** introduce frontend-only variants of DTOs
- UI state may exist but must map cleanly to DTOs

---

## 3. Canonical DTOs

### WorkoutLogRequest

```ts
export interface WorkoutLogRequest {
  userId: string;
  workoutId: string;
  versionId: number;
  workoutSnapshot: WorkoutSnapshot;
  blockLogs?: BlockLog[];
  exerciseLogs?: ExerciseLog[];
  actualDuration: number;
  actualStartDate: Date;
  actualEndDate: Date;
  isCompleted: boolean;
}
```

### WorkoutLogResponse

```ts
export interface WorkoutLogResponse {
  id: string;
  userId: string;
  workoutId: string;
  versionId: number;
  workoutSnapshot: WorkoutSnapshot;
  blockLogs?: BlockLog[];
  exerciseLogs?: ExerciseLog[];
  actualDuration: number;
  actualStartDate: Date;
  actualEndDate: Date;
  isCompleted: boolean;
}

## 4. Core Concepts

### Workout Log

A **workout log** represents:

- A user’s actual execution of a workout  
- A snapshot tied to a specific `workoutId` and `versionId`  
- A historical record that must not change if the workout definition is later modified  

### Snapshot Rule

- `workoutSnapshot` is authoritative  
- It must be persisted **exactly as captured** at log time  
- The UI must render from the snapshot, **not from live workout definitions**

---

## 5. Feature Scope

### In Scope

- Create a workout log  
- Capture actual start time, end time, and duration  
- Log block-level performance (`BlockLog`)  
- Log exercise-level performance (`ExerciseLog`)  
- Mark workout as completed  
- View workout log history  
- View a single workout log  
- Edit an existing workout log (if supported by backend)  

### Out of Scope

- Editing workout definitions  
- Editing programs  
- Analytics / PR tracking  
- Social features  

---

## 6. User Flows

### Create Workout Log

#### Entry Points

- Dashboard → **“Log Workout”**  
- Workout Detail → **“Log This Workout”**  
- Workout History → **“Log Another Workout”**

#### Flow

1. User selects a workout  
2. Frontend fetches workout definition and `versionId`  
3. Frontend constructs `workoutSnapshot`  
4. User logs performance data  
5. User completes workout  
6. Frontend submits `WorkoutLogRequest`

---

### View Workout Log

Displays:

- Workout name (from snapshot)  
- Version ID  
- Actual start date  
- Actual end date  
- Total duration  
- Block logs  
- Exercise logs  
- Completion status  

---

### Edit Workout Log

1. Load existing `WorkoutLogResponse`  
2. Prefill UI with response data  
3. Preserve:
   - `workoutId`
   - `versionId`
   - `workoutSnapshot`
4. Submit updated `WorkoutLogRequest`

---

## 7. Frontend State Model

The frontend does **not own the domain model**.  
UI state exists only to help construct DTOs.

### Example UI State

```ts
type WorkoutLogFormState = {
  blockLogs: BlockLog[];
  exerciseLogs: ExerciseLog[];
  actualStartDate: Date;
  actualEndDate: Date;
  isCompleted: boolean;
};
```

## 8. API Contract Expectations

### Create Workout Log

```bash
POST /workout-logs

Response: WorkoutLogResponse
```

### Get Workout History

```bash
GET /workout-logs?userId=:userId
```

### Get Workout Log

```bash
GET /workout-logs/:logId
```

### Update Workout Log

```bash
PUT /workout-logs/:logId
```

### Delete Workout Log (If Supported)

```bash
DELETE /workout-logs/:logId
```

---

## 9. Component Architecture

Follow existing project structure and conventions.

### Suggested Structure

```text
src/
  pages/
    workout-logs/
      WorkoutLogCreate.tsx
      WorkoutLogDetail.tsx
      WorkoutLogEdit.tsx
      WorkoutLogHistory.tsx

  components/
    workout-logs/
      WorkoutLogForm/
        WorkoutLogForm.tsx
        WorkoutHeader.tsx
        BlockLogSection.tsx
        ExerciseLogSection.tsx
        CompletionFooter.tsx
```

### Component Responsibilities

- `WorkoutLogForm`
  - Orchestrates all child components
  - Accepts `WorkoutSnapshot`
  - Emits `WorkoutLogRequest`

- `BlockLogSection`
  - Renders `BlockLog[]`
  - Handles timing, notes, and completion state

- `ExerciseLogSection`
  - Renders `ExerciseLog[]`
  - Handles sets, reps, weights, RPE, etc.

- `CompletionFooter`
  - Displays duration summary
  - Completion toggle
  - Save / Cancel actions

---

## 11. Date & Duration Handling

### Rules

- `actualStartDate` and `actualEndDate` must be `Date` objects
- `actualDuration` is computed client-side

```ts
actualDuration =
  (actualEndDate.getTime() - actualStartDate.getTime()) / 1000;
```

Frontend must not infer or override backend timestamps

---

## 12. Validation Rules

### Required Fields

- `userId`
- `workoutId`
- `versionId`
- `workoutSnapshot`
- `actualStartDate`
- `actualEndDate`
- `actualDuration`

### Completion Logic

- `isCompleted` can only be true if:
  - User explicitly completes the workout
  - `actualDuration > 0`

---

## 13. Error Handling

### Use existing global error handling patterns

Show inline validation errors

Preserve user input on failed submissions

---

## 14. Loading & Empty States

### Skeleton loaders during fetch

### Empty history state:

Message: “No workouts logged yet”

Primary CTA: “Log Your First Workout”

---

## 15. Acceptance Criteria

### Shared DTOs are used directly

### Workout snapshots are immutable

### UI matches existing design system

No TypeScript or runtime errors

All CRUD flows function end-to-end

---

## 16. Implementation Constraints

### Do NOT introduce new backend models

### Do NOT reshape DTOs

### Do NOT stringify Date fields

Keep UI logic separate from domain logic

Follow existing project conventions strictly

---

## 17. Future Enhancements (Not Implemented)

### Draft workout logs

### Personal record tracking

### Workout comparisons

Program-level summaries

End of Document

---






