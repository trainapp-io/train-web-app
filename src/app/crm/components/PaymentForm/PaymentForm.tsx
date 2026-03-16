import React, { useState, useEffect } from 'react';
import { LuX } from 'react-icons/lu';
import Button from '../../../../components/ui/Button';
import TextInput from '../../../../components/ui/TextInput';
import type { FieldErrorMap } from '../../types/crm.types';
import './PaymentForm.css';

interface PaymentFormData {
  amount: number;
  currency: string;
  paymentMethod: string;
}

interface PaymentFormProps {
  open: boolean;
  isSaving: boolean;
  fieldErrors: FieldErrorMap;
  onSubmit: (data: PaymentFormData) => void;
  onClose: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other'];

const EMPTY_FORM = { amountStr: '', currency: 'USD', paymentMethod: 'card' };

const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  isSaving,
  fieldErrors,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amountStr);
    if (isNaN(amount) || amount <= 0) return;
    onSubmit({ amount, currency: form.currency, paymentMethod: form.paymentMethod });
  };

  const amountNum = parseFloat(form.amountStr);
  const isSubmitDisabled = isSaving || !form.amountStr.trim() || isNaN(amountNum) || amountNum <= 0;

  return (
    <div className="payment-form-overlay" onClick={onClose}>
      <div
        className="payment-form-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Record Payment"
      >
        <div className="payment-form-header">
          <h2 className="payment-form-title">Record Payment</h2>
          <button className="payment-form-close" onClick={onClose} aria-label="Close dialog">
            <LuX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-form-body">
          <div className="payment-form-row">
            <TextInput
              id="amount"
              label="Amount"
              type="number"
              value={form.amountStr}
              onChange={(e) => setForm((prev) => ({ ...prev, amountStr: e.target.value }))}
              placeholder="0.00"
              required
              disabled={isSaving}
              error={fieldErrors['amount']}
            />
            <div className="payment-form-field">
              <label className="payment-form-label" htmlFor="currency">
                Currency
              </label>
              <select
                id="currency"
                className="payment-form-select"
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                disabled={isSaving}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fieldErrors['currency'] && (
                <span className="payment-form-error">{fieldErrors['currency']}</span>
              )}
            </div>
          </div>

          <div className="payment-form-field">
            <label className="payment-form-label" htmlFor="paymentMethod">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              className="payment-form-select"
              value={form.paymentMethod}
              onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              disabled={isSaving}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            {fieldErrors['paymentMethod'] && (
              <span className="payment-form-error">{fieldErrors['paymentMethod']}</span>
            )}
          </div>

          <div className="payment-form-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={isSubmitDisabled}>
              Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
