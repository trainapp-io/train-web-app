import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { LuArrowLeft, LuPencil, LuUserX, LuPlus, LuMail, LuPhone, LuCalendar, LuActivity, LuDumbbell, LuCalendarCheck } from 'react-icons/lu';
import {
  useClient,
  useClientAppointments,
  useClientWorkoutHistory,
  useClientPrograms,
  useUpdateClient,
  useDeactivateClient,
} from '../hooks/useCrmClients';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useCrmNotes';
import { usePayments, useRecordPayment, useRefundPayment } from '../hooks/useCrmPayments';
import { useStripeStatus, useStartOnboarding } from '../hooks/useStripeOnboarding';
import ClientStatusBadge from '../components/ClientStatusBadge/ClientStatusBadge';
import ClientForm from '../components/ClientForm/ClientForm';
import NoteItem from '../components/NoteItem/NoteItem';
import NoteForm from '../components/NoteForm/NoteForm';
import PaymentItem from '../components/PaymentItem/PaymentItem';
import PaymentForm from '../components/PaymentForm/PaymentForm';
import StripeOnboardingBanner from '../components/StripeOnboardingBanner/StripeOnboardingBanner';
import ConfirmDialog from '../../programs/components/ConfirmDialog';
import type {
  Note,
  CreateClientRequest,
  FieldErrorMap,
  ClientStatus,
  PaymentSummary,
} from '../types/crm.types';
import './ClientProfilePage.css';

type Tab = 'notes' | 'payments';

const ClientProfilePage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrorMap>({});
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<FieldErrorMap>({});

  const clientQuery = useClient(clientId!);
  const appointmentsQuery = useClientAppointments(clientId!);
  const workoutHistoryQuery = useClientWorkoutHistory(clientId!);
  const programsQuery = useClientPrograms(clientId!);
  const notesQuery = useNotes(clientId!);
  const paymentsQuery = usePayments(clientId!);
  const stripeStatusQuery = useStripeStatus();

  const updateClientMutation = useUpdateClient();
  const deactivateClientMutation = useDeactivateClient();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const recordPaymentMutation = useRecordPayment();
  const refundPaymentMutation = useRefundPayment();
  const startOnboardingMutation = useStartOnboarding();

  if (clientQuery.isLoading) {
    return <div className="profile-loading" aria-live="polite">Loading profile…</div>;
  }

  if (clientQuery.isError || !clientQuery.data) {
    return (
      <div className="profile-error" role="alert">
        Failed to load client profile.
      </div>
    );
  }

  const client = clientQuery.data;
  const appointments = appointmentsQuery.data ?? [];
  const workoutHistory = workoutHistoryQuery.data ?? [];
  const programs = programsQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const payments = paymentsQuery.data?.payments ?? [];
  const paymentSummary: PaymentSummary = paymentsQuery.data?.paymentSummary ?? {
    totalPaid: 0,
    totalOutstanding: 0,
    currency: 'USD',
  };
  const isStripeOnboarded = stripeStatusQuery.data?.onboarded ?? false;
  const hasPlatformData = !!client.platformUserId;

  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();

  // ── Edit profile ──────────────────────────────────────────────────────────────

  const handleEditSubmit = (formData: CreateClientRequest) => {
    setEditFieldErrors({});
    updateClientMutation.mutate(
      { clientId: clientId!, data: formData },
      {
        onSuccess: () => setShowEditForm(false),
        onError: (err) => {
          const errors = err.response?.data?.errors;
          if (errors) {
            const map: FieldErrorMap = {};
            errors.forEach((e) => { map[e.field] = e.message; });
            setEditFieldErrors(map);
          }
        },
      }
    );
  };

  const handleStatusChange = (newStatus: ClientStatus) => {
    updateClientMutation.mutate({ clientId: clientId!, data: { status: newStatus } });
  };

  // ── Deactivation ──────────────────────────────────────────────────────────────

  const handleDeactivateConfirm = () => {
    deactivateClientMutation.mutate(clientId!, {
      onSuccess: () => navigate('/crm'),
    });
  };

  // ── Notes ─────────────────────────────────────────────────────────────────────

  const handleNoteSubmit = (text: string) => {
    if (editingNote) {
      updateNoteMutation.mutate(
        { clientId: clientId!, noteId: editingNote.id, data: { noteText: text } },
        { onSuccess: () => { setEditingNote(null); setShowNoteForm(false); } }
      );
    } else {
      createNoteMutation.mutate(
        { clientId: clientId!, data: { noteText: text } },
        { onSuccess: () => setShowNoteForm(false) }
      );
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const handleDeleteNoteConfirm = () => {
    if (!deletingNoteId) return;
    deleteNoteMutation.mutate(
      { clientId: clientId!, noteId: deletingNoteId },
      { onSuccess: () => setDeletingNoteId(null) }
    );
  };

  // ── Payments ──────────────────────────────────────────────────────────────────

  const handleRecordPaymentSubmit = (data: { amount: number; currency: string; paymentMethod: string }) => {
    setPaymentFieldErrors({});
    recordPaymentMutation.mutate(
      { clientId: clientId!, data },
      {
        onSuccess: () => setShowPaymentForm(false),
        onError: (err) => {
          const errors = err.response?.data?.errors;
          if (errors) {
            const map: FieldErrorMap = {};
            errors.forEach((e) => { map[e.field] = e.message; });
            setPaymentFieldErrors(map);
          }
        },
      }
    );
  };

  const handleRefundConfirm = () => {
    if (!refundingPaymentId) return;
    refundPaymentMutation.mutate(
      { clientId: clientId!, paymentId: refundingPaymentId },
      { onSuccess: () => setRefundingPaymentId(null) }
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const availableStatuses: ClientStatus[] = ['pending', 'active', 'inactive'];

  return (
    <div className="client-profile">
      <div className="profile-nav">
        <button className="profile-back-btn" onClick={() => navigate('/crm')} aria-label="Back to clients">
          <LuArrowLeft aria-hidden="true" /> Back to Clients
        </button>
      </div>

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-header__identity">
          <div className="profile-header__avatar" aria-hidden="true">{initials}</div>
          <div className="profile-header__info">
            <h1 className="profile-header__name">{fullName}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
        </div>
        <div className="profile-header__actions">
          <button
            className="profile-action-btn"
            onClick={() => { setEditFieldErrors({}); setShowEditForm(true); }}
            aria-label="Edit client"
          >
            <LuPencil aria-hidden="true" /> Edit
          </button>
          {client.status !== 'inactive' && (
            <button
              className="profile-action-btn profile-action-btn--danger"
              onClick={() => setShowDeactivateConfirm(true)}
              aria-label="Deactivate client"
            >
              <LuUserX aria-hidden="true" /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* ── Contact info ── */}
      <div className="profile-contact">
        {client.email && (
          <div className="profile-contact__item">
            <LuMail className="profile-contact__icon" aria-hidden="true" />
            <span className="profile-contact__label">Email</span>
            <span className="profile-contact__value">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="profile-contact__item">
            <LuPhone className="profile-contact__icon" aria-hidden="true" />
            <span className="profile-contact__label">Phone</span>
            <span className="profile-contact__value">{client.phone}</span>
          </div>
        )}
        {client.dateOfBirth && (
          <div className="profile-contact__item">
            <LuCalendar className="profile-contact__icon" aria-hidden="true" />
            <span className="profile-contact__label">Date of Birth</span>
            <span className="profile-contact__value">{client.dateOfBirth}</span>
          </div>
        )}
        <div className="profile-contact__item">
          <LuActivity className="profile-contact__icon" aria-hidden="true" />
          <span className="profile-contact__label">Status</span>
          <select
            className="profile-status-select"
            value={client.status}
            onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
            aria-label="Change client status"
            disabled={updateClientMutation.isPending}
          >
            {availableStatuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Platform data ── */}
      {hasPlatformData && (
        <div className="profile-platform-section">
          <h2 className="profile-section-title">Platform Activity</h2>
          <div className="profile-platform-stats">
            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--workouts" aria-hidden="true"><LuDumbbell /></div>
              <strong>{workoutHistory.length}</strong>
              <span>Workouts</span>
            </div>
            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--programs" aria-hidden="true"><LuActivity /></div>
              <strong>{programs.length}</strong>
              <span>Programs</span>
            </div>
            <div className="profile-stat">
              <div className="profile-stat__icon profile-stat__icon--appointments" aria-hidden="true"><LuCalendarCheck /></div>
              <strong>{appointments.length}</strong>
              <span>Appointments</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="profile-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'notes'}
          className={`profile-tab ${activeTab === 'notes' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes {notes.length > 0 && <span className="profile-tab__count">{notes.length}</span>}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'payments'}
          className={`profile-tab ${activeTab === 'payments' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
      </div>

      {/* ── Notes tab ── */}
      {activeTab === 'notes' && (
        <div className="profile-tab-panel" role="tabpanel" aria-label="Notes">
          <div className="profile-tab-header">
            <button
              className="profile-tab-action-btn"
              onClick={() => { setEditingNote(null); setShowNoteForm(true); }}
              aria-label="Add note"
            >
              <LuPlus aria-hidden="true" /> Add Note
            </button>
          </div>
          {notesQuery.isLoading ? (
            <p className="profile-loading-text">Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="profile-empty-text">No notes yet. Add the first one.</p>
          ) : (
            <div className="profile-notes-list">
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onDelete={(noteId) => setDeletingNoteId(noteId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Payments tab ── */}
      {activeTab === 'payments' && (
        <div className="profile-tab-panel" role="tabpanel" aria-label="Payments">
          {!isStripeOnboarded && (
            <StripeOnboardingBanner
              onConnect={() => startOnboardingMutation.mutate()}
              isLoading={startOnboardingMutation.isPending}
            />
          )}
          <div className="profile-payment-summary">
            <div className="profile-stat">
              <strong>{paymentSummary.currency} {paymentSummary.totalPaid.toFixed(2)}</strong>
              Total Paid
            </div>
            <div className="profile-stat profile-stat--outstanding">
              <strong>{paymentSummary.currency} {paymentSummary.totalOutstanding.toFixed(2)}</strong>
              Outstanding
            </div>
          </div>
          <div className="profile-tab-header">
            <button
              className="profile-tab-action-btn"
              onClick={() => { setPaymentFieldErrors({}); setShowPaymentForm(true); }}
              aria-label="Record payment"
            >
              <LuPlus aria-hidden="true" /> Record Payment
            </button>
          </div>
          {paymentsQuery.isLoading ? (
            <p className="profile-loading-text">Loading payments…</p>
          ) : payments.length === 0 ? (
            <p className="profile-empty-text">No payments recorded yet.</p>
          ) : (
            <div className="profile-payments-list">
              {payments.map((payment) => (
                <PaymentItem
                  key={payment.id}
                  payment={payment}
                  isStripeOnboarded={isStripeOnboarded}
                  onRefund={(paymentId) => setRefundingPaymentId(paymentId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      <ClientForm
        open={showEditForm}
        title="Edit Client"
        initialValues={{
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email ?? '',
          phone: client.phone ?? '',
          dateOfBirth: client.dateOfBirth ?? '',
          status: client.status,
        }}
        isSaving={updateClientMutation.isPending}
        fieldErrors={editFieldErrors}
        onSubmit={handleEditSubmit}
        onClose={() => setShowEditForm(false)}
      />

      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        title="Deactivate Client?"
        message={`This will move ${fullName} to inactive status. You can reactivate them later by changing their status.`}
        confirmText="Deactivate"
        isDestructive
        isLoading={deactivateClientMutation.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setShowDeactivateConfirm(false)}
      />

      <NoteForm
        open={showNoteForm}
        title={editingNote ? 'Edit Note' : 'Add Note'}
        initialText={editingNote?.noteText ?? ''}
        isSaving={createNoteMutation.isPending || updateNoteMutation.isPending}
        onSubmit={handleNoteSubmit}
        onClose={() => { setShowNoteForm(false); setEditingNote(null); }}
      />

      <ConfirmDialog
        isOpen={deletingNoteId !== null}
        title="Delete Note?"
        message="This note will be permanently deleted."
        confirmText="Delete"
        isDestructive
        isLoading={deleteNoteMutation.isPending}
        onConfirm={handleDeleteNoteConfirm}
        onCancel={() => setDeletingNoteId(null)}
      />

      <PaymentForm
        open={showPaymentForm}
        isSaving={recordPaymentMutation.isPending}
        fieldErrors={paymentFieldErrors}
        onSubmit={handleRecordPaymentSubmit}
        onClose={() => setShowPaymentForm(false)}
      />

      <ConfirmDialog
        isOpen={refundingPaymentId !== null}
        title="Issue Refund?"
        message="This will initiate a full refund via Stripe. The status will update once Stripe processes it."
        confirmText="Issue Refund"
        isDestructive
        isLoading={refundPaymentMutation.isPending}
        onConfirm={handleRefundConfirm}
        onCancel={() => setRefundingPaymentId(null)}
      />
    </div>
  );
};

export default ClientProfilePage;
