import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { IoShareOutline, IoTrashOutline, IoEllipsisVertical } from 'react-icons/io5';
import { FaEdit } from 'react-icons/fa';
import { programService } from '../services/programService';
import { ProgramResponse } from '@trainapp-io/train-core';

// interface Program {
//   id: string;
//   title: string;
//   description: string;
//   weeks?: any; // Can be array or number
//   numWeeks?: number;
//   includesNutrition: boolean;
// }

interface ProgramCardProps {
  program: ProgramResponse;
  onDelete?: (programId: string) => void;
  onEdit?: (programId: string) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  const handleProgramClick = () => {
    console.log('Program being passed to navigation:', program);
    navigate(`/programs/${program.id}`, { state: { program } });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (onEdit) {
      onEdit(program.id);
    } else {
      // Fallback to navigation if no onEdit callback provided
      console.log('Edit program:', program.id);
      navigate(`/programs/builder/${program.id}`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const programUrl = `${window.location.origin}/programs/${program.id}`;
    
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!program.id) {
      console.error('Program ID is required');
      return;
    }

    setIsDeleting(true);
    
    try {
      await programService.deleteProgram(program.id);
      
      if (onDelete) {
        onDelete(program.id);
      }
    } catch (error) {
      console.error('Error deleting program:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine the program length
  const programLength = program.numWeeks || 
                       (Array.isArray(program.weeks) ? program.weeks.length : 
                       (typeof program.weeks === 'number' ? program.weeks : 0));

  return (
    <div className="program-card" onClick={handleProgramClick}>
      <div className="program-image-placeholder"></div>
      <div className="program-card-content">
        <div className="program-card-header">
          <h3>{program.name}</h3>
          <div className="program-card-actions" ref={menuRef}>
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
              <div className="program-menu-dropdown">
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
                  disabled={isDeleting}
                >
                  <IoTrashOutline /> {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="program-card-description">{program.description}</p>
        <div className="program-card-meta">
          <span className="program-length">{programLength} weeks</span>
          {program.hasNutritionProgram && (
            <span className="program-nutrition">Nutrition included</span>
          )}
        </div>
      </div>
    </div>
  );
};
