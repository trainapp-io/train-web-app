import React, { useState, useEffect } from 'react';
import type { CreateClientRequest, FieldErrorMap } from '../../types/crm.types';
import Button from '../../../../components/ui/Button';
import TextInput from '../../../../components/ui/TextInput';
import { LuX } from 'react-icons/lu';
import './ClientForm.css';

interface ClientFormProps {
  open: boolean;
  title?: string;
  initialValues?: Partial<CreateClientRequest>;
  isSaving: boolean;
  fieldErrors: FieldErrorMap;
  onSubmit: (data: CreateClientRequest) => void;
  onClose: () => void;
}

const EMPTY_FORM: CreateClientRequest = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
};

const ClientForm: React.FC<ClientFormProps> = ({
  open,
  title = 'Add Client',
  initialValues,
  isSaving,
  fieldErrors,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState<CreateClientRequest>({ ...EMPTY_FORM, ...initialValues });

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, ...initialValues });
    }
  }, [open, initialValues]);

  if (!open) return null;

  const handleChange = (field: keyof CreateClientRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateClientRequest = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    };
    if (form.email?.trim()) payload.email = form.email.trim();
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    if (form.dateOfBirth?.trim()) payload.dateOfBirth = form.dateOfBirth.trim();
    onSubmit(payload);
  };

  return (
    <div className="client-form-overlay" onClick={onClose}>
      <div className="client-form-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="client-form-header">
          <h2 className="client-form-title">{title}</h2>
          <button className="client-form-close" onClick={onClose} aria-label="Close dialog">
            <LuX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="client-form-body">
          <TextInput
            id="firstName"
            label="First Name"
            value={form.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Jane"
            required
            disabled={isSaving}
            error={fieldErrors['firstName']}
          />
          <TextInput
            id="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Doe"
            required
            disabled={isSaving}
            error={fieldErrors['lastName']}
          />
          <TextInput
            id="email"
            type="email"
            label="Email"
            value={form.email ?? ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jane@example.com"
            disabled={isSaving}
            error={fieldErrors['email']}
          />
          <TextInput
            id="phone"
            label="Phone"
            value={form.phone ?? ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 555 123 4567"
            disabled={isSaving}
            error={fieldErrors['phone']}
          />
          <TextInput
            id="dateOfBirth"
            label="Date of Birth"
            value={form.dateOfBirth ?? ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            placeholder="YYYY-MM-DD"
            disabled={isSaving}
            error={fieldErrors['dateOfBirth']}
          />

          <div className="client-form-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={!form.firstName.trim() || !form.lastName.trim()}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
