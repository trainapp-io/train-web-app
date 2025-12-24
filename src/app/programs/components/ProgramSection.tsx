import React from 'react';
import { ProgramCard } from './ProgramCard';
import { ProgramResponse } from '@trainapp-io/train-core';

// Renamed to ProgramSectionItem to avoid conflicts
// interface ProgramSectionItem {
//   id: string;
//   title: string;
//   description: string;
//   numWeeks: number; // Changed from weeks: number to match Programs.tsx
//   includesNutrition: boolean;
// }

interface ProgramSectionProps {
  title: string;
  programs: ProgramResponse[]; 
  showAddButton?: boolean;
  onAddProgram?: () => void;
  onDeleteProgram?: (programId: string) => void;
  onEditProgram?: (programId: string) => void;
}

export const ProgramSection: React.FC<ProgramSectionProps> = ({ 
  title, 
  programs, 
  showAddButton = false, 
  onAddProgram,
  onDeleteProgram,
  onEditProgram
}) => {
  return (
    <div className="program-section">
      <div className="programs-header">
        <h2>{title}</h2>
      </div>
      <div className="programs-container">
        {programs.map(program => (
          <ProgramCard 
            key={program.id} 
            program={program} 
            onDelete={onDeleteProgram}
            onEdit={onEditProgram}
          />
        ))}
        {showAddButton && (
          <div className="add-program-card" onClick={onAddProgram}>
            <div className="add-program-circle">
              <span>+</span>
            </div>
            <p>Add New Program</p>
          </div>
        )}
        {programs.length === 0 && !showAddButton && (
          <p className="no-programs-message">No programs available.</p>
        )}
      </div>
    </div>
  );
};
