// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import { UserResponse, UserRequest } from "@trainapp-io/train-core";
import { RegistrationErrorTypes } from "../common/enums/authEnum";
import { LoginErrorTypes } from "../common/enums/authEnum";

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

export const handlers = [
  http.post("http://localhost:3000/api/user/login", async ({ request }) => {
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
  http.post("http://localhost:3000/api/user/register", async ({ request }) => {
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
  http.post("http://localhost:3000/api/user/logout", async () => {
    console.log("MSW: Logging out user");
    return HttpResponse.json({ message: "Logged out successfully" });
  }),
  http.post(
    "http://localhost:3000/api/user/request-password-reset",
    async () => {
      console.log("MSW: Requesting password reset");
      return HttpResponse.json({ message: "Password reset request sent" });
    }
  ),
  http.post(
    "http://localhost:3000/api/user/reset-password-with-code",
    async () => {
      console.log("MSW: Requesting reset password with code");
      return HttpResponse.json({ message: "Password reset successful" });
    }
  ),
];
