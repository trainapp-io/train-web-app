// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import { UserResponse, UserRequest } from "@trainapp-io/train-core";
import { RegistrationErrorTypes } from "../common/enums/authEnum";
import { LoginErrorTypes } from "../common/enums/authEnum";
import type { Client, Note, Payment, ClientProfile, StripeOnboardingStatus } from "../app/crm/types/crm.types";

const mockUserResponse: UserResponse = {
  userId: "1",
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  username: "testuser",
  name: "New User",
};

export interface ErrorResponse {
  message: string;
  errorCode: string;
  details?: unknown;
  requestId?: string;
}

// Use wildcard to match any host/port combination
const API_URL = "*/api";

export const handlers = [
  http.post(`${API_URL}/user/login`, async ({ request }) => {
    const body = (await request.json()) as UserRequest;

    if (body.password === "invalid-password@example.com") {
      const errorResponse: ErrorResponse = {
        message: LoginErrorTypes.InvalidPassword,
        errorCode: "INVALID_PASSWORD",
        requestId: "mock-request-id",
      };

      return new HttpResponse(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (body.email === "server-error@example.com") {
      return new HttpResponse(null, {
        status: 500,
        statusText: "Internal Server Error",
      });
    }

    return HttpResponse.json(mockUserResponse);
  }),
  http.post(`${API_URL}/user/register`, async ({ request }) => {
    console.log("MSW: Registering user");
    const body = (await request.json()) as UserRequest;
    console.log("MSW: Registration request body:", body);

    // Check for request error cases
    if (body.email === "") {
      const errorResponse: ErrorResponse = {
        message: "Validation failed",
        errorCode: "BAD_REQUEST",
        requestId: "mock-request-id",
        details: {
          errors: [RegistrationErrorTypes.EmailRequired],
        },
      };

      return new HttpResponse(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check for server error case
    if (body.email === "server-error@example.com") {
      return new HttpResponse(null, {
        status: 500,
        statusText: "Internal Server Error",
      });
    }

    // Check if email already exists
    if (body.email === "existing@example.com") {
      const errorResponse: ErrorResponse = {
        message: RegistrationErrorTypes.EmailAlreadyExists,
        errorCode: "CONFLICT",
        requestId: "mock-request-id",
      };

      return new HttpResponse(JSON.stringify(errorResponse), {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return HttpResponse.json(mockUserResponse);
  }),
  http.post(`${API_URL}/user/logout`, async () => {
    console.log("MSW: Logging out user");
    return HttpResponse.json({ message: "Logged out successfully" });
  }),
  http.post(
    `${API_URL}/user/request-password-reset`,
    async () => {
      console.log("MSW: Requesting password reset");
      return HttpResponse.json({ message: "Password reset request sent" });
    }
  ),
  http.post(
    `${API_URL}/user/reset-password-with-code`,
    async () => {
      console.log("MSW: Requesting reset password with code");
      return HttpResponse.json({ message: "Password reset successful" });
    }
  ),
  http.post(`${API_URL}/user/google-auth`, async () => {
    console.log('MSW: Google auth');
    return HttpResponse.json(mockUserResponse);
  }),

  // ─── CRM: Clients ────────────────────────────────────────────────────────────

  http.get(`${API_URL}/crm/clients`, () => {
    const mockClients: Client[] = [
      {
        id: 'client-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+15551234567',
        dateOfBirth: '1990-06-15',
        status: 'active',
        notes: null,
        platformUserId: null,
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-10T12:00:00.000Z',
      },
      {
        id: 'client-2',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: null,
        dateOfBirth: null,
        status: 'pending',
        notes: null,
        platformUserId: null,
        createdAt: '2026-03-14T09:00:00.000Z',
        updatedAt: '2026-03-14T09:00:00.000Z',
      },
    ];
    return HttpResponse.json({ active: [mockClients[0]], pending: [mockClients[1]], inactive: [] });
  }),

  http.post(`${API_URL}/crm/clients`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    if (!body.firstName || !body.lastName) {
      return HttpResponse.json(
        { message: 'Validation failed', errors: [{ field: 'firstName', message: 'Required' }] },
        { status: 400 }
      );
    }
    const newClient: Client = {
      id: `client-${Date.now()}`,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email ?? null,
      phone: body.phone ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      status: 'pending',
      notes: null,
      platformUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newClient, { status: 201 });
  }),

  http.get(`${API_URL}/crm/clients/:clientId`, ({ params }) => {
    const client: Client = {
      id: params.clientId as string,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+15551234567',
      dateOfBirth: '1990-06-15',
      status: 'active',
      notes: null,
      platformUserId: null,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-10T12:00:00.000Z',
    };
    return HttpResponse.json(client);
  }),

  http.patch(`${API_URL}/crm/clients/:clientId`, async ({ params, request }) => {
    const body = await request.json() as Partial<Client>;
    const updated: Client = {
      id: params.clientId as string,
      firstName: body.firstName ?? 'Jane',
      lastName: body.lastName ?? 'Doe',
      email: body.email ?? 'jane@example.com',
      phone: body.phone ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      status: body.status ?? 'active',
      notes: body.notes ?? null,
      platformUserId: null,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(updated);
  }),

  http.delete(`${API_URL}/crm/clients/:clientId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ─── CRM: Client Profile ──────────────────────────────────────────────────────

  http.get(`${API_URL}/crm/clients/:clientId/profile`, ({ params }) => {
    const profile: ClientProfile = {
      client: {
        id: params.clientId as string,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+15551234567',
        dateOfBirth: '1990-06-15',
        status: 'active',
        notes: null,
        platformUserId: null,
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-10T12:00:00.000Z',
      },
      platformProfile: null,
      workoutHistory: [],
      programs: [],
      appointments: [],
      notes: [],
      payments: [],
      paymentSummary: { totalPaid: 0, totalOutstanding: 0, currency: 'USD' },
    };
    return HttpResponse.json(profile);
  }),

  // ─── CRM: Notes ───────────────────────────────────────────────────────────────

  http.get(`${API_URL}/crm/clients/:clientId/notes`, () => {
    const notes: Note[] = [
      {
        id: 'note-1',
        clientId: 'client-1',
        noteText: 'First session went well.',
        createdAt: '2026-03-10T14:00:00.000Z',
        updatedAt: null,
      },
    ];
    return HttpResponse.json(notes);
  }),

  http.post(`${API_URL}/crm/clients/:clientId/notes`, async ({ params, request }) => {
    const body = await request.json() as { noteText: string };
    const note: Note = {
      id: `note-${Date.now()}`,
      clientId: params.clientId as string,
      noteText: body.noteText,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    return HttpResponse.json(note, { status: 201 });
  }),

  http.patch(`${API_URL}/crm/clients/:clientId/notes/:noteId`, async ({ params, request }) => {
    const body = await request.json() as { noteText: string };
    const note: Note = {
      id: params.noteId as string,
      clientId: params.clientId as string,
      noteText: body.noteText,
      createdAt: '2026-03-10T14:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(note);
  }),

  http.delete(`${API_URL}/crm/clients/:clientId/notes/:noteId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ─── CRM: Payments ────────────────────────────────────────────────────────────

  http.get(`${API_URL}/crm/clients/:clientId/payments`, () => {
    const payments: Payment[] = [
      {
        id: 'payment-1',
        clientId: 'client-1',
        amount: 150,
        currency: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'succeeded',
        paymentDate: '2026-03-10T10:00:00.000Z',
        externalPaymentId: 'pi_3abc',
        createdAt: '2026-03-10T10:00:00.000Z',
        isOverdue: false,
      },
    ];
    return HttpResponse.json(payments);
  }),

  http.post(`${API_URL}/crm/clients/:clientId/payments`, async ({ params, request }) => {
    const body = await request.json() as { amount: number; currency: string; paymentMethod: string };
    const payment: Payment = {
      id: `payment-${Date.now()}`,
      clientId: params.clientId as string,
      amount: body.amount,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
      paymentStatus: 'pending',
      paymentDate: new Date().toISOString(),
      externalPaymentId: null,
      createdAt: new Date().toISOString(),
      isOverdue: false,
    };
    return HttpResponse.json(payment, { status: 201 });
  }),

  http.patch(`${API_URL}/crm/clients/:clientId/payments/:paymentId`, async ({ params, request }) => {
    const body = await request.json() as { amount?: number; paymentMethod?: string };
    const payment: Payment = {
      id: params.paymentId as string,
      clientId: params.clientId as string,
      amount: body.amount ?? 150,
      currency: 'USD',
      paymentMethod: body.paymentMethod ?? 'stripe',
      paymentStatus: 'pending',
      paymentDate: '2026-03-10T10:00:00.000Z',
      externalPaymentId: null,
      createdAt: '2026-03-10T10:00:00.000Z',
      isOverdue: false,
    };
    return HttpResponse.json(payment);
  }),

  http.post(`${API_URL}/crm/clients/:clientId/payments/:paymentId/refund`, () => {
    return new HttpResponse(null, { status: 202 });
  }),

  // ─── CRM: Stripe ─────────────────────────────────────────────────────────────

  http.get(`${API_URL}/crm/stripe/onboarding/status`, () => {
    const status: StripeOnboardingStatus = { onboarded: false, stripeAccountId: null };
    return HttpResponse.json(status);
  }),

  http.post(`${API_URL}/crm/stripe/onboarding`, () => {
    return HttpResponse.json({ url: 'https://connect.stripe.com/setup/mock' });
  }),
];
