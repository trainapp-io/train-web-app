import React, { useState, useEffect } from 'react';
import { WorkoutLogRequest, WorkoutSnapshot, BlockLog, ExerciseLog } from '@seenelm/train-core';
import WorkoutLogHeader from './WorkoutLogHeader';
import BlockLogSection from './BlockLogSection';
import CompletionFooter from './CompletionFooter';
import './WorkoutLogForm.css';

interface WorkoutLogFormProps {
  workoutSnapshot: WorkoutSnapshot;
  initialData?: WorkoutLogRequest;
  onSubmit: (workoutLogRequest: WorkoutLogRequest) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const WorkoutLogForm: React.FC<WorkoutLogFormProps> = ({
  workoutSnapshot,
  initialData,
  onSubmit,
  onCancel,
  isSaving = false,
}) => {
  const [actualStartDate, setActualStartDate] = useState<Date>(
    initialData?.actualStartDate || new Date()
  );
  const [actualEndDate, setActualEndDate] = useState<Date>(
    initialData?.actualEndDate || new Date()
  );
  const [actualDuration, setActualDuration] = useState<number>(
    initialData?.actualDuration || 0
  );
  const [blockLogs, setBlockLogs] = useState<BlockLog[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    initialData?.isCompleted || false
  );

  // Initialize block logs from workout snapshot
  useEffect(() => {
    if (initialData?.blockLogs) {
      setBlockLogs(initialData.blockLogs);
    } else {
      // Create initial block logs from snapshot
      const initialBlockLogs: BlockLog[] = workoutSnapshot.blockSnapshot.map((blockSnapshot) => ({
        actualRest: blockSnapshot.rest,
        actualSets: blockSnapshot.targetSets,
        exerciseLogs: blockSnapshot.exerciseSnapshot.map((exerciseSnapshot): ExerciseLog => ({
          name: exerciseSnapshot.name,
          actualRest: exerciseSnapshot.rest,
          actualReps: exerciseSnapshot.targetReps,
          actualDurationSec: exerciseSnapshot.targetDurationSec,
          actualWeight: exerciseSnapshot.targetWeight,
          actualDistance: exerciseSnapshot.targetDistance,
          isCompleted: false,
          order: exerciseSnapshot.order,
        })),
        order: blockSnapshot.order,
        isCompleted: false,
      }));
      setBlockLogs(initialBlockLogs);
    }
  }, [workoutSnapshot, initialData]);

  const handleBlockLogUpdate = (index: number, updatedBlockLog: BlockLog) => {
    const updatedBlockLogs = [...blockLogs];
    updatedBlockLogs[index] = updatedBlockLog;
    setBlockLogs(updatedBlockLogs);
  };

  const handleSubmit = () => {

    const workoutLogRequest: WorkoutLogRequest = {
      userId: initialData?.userId || '',
      workoutId: initialData?.workoutId || '',
      versionId: initialData?.versionId || 0,
      workoutSnapshot,
      blockLogs,
      actualDuration,
      actualStartDate,
      actualEndDate,
      isCompleted,
    };

    onSubmit(workoutLogRequest);
  };

  return (
    <div className="workout-log-form">
      <WorkoutLogHeader
        workoutSnapshot={workoutSnapshot}
        actualStartDate={actualStartDate}
        actualEndDate={actualEndDate}
        onStartDateChange={setActualStartDate}
        onEndDateChange={setActualEndDate}
        onDurationChange={setActualDuration}
      />

      <div className="block-logs-container">
        {workoutSnapshot.blockSnapshot.map((blockSnapshot, index) => (
          <BlockLogSection
            key={index}
            blockSnapshot={blockSnapshot}
            blockLog={blockLogs[index] || {
              actualRest: 0,
              actualSets: 0,
              exerciseLogs: [],
              order: blockSnapshot.order,
              isCompleted: false,
            }}
            onUpdate={(updated) => handleBlockLogUpdate(index, updated)}
          />
        ))}
      </div>

      <CompletionFooter
        actualDuration={actualDuration}
        isCompleted={isCompleted}
        onCompletionToggle={setIsCompleted}
        onSave={handleSubmit}
        onCancel={onCancel}
        isSaving={isSaving}
      />
    </div>
  );
};

export default WorkoutLogForm;
