import React from 'react';
import { LuX, LuTriangleAlert } from 'react-icons/lu';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-close-button" onClick={onCancel} aria-label="Close">
          <LuX />
        </button>

        <div className="confirm-dialog-content">
          <div className={`confirm-icon ${isDestructive ? 'destructive' : ''}`}>
            <LuTriangleAlert />
          </div>
          
          <h2 className="confirm-title">{title}</h2>
          <p className="confirm-message">{message}</p>
        </div>

        <div className="confirm-dialog-actions">
          <button 
            type="button" 
            className="confirm-btn-cancel" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`confirm-btn-confirm ${isDestructive ? 'destructive' : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

