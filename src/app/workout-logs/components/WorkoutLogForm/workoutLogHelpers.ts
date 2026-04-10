import { Block, BlockLog, Exercise, ExerciseLog, SetLog } from '@trainapp-io/train-core';

export type ExerciseWithLogs = Exercise & { setLogs?: SetLog[] };
export type BlockWithLogs = Omit<Block, 'exercises'> & { exercises: ExerciseWithLogs[] };

export function snapshotToBlock(bs: any): BlockWithLogs {
  return {
    ...bs,
    exercises: bs.exerciseSnapshot.map((es: any) => {
      const setLogs: SetLog[] = es.setData?.length
        ? es.setData.map((s: any) => ({
            actualReps: s.reps,
            actualWeight: s.weight,
            actualDurationSec: s.durationSec,
            actualDistance: s.distance,
            actualRest: s.rest,
            isCompleted: false,
            note: s.note,
          }))
        : Array.from({ length: es.sets ?? 3 }, () => ({
            actualReps: es.targetReps,
            actualWeight: es.targetWeight,
            actualDurationSec: es.targetDurationSec,
            actualDistance: es.targetDistance,
            actualRest: es.rest,
            isCompleted: false,
          }));
      return {
        ...es,
        sets: setLogs.length,
        hasSuperset: false,
        setLogs,
      };
    }),
  } as Block;
}

export function blockToLog(block: BlockWithLogs, order: number): BlockLog {
  return {
    actualSets: block.targetSets,
    actualRest: (block as any).rest || 0,
    exerciseLogs: block.exercises.map((ex): ExerciseLog => {
      const setLogs: SetLog[] = ex.setLogs ?? [];
      return {
        name: ex.name,
        actualReps: ex.targetReps || 0,
        actualWeight: ex.targetWeight || 0,
        actualDurationSec: ex.targetDurationSec || 0,
        actualDistance: ex.targetDistance || 0,
        actualRest: ex.rest || 0,
        isCompleted: setLogs.length > 0
          ? setLogs.every((s) => s.isCompleted)
          : false,
        order: ex.order,
        setLogs,
      };
    }),
    order,
    isCompleted: false,
  };
}

export function getInitialActiveBlock(blocks: BlockWithLogs[]): number {
  if (blocks.length === 0) return 0;
  const idx = blocks.findIndex((block) =>
    block.exercises.some((ex) =>
      ((ex as ExerciseWithLogs).setLogs ?? []).some((s) => !s.isCompleted)
    )
  );
  return idx === -1 ? 0 : idx;
}
