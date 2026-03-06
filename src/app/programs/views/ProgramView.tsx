import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import './ProgramView.css';
import { programService } from '../services/programService';
import { LuShare2, LuTrash2, LuEllipsisVertical, LuPencil } from 'react-icons/lu';
import { useProgramContext, programUtils } from '../contexts/ProgramContext';
import { ProgramResponse, WeekRequest, WeekResponse } from '@trainapp-io/train-core';
import EditWeekDialog from '../components/EditWeekDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const ProgramView: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const location = useLocation();
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [openMenuWeekId, setOpenMenuWeekId] = useState<string | null>(null);
  const [showEditWeekDialog, setShowEditWeekDialog] = useState(false);
  const [editingWeekIndex, setEditingWeekIndex] = useState<number>(-1);
  const [editingWeekId, setEditingWeekId] = useState<string>('');
  const [weekData, setWeekData] = useState<WeekRequest | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Confirm dialog states for program deletion
  const [showDeleteProgramConfirm, setShowDeleteProgramConfirm] = useState(false);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  
  // Confirm dialog states for week deletion
  const [showDeleteWeekConfirm, setShowDeleteWeekConfirm] = useState(false);
  const [deletingWeekId, setDeletingWeekId] = useState<string>('');
  const [deletingWeekIndex, setDeletingWeekIndex] = useState<number>(-1);
  const [deletingWeekName, setDeletingWeekName] = useState<string>('');
  const [isDeletingWeek, setIsDeletingWeek] = useState(false);
  
  const navigate = useNavigate();
  
  const { 
    state, 
    setProgramsLoading, 
    setProgramsError,
    clearCurrentProgram, 
    clearCurrentWeek,  
    setCurrentProgram,
    setWeeks,
    updateWeek,
    deleteWeek,
  } = useProgramContext();

  useEffect(() => {
    return () => {
      clearCurrentProgram();
      clearCurrentWeek();
      setWeeks([]); 
      setProgramsLoading(false);
      setProgramsError(null);
    };
  }, []);

  // Close dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the menu and menu button
      if (!target.closest('.week-card-actions')) {
        setOpenMenuWeekId(null);
      }
    };

    if (openMenuWeekId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuWeekId]); 

  useEffect(() => {
    const fetchProgram = async () => {
      const programFromState = location.state?.program as ProgramResponse;
      if (programFromState) {
        setCurrentProgram(programFromState);
        setProgramsLoading(false);
      } else if (programId) {
        // Fetch program from API when not available in state
        try {
          const fetchedProgram = await programService.getProgramById(programId);
          setCurrentProgram(fetchedProgram);
          setProgramsLoading(false);
        } catch (error) {
          console.error('Error fetching program:', error);
          setProgramsLoading(false);
        }
      }
    };
    
    fetchProgram();
  }, [location.state, programId]);
  
  useEffect(() => {
    if (state.currentProgram && Array.isArray(state.currentProgram.weeks)) {
     
      const weekRequests = programUtils.weekResponseArrayToRequestArray(
        state.currentProgram.weeks as WeekResponse[]
      );
      setWeeks(weekRequests);
    }
   
  }, [state.currentProgram]);

  // Function to handle week card click
  const handleWeekClick = (weekId: string) => {
    console.log('DEBUG - Week clicked with ID:', weekId);
    navigate(`/programs/${programId}/weeks/${weekId}`);
  };

  const handleDeleteWeek = (weekId: string, weekIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the week card click
    const week = state.weeks[weekIndex];
    if (week) {
      setDeletingWeekId(weekId);
      setDeletingWeekIndex(weekIndex);
      setDeletingWeekName(week.name || `Week ${week.weekNumber}`);
      setShowDeleteWeekConfirm(true);
    }
  };

  const confirmDeleteWeek = async () => {
    if (!deletingWeekId || deletingWeekIndex === -1) return;

    try {
      setIsDeletingWeek(true);
      // Use context's deleteWeek which handles both API call and state update
      await deleteWeek(programId!, deletingWeekId, deletingWeekIndex);
      
      // Close dialog
      setShowDeleteWeekConfirm(false);
      setDeletingWeekId('');
      setDeletingWeekIndex(-1);
      setDeletingWeekName('');
    } catch (error) {
      console.error('Error deleting week:', error);
      setProgramsError('Failed to delete week. Please try again.');
    } finally {
      setIsDeletingWeek(false);
    }
  };

  const cancelDeleteWeek = () => {
    setShowDeleteWeekConfirm(false);
    setDeletingWeekId('');
    setDeletingWeekIndex(-1);
    setDeletingWeekName('');
  };

  // Function to handle edit week
  const handleEditWeek = (weekIndex: number, weekId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the week card click
    const weekRequest = state.weeks[weekIndex];
    if (weekRequest) {
      setEditingWeekIndex(weekIndex);
      setEditingWeekId(weekId);
      setWeekData({ ...weekRequest }); // Create a copy
      
      // Get the original week response to check for imageUrl
      const weekResponse = state.currentProgram?.weeks?.[weekIndex] as WeekResponse;
      setImageUrl(weekResponse?.imageUrl || '');
      
      setShowEditWeekDialog(true);
    }
  };

  const handleSaveWeek = async (updatedWeekData: WeekRequest) => {
    if (!programId || !editingWeekId || editingWeekIndex === -1) return;

    try {
      // TODO: Handle image upload separately if needed
      await updateWeek(programId, editingWeekId, editingWeekIndex, updatedWeekData);
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating week:', error);
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditWeekDialog(false);
    setImageUrl('');
    setEditingWeekIndex(-1);
    setEditingWeekId('');
    setWeekData(null);
  };

  // Function to handle share
  const handleShare = async () => {
    const programUrl = `${window.location.origin}/programs/${programId}`;
    
    try {
      await navigator.clipboard.writeText(programUrl);
      setShareSuccess(true);
      
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  // Function to handle back to programs
  const handleBackToPrograms = () => {
    clearCurrentProgram();
    navigate('/programs');
  };

  // Function to handle delete program
  const handleDelete = () => {
    if (!programId || !state.currentProgram) {
      console.error('Program ID is required');
      return;
    }
    setShowDeleteProgramConfirm(true);
  };

  const confirmDeleteProgram = async () => {
    if (!programId) return;

    try {
      setIsDeletingProgram(true);
      await programService.deleteProgram(programId);
      
      // Navigate back to programs list
      navigate('/programs');
    } catch (error) {
      console.error('Error deleting program:', error);
      setProgramsError('Failed to delete program. Please try again.');
    } finally {
      setIsDeletingProgram(false);
      setShowDeleteProgramConfirm(false);
    }
  };

  const cancelDeleteProgram = () => {
    setShowDeleteProgramConfirm(false);
  };

  if (state.programsLoading) {
    return <div className="loading-container">Loading program details...</div>;
  }

  if (!state.currentProgram) {
    return <div className="error-container">Program not found</div>;
  }

  console.log('DEBUG - Week cards for rendering:', state.weeks);

  return (
    <div className="program-view">
      <button className="back-button" onClick={handleBackToPrograms}>
        &larr; Back to Programs
      </button>
      <div className="program-header">
        <div className="program-header-top">
          <h1>{state.currentProgram.name || state.currentProgram.name}</h1>
          <div className="program-header-actions">
            <button 
              className={`share-button ${shareSuccess ? 'share-success' : ''}`}
              onClick={handleShare}
              aria-label="Share program"
            >
              <LuShare2 /> {shareSuccess ? 'Copied!' : 'Share'}
            </button>
            <button 
              className="program-delete-button"
              onClick={handleDelete}
              aria-label="Delete program"
            >
              <LuTrash2 /> Delete
            </button>
          </div>
        </div>
        <div className="program-meta">
          <span className="program-duration">
            {state.currentProgram.numWeeks || state.weeks.length} weeks
          </span>
          {(state.currentProgram.hasNutritionProgram) && (
            <span className="program-nutrition">Includes nutrition plan</span>
          )}
          {state.currentProgram.types && state.currentProgram.types.length > 0 && (
            <span className="program-types">
              Types: {state.currentProgram.types.join(', ')}
            </span>
          )}
        </div>
        <p className="program-description">{state.currentProgram.description}</p>
      </div>
      
      {state.weeks.length > 0 && state.currentProgram.weeks ? (
        <div className="program-weeks">
          <h2>Program Schedule</h2>
          <div className="weeks-grid">
            {state.weeks
              .map((weekReq, index) => {
                const weekResp = state.currentProgram?.weeks?.[index] as WeekResponse | undefined;
                return {
                  ...weekReq,
                  id: weekResp?.id || `week-${index}`,
                  index
                };
              })
              .sort((a, b) => a.weekNumber - b.weekNumber)
              .map(week => (
                <div 
                  key={week.id} 
                  className={`week-card ${openMenuWeekId === week.id ? 'menu-open' : ''}`}
                  onClick={() => handleWeekClick(week.id)}
                >
                  <div className="week-image-placeholder"></div>
                  <div className="week-content">
                    <div className="week-card-header">
                      <h3>{week.name || `Week ${week.weekNumber}`}</h3>
                      <div className="week-card-actions">
                        <button 
                          className="menu-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuWeekId(openMenuWeekId === week.id ? null : week.id);
                          }}
                          aria-label="Open menu"
                        >
                          <LuEllipsisVertical />
                        </button>
                        {openMenuWeekId === week.id && (
                          <div className="week-menu-dropdown">
                            <button
                              className="menu-item"
                              onClick={(e) => handleEditWeek(week.index, week.id, e)}
                            >
                              <LuPencil /> Edit
                            </button>
                            <button
                              className="menu-item delete"
                              onClick={(e) => handleDeleteWeek(week.id, week.index, e)}
                              disabled={isDeletingWeek}
                            >
                              <LuTrash2 /> {isDeletingWeek ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="week-description">
                      {week.description || 'Build strength and endurance'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="no-weeks">
          <p>No detailed schedule available for this program yet.</p>
        </div>
      )}

      <EditWeekDialog
        isOpen={showEditWeekDialog}
        weekData={weekData}
        imageUrl={imageUrl}
        isSaving={state.weeksSaving}
        onClose={handleCloseEditDialog}
        onSave={handleSaveWeek}
      />

      <ConfirmDialog
        isOpen={showDeleteProgramConfirm}
        title="Delete Program?"
        message={`Are you sure you want to delete "${state.currentProgram?.name}"? This action cannot be undone and will remove all weeks, workouts, and data associated with this program.`}
        confirmText="Delete Program"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingProgram}
        onConfirm={confirmDeleteProgram}
        onCancel={cancelDeleteProgram}
      />

      <ConfirmDialog
        isOpen={showDeleteWeekConfirm}
        title="Delete Week?"
        message={`Are you sure you want to delete "${deletingWeekName}"? This action cannot be undone and will remove all workouts, meals, and notes associated with this week.`}
        confirmText="Delete Week"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeletingWeek}
        onConfirm={confirmDeleteWeek}
        onCancel={cancelDeleteWeek}
      />
    </div>
  );
};

export default ProgramView;
