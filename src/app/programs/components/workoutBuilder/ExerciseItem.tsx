import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuGripVertical, LuX, LuRefreshCw, LuUpload } from 'react-icons/lu';
import { Exercise, MeasurementType, Unit } from '@trainapp-io/train-core';

interface Props {
  exercise: Exercise;
  editMode: boolean;
  logMode?: boolean;
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
  [MeasurementType.REPS]: 'reps',
  [MeasurementType.TIME]: 'sec',
  [MeasurementType.DISTANCE]: 'dist',
  [MeasurementType.BODYWEIGHT]: 'bw',
};

function isVideoUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.mov/i.test(url);
}

const ExerciseItem: React.FC<Props> = ({
  exercise,
  editMode,
  logMode = false,
  blockIndex,
  exerciseIndex,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.order });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  if (!updateExerciseInBlockPartial || !removeExerciseFromBlock) return null;

  const measurementType = exercise.measurement?.measurementType || MeasurementType.REPS;
  const weightUnit = (exercise as any).weightUnit === Unit.KILOGRAM ? 'kg' : 'lbs';
  const sets = (exercise as any).sets || 1;
  const mediaUrl: string | undefined = (exercise as any).mediaUrl;

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
        if (res.ok) { setSuggestions(await res.json()); setShowSuggestions(true); }
      } catch { setSuggestions([]); }
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) update({ mediaUrl: result } as any);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  // ── View mode ──────────────────────────────────────────────────────────────
  const avatar = getAvatarStyle(exercise.name || 'X');
  const initial = (exercise.name || '?').charAt(0).toUpperCase();
  const metricLabel = MEASUREMENT_LABELS[measurementType];
  const metricValue = exercise.targetReps || 0;
  const weightValue = exercise.targetWeight || 0;
  const restValue = exercise.rest || 0;
  const summaryParts: string[] = [];
  if (metricValue) summaryParts.push(`${metricValue} ${metricLabel}`);
  if (weightValue) summaryParts.push(`${weightValue} ${weightUnit}`);
  if (restValue) summaryParts.push(`${restValue}s rest`);

  if (!editMode) {
    return (
      <div ref={setNodeRef} style={style} className="ex-row" {...attributes}>
        {mediaUrl ? (
          <div className="ex-row__media-thumb">
            {isVideoUrl(mediaUrl)
              ? <div className="ex-row__media-thumb--video">▶</div>
              : <img src={mediaUrl} alt={exercise.name} className="ex-row__media-img" />}
          </div>
        ) : (
          <div className="ex-row__avatar" style={{ background: avatar.bg, color: avatar.color }}>
            {initial}
          </div>
        )}
        <div className="ex-row__info">
          <span className="ex-row__name">{exercise.name || 'Untitled'}</span>
          {summaryParts.length > 0 && (
            <span className="ex-row__meta">{sets} × {summaryParts.join(' · ')}</span>
          )}
        </div>
      </div>
    );
  }

  // ── Edit mode — single row ─────────────────────────────────────────────────
  return (
    <div ref={setNodeRef} style={style} className="ex-card" {...attributes}>

      {/* ── Single content row ── */}
      <div className="ex-card__row">

        {/* Drag handle */}
        <span className="ex-card__drag" {...listeners} aria-label="Drag to reorder">
          <LuGripVertical />
        </span>

        {/* Name */}
        <div className="ex-card__name-wrap">
          <input
            className="ex-card__name-input"
            type="text"
            value={exercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
            placeholder="Exercise…"
            aria-label="Exercise name"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="ex-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="ex-suggestion"
                  onPointerDown={(e) => { e.preventDefault(); update({ name: s.name, exerciseId: s.id } as any); setShowSuggestions(false); }}>
                  <span className="ex-suggestion__name">{s.name}</span>
                  <span className="ex-suggestion__tag">{s.target}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="ex-card__divider" aria-hidden="true" />

        {/* Metrics — all inline */}
        <div className="ex-card__metrics">

          <div className="ex-m">
            <input className="ex-m__input" type="number" min={1}
              value={sets}
              onChange={(e) => update({ sets: parseInt(e.target.value) || 1 } as any)}
              aria-label="Sets" />
            <span className="ex-m__label">sets</span>
          </div>

          <span className="ex-m__sep">×</span>

          <div className="ex-m">
            <input className="ex-m__input" type="number" min={0}
              value={metricValue || ''}
              onChange={(e) => update({ targetReps: parseInt(e.target.value) || 0 })}
              placeholder="0"
              aria-label={MEASUREMENT_LABELS[measurementType]} />
            <button className="ex-m__label ex-m__label--tap" onClick={cycleMeasurement} title="Change type">
              {MEASUREMENT_LABELS[measurementType]}<LuRefreshCw size={9} />
            </button>
          </div>

          <span className="ex-m__sep">·</span>

          <div className="ex-m">
            <input className="ex-m__input" type="number" min={0}
              value={weightValue || ''}
              onChange={(e) => update({ targetWeight: parseInt(e.target.value) || 0 })}
              placeholder="0"
              aria-label="Weight" />
            <button className="ex-m__label ex-m__label--tap" onClick={cycleWeight} title="Change unit">
              {weightUnit}<LuRefreshCw size={9} />
            </button>
          </div>

          <span className="ex-m__sep">·</span>

          <div className="ex-m">
            <input className="ex-m__input" type="number" min={0}
              value={restValue || ''}
              onChange={(e) => update({ rest: parseInt(e.target.value) || 0 })}
              placeholder="0"
              aria-label="Rest" />
            <span className="ex-m__label">s rest</span>
          </div>

        </div>

        {/* Media trigger */}
        {!logMode && !mediaUrl && (
          <div className="ex-card__media-trigger">
            <button className="ex-card__media-icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="Upload image" title="Upload image / GIF">
              <LuUpload size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,.gif"
              style={{ display: 'none' }} onChange={handleFileChange} aria-label="Upload exercise image" />
          </div>
        )}
        {!logMode && mediaUrl && (
          <button className="ex-card__media-icon-btn ex-card__media-icon-btn--active"
            onClick={() => update({ mediaUrl: undefined } as any)} aria-label="Remove media" title="Remove media">
            <LuX size={14} />
          </button>
        )}

        {/* Remove exercise */}
        {!logMode && (
          <button className="ex-card__remove"
            onClick={() => removeExerciseFromBlock(blockIndex, exerciseIndex)} aria-label="Remove exercise">
            <LuX size={15} />
          </button>
        )}

      </div>

      {/* ── Media preview (below the row, optional) ── */}
      {mediaUrl && (
        <div className="ex-card__media-preview">
          {isVideoUrl(mediaUrl) ? (
            <div className="ex-card__media-video-placeholder">
              ▶ <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="ex-card__media-link">{mediaUrl}</a>
            </div>
          ) : (
            <img src={mediaUrl} alt="Exercise media" className="ex-card__media-img" />
          )}
        </div>
      )}


    </div>
  );
};

export default ExerciseItem;
