# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite build
npm run lint         # ESLint checks
npm test             # Run unit tests (Vitest)
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests
```

To run a single test file: `npx vitest run src/path/to/file.test.ts`

## Tech Stack

- **Framework**: React 19 + TypeScript 5.7
- **Build**: Vite 6, path alias `@/` → `./src`
- **Routing**: React Router 7
- **Styling**: MUI v7 (Material UI) + Emotion
- **Server state**: TanStack React Query via custom hooks in `src/services/apiHooks.ts`
- **Auth**: Firebase Authentication + custom JWT backend
- **Testing**: Vitest (unit), Playwright (E2E)
- **Private package**: `@trainapp-io/train-core` — shared types, requires GitHub Package Registry auth

## Architecture

### Routing (`src/app/Navigation.tsx`)
Central route config with three route guards:
- `ProtectedRoute` — requires auth, saves location for post-login redirect
- `AuthRoute` — blocks authenticated users from `/login`, `/register`, etc.
- `ResetPasswordRoute` — validates email query param, requires unauthenticated state

### API Layer (`src/services/`)
- `apiClient.ts` — Axios instance with Bearer token injection and automatic token refresh on 401. Queues requests during refresh to prevent race conditions. Detects public endpoints (login, register, refresh, password reset) to skip auth headers.
- `apiHooks.ts` — `useApiQuery`, `useDynamicApiQuery`, `useApiMutation` wrapping React Query
- `tokenService.ts` — JWT token management (access, refresh, device ID) via localStorage

### Feature Modules (`src/app/`)
Each feature follows: `components/` (with `views/` subdirectory) + `services/` + `contexts/` + `types/` + `tests/`

Modules: `access/` (auth), `workouts/`, `workout-logs/`, `programs/`, `crm/`, `events/`, `profiles/`, `search/`

### State Management
- Domain state via React Context: `WorkoutLogContext`, `ProgramContext`, `WorkoutContext`
- Server state via React Query (through `apiHooks.ts`)
