import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { LuUserPlus, LuUsers, LuUserCheck, LuClock, LuTable2, LuColumns3, LuChevronRight } from 'react-icons/lu';
import type { AxiosError } from 'axios';
import { useClientList, useCreateClient } from '../hooks/useCrmClients';
import ClientCard from '../components/ClientCard/ClientCard';
import ClientStatusBadge from '../components/ClientStatusBadge/ClientStatusBadge';
import ClientForm from '../components/ClientForm/ClientForm';
import type { Client, CreateClientRequest, FieldErrorMap } from '../types/crm.types';
import './CrmPage.css';

type ViewMode = 'table' | 'pipeline';

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

interface ClientRowProps {
  client: Client;
  onClick: (id: string) => void;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, onClick }) => {
  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  const avatarStyle = getAvatarStyle(fullName);

  return (
    <tr className="crm-table__row" onClick={() => onClick(client.id)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(client.id)}
      aria-label={`Open profile for ${fullName}`}>
      <td className="crm-table__cell crm-table__cell--name">
        <div className="crm-table__avatar" style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}>
          {initials}
        </div>
        <span className="crm-table__name">{fullName}</span>
      </td>
      <td className="crm-table__cell crm-table__cell--email">{client.email ?? '—'}</td>
      <td className="crm-table__cell crm-table__cell--status">
        <ClientStatusBadge status={client.status} />
      </td>
      <td className="crm-table__cell crm-table__cell--action">
        <LuChevronRight className="crm-table__chevron" aria-hidden="true" />
      </td>
    </tr>
  );
};

const CrmPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  const { data, isLoading, isError, error } = useClientList();
  const createClientMutation = useCreateClient();

  const activeClients = data?.active ?? [];
  const pendingClients = data?.pending ?? [];
  const inactiveClients = data?.inactive ?? [];

  const isCrmUninitialized = isError && (error as AxiosError)?.response?.status === 500;

  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (!autoOpenedRef.current && isCrmUninitialized) {
      autoOpenedRef.current = true;
      setShowAddForm(true);
    }
  }, [isCrmUninitialized]);

  const handleClientClick = (clientId: string) => navigate(`/crm/clients/${clientId}`);

  const handleAddClientOpen = () => {
    setFieldErrors({});
    setShowAddForm(true);
  };

  const handleAddClientSubmit = (formData: CreateClientRequest) => {
    setFieldErrors({});
    createClientMutation.mutate(formData, {
      onSuccess: () => setShowAddForm(false),
      onError: (err) => {
        const errors = err.response?.data?.errors;
        if (errors) {
          const map: FieldErrorMap = {};
          errors.forEach((e) => { map[e.field] = e.message; });
          setFieldErrors(map);
        }
      },
    });
  };

  if (isLoading) {
    return <div className="crm-page"><div className="crm-loading" aria-live="polite">Loading clients…</div></div>;
  }

  if (isError && !isCrmUninitialized) {
    return (
      <div className="crm-page">
        <div className="crm-error" role="alert">
          {(error as { message?: string })?.message ?? 'Failed to load clients.'}
        </div>
      </div>
    );
  }

  const hasNoClients = isCrmUninitialized || (activeClients.length === 0 && pendingClients.length === 0);
  const totalClients = activeClients.length + pendingClients.length + inactiveClients.length;
  const tableClients = showInactive
    ? [...activeClients, ...pendingClients, ...inactiveClients]
    : [...activeClients, ...pendingClients];

  return (
    <div className="crm-page">

      {/* ── Toolbar ── */}
      <div className="crm-toolbar">
        <div className="crm-toolbar__left">
          <h1 className="crm-title">Clients</h1>
          <div className="crm-stats" aria-label="Client statistics">
            <span className="crm-stat-pill crm-stat-pill--total">
              <LuUsers aria-hidden="true" /> {totalClients} Total
            </span>
            <span className="crm-stat-pill crm-stat-pill--active">
              <LuUserCheck aria-hidden="true" /> {activeClients.length} Active
            </span>
            <span className="crm-stat-pill crm-stat-pill--pending">
              <LuClock aria-hidden="true" /> {pendingClients.length} Pending
            </span>
          </div>
        </div>
        <div className="crm-toolbar__right">
          <div className="crm-view-toggle" role="group" aria-label="View mode">
            <button
              className={`crm-view-btn ${viewMode === 'table' ? 'crm-view-btn--active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
            >
              <LuTable2 aria-hidden="true" /> Table
            </button>
            <button
              className={`crm-view-btn ${viewMode === 'pipeline' ? 'crm-view-btn--active' : ''}`}
              onClick={() => setViewMode('pipeline')}
              aria-pressed={viewMode === 'pipeline'}
            >
              <LuColumns3 aria-hidden="true" /> Pipeline
            </button>
          </div>
          <button className="crm-add-btn" onClick={handleAddClientOpen} aria-label="Add new client">
            <LuUserPlus aria-hidden="true" /> Add Client
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {hasNoClients ? (
        <div className="crm-empty-state">
          <LuUsers className="crm-empty-state__icon" aria-hidden="true" />
          <p>No clients yet.</p>
          <button className="crm-add-btn" onClick={handleAddClientOpen}>Add your first client</button>
        </div>

      ) : viewMode === 'table' ? (
        /* ── Table view ── */
        <div className="crm-table-wrap">
          <div className="crm-table-controls">
            <label className="crm-toggle-label">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                aria-label="Show inactive clients"
              />
              Show inactive
            </label>
          </div>
          <table className="crm-table" aria-label="Clients">
            <thead className="crm-table__head">
              <tr>
                <th className="crm-table__th">Name</th>
                <th className="crm-table__th">Email</th>
                <th className="crm-table__th">Status</th>
                <th className="crm-table__th crm-table__th--action" />
              </tr>
            </thead>
            <tbody>
              {tableClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="crm-table__empty">No clients to show.</td>
                </tr>
              ) : (
                tableClients.map((client) => (
                  <ClientRow key={client.id} client={client} onClick={handleClientClick} />
                ))
              )}
            </tbody>
          </table>
        </div>

      ) : (
        /* ── Pipeline view ── */
        <div className="crm-pipeline">
          <div className="crm-pipeline__col">
            <div className="crm-pipeline__col-header">
              <span className="crm-pipeline__col-title">Pending</span>
              <span className="crm-pipeline__col-count">{pendingClients.length}</span>
            </div>
            <div className="crm-pipeline__col-body">
              {pendingClients.length === 0
                ? <p className="crm-pipeline__empty">No pending clients</p>
                : pendingClients.map((c) => <ClientCard key={c.id} client={c} onClick={handleClientClick} />)
              }
            </div>
          </div>
          <div className="crm-pipeline__col">
            <div className="crm-pipeline__col-header">
              <span className="crm-pipeline__col-title">Active</span>
              <span className="crm-pipeline__col-count">{activeClients.length}</span>
            </div>
            <div className="crm-pipeline__col-body">
              {activeClients.length === 0
                ? <p className="crm-pipeline__empty">No active clients</p>
                : activeClients.map((c) => <ClientCard key={c.id} client={c} onClick={handleClientClick} />)
              }
            </div>
          </div>
          <div className="crm-pipeline__col crm-pipeline__col--inactive">
            <div className="crm-pipeline__col-header">
              <span className="crm-pipeline__col-title">Inactive</span>
              <span className="crm-pipeline__col-count">{inactiveClients.length}</span>
            </div>
            <div className="crm-pipeline__col-body">
              {inactiveClients.length === 0
                ? <p className="crm-pipeline__empty">No inactive clients</p>
                : inactiveClients.map((c) => <ClientCard key={c.id} client={c} onClick={handleClientClick} />)
              }
            </div>
          </div>
        </div>
      )}

      <ClientForm
        open={showAddForm}
        isSaving={createClientMutation.isPending}
        fieldErrors={fieldErrors}
        onSubmit={handleAddClientSubmit}
        onClose={() => setShowAddForm(false)}
      />
    </div>
  );
};

export default CrmPage;
