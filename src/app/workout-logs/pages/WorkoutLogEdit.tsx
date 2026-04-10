import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { WorkoutLogRequest } from '@trainapp-io/train-core';
import { useWorkoutLog, useUpdateWorkoutLog } from '../../../services/apiHooks';
import { useWorkoutLogContext } from '../contexts/WorkoutLogContext';
import WorkoutLogForm from '../components/WorkoutLogForm/WorkoutLogForm';
import Button from '../../../components/ui/Button';
import './WorkoutLogPages.css';

const WorkoutLogEdit: React.FC = () => {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();
  const { data: workoutLog, isLoading, error } = useWorkoutLog(logId!);
  const updateWorkoutLogMutation = useUpdateWorkoutLog();
  const { setWorkoutSnapshot, setVersionId } = useWorkoutLogContext();

  useEffect(() => {
    if (workoutLog) {
      setWorkoutSnapshot(workoutLog.workoutSnapshot);
      setVersionId(workoutLog.versionId);
    }
  }, [workoutLog, setWorkoutSnapshot, setVersionId]);

  const handleSubmit = async (workoutLogRequest: WorkoutLogRequest) => {
    try {
      await updateWorkoutLogMutation.mutateAsync({ 
        params: logId!, 
        data: workoutLogRequest 
      });
      navigate(`/workout-logs/${logId}`);
    } catch (err) {
      console.error('Error updating workout log:', err);
    }
  };

  const handleCancel = () => {
    navigate(`/workout-logs/${logId}`);
  };

  if (isLoading) {
    return (
      <div className="workout-log-page">
        <div className="loading-container">
          <p>Loading workout log...</p>
        </div>
      </div>
    );
  }

  if (error || !workoutLog) {
    return (
      <div className="workout-log-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>Failed to load workout log</p>
          <Button variant="secondary" onClick={() => navigate('/workout-logs/history')}>
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const initialData: WorkoutLogRequest = {
    userId: workoutLog.userId,
    workoutId: workoutLog.workoutId,
    versionId: workoutLog.versionId,
    workoutSnapshot: workoutLog.workoutSnapshot,
    blockLogs: workoutLog.blockLogs,
    actualDuration: workoutLog.actualDuration,
    actualStartDate: new Date(workoutLog.actualStartDate),
    actualEndDate: new Date(workoutLog.actualEndDate),
    isCompleted: workoutLog.isCompleted,
  };

  return (
    <WorkoutLogForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSaving={updateWorkoutLogMutation.isPending}
    />
  );
};

export default WorkoutLogEdit;
