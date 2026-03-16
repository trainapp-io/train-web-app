import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuGripVertical, LuX, LuRefreshCw } from 'react-icons/lu';
import { Exercise, MeasurementType, Unit } from '@trainapp-io/train-core';

interface Props {
  exercise: Exercise;
  editMode: boolean;
  blockIndex: number;
  exerciseIndex: number;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
}

const AVATAR_COLORS = [
  { bg: '#ede9fe', color: '#6d28d9' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#dcfce7', color: '#15803d' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#e0f2fe', color: '#075985' },
  { bg: '#fee2e2', color: '#991b1b' },
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'Reps',
  [MeasurementType.TIME]: 'Time (s)',
  [MeasurementType.DISTANCE]: 'Dist',
};

const ExerciseItem: React.FC<Props> = ({
  exercise,
  editMode,
  blockIndex,
  exerciseIndex,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.order });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  if (!updateExerciseInBlockPartial || !removeExerciseFromBlock) return null;

  const measurementType = exercise.measurement?.measurementType || MeasurementType.REPS;
  const weightUnit = (exercise as any).weightUnit === Unit.KILOGRAM ? 'kg' : 'lbs';
  const sets = (exercise as any).sets || 1;

  const update = (updates: Partial<Exercise>) =>
    updateExerciseInBlockPartial(blockIndex, exerciseIndex, updates);

  const cycleMeasurement = () => {
    const types = [MeasurementType.REPS, MeasurementType.TIME, MeasurementType.DISTANCE];
    const next = types[(types.indexOf(measurementType) + 1) % types.length];
    update({ measurement: { ...exercise.measurement, measurementType: next } });
  };

  const cycleWeight = () => {
    const next = (exercise as any).weightUnit === Unit.KILOGRAM ? Unit.POUND : Unit.KILOGRAM;
    update({ weightUnit: next } as any);
  };

  const handleNameChange = (value: string) => {
    update({ name: value });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (!value || value.length < 2) return setSuggestions([]);
      const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      if (!apiKey) return;
      try {
        const res = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/name/${value}?limit=8`,
          { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' } }
        );
        if (res.ok) {
          setSuggestions(await res.json());
          setShowSuggestions(true);
        }
      } catch { setSuggestions([]); }
    }, 300);
  };

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  // Build view-mode summary string
  const metricLabel = MEASUREMENT_LABELS[measurementType];
  const metricValue = exercise.targetReps || 0;
  const weightValue = exercise.targetWeight || 0;
  const restValue = exercise.rest || 0;
  const avatar = getAvatarStyle(exercise.name || 'X');
  const initial = (exercise.name || '?').charAt(0).toUpperCase();

  const summaryParts: string[] = [];
  if (metricValue) summaryParts.push(`${metricValue} ${metricLabel.toLowerCase()}`);
  if (weightValue) summaryParts.push(`${weightValue} ${weightUnit}`);
  if (restValue) summaryParts.push(`${restValue}s rest`);

  // ── View mode ────────────────────────────────────────────────────────────────

  if (!editMode) {
    return (
      <div ref={setNodeRef} style={style} className="ex-row" {...attributes}>
        <div className="ex-row__avatar" style={{ background: avatar.bg, color: avatar.color }}>
          {initial}
        </div>
        <div className="ex-row__info">
          <span className="ex-row__name">{exercise.name || 'Untitled'}</span>
          {summaryParts.length > 0 && (
            <span className="ex-row__meta">
              {sets} × {summaryParts.join(' · ')}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────

  return (
    <div ref={setNodeRef} style={style} className="ex-card" {...attributes}>
      {/* Name row */}
      <div className="ex-card__top">
        <span className="ex-card__drag" {...listeners} aria-label="Drag to reorder">
          <LuGripVertical />
        </span>
        <div className="ex-card__name-wrap">
          <input
            className="ex-card__name-input"
            type="text"
            value={exercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Exercise name…"
            aria-label="Exercise name"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="ex-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="ex-suggestion"
                  onMouseDown={() => { update({ name: s.name }); setShowSuggestions(false); }}
                >
                  <span className="ex-suggestion__name">{s.name}</span>
                  <span className="ex-suggestion__tag">{s.target}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="ex-card__remove" onClick={() => removeExerciseFromBlock(blockIndex, exerciseIndex)} aria-label="Remove exercise">
          <LuX />
        </button>
      </div>

      {/* Metrics row */}
      <div className="ex-card__metrics">
        <div className="ex-metric">
          <span className="ex-metric__label">Sets</span>
          <input
            className="ex-metric__input"
            type="number"
            min={1}
            value={sets}
            onChange={(e) => update({ sets: parseInt(e.target.value) || 1 } as any)}
            aria-label="Number of sets"
          />
        </div>
        <div className="ex-metric">
          <button className="ex-metric__label ex-metric__label--btn" onClick={cycleMeasurement} title="Click to change">
            {MEASUREMENT_LABELS[measurementType]} <LuRefreshCw size={10} />
          </button>
          <input
            className="ex-metric__input"
            type="number"
            min={0}
            value={metricValue || ''}
            onChange={(e) => update({ targetReps: parseInt(e.target.value) || 0 })}
            placeholder="0"
            aria-label={MEASUREMENT_LABELS[measurementType]}
          />
        </div>
        <div className="ex-metric">
          <button className="ex-metric__label ex-metric__label--btn" onClick={cycleWeight} title="Click to change unit">
            {weightUnit} <LuRefreshCw size={10} />
          </button>
          <input
            className="ex-metric__input"
            type="number"
            min={0}
            value={weightValue || ''}
            onChange={(e) => update({ targetWeight: parseInt(e.target.value) || 0 })}
            placeholder="0"
            aria-label="Target weight"
          />
        </div>
        <div className="ex-metric">
          <span className="ex-metric__label">Rest (s)</span>
          <input
            className="ex-metric__input"
            type="number"
            min={0}
            value={restValue || ''}
            onChange={(e) => update({ rest: parseInt(e.target.value) || 0 })}
            placeholder="0"
            aria-label="Rest seconds"
          />
        </div>
      </div>
    </div>
  );
};

export default ExerciseItem;
