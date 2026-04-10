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

const MEASUREMENT_TYPES = [MeasurementType.REPS, MeasurementType.TIME, MeasurementType.DISTANCE];
const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  [MeasurementType.REPS]: 'reps',
  [MeasurementType.TIME]: 'sec',
  [MeasurementType.DISTANCE]: 'dist',
  [MeasurementType.BODYWEIGHT]: 'bw',
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
}) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: exercise.order });
  const style = { transform: CSS.Transform.toString(transform) };

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; setIndex: number; value: string }>({
    open: false, setIndex: 0, value: '',
  });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  if (!updateExerciseInBlockPartial || !removeExerciseFromBlock) return null;

  const measurementType = exercise.measurement?.measurementType || MeasurementType.REPS;
  const weightUnit = (exercise as any).weightUnit === Unit.KILOGRAM ? 'kg' : 'lbs';
  const restUnit: 'seconds' | 'minutes' = exercise.restUnit || 'seconds';
  const avatar = getAvatarStyle(exercise.name || 'X');
  const initial = (exercise.name || '?').charAt(0).toUpperCase();
  const hasWeight = measurementType === MeasurementType.REPS || measurementType === MeasurementType.DISTANCE;

  const update = (updates: Partial<Exercise>) =>
    updateExerciseInBlockPartial(blockIndex, exerciseIndex, updates);

  const cycleMeasurement = () => {
    const next = MEASUREMENT_TYPES[(MEASUREMENT_TYPES.indexOf(measurementType) + 1) % MEASUREMENT_TYPES.length];
    update({ measurement: { ...exercise.measurement, measurementType: next } });
  };

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

  // ── Log mode ──────────────────────────────────────────────────────────────
  if (logMode) {
    const setLogs = getSetLogs(exercise);
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

    const markAll = () => {
      update({ setLogs: setLogs.map((s) => ({ ...s, isCompleted: true })) } as any);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`ex-card-v2 ex-card-v2--log${isActive === false ? ' ex-card-v2--inactive' : ''}`}
        onClick={isActive === false ? onSelect : undefined}
      >
        <div className="ex-card-v2__header">
          <div className="ex-card-v2__avatar" style={{ background: avatar.bg, color: avatar.color }}>
            {initial}
          </div>
          <span className="ex-card-v2__name-static">{exercise.name || 'Untitled'}</span>
          <span className="ex-toggle-chip" style={{ cursor: 'default' }}>{weightUnit}</span>
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
                        value={sl.actualWeight ?? ''}
                        onChange={(e) => {
                          const next = setLogs.map((s, idx) =>
                            idx === i ? { ...s, actualWeight: parseFloat(e.target.value) || 0 } : s
                          );
                          update({ setLogs: next } as any);
                        }}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      className="ex-set-input"
                      type="number" min={0}
                      value={
                        measurementType === MeasurementType.TIME ? (sl.actualDurationSec ?? '')
                        : measurementType === MeasurementType.DISTANCE ? (sl.actualDistance ?? '')
                        : (sl.actualReps ?? '')
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const field =
                          measurementType === MeasurementType.TIME ? 'actualDurationSec'
                          : measurementType === MeasurementType.DISTANCE ? 'actualDistance'
                          : 'actualReps';
                        const next = setLogs.map((s, idx) =>
                          idx === i ? { ...s, [field]: val } : s
                        );
                        update({ setLogs: next } as any);
                      }}
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
          <button className="ex-mark-all" onClick={markAll} type="button">
            Mark All
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
          <button className="ex-toggle-chip" onClick={cycleMeasurement} type="button">
            {MEASUREMENT_LABELS[measurementType]} <span style={{ fontSize: 9 }}>⟳</span>
          </button>
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
              <th>{MEASUREMENT_LABELS[measurementType].toUpperCase()}</th>
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
                      value={set.weight ?? ''}
                      onChange={(e) => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                      aria-label={`Set ${i + 1} weight`}
                    />
                  </td>
                )}

                <td>
                  <input className="ex-set-input" type="number" min={0}
                    value={
                      measurementType === MeasurementType.TIME ? (set.durationSec ?? '')
                      : measurementType === MeasurementType.DISTANCE ? (set.distance ?? '')
                      : (set.reps ?? '')
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const field =
                        measurementType === MeasurementType.TIME ? 'durationSec'
                        : measurementType === MeasurementType.DISTANCE ? 'distance'
                        : 'reps';
                      updateSet(i, field as keyof SetTarget, val);
                    }}
                    aria-label={`Set ${i + 1} ${MEASUREMENT_LABELS[measurementType]}`}
                  />
                </td>

                <td>
                  <div className="ex-rest-cell">
                    <input className="ex-set-input" type="number" min={0}
                      style={{ width: 44 }}
                      value={displayRest(set.rest)}
                      onChange={(e) => updateSet(i, 'rest', parseRest(e.target.value))}
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
