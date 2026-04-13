import { useState } from 'react';
import { useWorkoutAnalytics, useWorkoutLogHistory } from '../../../services/apiHooks';
import OverviewTab from '../components/analytics/OverviewTab';
import HistoryTab from '../components/analytics/HistoryTab';
import ProgressTab from '../components/analytics/ProgressTab';
import ExercisesTab from '../components/analytics/ExercisesTab';
import '../components/analytics/WorkoutAnalytics.css';

type Tab = 'overview' | 'history' | 'progress' | 'exercises';
type Range = 'week' | 'month' | 'year';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' },
  { id: 'exercises', label: 'Exercises' },
];

export default function WorkoutAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [range, setRange] = useState<Range>('week');
  const [selectedExercise, setSelectedExercise] = useState('');

  const { data: analytics, isLoading: analyticsLoading } = useWorkoutAnalytics(range);
  const { data: logs } = useWorkoutLogHistory();

  const handleExerciseSelect = (name: string) => {
    setSelectedExercise(name);
    setActiveTab('progress');
  };

  return (
    <div className="wla-page">
      <div className="wla-header">
        <div className="wla-header__top">
          <h1 className="wla-header__title">My Progress</h1>
          <div className="wla-range-toggle">
            {(['week', 'month', 'year'] as Range[]).map((r) => (
              <button
                key={r}
                className={`wla-range-btn${range === r ? ' wla-range-btn--active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r === 'week' ? 'W' : r === 'month' ? 'M' : 'Y'}
              </button>
            ))}
          </div>
        </div>
        <div className="wla-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`wla-tab${activeTab === tab.id ? ' wla-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wla-body">
        {analyticsLoading && (
          <div className="wla-skeleton" aria-label="Loading analytics">
            <div className="wla-skeleton-card" />
            <div className="wla-skeleton-card" />
            <div className="wla-skeleton-card" />
          </div>
        )}

        {!analyticsLoading && analytics && analytics.totalWorkouts === 0 && (
          <div className="wla-empty-state">
            <div className="wla-empty-state__icon">🏋️</div>
            <h2 className="wla-empty-state__title">No workouts yet</h2>
            <p className="wla-empty-state__sub">
              Log your first workout to see your progress
            </p>
          </div>
        )}

        {!analyticsLoading && analytics && analytics.totalWorkouts > 0 && (
          <>
            {activeTab === 'overview' && <OverviewTab data={analytics} />}
            {activeTab === 'history' && (
              <HistoryTab logs={logs ?? []} analytics={analytics} />
            )}
            {activeTab === 'progress' && (
              <ProgressTab
                analytics={analytics}
                selectedExercise={selectedExercise}
                onSelectExercise={setSelectedExercise}
              />
            )}
            {activeTab === 'exercises' && (
              <ExercisesTab
                analytics={analytics}
                onSelectExercise={handleExerciseSelect}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
