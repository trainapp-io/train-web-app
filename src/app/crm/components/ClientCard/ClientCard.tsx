import React from 'react';
import type { Client } from '../../types/crm.types';
import ClientStatusBadge from '../ClientStatusBadge/ClientStatusBadge';
import { LuChevronRight } from 'react-icons/lu';
import './ClientCard.css';

interface ClientCardProps {
  client: Client;
  onClick: (clientId: string) => void;
}

const AVATAR_COLORS = [
  { bg: '#ede9fe', color: '#6d28d9' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#dcfce7', color: '#15803d' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#e0f2fe', color: '#075985' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#f0fdf4', color: '#166534' },
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  const avatarStyle = getAvatarStyle(fullName);

  return (
    <button
      className="client-card"
      onClick={() => onClick(client.id)}
      aria-label={`Open profile for ${fullName}`}
    >
      <div
        className="client-card__avatar"
        aria-hidden="true"
        style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}
      >
        {initials}
      </div>
      <div className="client-card__info">
        <span className="client-card__name">{fullName}</span>
        {client.email && (
          <span className="client-card__email">{client.email}</span>
        )}
      </div>
      <div className="client-card__status">
        <ClientStatusBadge status={client.status} />
      </div>
      <LuChevronRight className="client-card__chevron" aria-hidden="true" />
    </button>
  );
};

export default ClientCard;
