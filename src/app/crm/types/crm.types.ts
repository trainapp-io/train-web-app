export type ClientStatus = 'pending' | 'active' | 'inactive';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  status: ClientStatus;
  notes: string | null;
  platformUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResponse {
  active: Client[];
  pending: Client[];
  inactive?: Client[];
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  platformUserId?: string;
}

export interface UpdateClientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  status?: ClientStatus;
  notes?: string;
  platformUserId?: string;
}

export interface Note {
  id: string;
  clientId: string;
  noteText: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateNoteRequest {
  noteText: string;
}

export interface UpdateNoteRequest {
  noteText: string;
}

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  externalPaymentId: string | null;
  createdAt: string;
  isOverdue: boolean;
}

export interface RecordPaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  paymentMethod?: string;
}

export interface RefundPaymentRequest {
  amount?: number;
}

export interface WorkoutHistoryEntry {
  id: string;
  date: string;
  workoutName: string;
}

export interface ProgramSummary {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface AppointmentSummary {
  id: string;
  date: string;
  type: string;
  status: string;
}

export interface PlatformProfile {
  userId: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
}

export interface PaymentSummary {
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
}

export interface ClientProfile {
  client: Client;
  platformProfile: PlatformProfile | null;
  workoutHistory: WorkoutHistoryEntry[];
  programs: ProgramSummary[];
  appointments: AppointmentSummary[];
  notes: Note[];
  payments: Payment[];
  paymentSummary: PaymentSummary;
}

export interface StripeOnboardingStatus {
  onboarded: boolean;
  stripeAccountId: string | null;
}

export interface StripeOnboardingStartResponse {
  url: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface CrmApiError {
  message: string;
  errorCode?: string;
  errors?: ApiFieldError[];
}

export type FieldErrorMap = Record<string, string>;
