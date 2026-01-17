import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkoutSnapshot } from '@trainapp-io/train-core';

interface WorkoutLogContextType {
  workoutSnapshot: WorkoutSnapshot | null;
  versionId: number;
  setWorkoutSnapshot: (snapshot: WorkoutSnapshot | null) => void;
  setVersionId: (versionId: number) => void;
  clearWorkoutLog: () => void;
}

const WorkoutLogContext = createContext<WorkoutLogContextType | undefined>(undefined);

interface WorkoutLogProviderProps {
  children: ReactNode;
}

export const WorkoutLogProvider: React.FC<WorkoutLogProviderProps> = ({ children }) => {
  const [workoutSnapshot, setWorkoutSnapshot] = useState<WorkoutSnapshot | null>(null);
  const [versionId, setVersionId] = useState<number>(1);

  const clearWorkoutLog = () => {
    setWorkoutSnapshot(null);
    setVersionId(1);
  };

  const contextValue: WorkoutLogContextType = {
    workoutSnapshot,
    versionId,
    setWorkoutSnapshot,
    setVersionId,
    clearWorkoutLog,
  };

  return (
    <WorkoutLogContext.Provider value={contextValue}>
      {children}
    </WorkoutLogContext.Provider>
  );
};

export const useWorkoutLogContext = (): WorkoutLogContextType => {
  const context = useContext(WorkoutLogContext);
  if (context === undefined) {
    throw new Error('useWorkoutLogContext must be used within a WorkoutLogProvider');
  }
  return context;
};
