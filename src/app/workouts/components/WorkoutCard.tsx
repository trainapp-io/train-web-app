import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { IoShareOutline, IoTrashOutline, IoEllipsisVertical } from 'react-icons/io5';
import { FaEdit, FaDumbbell } from 'react-icons/fa';
import { WorkoutResponse } from '@seenelm/train-core';

interface WorkoutCardProps {
  workout: WorkoutResponse;
  onDelete?: (workoutId: string) => void;
  onEdit?: (workoutId: string) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleWorkoutClick = () => {
    navigate(`/workouts/${workout.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (onEdit) {
      onEdit(workout.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const workoutUrl = `${window.location.origin}/workouts/${workout.id}`;
    
    try {
      await navigator.clipboard.writeText(workoutUrl);
      setShareSuccess(true);
      
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (onDelete) {
      onDelete(workout.id);
    }
  };

  // Calculate total exercises
  const totalExercises = workout.blocks?.reduce((total, block) => {
    return total + (block.exercises?.length || 0);
  }, 0) || 0;

  // Calculate estimated duration (rough estimate based on exercises)
  const estimatedDuration = Math.max(30, totalExercises * 5);

  return (
    <div className="workout-card" onClick={handleWorkoutClick}>
      <div className="workout-card-icon">
        <FaDumbbell />
      </div>
      <div className="workout-card-content">
        <div className="workout-card-header">
          <h3>{workout.name}</h3>
          <div className="workout-card-actions" ref={menuRef}>
            <button 
              className="menu-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Open menu"
            >
              <IoEllipsisVertical />
            </button>
            {isMenuOpen && (
              <div className="workout-menu-dropdown">
                <button
                  className="menu-item"
                  onClick={handleEdit}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="menu-item"
                  onClick={handleShare}
                >
                  <IoShareOutline /> {shareSuccess ? 'Copied!' : 'Share'}
                </button>
                <button
                  className="menu-item delete"
                  onClick={handleDelete}
                >
                  <IoTrashOutline /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {workout.description && (
          <p className="workout-card-description">{workout.description}</p>
        )}
        <div className="workout-card-meta">
          <span className="workout-exercises">
            {totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'}
          </span>
          <span className="workout-duration">~{estimatedDuration} min</span>
        </div>
      </div>
    </div>
  );
};
