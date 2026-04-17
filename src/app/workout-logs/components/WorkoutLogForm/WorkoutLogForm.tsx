import React, { useState, useEffect } from 'react';
import { WorkoutLogRequest, Block, WorkoutRequest } from '@trainapp-io/train-core';
import { useWorkoutLogContext } from '../../contexts/WorkoutLogContext';
import CircuitItem from '../../../programs/components/workoutBuilder/CircuitItem';
import WorkoutLogHeader from './WorkoutLogHeader';
import CompletionFooter from './CompletionFooter';
import { snapshotToBlock, blockToLog, BlockWithLogs, getInitialActiveBlock } from './workoutLogHelpers';
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
  const [blocks, setBlocks] = useState<BlockWithLogs[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);

  // Rest callback state
  const [restSeconds, setRestSeconds] = useState(0);
  const [restKey, setRestKey] = useState(0);

  const handleSetCompleted = (seconds: number) => {
    setRestSeconds(seconds);
    setRestKey((k) => k + 1);
  };

  useEffect(() => {
    if (workoutSnapshot?.blockSnapshot) {
      setBlocks(workoutSnapshot.blockSnapshot.map(snapshotToBlock));
    }
  }, [workoutSnapshot]);

  useEffect(() => {
    if (blocks.length > 0) {
      setActiveBlockIndex(getInitialActiveBlock(blocks));
    }
  }, [blocks.length]);

  // ── Timer state ──
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isTimerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isTimerRunning]);

  useEffect(() => {
    if (!isTimerRunning) return;
    setActualDuration(elapsedSeconds);
    setActualEndDate(new Date(actualStartDate.getTime() + elapsedSeconds * 1000));
  }, [elapsedSeconds, isTimerRunning]);

  // Auto-advance to next block when current block is fully complete
  useEffect(() => {
    if (blocks.length === 0) return;
    const current = blocks[activeBlockIndex];
    if (!current) return;
    const allDone = current.exercises.every((ex) => {
      const logs = ex.setLogs;
      return logs != null && logs.length > 0 && logs.every((s) => s.isCompleted);
    });
    if (allDone && activeBlockIndex < blocks.length - 1) {
      setActiveBlockIndex(activeBlockIndex + 1);
    }
  }, [blocks, activeBlockIndex]);

  const handleStartTimer = () => {
    if (!isTimerRunning) setActualStartDate(new Date());
    setIsTimerRunning(true);
  };
  const handlePauseTimer = () => setIsTimerRunning(false);

  if (!workoutSnapshot) {
    return <div className="wl-page"><p>Loading workout data…</p></div>;
  }

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

  const handleJumpTo = (blockIndex: number) => {
    setActiveBlockIndex(blockIndex);
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
    <div className="wl-page">
      <WorkoutLogHeader
        workoutSnapshot={workoutSnapshot}
        isTimerRunning={isTimerRunning}
        elapsedSeconds={elapsedSeconds}
        onPausePlay={isTimerRunning ? handlePauseTimer : handleStartTimer}
        onFinish={handleSubmit}
      />

      <div className="wl-body">
        {(() => {
          const sectionSnapshot = workoutSnapshot.sectionSnapshot ?? [];
          const seenSections = new Set<number>();

          type RenderGroup =
            | { type: 'section'; section: typeof sectionSnapshot[number]; blockIndices: number[] }
            | { type: 'standalone'; blockIndex: number };

          const renderGroups: RenderGroup[] = [];
          blocks.forEach((_, index) => {
            const section = sectionSnapshot.find((s) => s.blockOrders.includes(index));
            if (section) {
              if (!seenSections.has(section.order)) {
                seenSections.add(section.order);
                const blockIndices = section.blockOrders
                  .filter((bi) => bi < blocks.length)
                  .sort((a, b) => a - b);
                renderGroups.push({ type: 'section', section, blockIndices });
              }
            } else {
              renderGroups.push({ type: 'standalone', blockIndex: index });
            }
          });

          return renderGroups.map((group) => {
            if (group.type === 'standalone') {
              const { blockIndex } = group;
              const block = blocks[blockIndex];
              return (
                <React.Fragment key={block.order}>
                  <CircuitItem
                    block={block}
                    blockNumber={blockIndex + 1}
                    editMode={true}
                    logMode={true}
                    workout={workoutShell}
                    onUpdateBlock={(updated) => handleUpdateBlock(blockIndex, updated)}
                    onRemoveBlock={() => {}}
                    onSetHasUnsavedChanges={() => {}}
                    updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                    removeExerciseFromBlock={() => {}}
                    onSetCompleted={handleSetCompleted}
                    isBlockActive={activeBlockIndex === blockIndex}
                    onJumpTo={() => handleJumpTo(blockIndex)}
                    activeExerciseIndex={0}
                  />
                </React.Fragment>
              );
            }

            const { section, blockIndices } = group;
            const allExercises = blockIndices.flatMap((bi) => blocks[bi].exercises);
            const completedCount = allExercises.filter((ex) => {
              const logs = ex.setLogs;
              return logs != null && logs.length > 0 && logs.every((s) => s.isCompleted);
            }).length;

            return (
              <div key={section.order} className="wl-section-card">
                <div className="wl-section-card__header">
                  <span className="wl-section-badge">SECTION</span>
                  <span className="wl-section-card__name">{section.name}</span>
                  <span className="wl-section-card__count">{completedCount} / {allExercises.length}</span>
                </div>
                <div className="wl-section-card__body">
                  {blockIndices.map((blockIndex) => {
                    const block = blocks[blockIndex];
                    return (
                      <CircuitItem
                        key={block.order}
                        block={block}
                        blockNumber={blockIndex + 1}
                        editMode={true}
                        logMode={true}
                        workout={workoutShell}
                        onUpdateBlock={(updated) => handleUpdateBlock(blockIndex, updated)}
                        onRemoveBlock={() => {}}
                        onSetHasUnsavedChanges={() => {}}
                        updateExerciseInBlockPartial={updateExerciseInBlockPartial}
                        removeExerciseFromBlock={() => {}}
                        onSetCompleted={handleSetCompleted}
                        isBlockActive={activeBlockIndex === blockIndex}
                        onJumpTo={() => handleJumpTo(blockIndex)}
                        activeExerciseIndex={0}
                      />
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      <CompletionFooter
        key={restKey}
        isLive={true}
        isTimerRunning={isTimerRunning}
        onStart={handleStartTimer}
        onPause={handlePauseTimer}
        onFinish={handleSubmit}
        isSaving={isSaving}
        restSeconds={restSeconds}
      />
    </div>
  );
};

export default WorkoutLogForm;
