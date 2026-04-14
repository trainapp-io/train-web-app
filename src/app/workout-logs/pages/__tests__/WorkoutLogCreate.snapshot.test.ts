import { describe, it, expect } from 'vitest';
import { BlockType, MeasurementType, MeasurementUnit } from '@trainapp-io/train-core';

// Pure function extracted from WorkoutLogCreate — test it in isolation
function buildBlockSnapshot(workout: any) {
  const standaloneBlocks = workout.blocks ?? [];
  const sectionBlocks = (workout.sections ?? []).flatMap((s: any) => s.blocks);
  const allBlocks = [...standaloneBlocks, ...sectionBlocks].sort((a: any, b: any) => a.order - b.order);
  return allBlocks.map((block: any) => ({
    type: block.type,
    name: block.name,
    targetSets: block.targetSets,
    description: block.description,
    rest: block.rest,
    exerciseSnapshot: block.exercises.map((ex: any) => ({
      name: ex.name,
      rest: ex.rest,
      targetReps: ex.targetReps,
      targetDurationSec: ex.targetDurationSec,
      targetWeight: ex.targetWeight,
      targetDistance: ex.targetDistance,
      notes: ex.notes,
      order: ex.order,
      measurement: ex.measurement,
      setData: ex.setData,
      restUnit: ex.restUnit,
    })),
    order: block.order,
  }));
}

function buildSectionSnapshot(workout: any) {
  return (workout.sections ?? []).map((s: any) => ({
    name: s.name,
    order: s.order,
    blockOrders: s.blocks.map((b: any) => b.order),
  }));
}

const makeExercise = (order: number) => ({
  name: `Ex${order}`,
  rest: 0, targetReps: 10, targetDurationSec: 0, targetWeight: 0, targetDistance: 0,
  notes: '', order, sets: 3, hasSuperset: false,
  measurement: { measurementType: MeasurementType.REPS, measurementUnit: MeasurementUnit.POUND },
  setData: [],
});

describe('buildBlockSnapshot', () => {
  it('includes exercises from both standalone blocks and section blocks, sorted by order', () => {
    const workout = {
      blocks: [
        { type: BlockType.SINGLE, name: 'A', targetSets: 3, rest: 0, order: 0, exercises: [makeExercise(0)] },
        { type: BlockType.SINGLE, name: 'C', targetSets: 3, rest: 0, order: 2, exercises: [makeExercise(2)] },
      ],
      sections: [
        {
          name: 'Main',
          order: 1,
          blocks: [
            { type: BlockType.SINGLE, name: 'B', targetSets: 3, rest: 0, order: 1, exercises: [makeExercise(1)] },
          ],
        },
      ],
    };
    const snapshot = buildBlockSnapshot(workout);
    expect(snapshot).toHaveLength(3);
    expect(snapshot[0].name).toBe('A');
    expect(snapshot[1].name).toBe('B');
    expect(snapshot[2].name).toBe('C');
  });

  it('works with no sections (backward compat)', () => {
    const workout = {
      blocks: [
        { type: BlockType.SINGLE, name: 'A', targetSets: 3, rest: 0, order: 0, exercises: [makeExercise(0)] },
      ],
    };
    const snapshot = buildBlockSnapshot(workout);
    expect(snapshot).toHaveLength(1);
  });
});

describe('buildSectionSnapshot', () => {
  it('captures section name, order, and block orders', () => {
    const workout = {
      sections: [
        {
          name: 'W/U',
          order: 0,
          blocks: [
            { order: 0, type: BlockType.SINGLE, exercises: [], targetSets: 3, rest: 0 },
            { order: 1, type: BlockType.SINGLE, exercises: [], targetSets: 3, rest: 0 },
          ],
        },
      ],
    };
    const snap = buildSectionSnapshot(workout);
    expect(snap).toHaveLength(1);
    expect(snap[0]).toMatchObject({ name: 'W/U', order: 0, blockOrders: [0, 1] });
  });

  it('returns empty array when no sections', () => {
    expect(buildSectionSnapshot({ blocks: [] })).toEqual([]);
  });
});
