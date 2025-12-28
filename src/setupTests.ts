import { server } from "./mocks/server";
import { beforeAll, afterAll, afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
  server.events.on("request:start", ({ request }) => {
    console.log("Outgoing request:", request.method, request.url);
  });
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  server.resetHandlers();
});
