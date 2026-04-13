import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { WorkoutLogResponse, WorkoutAnalyticsResponse } from '@trainapp-io/train-core';

interface Props {
  logs: WorkoutLogResponse[];
  analytics: WorkoutAnalyticsResponse;
}

const PAGE_SIZE = 20;

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getExerciseCount(log: WorkoutLogResponse): number {
  if (log.blockLogs?.length) {
    return log.blockLogs.reduce((sum, b) => sum + (b.exerciseLogs?.length ?? 0), 0);
  }
  return log.exerciseLogs?.length ?? 0;
}

function getLogVolume(log: WorkoutLogResponse): number {
  let vol = 0;
  const processSets = (exerciseLogs: typeof log.exerciseLogs) => {
    for (const ex of exerciseLogs ?? []) {
      for (const s of (ex as any).setLogs ?? []) {
        if (s.isCompleted) vol += (s.actualWeight ?? 0) * (s.actualReps ?? 0);
      }
    }
  };
  if (log.blockLogs?.length) {
    for (const block of log.blockLogs) processSets(block.exerciseLogs);
  } else {
    processSets(log.exerciseLogs);
  }
  return vol;
}

export default function HistoryTab({ logs, analytics }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const newPRExercises = new Set(
    analytics.personalRecords.filter((pr) => pr.isNewPR).map((pr) => pr.exerciseName)
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) => l.workoutSnapshot.name.toLowerCase().includes(q));
  }, [logs, search]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > visible.length;

  const grouped = useMemo(() => {
    const groups: Record<string, WorkoutLogResponse[]> = {};
    for (const log of visible) {
      const key = new Date(log.actualStartDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    }
    return groups;
  }, [visible]);

  const hasPR = (log: WorkoutLogResponse): boolean => {
    const names = new Set<string>();
    if (log.blockLogs?.length) {
      for (const b of log.blockLogs) {
        for (const e of b.exerciseLogs ?? []) names.add(e.name);
      }
    } else {
      for (const e of log.exerciseLogs ?? []) names.add(e.name);
    }
    return [...names].some((n) => newPRExercises.has(n));
  };

  return (
    <div className="wla-history">
      <input
        className="wla-search__input"
        placeholder="Search workouts..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {filtered.length === 0 ? (
        <div className="wla-empty">No workouts found</div>
      ) : (
        <>
          {Object.entries(grouped).map(([month, monthLogs]) => (
            <div key={month} className="wla-history-group">
              <div className="wla-history-group__label">{month}</div>
              {monthLogs.map((log) => {
                const volume = getLogVolume(log);
                const exerciseCount = getExerciseCount(log);
                return (
                  <div
                    key={log.id}
                    className="wla-history-card"
                    onClick={() => navigate(`/workout-logs/${log.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/workout-logs/${log.id}`)}
                  >
                    <div className="wla-history-card__header">
                      <span className="wla-history-card__name">
                        {log.workoutSnapshot.name}
                      </span>
                      {hasPR(log) && (
                        <span className="wla-history-card__pr">PR</span>
                      )}
                    </div>
                    <div className="wla-history-card__meta">
                      {formatDate(log.actualStartDate)} · {formatTime(log.actualStartDate)}
                    </div>
                    <div className="wla-history-card__stats">
                      <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
                      {volume > 0 && <span>{volume.toLocaleString()} lbs</span>}
                      <span
                        className={`wla-status-badge wla-status-badge--${
                          log.isCompleted ? 'done' : 'partial'
                        }`}
                      >
                        {log.isCompleted ? 'Done' : 'Partial'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {hasMore && (
            <button className="wla-load-more" onClick={() => setPage((p) => p + 1)}>
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
