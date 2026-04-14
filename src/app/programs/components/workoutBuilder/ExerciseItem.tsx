import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuGripVertical, LuX } from 'react-icons/lu';
import { Exercise, MeasurementType, Unit, SetTarget, SetLog } from '@trainapp-io/train-core';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import './ExerciseItem.css';

interface Props {
  exercise: Exercise;
  editMode: boolean;
  logMode?: boolean;
  blockIndex: number;
  exerciseIndex: number;
  updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => void;
  removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
  isActive?: boolean;
  onSelect?: () => void;
  onAddSuperset?: () => void;
  /** Called when a set is checked in log mode; passes the rest duration in seconds */
  onSetCompleted?: (restSeconds: number) => void;
  /** Column label for set number — "Rnd" inside circuits */
  setColumnLabel?: string;
  onGroupExercise?: () => void;
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

const MEASUREMENT_TYPES = [
  MeasurementType.REPS,
  MeasurementType.TIME,
  MeasurementType.DISTANCE,
  MeasurementType.BODYWEIGHT,
  MeasurementType.CALORIES,
  MeasurementType.PERCENTAGE,
];

const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'reps',
  [MeasurementType.TIME]: 'sec',
  [MeasurementType.DISTANCE]: 'dist',
  [MeasurementType.BODYWEIGHT]: 'bw',
  [MeasurementType.CALORIES]: 'cal',
  [MeasurementType.PERCENTAGE]: '%',
};

const MEASUREMENT_DISPLAY: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'Reps',
  [MeasurementType.TIME]: 'Time',
  [MeasurementType.DISTANCE]: 'Distance',
  [MeasurementType.BODYWEIGHT]: 'Bodyweight',
  [MeasurementType.CALORIES]: 'Calories',
  [MeasurementType.PERCENTAGE]: '% Effort',
};

/** Build initial setData from exercise, falling back to single-value fields */
function getSetData(exercise: Exercise): SetTarget[] {
  if (exercise.setData?.length) return exercise.setData;
  const count = exercise.sets || 3;
  return Array.from({ length: count }, () => ({
    reps: exercise.targetReps,
    weight: exercise.targetWeight,
    durationSec: exercise.targetDurationSec,
    distance: exercise.targetDistance,
    rest: exercise.rest,
  }));
}

/** Build initial setLogs from exercise, falling back to setData or single-value fields */
function getSetLogs(exercise: Exercise): SetLog[] {
  const logs = (exercise as any).setLogs as SetLog[] | undefined;
  if (logs?.length) return logs;
  return getSetData(exercise).map((s) => ({
    actualReps: s.reps,
    actualWeight: s.weight,
    actualDurationSec: s.durationSec,
    actualDistance: s.distance,
    actualRest: s.rest,
    isCompleted: false,
  }));
}

const ExerciseItem: React.FC<Props> = ({
  exercise,
  editMode,
  logMode = false,
  blockIndex,
  exerciseIndex,
  updateExerciseInBlockPartial,
  removeExerciseFromBlock,
  isActive,
  onSelect,
  onAddSuperset: _onAddSuperset,
  onSetCompleted,
  setColumnLabel = 'Set',
  onGroupExercise,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: exercise.order });
  const style = { transform: CSS.Transform.toString(transform) };

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; setIndex: number; value: string }>({
    open: false, setIndex: 0, value: '',
  });
  // Raw string values while user is mid-edit (key: `${rowIndex}-${field}`)
  const [rawValues, setRawValues] = useState<Record<string, string>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitializedSetData = useRef(false);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  // Populate setData from top-level fields on first edit-mode mount so it always persists on save
  useEffect(() => {
    if (!editMode || logMode) return;
    if (hasInitializedSetData.current || exercise.setData?.length) return;
    if (!updateExerciseInBlockPartial) return;
    hasInitializedSetData.current = true;
    const generated = getSetData(exercise);
    updateExerciseInBlockPartial(blockIndex, exerciseIndex, { setData: generated, sets: generated.length });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, logMode]);

  if (!updateExerciseInBlockPartial || !removeExerciseFromBlock) return null;

  const measurementType = exercise.measurement?.measurementType || MeasurementType.REPS;
  const weightUnit = (exercise as any).weightUnit === Unit.KILOGRAM ? 'kg' : 'lbs';
  const restUnit: 'seconds' | 'minutes' = exercise.restUnit || 'seconds';
  const avatar = getAvatarStyle(exercise.name || 'X');
  const initial = (exercise.name || '?').charAt(0).toUpperCase();
  const hasWeight = measurementType === MeasurementType.REPS;
  const [measureDropdownOpen, setMeasureDropdownOpen] = useState(false);

  const update = (updates: Partial<Exercise>) =>
    updateExerciseInBlockPartial(blockIndex, exerciseIndex, updates);

  const cycleWeight = () => {
    const next = (exercise as any).weightUnit === Unit.KILOGRAM ? Unit.POUND : Unit.KILOGRAM;
    update({ weightUnit: next } as any);
  };

  const toggleRestUnit = () => {
    update({ restUnit: restUnit === 'seconds' ? 'minutes' : 'seconds' });
  };

  const handleNameChange = (value: string) => {
    update({ name: value });
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (!value || value.length < 2) return;
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

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editMode) {
    const setData = getSetData(exercise);
    const summaryParts: string[] = [];
    const first = setData[0] || {};
    if (first.reps) summaryParts.push(`${first.reps} ${MEASUREMENT_LABELS[measurementType]}`);
    if (first.weight) summaryParts.push(`${first.weight} ${weightUnit}`);
    return (
      <div ref={setNodeRef} style={style} className="ex-row-v2" {...attributes}>
        <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{exercise.name || 'Untitled'}</div>
          {summaryParts.length > 0 && (
            <div className="ex-row-v2__meta">{setData.length} × {summaryParts.join(' · ')}</div>
          )}
        </div>
      </div>
    );
  }

  // While editing: show the raw string; on blur: commit parsed number
  const rawKey = (row: number, field: string) => `${row}-${field}`;
  const onRawChange = (row: number, field: string, val: string) =>
    setRawValues((prev) => ({ ...prev, [rawKey(row, field)]: val }));

  // ── Log mode ──────────────────────────────────────────────────────────────
  if (logMode) {
    const setLogs = getSetLogs(exercise);
    const allCompleted = setLogs.length > 0 && setLogs.every((s) => s.isCompleted);
    const someCompleted = setLogs.some((s) => s.isCompleted);
    const isCurrentlyActive = isActive === true;

    // Determine visual state
    const logState: 'active' | 'done' | 'inProgress' | 'upcoming' =
      isCurrentlyActive ? 'active'
      : allCompleted ? 'done'
      : someCompleted ? 'inProgress'
      : 'upcoming';

    // ── Completed row ──
    if (logState === 'done') {
      const weights = setLogs.map((s) => s.actualWeight).filter((w): w is number => w != null && w > 0);
      const weightStr = weights.length === 0 ? ''
        : weights.length === 1 || Math.min(...weights) === Math.max(...weights)
          ? `${weights[0]} lbs`
          : `${Math.min(...weights)}–${Math.max(...weights)} lbs`;
      const summary = [
        `${setLogs.length} ×`,
        weightStr,
      ].filter(Boolean).join(' ');

      return (
        <div ref={setNodeRef} style={style} className="ex-log-done" onClick={onSelect}>
          <div className="ex-log-done__check">✓</div>
          <span className="ex-log-done__name">{exercise.name || 'Untitled'}</span>
          <span className="ex-log-done__summary">{summary}</span>
        </div>
      );
    }

    // ── In-progress row ──
    if (logState === 'inProgress') {
      const completedCount = setLogs.filter((s) => s.isCompleted).length;
      return (
        <div ref={setNodeRef} style={style} className="ex-log-inprogress" onClick={onSelect}>
          <div className="ex-log-inprogress__badge">
            {completedCount}/{setLogs.length}
          </div>
          <span className="ex-log-inprogress__name">{exercise.name || 'Untitled'}</span>
          <span className="ex-log-inprogress__status">In progress · tap to resume</span>
        </div>
      );
    }

    // ── Upcoming row ──
    if (logState === 'upcoming') {
      const first = setLogs[0];
      const metricVal = measurementType === MeasurementType.TIME
        ? first?.actualDurationSec
        : measurementType === MeasurementType.DISTANCE
          ? first?.actualDistance
          : first?.actualReps;
      const metricLabel = MEASUREMENT_LABELS[measurementType];
      const weightStr = hasWeight && first?.actualWeight
        ? ` · ${first.actualWeight} ${weightUnit}`
        : '';
      const meta = `${setLogs.length} × ${metricVal ?? '?'} ${metricLabel}${weightStr}`;

      return (
        <div ref={setNodeRef} style={style} className="ex-log-upcoming" onClick={onSelect}>
          <div className="ex-log-upcoming__num">{exerciseIndex + 1}</div>
          <span className="ex-log-upcoming__name">{exercise.name || 'Untitled'}</span>
          <span className="ex-log-upcoming__meta">{meta}</span>
          <span className="ex-log-upcoming__jump">Jump to →</span>
        </div>
      );
    }

    // ── Active expanded card ──
    const activeIndex = setLogs.findIndex((s) => !s.isCompleted);

    const checkSet = (index: number) => {
      const wasCompleted = setLogs[index].isCompleted;
      const next = setLogs.map((s, i) =>
        i === index ? { ...s, isCompleted: !s.isCompleted } : s
      );
      update({ setLogs: next } as any);
      if (!wasCompleted && onSetCompleted) {
        onSetCompleted(setLogs[index].actualRest || 0);
      }
    };

    const addLogSet = () => {
      const last = setLogs[setLogs.length - 1] || {};
      update({ setLogs: [...setLogs, { ...last, isCompleted: false }] } as any);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="ex-card-v2 ex-card-v2--log"
      >
        <div className="ex-card-v2__header">
          <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
            {initial}
          </div>
          <span className="ex-card-v2__name-static">{exercise.name || 'Untitled'}</span>
          <span className="ex-active__progress" style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
            {setLogs.filter(s => s.isCompleted).length} / {setLogs.length} sets
          </span>
        </div>

        <div className="ex-set-table-wrap">
          <table className="ex-set-table">
            <thead>
              <tr>
                <th>{setColumnLabel}</th>
                {hasWeight && <th>{weightUnit.toUpperCase()}</th>}
                <th>{MEASUREMENT_LABELS[measurementType].toUpperCase()}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {setLogs.map((sl, i) => (
                <tr
                  key={i}
                  className={
                    sl.isCompleted ? 'ex-log-row--done'
                    : i === activeIndex ? 'ex-log-row--active'
                    : ''
                  }
                >
                  <td><span className="ex-set-num">{i + 1}</span></td>
                  {hasWeight && (
                    <td>
                      <input
                        className="ex-set-input"
                        type="number" min={0}
                        value={rawKey(i, 'weight') in rawValues ? rawValues[rawKey(i, 'weight')] : (sl.actualWeight ?? 0).toString()}
                        onChange={(e) => onRawChange(i, 'weight', e.target.value)}
                        onBlur={(e) => {
                          const parsed = parseFloat(e.target.value);
                          const next = setLogs.map((s, idx) =>
                            idx === i ? { ...s, actualWeight: isNaN(parsed) ? 0 : parsed } : s
                          );
                          update({ setLogs: next } as any);
                          setRawValues((prev) => { const n = { ...prev }; delete n[rawKey(i, 'weight')]; return n; });
                        }}
                        onFocus={(e) => e.target.select()}
                        aria-label={`Set ${i + 1} weight`}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      className="ex-set-input"
                      type="number" min={0}
                      value={
                        measurementType === MeasurementType.TIME
                          ? (rawKey(i, 'dur') in rawValues ? rawValues[rawKey(i, 'dur')] : (sl.actualDurationSec ?? 0).toString())
                          : measurementType === MeasurementType.DISTANCE
                            ? (rawKey(i, 'dist') in rawValues ? rawValues[rawKey(i, 'dist')] : (sl.actualDistance ?? 0).toString())
                            : (rawKey(i, 'reps') in rawValues ? rawValues[rawKey(i, 'reps')] : (sl.actualReps ?? 0).toString())
                      }
                      onChange={(e) => {
                        const field = measurementType === MeasurementType.TIME ? 'dur'
                          : measurementType === MeasurementType.DISTANCE ? 'dist' : 'reps';
                        onRawChange(i, field, e.target.value);
                      }}
                      onBlur={(e) => {
                        const parsed = parseFloat(e.target.value);
                        const field: keyof SetLog = measurementType === MeasurementType.TIME ? 'actualDurationSec'
                          : measurementType === MeasurementType.DISTANCE ? 'actualDistance' : 'actualReps';
                        const next = setLogs.map((s, idx) =>
                          idx === i ? { ...s, [field]: isNaN(parsed) ? 0 : parsed } : s
                        );
                        update({ setLogs: next } as any);
                        const rawField = measurementType === MeasurementType.TIME ? 'dur'
                          : measurementType === MeasurementType.DISTANCE ? 'dist' : 'reps';
                        setRawValues((prev) => { const n = { ...prev }; delete n[rawKey(i, rawField)]; return n; });
                      }}
                      onFocus={(e) => e.target.select()}
                      aria-label={`Set ${i + 1} ${MEASUREMENT_LABELS[measurementType]}`}
                    />
                  </td>
                  <td>
                    <button
                      className={`ex-check-btn${sl.isCompleted ? ' ex-check-btn--done' : ''}`}
                      onClick={(e) => { e.stopPropagation(); checkSet(i); }}
                      aria-label={sl.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      type="button"
                    >
                      ✓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ex-card-v2__footer">
          <button className="ex-add-set" onClick={addLogSet} type="button">
            + Add Set
          </button>
        </div>
      </div>
    );
  }

  // ── Edit (create) mode ────────────────────────────────────────────────────
  const setData = getSetData(exercise);

  const updateSet = (index: number, field: keyof SetTarget, value: number | string | undefined) => {
    const next = setData.map((s, i) => i === index ? { ...s, [field]: value } : s);
    update({ setData: next, sets: next.length });
  };

  const addSet = () => {
    const last = setData[setData.length - 1] || {};
    const next = [...setData, { ...last, note: undefined }];
    update({ setData: next, sets: next.length });
  };

  const removeSet = (index: number) => {
    if (setData.length <= 1) return;
    const next = setData.filter((_, i) => i !== index);
    update({ setData: next, sets: next.length });
  };

  const openNote = (index: number) => {
    setNoteDialog({ open: true, setIndex: index, value: setData[index]?.note || '' });
  };

  const saveNote = () => {
    updateSet(noteDialog.setIndex, 'note', noteDialog.value);
    setNoteDialog((d) => ({ ...d, open: false }));
  };

  const displayRest = (rest: number | undefined) => {
    if (!rest) return '';
    return restUnit === 'minutes' ? String(+(rest / 60).toFixed(1)) : String(rest);
  };

  const parseRest = (val: string) => {
    const n = parseFloat(val) || 0;
    return restUnit === 'minutes' ? Math.round(n * 60) : n;
  };

  const rawVal = (row: number, field: string, stored: number | undefined) =>
    rawKey(row, field) in rawValues ? rawValues[rawKey(row, field)] : (stored ?? 0).toString();
  const onRawBlur = (row: number, field: keyof SetTarget, val: string) => {
    const parsed = parseFloat(val);
    updateSet(row, field, isNaN(parsed) ? 0 : parsed);
    setRawValues((prev) => { const next = { ...prev }; delete next[rawKey(row, field)]; return next; });
  };

  return (
    <div ref={setNodeRef} style={style} className="ex-card-v2" {...attributes}>
      {/* Header */}
      <div className="ex-card-v2__header">
        <span className="ex-card-v2__drag" {...listeners} style={{ cursor: 'grab', color: '#d1d5db', display: 'flex', alignItems: 'center' }}>
          <LuGripVertical size={14} />
        </span>

        <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
          {initial}
        </div>

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <input
            className="ex-card-v2__name"
            type="text"
            value={exercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Exercise..."
            aria-label="Exercise name"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="ex-suggestions-v2">
              {suggestions.map((s, i) => (
                <button key={i} className="ex-suggestion-v2"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    update({ name: s.name, exerciseId: s.id } as any);
                    setShowSuggestions(false);
                  }}>
                  <span>{s.name}</span>
                  <span className="ex-suggestion-v2__tag">{s.target}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ex-card-v2__toggles">
          {hasWeight && (
            <button className="ex-toggle-chip" onClick={cycleWeight} type="button">
              {weightUnit} <span style={{ fontSize: 9 }}>⟳</span>
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button
              className="ex-toggle-chip"
              onClick={() => setMeasureDropdownOpen((o) => !o)}
              type="button"
              aria-label={`Measurement type: ${MEASUREMENT_DISPLAY[measurementType]}`}
            >
              {MEASUREMENT_LABELS[measurementType]} <span style={{ fontSize: 9 }}>▾</span>
            </button>
            {measureDropdownOpen && (
              <div
                className="ex-measure-dropdown"
                style={{
                  position: 'absolute', right: 0, top: '110%', zIndex: 100,
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 160, padding: '4px 0',
                }}
              >
                {MEASUREMENT_TYPES.map((mt) => (
                  <button
                    key={mt}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13,
                      fontWeight: mt === measurementType ? 700 : 400,
                      color: mt === measurementType ? '#6d28d9' : '#111827',
                    }}
                    onClick={() => {
                      update({ measurement: { ...exercise.measurement, measurementType: mt } });
                      setMeasureDropdownOpen(false);
                    }}
                    type="button"
                  >
                    {mt === measurementType && '✓ '}{MEASUREMENT_DISPLAY[mt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className="ex-card-v2__remove"
          onClick={() => removeExerciseFromBlock(blockIndex, exerciseIndex)}
          aria-label="Remove exercise"
          type="button"
        >
          <LuX size={14} />
        </button>
      </div>

      {/* Set table */}
      <div className="ex-set-table-wrap">
        <table className="ex-set-table">
          <thead>
            <tr>
              <th>{setColumnLabel}</th>
              {hasWeight && <th>{weightUnit.toUpperCase()}</th>}
              <th>
                {measurementType === MeasurementType.CALORIES ? 'CAL'
                  : measurementType === MeasurementType.PERCENTAGE ? '%'
                  : MEASUREMENT_LABELS[measurementType].toUpperCase()}
              </th>
              <th>REST</th>
              <th aria-label="Notes">📝</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {setData.map((set, i) => (
              <tr key={i}>
                <td><span className="ex-set-num">{i + 1}</span></td>

                {hasWeight && (
                  <td>
                    <input className="ex-set-input" type="number" min={0}
                      value={rawVal(i, 'weight', set.weight)}
                      onChange={(e) => onRawChange(i, 'weight', e.target.value)}
                      onBlur={(e) => onRawBlur(i, 'weight', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      aria-label={`Set ${i + 1} weight`}
                    />
                  </td>
                )}

                <td>
                  <input className="ex-set-input" type="number" min={0}
                    value={
                      measurementType === MeasurementType.TIME ? rawVal(i, 'durationSec', set.durationSec)
                      : measurementType === MeasurementType.DISTANCE ? rawVal(i, 'distance', set.distance)
                      : rawVal(i, 'reps', set.reps)
                    }
                    onChange={(e) => {
                      const field =
                        measurementType === MeasurementType.TIME ? 'durationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'distance'
                        : 'reps';
                      onRawChange(i, field, e.target.value);
                    }}
                    onBlur={(e) => {
                      const field =
                        measurementType === MeasurementType.TIME ? 'durationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'distance'
                        : 'reps';
                      onRawBlur(i, field as keyof SetTarget, e.target.value);
                    }}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Set ${i + 1} ${MEASUREMENT_LABELS[measurementType]}`}
                  />
                </td>

                <td>
                  <div className="ex-rest-cell">
                    <input className="ex-set-input" type="number" min={0}
                      style={{ width: 44 }}
                      value={rawKey(i, 'rest') in rawValues ? rawValues[rawKey(i, 'rest')] : displayRest(set.rest)}
                      onChange={(e) => onRawChange(i, 'rest', e.target.value)}
                      onBlur={(e) => {
                        updateSet(i, 'rest', parseRest(e.target.value));
                        setRawValues((prev) => { const next = { ...prev }; delete next[rawKey(i, 'rest')]; return next; });
                      }}
                      onFocus={(e) => e.target.select()}
                      aria-label={`Set ${i + 1} rest`}
                    />
                    <button className="ex-rest-unit" onClick={toggleRestUnit} type="button">
                      {restUnit === 'seconds' ? 's ⟳' : 'min ⟳'}
                    </button>
                  </div>
                </td>

                <td>
                  <button
                    className={`ex-note-btn${set.note ? ' ex-note-btn--active' : ''}`}
                    onClick={() => openNote(i)}
                    aria-label={`Note for set ${i + 1}`}
                    type="button"
                  >
                    📝
                  </button>
                </td>

                <td>
                  <button
                    className="ex-remove-set"
                    onClick={() => removeSet(i)}
                    aria-label={`Remove set ${i + 1}`}
                    type="button"
                  >
                    <LuX size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="ex-card-v2__footer">
        <button className="ex-add-set" onClick={addSet} type="button">
          + Add Set
        </button>
        {onGroupExercise && (
          <button
            className="ex-group-ex-btn"
            onClick={onGroupExercise}
            type="button"
            aria-label="Group Exercise"
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: '#6d28d9',
              background: 'none',
              border: '1px solid #ede9fe',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            + Group Exercise
          </button>
        )}
      </div>

      {/* Note dialog */}
      <Dialog open={noteDialog.open} onClose={() => setNoteDialog((d) => ({ ...d, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>Note for Set {noteDialog.setIndex + 1}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline rows={3} fullWidth variant="outlined"
            placeholder="Add a coaching note for this set..."
            value={noteDialog.value}
            onChange={(e) => setNoteDialog((d) => ({ ...d, value: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog((d) => ({ ...d, open: false }))}>Cancel</Button>
          <Button onClick={saveNote} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExerciseItem;
