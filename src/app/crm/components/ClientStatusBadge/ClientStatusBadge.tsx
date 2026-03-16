import React from 'react';
import type { ClientStatus } from '../../types/crm.types';
import './ClientStatusBadge.css';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
};

const ClientStatusBadge: React.FC<ClientStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`client-status-badge client-status-badge--${status}`} aria-label={`Status: ${STATUS_LABELS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};

export default ClientStatusBadge;
