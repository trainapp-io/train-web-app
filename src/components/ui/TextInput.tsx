import React from 'react';
import './styles/TextInput.css';

interface TextInputProps {
  id: string;
  type?: 'text' | 'email' | 'password' | 'number';
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  autoComplete?: string;
  name?: string;
  testId?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  autoComplete,
  name,
  testId,
}) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}{required && <span className="required">*</span>}</label>
      <div className="input-wrapper">
        <input
          data-testid={testId}
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={error ? 'error' : ''}
        />
      </div>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

export default TextInput;
