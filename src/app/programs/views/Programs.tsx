import { ProgramSection } from '../components/ProgramSection';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import "./Programs.css"
import { programService } from '../services/programService';
import { tokenService } from '../../../services/tokenService';
import { ProgramResponse, ProgramRequest } from '@trainapp-io/train-core';
import { useProgramContext } from '../contexts/ProgramContext';
import EditProgramDialog from '../components/EditProgramDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const Programs: React.FC = () => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string>('');
  const [programData, setProgramData] = useState<ProgramRequest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string>('');
  const [deletingProgramName, setDeletingProgramName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    state, 
    setProgramsLoading, 
    setProgramsError, 
    setPrograms,
    clearCurrentProgram,
    clearCurrentWeek,
    clearCurrentWorkout
  } = useProgramContext();
  
  useEffect(() => {
    return () => {
      clearCurrentProgram();
      clearCurrentWeek();
      clearCurrentWorkout();
      setProgramsLoading(false);
      setProgramsError(null);
    };
  }, []); 
  
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setProgramsLoading(true);
        
        // Get user ID from token service
        const userString = tokenService.getUser();
        if (!userString) {
          throw new Error("User not logged in");
        }
        
        const userData = JSON.parse(userString);
        
        // Fetch programs with pagination
        const programsData = await programService.fetchUserPrograms(userData.userId);
        
        // Map programs to add default description if missing
        const mappedPrograms = programsData.map((program: ProgramResponse) => ({
          ...program,
          description: program.description || 
            `A ${program.numWeeks}-week program${program.hasNutritionProgram ? ' with nutrition guidance' : ''}.`
        }));
        
        setPrograms(mappedPrograms);
      } catch (err) {
        console.error("Error fetching programs:", err);
        setProgramsError("Failed to load programs. Please try again.");
      } finally {
        setProgramsLoading(false);
      }
    };
    
    fetchPrograms();
  }, []);
  
  const handleAddProgram = () => {
    // Navigate to the program builder
    navigate('/programs/builder');
  };

  const handleDeleteProgram = (programId: string) => {
    const program = state.programs.find(p => p.id === programId);
    if (program) {
      setDeletingProgramId(programId);
      setDeletingProgramName(program.name);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!deletingProgramId) return;

    try {
      setIsDeleting(true);
      await programService.deleteProgram(deletingProgramId);
      
      // Remove from state
      setPrograms(state.programs.filter(program => program.id !== deletingProgramId));
      
      // Close dialog
      setShowDeleteConfirm(false);
      setDeletingProgramId('');
      setDeletingProgramName('');
    } catch (error) {
      console.error('Error deleting program:', error);
      setProgramsError('Failed to delete program. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteProgram = () => {
    setShowDeleteConfirm(false);
    setDeletingProgramId('');
    setDeletingProgramName('');
  };

  const handleEditProgram = (programId: string) => {
    const program = state.programs.find(p => p.id === programId);
    if (program) {
      // Convert ProgramResponse to ProgramRequest
      const programRequest: ProgramRequest = {
        name: program.name,
        description: program.description,
        types: program.types,
        numWeeks: program.numWeeks,
        hasNutritionProgram: program.hasNutritionProgram,
        phases: program.phases,
        accessType: program.accessType,
        admins: program.admins,
        createdBy: program.createdBy,
        members: program.members,
      };
      
      setEditingProgramId(programId);
      setProgramData(programRequest);
      setShowEditDialog(true);
    }
  };

  const handleSaveProgram = async (updatedProgramData: ProgramRequest) => {
    if (!editingProgramId) return;

    try {
      setIsSaving(true);
      await programService.updateProgram(editingProgramId, updatedProgramData);
      
      // Update the program in state
      const updatedPrograms = state.programs.map(program =>
        program.id === editingProgramId
          ? { ...program, ...updatedProgramData }
          : program
      );
      setPrograms(updatedPrograms);
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating program:', error);
      setProgramsError('Failed to update program. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingProgramId('');
    setProgramData(null);
  };

  if (state.programsLoading) {
    return <div className="loading-container">Loading programs...</div>;
  }

  if (state.programsError) {
    return <div className="error-container">{state.programsError}</div>;
  }

  return (
    <div className="programs-page">
      <ProgramSection 
        title="All Programs" 
        programs={state.programs}
        showAddButton={true}
        onAddProgram={handleAddProgram}
        onDeleteProgram={handleDeleteProgram}
        onEditProgram={handleEditProgram}
      />

      <EditProgramDialog
        isOpen={showEditDialog}
        programData={programData}
        isSaving={isSaving}
        onClose={handleCloseEditDialog}
        onSave={handleSaveProgram}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Program?"
        message={`Are you sure you want to delete "${deletingProgramName}"? This action cannot be undone and will remove all weeks, workouts, and data associated with this program.`}
        confirmText="Delete Program"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteProgram}
        onCancel={cancelDeleteProgram}
      />
    </div>
  );
};

export default Programs;
