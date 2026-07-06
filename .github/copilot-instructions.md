# JauntDetour — Copilot Instructions

Road-trip planner: React frontend + Node/Express backend + PostgreSQL, using
Google Maps APIs to build routes and find detours, with user accounts and saved
trips.

## Architecture at a glance

- **Frontend**: React 19 (CRA) + Redux, runs on `:3001`. Entry: `frontend/src/index.js`.
- **Backend**: Node/Express (CommonJS), runs on `:3000`. Entry: `backend/index.js`.
- **Database**: PostgreSQL (`users → trips → detours`). Local DB via the dev
  container; Azure Database for PostgreSQL in production. Schema:
  `docs/database/schema.sql`.
- **Dev**: runs inside a dev container; env comes from `.devcontainer/devcontainer.env`
  (see `.env.example` / `.devcontainer/devcontainer.env.example`). `npm run dev`
  starts both apps.

## High-level tech decisions

- **UI library: Fluent 2 (`@fluentui/react-components`).** Build NEW frontend UI
  (dialogs, drawers, toasts, buttons, inputs) with Fluent. The app root is wrapped
  in `<FluentProvider theme={webLightTheme}>` (`frontend/src/index.js`). The
  original planning UI is legacy custom CSS/Bootstrap-ish markup — don't expand it;
  prefer Fluent for new work.
- **Auth: Microsoft Entra External ID (CIAM)**, backend-driven confidential-client
  OAuth (MSAL Node, authorization-code + PKCE) with a server-side session cookie.
  - `requireAuth` middleware sets `req.userId` — the **authorization boundary**.
    Never trust a `userId` from the client; always use `req.userId`.
  - The MSAL authority **must include the tenant ID in the path**
    (`https://<subdomain>.ciamlogin.com/<tenantId>`) or CIAM discovery fails with
    `endpoints_resolution_error`. Config: `backend/config/auth.js`.
  - Env: `ENTRA_TENANT_SUBDOMAIN`, `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`,
    `ENTRA_CLIENT_SECRET`, `ENTRA_REDIRECT_URI`, `SESSION_SECRET`, `FRONTEND_URL`.
- **Cookies/CORS**: session cookie is `httpOnly`; `sameSite="none"` + `secure` in
  prod (frontend/backend are cross-site on `*.azurewebsites.net`), `lax` in dev.
  CORS uses an explicit origin (`FRONTEND_URL`) + `credentials: true`; frontend
  axios calls that need auth use `withCredentials: true`.
- **Data access: repository pattern** (`backend/app/repositories/*Repository.js`).
  A `pg` pool (or a transaction client) is injected via the constructor. All SQL
  is parameterized. Every query is scoped by `user_id`.
- **Transactions**: use `db.getClient()` and construct client-scoped repositories
  (`new TripRepository(client)`) inside `BEGIN`/`COMMIT`/`ROLLBACK` (see the
  `POST /api/trips` handler in `backend/app/routes/trips.js`).
- **Routes are injectable factories** (`createXRouter({ ...deps })`) so they can be
  unit-tested with mock repositories.
- **Redux state persists to `sessionStorage`** (`frontend/src/index.js`) so an
  in-progress trip survives the full-page login redirect. `user` is NOT persisted —
  auth state is always re-resolved from `GET /auth/me`.
- **Frontend requesters** (`frontend/src/scripts/*Requester.js`) wrap axios, build
  URLs from `config.BACKEND_URL`, and pass `withCredentials: true` for authed calls.

## Conventions

- Backend is CommonJS (`require`/`module.exports`), `var`/`const` mixed in older
  files — match the file you're editing.
- Prettier + ESLint enforced via husky `pre-commit` + lint-staged. **Git hooks and
  shell scripts must be LF** (see `.gitattributes`) or the hook breaks on CRLF.
- Don't commit secrets; real values live in the gitignored `devcontainer.env`.

## Testing

- Backend: Jest. Repos tested with a mock pool (`{ query: jest.fn() }`, assert SQL
  substrings + params); routes tested with `supertest` + mocked repos/db. Run
  `cd backend && npm test`.
- Frontend: `cd frontend && CI=true npm test`.
- Keep the suite green and add tests for new backend routes/repos.

## Known constraints / follow-ups

- `@azure/msal-node` requires **Node >= 20** (dev container is 20). CI still uses
  Node 18 — bump tracked separately.
- Sessions use the default in-memory `MemoryStore` — fine for a single instance;
  needs a persistent store (e.g. `connect-pg-simple`) before scaling out.
