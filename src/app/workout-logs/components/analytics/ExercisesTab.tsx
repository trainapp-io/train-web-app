import { useState, useMemo } from 'react';
import type { WorkoutAnalyticsResponse } from '@trainapp-io/train-core';

interface Props {
  analytics: WorkoutAnalyticsResponse;
  onSelectExercise: (name: string) => void;
}

export default function ExercisesTab({ analytics, onSelectExercise }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return analytics.exerciseStats;
    const q = search.toLowerCase();
    return analytics.exerciseStats.filter((e) => e.name.toLowerCase().includes(q));
  }, [analytics.exerciseStats, search]);

  return (
    <div className="wla-exercises">
      <input
        className="wla-search__input"
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="wla-exercise-list">
        {filtered.length === 0 ? (
          <div className="wla-empty">No exercises found</div>
        ) : (
          filtered.map((exercise) => (
            <div
              key={exercise.name}
              className="wla-exercise-row"
              onClick={() => onSelectExercise(exercise.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectExercise(exercise.name)}
            >
              <div className="wla-exercise-row__avatar">
                {exercise.name.charAt(0).toUpperCase()}
              </div>
              <div className="wla-exercise-row__info">
                <div className="wla-exercise-row__name">{exercise.name}</div>
                <div className="wla-exercise-row__meta">
                  {exercise.sessionCount} session{exercise.sessionCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="wla-exercise-row__right">
                <div className="wla-exercise-row__pr">
                  {exercise.allTimePRWeight > 0 ? `${exercise.allTimePRWeight} lbs` : '—'}
                </div>
                {exercise.isNewPR && (
                  <div className="wla-exercise-row__new-pr">NEW PR</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
