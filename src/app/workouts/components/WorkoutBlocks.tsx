import { WorkoutRequest, Block } from "@trainapp-io/train-core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import CircuitItem from "../../programs/components/workoutBuilder/CircuitItem";
import EmptyState from "../../programs/components/workoutBuilder/EmptyState";

interface WorkoutBlocksProps {
    workout: WorkoutRequest;
    editMode: boolean;
    isOwner: boolean;
    onAddCircuit: () => void;
    onUpdateBlock: (blockIndex: number, updated: Block) => void;
    onRemoveBlock: (blockIndex: number) => void;
    onSetHasUnsavedChanges: (hasChanges: boolean) => void;
    updateExerciseInBlockPartial?: (blockIndex: number, exerciseIndex: number, updates: Partial<any>) => void;
    removeExerciseFromBlock?: (blockIndex: number, exerciseIndex: number) => void;
  }
  
  const WorkoutBlocks: React.FC<WorkoutBlocksProps> = ({
    workout,
    editMode,
    isOwner,
    onAddCircuit,
    onUpdateBlock,
    onRemoveBlock,
    onSetHasUnsavedChanges,
    updateExerciseInBlockPartial,
    removeExerciseFromBlock,
  }) => {
    if (!workout.blocks?.length) {
      if (!editMode) {
        return <EmptyState onStart={() => {}} isOwner={isOwner} />;
      }
      // In edit mode with no blocks, show the add button
      return (
        <>
          {editMode && isOwner && (
            <button className="add-circuit-btn" onClick={onAddCircuit}>
              + Add Circuit
            </button>
          )}
        </>
      );
    }
  
    return (
      <>
        <SortableContext
          items={workout.blocks.map(b => b.order)}
          strategy={verticalListSortingStrategy}
        >
          {workout.blocks.map((block, index) => (
            <CircuitItem
              key={block.order}
              block={block}
              editMode={editMode && isOwner}
              workout={workout}
              onUpdateBlock={(updated) => onUpdateBlock(index, updated)}
              onRemoveBlock={() => onRemoveBlock(index)}
              onSetHasUnsavedChanges={onSetHasUnsavedChanges}
              updateExerciseInBlockPartial={updateExerciseInBlockPartial}
              removeExerciseFromBlock={removeExerciseFromBlock}
            />
          ))}
        </SortableContext>
  
        {editMode && isOwner && (
          <button className="add-circuit-btn" onClick={onAddCircuit}>
            + Add Circuit
          </button>
        )}
      </>
    );
  };
  
  export default WorkoutBlocks;