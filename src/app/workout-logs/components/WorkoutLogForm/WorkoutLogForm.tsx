import React, { useState, useEffect } from 'react';
import { WorkoutLogRequest, Block, WorkoutRequest, MeasurementType } from '@trainapp-io/train-core';
import { useWorkoutLogContext } from '../../contexts/WorkoutLogContext';
import CircuitItem from '../../../programs/components/workoutBuilder/CircuitItem';
import WorkoutLogHeader from './WorkoutLogHeader';
import CompletionFooter from './CompletionFooter';
import { snapshotToBlock, blockToLog } from './workoutLogHelpers';
import './WorkoutLogForm.css';

interface WorkoutLogFormProps {
  initialData?: WorkoutLogRequest;
  onSubmit: (workoutLogRequest: WorkoutLogRequest) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const WorkoutLogForm: React.FC<WorkoutLogFormProps> = ({
  initialData,
  onSubmit,
  onCancel: _onCancel,
  isSaving = false,
}) => {
  const { workoutSnapshot, versionId } = useWorkoutLogContext();

  const [actualStartDate, setActualStartDate] = useState<Date>(
    initialData?.actualStartDate || new Date()
  );
  const [actualEndDate, setActualEndDate] = useState<Date>(
    initialData?.actualEndDate || new Date()
  );
  const [actualDuration, setActualDuration] = useState<number>(
    initialData?.actualDuration || 0
  );
  const [isCompleted, _setIsCompleted] = useState<boolean>(
    initialData?.isCompleted || false
  );

  // Blocks used by the builder components — pre-filled with target values
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Active exercise selection
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);

  useEffect(() => {
    if (workoutSnapshot?.blockSnapshot) {
      setBlocks(workoutSnapshot.blockSnapshot.map(snapshotToBlock));
    }
  }, [workoutSnapshot]);

  // ── Timer state ──
  const [isLive, setIsLive] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualDuration, setManualDuration] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!isTimerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isTimerRunning]);

  useEffect(() => {
    if (!isLive || !isTimerRunning) return;
    setActualDuration(elapsedSeconds);
    setActualEndDate(new Date(actualStartDate.getTime() + elapsedSeconds * 1000));
  }, [elapsedSeconds, isLive, isTimerRunning]);

  useEffect(() => {
    if (isLive) return;
    const total = manualDuration.hours * 3600 + manualDuration.minutes * 60;
    setActualDuration(total);
    setActualEndDate(new Date(actualStartDate.getTime() + total * 1000));
  }, [manualDuration, isLive, actualStartDate]);

  const handleStartTimer = () => {
    if (!isTimerRunning) setActualStartDate(new Date());
    setIsTimerRunning(true);
  };
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleModeToggle = () => {
    setIsLive((v) => !v);
    setIsTimerRunning(false);
    setElapsedSeconds(0);
  };

  if (!workoutSnapshot) {
    return <div className="workout-log-form"><p>Loading workout data…</p></div>;
  }

  // Middle button config — driven by the active exercise
  const activeBlock = blocks[activeBlockIdx];
  const activeExercise = activeBlock?.exercises[activeExerciseIdx];
  const midButton = activeExercise?.measurement?.measurementType === MeasurementType.TIME ? 'rest' : 'sets';
  const totalSets = activeBlock?.targetSets ?? 1;
  const defaultRestSeconds = (activeExercise as any)?.rest || 60;

  // Minimal WorkoutRequest shell so CircuitItem can resolve blockIndex
  const workoutShell: WorkoutRequest = {
    name: workoutSnapshot.name,
    blocks,
  } as WorkoutRequest;

  const handleUpdateBlock = (index: number, updated: Block) => {
    const next = [...blocks];
    next[index] = updated;
    setBlocks(next);
  };

  const updateExerciseInBlockPartial = (blockIndex: number, exerciseIndex: number, updates: Partial<any>) => {
    const next = [...blocks];
    const exercises = [...next[blockIndex].exercises];
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates };
    next[blockIndex] = { ...next[blockIndex], exercises };
    setBlocks(next);
  };

  const handleSubmit = () => {
    onSubmit({
      userId: initialData?.userId || '',
      workoutId: initialData?.workoutId || '',
      versionId: initialData?.versionId || versionId,
      workoutSnapshot: workoutSnapshot!,
      blockLogs: blocks.map((b, i) => blockToLog(b, workoutSnapshot.blockSnapshot?.[i]?.order ?? i)),
      actualDuration,
      actualStartDate: actualStartDate.toISOString() as any,
      actualEndDate: actualEndDate.toISOString() as any,
      isCompleted,
    });
  };

  return (
    <div className="workout-log-form">
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
      />

      <div className="workout-view block-logs-container">
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
            activeExerciseIndex={index === activeBlockIdx ? activeExerciseIdx : -1}
            onSelectExercise={(exIdx) => { setActiveBlockIdx(index); setActiveExerciseIdx(exIdx); }}
          />
        ))}
      </div>

      <CompletionFooter
        key={`${activeBlockIdx}-${activeExerciseIdx}`}
        isLive={isLive}
        isTimerRunning={isTimerRunning}
        onStart={handleStartTimer}
        onPause={handlePauseTimer}
        onFinish={handleSubmit}
        isSaving={isSaving}
        midButton={midButton}
        totalSets={totalSets}
        defaultRestSeconds={defaultRestSeconds}
      />
    </div>
  );
};

export default WorkoutLogForm;
