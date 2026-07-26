# JauntDetour — Copilot Instructions

<!-- markdownlint-disable MD013 -->

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

## UI/UX Design

- For any frontend UI change, follow `docs/design-system/foundations.md` and
  `docs/design-system/fluent-token-mapping.md`; consume canonical values from
  `design-system/tokens/` instead of adding feature-level brand values.
- Use `docs/ux/concept-directions.md` for information architecture and screen
  structure, and `docs/ux/responsive-strategy.md` when changing layout or map
  behavior across viewports.
- Read `docs/ux/development-handoff.md`, `docs/ux/implementation-session-plan.md`,
  and `docs/ux/migration-backlog.md` for redesign implementation, substantial
  new screens, or migration sequencing; routine fixes do not require them.
- Use `design-system/specimen/` and `spikes/ux-redesign-prototype/` as visual and
  interaction references only. Do not copy the throwaway prototype CSS or state
  implementation into production.
- Use approved brand files from `design-system/assets/brand/`; update the
  canonical SVG before regenerating raster derivatives.
- Build controls with Fluent 2 and Fluent icons, then apply JauntDetour tokens
  and domain compositions. Preserve one responsive component tree.
- Use "Jaunt" in visible UI copy; preserve trip-based API, database, repository,
  route, and state contracts internally.

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

## Reviewing code

When reviewing code, focus on:

### Security Critical Issues

- Check for hardcoded secrets, API keys, or credentials
- Look for SQL injection and XSS vulnerabilities
- Verify proper input validation and sanitization
- Review authentication and authorization logic

### Performance Red Flags

- Identify N+1 database query problems
- Spot inefficient loops and algorithmic issues
- Check for memory leaks and resource cleanup
- Review caching opportunities for expensive operations

### Code Quality Essentials

- Functions should be focused and appropriately sized
- Use clear, descriptive naming conventions
- Ensure proper error handling throughout

### Review Style

- Be specific and actionable in feedback
- Explain the "why" behind recommendations
- Acknowledge good patterns when you see them
- Ask clarifying questions when code intent is unclear

Always prioritize security vulnerabilities and performance issues that could impact users.

Always suggest changes to improve readability. For example, this suggestion seeks to make the code more readable and also makes the validation logic reusable and testable.

// Instead of:
if (user.email && user.email.includes('@') && user.email.length > 5) {
submitButton.enabled = true;
} else {
submitButton.enabled = false;
}

// Consider:
function isValidEmail(email) {
return email && email.includes('@') && email.length > 5;
}

submitButton.enabled = isValidEmail(user.email);

## Pull Requests

- When asked for a PR description, provide a summary of the change, what files were modified, how to test the
  changes, and any other relevant information or assumtpions. Provide all of this in markdown to be copy and pasted.
- Once a PR is active, the user will review the changes with you based on feedback from a Github Copilot agent.
  For each comment, do not assume the comment is correct, but investigate if the feedback is accurate and within
  scope of this PR. If it is, work with the user to make changes based on the feedback.

## Known constraints / follow-ups

- `@azure/msal-node` requires **Node >= 20** (dev container is 20). CI still uses
  Node 18 — bump tracked separately.
- Sessions use the default in-memory `MemoryStore` — fine for a single instance;
  needs a persistent store (e.g. `connect-pg-simple`) before scaling out.
