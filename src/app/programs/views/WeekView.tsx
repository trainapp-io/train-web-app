import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import './WeekView.css';
import { programService } from '../services/programService';
import { useProgramContext, programUtils } from '../contexts/ProgramContext';
import { tokenService } from '../../../services/tokenService';
import { IoTrashOutline, IoEllipsisVertical } from 'react-icons/io5';
import { WeekResponse } from '@trainapp-io/train-core';
import ConfirmDialog from '../components/ConfirmDialog';

// Types for our workout events
interface WorkoutEvent {
  id: string;
  title: string;
  day: string; // 'SUN', 'MON', etc.
  startTime: string; // '7AM', '10AM', etc.
  duration: number; // duration in hours
  completed: boolean;
  color?: string; // Add color property
}

// Type for selected time block
interface SelectedBlock {
  day: string;
  time: string;
}

const WeekView: React.FC = () => {
  const { programId, weekId } = useParams<{ programId: string; weekId: string }>();
  const navigate = useNavigate();

  const { 
    setWorkoutRequest, 
    clearCurrentWeek,
    setWeeksLoading,
    setWeeksError
  } = useProgramContext();
  
  // Days of the week
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // All 24 hours of the day
  const timeSlots = [
    '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
    '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'
  ];

  // State for workouts
  const [workouts, setWorkouts] = useState<WorkoutEvent[]>([]);
  
  // State for week data
  const [weekData, setWeekData] = useState<WeekResponse | null>(null);
  
  // State for selected blocks
  const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlock[]>([]);
  
  // State for selection mode
  // const [isSelectionMode] = useState<boolean>(false);
  
  // State for drag selection
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<SelectedBlock | null>(null);
  
  // State for creation popup
  const [showCreationPopup, setShowCreationPopup] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Confirm dialog states for workout deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string>('');
  const [deletingWorkoutName, setDeletingWorkoutName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // State for workout colors
  const [workoutColors, setWorkoutColors] = useState<Record<string, string>>({});
  const [showColorMenu, setShowColorMenu] = useState<string | null>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  const availableColors = [
    '#4a90e2', // Blue (default)
    '#e53935', // Red
    '#4caf50', // Green
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
    '#ff5722', // Deep Orange
    '#795548', // Brown
  ];

  useEffect(() => {
    return () => {
      clearCurrentWeek();
      setWeeksLoading(false);
      setWeeksError(null);
      // Clear local state
      setWorkouts([]);
      setSelectedBlocks([]);
      setShowCreationPopup(false);
    };
  }, []); 

  // Fetch workouts when component mounts
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (programId && weekId) {
        try {
          const workoutsData = await programService.getWeekWorkouts(programId, weekId);
          
          // Transform API response to WorkoutEvent format
          const transformedWorkouts = workoutsData.map(workout => {
            // Format date to day of week
            let dayOfWeek = 'MON';
            let timeOfDay = '9AM';
            let duration = 1; // Default duration in hours
            
            if (workout.startDate) {
              // Convert string date to Date object if needed
              const startDate = typeof workout.startDate === 'string' 
                ? new Date(workout.startDate) 
                : workout.startDate;
              
              console.log(`Raw workout.startDate: ${workout.startDate}`);
              console.log(`Parsed startDate: ${startDate}`);
              console.log(`startDate.getDay(): ${startDate.getDay()}`);
              console.log(`startDate.getHours(): ${startDate.getHours()}`);
              
              // Get day of week as three-letter abbreviation
              const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
              dayOfWeek = days[startDate.getDay()];
              
              // Format time as AM/PM
              const hours = startDate.getHours();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const hour = hours % 12 || 12; // Convert 0 to 12
              timeOfDay = `${hour}${ampm}`;
              
              // Calculate duration from startDate and endDate
              if (workout.endDate) {
                const endDate = typeof workout.endDate === 'string' 
                  ? new Date(workout.endDate) 
                  : workout.endDate;
                
                console.log(`Raw workout.endDate: ${workout.endDate}`);
                console.log(`Parsed endDate: ${endDate}`);
                console.log(`endDate.getHours(): ${endDate.getHours()}`);
                
                // Calculate duration in hours
                const durationMs = endDate.getTime() - startDate.getTime();
                const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Convert to hours and round up
                duration = Math.max(1, durationHours); // Minimum 1 hour
                
                console.log(`Calculated duration: ${duration} hours`);
              } else {
                // Fallback to workout.duration if endDate is not available
                duration = workout.duration || 1;
              }
            }
            
            return {
              id: workout.id || '',
              title: workout.name,
              day: dayOfWeek,
              startTime: timeOfDay,
              duration: duration,
              completed: false,
              color: workoutColors[workout.id || ''] || '#4a90e2'
            };
          });
          
          console.log('Transformed workouts:', transformedWorkouts);
          setWorkouts(transformedWorkouts);
        } catch (error) {
          console.error('Error fetching workouts:', error);
        }
      }
    };
    
    fetchWorkouts();
  }, [programId, weekId]);

  // Fetch week details
  useEffect(() => {
    const fetchWeekDetails = async () => {
      if (programId && weekId) {
        try {
          const weekDetails = await programService.getWeek(programId, weekId);
          // Handle if response is an array
          const weekData = Array.isArray(weekDetails) ? weekDetails[0] : weekDetails;
          setWeekData(weekData);
        } catch (error) {
          console.error('Error fetching week details:', error);
        }
      }
    };
    
    fetchWeekDetails();
  }, [programId, weekId]);

  // // Function to get the row span for a workout based on its duration
  // const getWorkoutRowSpan = (duration: number) => {
  //   return Math.ceil(duration);
  // };

  // Function to check if a workout exists at a specific day and time
  const getWorkoutAtDayAndTime = (day: string, time: string) => {
    const foundWorkout = workouts.find(workout => {
      const matches = workout.day === day && workout.startTime === time;
      if (matches) {
        console.log(`Found workout: ${workout.title} at ${day} ${time}`);
      }
      return matches;
    });
    
    return foundWorkout;
  };

  // Function to check if a cell should be rendered or is part of a rowspan
  // const shouldRenderCell = (day: string, time: string) => {
  //   const workoutsForDay = workouts.filter(w => w.day === day);
    
  //   for (const workout of workoutsForDay) {
  //     if (workout.startTime === time) {
  //       return true; // This is the start of a workout
  //     }
      
  //     // Check if this time slot is covered by a workout that started earlier
  //     const timeIndex = timeSlots.indexOf(time);
  //     const workoutStartIndex = timeSlots.indexOf(workout.startTime);
  //     const workoutEndIndex = workoutStartIndex + getWorkoutRowSpan(workout.duration);
      
  //     if (timeIndex > workoutStartIndex && timeIndex < workoutEndIndex) {
  //       return false; // This cell is part of a rowspan
  //     }
  //   }
    
  //   return true; // No workout here, render an empty cell
  // };

  // Check if a block is selected
  const isBlockSelected = (day: string, time: string) => {
    return selectedBlocks.some(block => block.day === day && block.time === time);
  };

  // Handle cell click for selection
  const handleCellClick = (day: string, time: string) => {
    // Check if there's already a workout at this time
    if (getWorkoutAtDayAndTime(day, time)) return;
    
    // Single click opens popup immediately
    setSelectedBlocks([{ day, time }]);
    openCreationPopup();
  };

  // Handle mouse down to start drag selection
  const handleMouseDown = (day: string, time: string) => {
    if (getWorkoutAtDayAndTime(day, time)) return;
    
    setIsDragging(true);
    setDragStart({ day, time });
    setSelectedBlocks([{ day, time }]);
  };

  // Handle mouse enter during drag
  const handleMouseEnter = (day: string, time: string) => {
    if (!isDragging || !dragStart) return;
    if (getWorkoutAtDayAndTime(day, time)) return;
    
    // Calculate all blocks between drag start and current position
    const startDayIndex = days.indexOf(dragStart.day);
    const endDayIndex = days.indexOf(day);
    const startTimeIndex = timeSlots.indexOf(dragStart.time);
    const endTimeIndex = timeSlots.indexOf(time);
    
    const minDay = Math.min(startDayIndex, endDayIndex);
    const maxDay = Math.max(startDayIndex, endDayIndex);
    const minTime = Math.min(startTimeIndex, endTimeIndex);
    const maxTime = Math.max(startTimeIndex, endTimeIndex);
    
    const newSelection: SelectedBlock[] = [];
    for (let d = minDay; d <= maxDay; d++) {
      for (let t = minTime; t <= maxTime; t++) {
        if (!getWorkoutAtDayAndTime(days[d], timeSlots[t])) {
          newSelection.push({ day: days[d], time: timeSlots[t] });
        }
      }
    }
    
    setSelectedBlocks(newSelection);
  };

  // Handle mouse up to end drag selection
  const handleMouseUp = () => {
    if (isDragging && selectedBlocks.length > 0) {
      setIsDragging(false);
      setDragStart(null);
      openCreationPopup();
    }
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, selectedBlocks]);

  // Handle click on a workout
  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/programs/${programId}/weeks/${weekId}/workouts/${workoutId}`);
  };

  // Handle delete workout - open confirmation dialog
  const handleDeleteWorkout = (workoutId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the workout click
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      setDeletingWorkoutId(workoutId);
      setDeletingWorkoutName(workout.title);
      setShowDeleteConfirm(true);
    }
  };

  // Confirm delete workout
  const confirmDeleteWorkout = async () => {
    if (!deletingWorkoutId) return;

    try {
      setIsDeleting(true);
      await programService.deleteWorkout(programId!, weekId!, deletingWorkoutId);
      
      // Remove the workout from local state
      setWorkouts(prevWorkouts => 
        prevWorkouts.filter(workout => workout.id !== deletingWorkoutId)
      );

      // Close dialog
      setShowDeleteConfirm(false);
      setDeletingWorkoutId('');
      setDeletingWorkoutName('');
    } catch (error) {
      console.error('Error deleting workout:', error);
      setWeeksError('Failed to delete workout. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete workout
  const cancelDeleteWorkout = () => {
    setShowDeleteConfirm(false);
    setDeletingWorkoutId('');
    setDeletingWorkoutName('');
  };

  // Handle log workout click
  // const handleLogWorkout = (workoutId: string, event: React.MouseEvent) => {
  //   event.stopPropagation(); // Prevent triggering the parent onClick
  //   navigate(`/programs/${programId}/weeks/${weekId}/workouts/${workoutId}?mode=log`);
  // };

  // Function to go back to program view
  const handleBackClick = () => {
    clearCurrentWeek();
    navigate(`/programs/${programId}`);
  };

  // Toggle selection mode
  // const toggleSelectionMode = () => {
  //   setIsSelectionMode(!isSelectionMode);
  //   if (isSelectionMode) {
  //     // Clear selections when exiting selection mode
  //     setSelectedBlocks([]);
  //   }
  // };

  const openCreationPopup = () => {
    if (selectedBlocks.length > 0) {
      // Calculate default times from selected blocks
      const sortedBlocks = [...selectedBlocks].sort((a, b) => {
        if (a.day !== b.day) return days.indexOf(a.day) - days.indexOf(b.day);
        return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
      });
      
      const firstBlock = sortedBlocks[0];
      const lastBlock = sortedBlocks[sortedBlocks.length - 1];
      
      // Convert time format from "12AM" to "00:00"
      const convertTo24Hour = (timeStr: string) => {
        const match = timeStr.match(/(\d+)(AM|PM)/i);
        if (!match) return '09:00';
        
        let hour = parseInt(match[1], 10);
        const isPM = match[2].toUpperCase() === 'PM';
        
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        
        return `${hour.toString().padStart(2, '0')}:00`;
      };
      
      setStartTime(convertTo24Hour(firstBlock.time || '9AM'));
      
      // Calculate end time (1 hour after last block)
      const lastBlockTime = convertTo24Hour(lastBlock.time || '10AM');
      const [lastHour] = lastBlockTime.split(':').map(Number);
      const endHour = (lastHour + 1) % 24;
      setEndTime(`${endHour.toString().padStart(2, '0')}:00`);
      
      setShowCreationPopup(true);
    }
  };

  const closeCreationPopup = () => {
    setShowCreationPopup(false);
    setSelectedBlocks([]);
  };

  // Handle option selection from popup
  const handleOptionSelect = async (type: 'workout' | 'meal' | 'note') => {
    if (selectedBlocks.length === 0) return;
    
    if (type === 'workout') {
      const user = JSON.parse(tokenService.getUser() || '{}');
      
      // Calculate duration in minutes
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      console.log("Start time: ", startTime);
      console.log("Selected blocks: ", selectedBlocks);

      // Get the selected day (use the first selected block's day)
      const selectedDay = selectedBlocks[0]?.day;
      if (!selectedDay) return;

      const defaultRequest = programUtils.createDefaultWorkoutRequest(user.userId, durationMinutes);
      defaultRequest.startDate = createDateWithDayAndTime(selectedDay, startTime);
      defaultRequest.endDate = createDateWithDayAndTime(selectedDay, endTime);

      console.log('Default request: ', defaultRequest);
      console.log('Start date: ', defaultRequest.startDate);
      console.log('End date: ', defaultRequest.endDate);
      setWorkoutRequest(defaultRequest);
     

      // Navigate to workout builder with duration
      closeCreationPopup();
      navigate(`/programs/${programId}/weeks/${weekId}/workouts/new?duration=${durationMinutes}`);
    } else if (type === 'meal') {
      alert('Meal creation coming soon!');
      closeCreationPopup();
    } else {
      alert('Note creation coming soon!');
      closeCreationPopup();
    }
  };

  // Create proper dates with the selected day and time
  const createDateWithDayAndTime = (day: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Get the day index (0 = Sunday, 1 = Monday, etc.)
    const dayIndex = days.indexOf(day);
    
    // Create a date for the current week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the date for the selected day in the current week
    const daysUntilSelectedDay = (dayIndex - currentDay + 7) % 7;
    const selectedDate = new Date(today);
    selectedDate.setDate(today.getDate() + daysUntilSelectedDay);
    
    // Set the time
    selectedDate.setHours(hours, minutes, 0, 0);
    
    return selectedDate;
  };

  // Toggle between week view and agenda view
  const [viewMode, setViewMode] = useState<'week' | 'agenda'>(() => {
    // Default to agenda view on mobile devices
    return window.innerWidth <= 768 ? 'agenda' : 'week';
  });

  // Handle color change
  const handleColorChange = (workoutId: string, color: string) => {
    setWorkoutColors(prev => ({ ...prev, [workoutId]: color }));
    setWorkouts(prevWorkouts =>
      prevWorkouts.map(w => w.id === workoutId ? { ...w, color } : w)
    );
    setShowColorMenu(null);
  };

  // Toggle color menu
  const toggleColorMenu = (workoutId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowColorMenu(showColorMenu === workoutId ? null : workoutId);
  };

  // Close color menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setShowColorMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="week-view">
      <div className="week-view-header">
        <button className="back-button" onClick={handleBackClick}>
          &larr; Back to Program
        </button>
        <h1>{weekData?.name || 'Week Schedule'}</h1>
        <div className="view-toggle">
          <button 
            className={viewMode === 'week' ? 'active' : ''} 
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={viewMode === 'agenda' ? 'active' : ''} 
            onClick={() => setViewMode('agenda')}
          >
            Agenda
          </button>
        </div>
      </div>
      
      {viewMode === 'week' ? (
        <div className="calendar-container">
          <div className="calendar-grid">
            <div className="time-column-grid">
              <div className="time-header">Time</div>
              {timeSlots.map(time => (
                <div key={time} className="time-slot-grid">{time}</div>
              ))}
            </div>
            <div className="days-grid">
              <div className="day-headers">
                {days.map(day => (
                  <div key={day} className="day-header">{day}</div>
                ))}
              </div>
              <div className="calendar-cells">
                {days.map(day => (
                  <div key={day} className="day-column">
                    {timeSlots.map(time => (
                      <div
                        key={`${day}-${time}`}
                        className={`calendar-cell ${isBlockSelected(day, time) ? 'selected' : ''}`}
                        onClick={() => handleCellClick(day, time)}
                        onMouseDown={() => handleMouseDown(day, time)}
                        onMouseEnter={() => handleMouseEnter(day, time)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="workouts-overlay">
                {workouts.map(workout => {
                  const dayIndex = days.indexOf(workout.day);
                  const timeIndex = timeSlots.indexOf(workout.startTime);
                  const cellHeight = 60; // Height of each hour cell
                  const headerHeight = 48; // Height of day headers
                  
                  return (
                    <div
                      key={workout.id}
                      className="workout-overlay"
                      style={{
                        backgroundColor: workout.color,
                        left: `${(dayIndex * 100) / 7}%`,
                        top: `${headerHeight + (timeIndex * cellHeight)}px`,
                        width: `calc(${100 / 7}% - 16px)`,
                        height: `calc(${workout.duration * cellHeight}px - 8px)`,
                        margin: '4px 8px',
                      }}
                      onClick={() => handleWorkoutClick(workout.id)}
                    >
                      <div className="workout-overlay-content">
                        <div className="workout-overlay-header">
                          <div className="workout-overlay-image" />
                          <div className="workout-overlay-info">
                            <div className="workout-overlay-title">{workout.title}</div>
                            <div className="workout-overlay-time">{workout.startTime}</div>
                          </div>
                        </div>
                        
                        <button
                          className="workout-menu-btn"
                          onClick={(e) => toggleColorMenu(workout.id, e)}
                          aria-label="Workout options"
                        >
                          <IoEllipsisVertical />
                        </button>
                        
                        {showColorMenu === workout.id && (
                          <div className="color-menu" ref={colorMenuRef}>
                            <div className="color-menu-title">Choose Color</div>
                            <div className="color-options">
                              {availableColors.map(color => (
                                <button
                                  key={color}
                                  className={`color-option ${workout.color === color ? 'selected' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleColorChange(workout.id, color);
                                  }}
                                  aria-label={`Select color ${color}`}
                                />
                              ))}
                            </div>
                            <button
                              className="delete-workout-btn"
                              onClick={(e) => handleDeleteWorkout(workout.id, e)}
                              disabled={isDeleting}
                            >
                              <IoTrashOutline />
                              {isDeleting ? 'Deleting...' : 'Delete Workout'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="agenda-view">
          {days.map(day => {
            const dayWorkouts = workouts
              .filter(w => w.day === day)
              .sort((a, b) => {
                // Sort by start time
                const timeA = a.startTime || '00:00';
                const timeB = b.startTime || '00:00';
                return timeA.localeCompare(timeB);
              });
            
            if (dayWorkouts.length === 0) return null;
            
            return (
              <div key={day} className="agenda-day-section">
                <h2 className="agenda-day-title">{day}</h2>
                <div className="agenda-workout-grid">
                  {dayWorkouts.map(workout => (
                    <div 
                      key={workout.id} 
                      className={`agenda-workout-card ${workout.completed ? 'completed' : ''}`}
                      onClick={() => handleWorkoutClick(workout.id)}
                    >
                      <div className="workout-color-dot" style={{ backgroundColor: workout.color }} />
                      <div className="workout-actions">
                        <button
                          className="workout-menu-btn-agenda"
                          onClick={(e) => toggleColorMenu(workout.id, e)}
                          aria-label="Workout options"
                        >
                          <IoEllipsisVertical />
                        </button>
                        {showColorMenu === workout.id && (
                          <div className="color-menu" ref={colorMenuRef}>
                            <div className="color-menu-title">Choose Color</div>
                            <div className="color-options">
                              {availableColors.map(color => (
                                <button
                                  key={color}
                                  className={`color-option ${workout.color === color ? 'selected' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleColorChange(workout.id, color);
                                  }}
                                  aria-label={`Select color ${color}`}
                                />
                              ))}
                            </div>
                            <button
                              className="delete-workout-btn"
                              onClick={(e) => handleDeleteWorkout(workout.id, e)}
                              disabled={isDeleting}
                            >
                              <IoTrashOutline />
                              {isDeleting ? 'Deleting...' : 'Delete Workout'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="workout-image-placeholder"></div>
                      <div className="workout-time">{workout.startTime}</div>
                      <div className="workout-title">{workout.title}</div>
                      <div className="workout-duration">{workout.duration} hour{workout.duration !== 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Creation Popup */}
      {showCreationPopup && (
        <div className="modal-overlay" onClick={closeCreationPopup}>
          <div className="creation-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Item</h2>
            
            <div className="time-inputs">
              <div className="time-input-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="time-input"
                />
              </div>
              <div className="time-input-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="time-input"
                />
              </div>
            </div>

            <div className="option-buttons">
              <button onClick={() => handleOptionSelect('workout')}>Workout</button>
              <button onClick={() => handleOptionSelect('meal')}>Meal</button>
              <button onClick={() => handleOptionSelect('note')}>Note</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Workout?"
        message={`Are you sure you want to delete "${deletingWorkoutName}"? This action cannot be undone and will remove all exercises and data associated with this workout.`}
        confirmText="Delete Workout"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteWorkout}
        onCancel={cancelDeleteWorkout}
      />
    </div>
  );
};

export default WeekView;
