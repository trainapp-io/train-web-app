import { describe, it, expect } from 'vitest';
import { snapshotToBlock, blockToLog, getInitialActiveBlock, BlockWithLogs, ExerciseWithLogs } from '../workoutLogHelpers';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

const baseMeasurement = { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND };

describe('snapshotToBlock', () => {
  it('initializes setLogs from setData when present', () => {
    const bs = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 2,
      exerciseSnapshot: [{
        name: 'Squat',
        order: 0,
        measurement: baseMeasurement,
        setData: [
          { reps: 8, weight: 135, rest: 60 },
          { reps: 6, weight: 145, rest: 90 },
        ],
      }],
    };
    const block = snapshotToBlock(bs);
    expect(block.exercises[0].setLogs).toHaveLength(2);
    expect(block.exercises[0].setLogs![0]).toMatchObject({
      actualReps: 8,
      actualWeight: 135,
      actualRest: 60,
      isCompleted: false,
    });
    expect(block.exercises[0].setLogs![1]).toMatchObject({
      actualReps: 6,
      actualWeight: 145,
      actualRest: 90,
      isCompleted: false,
    });
  });

  it('falls back to single-value fields when setData is absent', () => {
    const bs = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 3,
      exerciseSnapshot: [{
        name: 'Pushup',
        order: 0,
        measurement: baseMeasurement,
        sets: 3,
        targetReps: 10,
        targetWeight: 0,
        rest: 30,
      }],
    };
    const block = snapshotToBlock(bs);
    expect(block.exercises[0].setLogs).toHaveLength(3);
    expect(block.exercises[0].setLogs![0]).toMatchObject({
      actualReps: 10,
      actualWeight: 0,
      actualRest: 30,
      isCompleted: false,
    });
  });
});

describe('blockToLog', () => {
  it('builds setLogs from exercise setLogs', () => {
    const block = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 2,
      exercises: [{
        name: 'Squat',
        order: 0,
        measurement: baseMeasurement,
        targetReps: 8,
        targetWeight: 135,
        setLogs: [
          { actualReps: 8, actualWeight: 135, actualRest: 60, isCompleted: true },
          { actualReps: 6, actualWeight: 145, actualRest: 90, isCompleted: false },
        ],
      }],
    };
    const log = blockToLog(block as BlockWithLogs, 0);
    expect(log.exerciseLogs[0].setLogs).toHaveLength(2);
    expect(log.exerciseLogs[0].setLogs![0].isCompleted).toBe(true);
    expect(log.exerciseLogs[0].setLogs![1].isCompleted).toBe(false);
  });

  it('marks exercise as completed when all sets are completed', () => {
    const block = {
      type: BlockType.SINGLE,
      order: 0,
      targetSets: 2,
      exercises: [{
        name: 'Squat',
        order: 0,
        measurement: baseMeasurement,
        setLogs: [
          { actualReps: 8, actualWeight: 135, isCompleted: true },
          { actualReps: 8, actualWeight: 135, isCompleted: true },
        ],
      }],
    };
    const log = blockToLog(block as BlockWithLogs, 0);
    expect(log.exerciseLogs[0].isCompleted).toBe(true);
  });
});

function makeBlock(completedFlags: boolean[][]): BlockWithLogs {
  return {
    exercises: completedFlags.map((flags) => ({
      setLogs: flags.map((isCompleted) => ({ isCompleted })),
    })) as ExerciseWithLogs[],
  } as BlockWithLogs;
}

describe('getInitialActiveBlock', () => {
  it('returns 0 for empty blocks array', () => {
    expect(getInitialActiveBlock([])).toBe(0);
  });

  it('returns 0 when first block has incomplete sets', () => {
    const blocks = [makeBlock([[false, false]]), makeBlock([[false]])];
    expect(getInitialActiveBlock(blocks)).toBe(0);
  });

  it('returns 1 when first block is fully completed', () => {
    const blocks = [makeBlock([[true, true]]), makeBlock([[false]])];
    expect(getInitialActiveBlock(blocks)).toBe(1);
  });

  it('returns 0 when all blocks are completed (resume from start)', () => {
    const blocks = [makeBlock([[true]]), makeBlock([[true]])];
    expect(getInitialActiveBlock(blocks)).toBe(0);
  });
});
