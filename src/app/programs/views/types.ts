// WorkoutView/types.ts
// import {
//   Block as CoreBlock,
//   Exercise as CoreExercise,
// } from "@trainapp-io/train-core";

// Extend Block to include id for local state management
// export interface Block extends CoreBlock {
//   id: string;
//   sets?: number; // Optional for UI purposes
//   exercises: Exercise[]; // Override with our extended Exercise type
// }

// // Extend Exercise to include additional UI properties
// export interface Exercise extends CoreExercise {
//   id: string;
//   sets: number;
//   reps: number;
//   weight: number;
//   weightUnit: string;
//   completed: boolean;
//   notes?: string;
//   measurementType?: 'reps' | 'time' | 'distance' | 'bodyweight';
// }

// export interface Circuit {
//   id: string;
//   name: string;
//   sets: number;
//   exercises: Exercise[];
// }

export interface MuscleGroup {
  name: string;
  percentage: number;
}

// export interface WorkoutDetails {
//   id: string;
//   title: string;
//   description: string;
//   duration: number;
//   muscleGroups: MuscleGroup[];
//   circuits: Block[];
//   completed: boolean;
// }
