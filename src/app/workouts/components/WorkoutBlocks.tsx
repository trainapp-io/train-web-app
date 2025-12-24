import { WorkoutRequest } from "@trainapp-io/train-core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import CircuitItem from "../../programs/components/workoutBuilder/CircuitItem";
import EmptyState from "../../programs/components/workoutBuilder/EmptyState";

interface WorkoutBlocksProps {
    workout: WorkoutRequest;
    editMode: boolean;
    isOwner: boolean;
    onAddCircuit: () => void;
  }
  
  const WorkoutBlocks: React.FC<WorkoutBlocksProps> = ({
    workout,
    editMode,
    isOwner,
    onAddCircuit,
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
          {workout.blocks.map(block => (
            <CircuitItem
              key={block.order}
              block={block}
              editMode={editMode && isOwner}
              workout={workout}
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