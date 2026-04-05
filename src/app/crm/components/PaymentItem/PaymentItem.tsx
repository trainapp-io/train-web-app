import React from 'react';
import { LuRotateCcw } from 'react-icons/lu';
import type { Payment } from '../../types/crm.types';
import './PaymentItem.css';

interface PaymentItemProps {
  payment: Payment;
  isStripeOnboarded: boolean;
  onRefund: (paymentId: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const PaymentItem: React.FC<PaymentItemProps> = ({ payment, isStripeOnboarded, onRefund }) => {
  const canRefund =
    isStripeOnboarded &&
    payment.paymentStatus === 'succeeded' &&
    payment.externalPaymentId !== null;

  const itemClass = [
    'payment-item',
    payment.isOverdue ? 'payment-item--overdue' : '',
    payment.paymentStatus === 'refunded' ? 'payment-item--refunded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={itemClass}>
      <div className="payment-item__main">
        <div className="payment-item__top">
          <span className="payment-item__amount">
            {payment.currency} {payment.amount.toFixed(2)}
          </span>
          <span className={`payment-item__status payment-item__status--${payment.paymentStatus}`}>
            {payment.paymentStatus}
          </span>
          {payment.isOverdue && (
            <span className="payment-item__overdue-badge">Overdue</span>
          )}
        </div>
        <div className="payment-item__meta">
          <span>{formatDate(payment.paymentDate)}</span>
          <span>·</span>
          <span>{payment.paymentMethod}</span>
          {payment.externalPaymentId && (
            <>
              <span>·</span>
              <span>ID: {payment.externalPaymentId}</span>
            </>
          )}
        </div>
      </div>

      {canRefund && (
        <div className="payment-item__actions">
          <button
            className="payment-item__refund-btn"
            onClick={() => onRefund(payment.id)}
            aria-label="Issue refund"
          >
            <LuRotateCcw aria-hidden="true" />
            Refund
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentItem;
