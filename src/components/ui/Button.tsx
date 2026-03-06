import React from 'react';
import './styles/Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  testId?: string;
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  testId
}) => {
  const baseClass = 'button';
  const variantClass = `button-${variant}`;
  const sizeClass = size !== 'md' ? `button-${size}` : '';
  const blockClass = block ? 'button-block' : '';
  const loadingClass = isLoading ? 'button-loading' : '';
  const buttonClasses = [baseClass, variantClass, sizeClass, blockClass, loadingClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
      data-testid={testId}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
