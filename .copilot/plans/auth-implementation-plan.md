<!-- markdownlint-disable-file -->
# Plan: End-to-End User Authentication (Entra External ID)

## Goal

Wire real user registration, login, and logout into the app using the
already-provisioned Microsoft Entra External ID tenant. Use a **backend-driven
confidential-client flow** (MSAL Node) with a server-side session, prove the whole chain
with one protected, `user_id`-scoped data route, then add a minimal frontend login/logout
UI. Email/password only for this pass; Google/social login is deferred (it is additive
later with no code change).

## Status / Context

- **Phase 0 (provisioning) is DONE** by the user: external tenant, `SignUpSignIn` user
  flow (Email with password, collecting Email + Display Name), app registration associated
  with the flow, admin consent granted, and the four `ENTRA_*` values collected.
- **Single tenant** is used for both dev and prod for now (no users yet, low risk; split
  later is a config-only change).
- **Secrets** live in `.devcontainer/devcontainer.env` (user runs inside the dev
  container).

## Confirmed Decisions

- **Option A — backend-driven**: Express performs the OAuth authorization-code + PKCE
  exchange (MSAL Node) and issues a server session cookie. App registration platform =
  **Web** (uses a client secret). Chosen over an MSAL-React SPA approach.
- **Session-based authorization**: `req.session.userId` is the boundary; `requireAuth`
  middleware resolves it to `req.userId`.
- **Env vars collected**: `ENTRA_TENANT_SUBDOMAIN`, `ENTRA_CLIENT_ID`,
  `ENTRA_CLIENT_SECRET`, `ENTRA_REDIRECT_URI=http://localhost:3000/auth/callback`.

## Current State (investigated)

- `backend/index.js`: Express 5.1, `express-session` 1.18 with a **hardcoded**
  `"temporarySecretKey"`, wide-open `app.use(cors())`, only `/test`, `/route`, `/places`.
  Listens on port 3000.
- `backend/app/db/pool.js`: shared `pg` pool from env vars; exports
  `{ query, getClient, pool }`; `DB_SSL=false` disables SSL for local Postgres.
- `backend/app/repositories/UserRepository.js`: has `getUserByExternalId`, `createUser`,
  `updateUser` (`UPDATABLE_COLUMNS` includes `email`, `displayName`, `lastLogin`). **No
  `upsertByExternalId`** — this is the one real gap.
- Repository test pattern: `pool = { query: jest.fn() }`; assert SQL substrings + params;
  `logger` mocked. 74 tests currently passing.
- Frontend: CRA + Redux; `axios` to an absolute backend base (`getUrlBase()` in
  `RouteRequester`); frontend on `:3001`, backend on `:3000` (cross-origin). No
  client-side callback route needed — the backend handles `/auth/callback`.
- Cookie note: `localhost:3000` and `localhost:3001` are the **same site** (site =
  eTLD+1, port-agnostic), so a `sameSite=lax` cookie **is** sent on XHR. CORS must still
  use `credentials: true` with an explicit origin (not `*`), and axios needs
  `withCredentials: true`. (Alt: add a CRA `proxy` for same-origin dev.)

## Phase 1 — Backend Auth Foundation

1. Add dependencies to `backend/`: `@azure/msal-node`, `jose`.
2. **CREATE** `backend/config/auth.js`: MSAL `ConfidentialClientApplication`
   (`clientId`, `clientSecret`, `authority = https://<sub>.ciamlogin.com/`,
   `knownAuthorities`). Export `msalClient`, `authority`, and a `CryptoProvider` for
   PKCE/state. Also export a `jose` `JWKS` (`createRemoteJWKSet` on
   `authority + discovery/v2.0/keys`) for future bearer-token verification.
3. **`UserRepository.upsertByExternalId({ externalId, email, displayName })`**:
   `getUserByExternalId`; if found → `updateUser(user_id, { email, displayName, lastLogin: now })`;
   else `createUser`. Return the row. Add unit tests (found path, create path,
   update-on-login path).
4. **CREATE** `backend/app/routes/auth.js`:
   - `GET /auth/login`: PKCE (verifier + challenge) + state stored in `req.session` →
     `msalClient.getAuthCodeUrl({ scopes: [openid, profile, email], redirectUri,
     codeChallenge, codeChallengeMethod: "S256", state })` → `res.redirect`.
   - `GET /auth/callback`: validate `state`; `acquireTokenByCode({ code, scopes,
     redirectUri, codeVerifier })`; read `idTokenClaims { sub, email, name }`;
     `upsertByExternalId`; set `req.session.userId`; redirect to `FRONTEND_URL`.
   - `POST /auth/logout`: `req.session.destroy` → redirect to the Entra logout endpoint
     (`authority + oauth2/v2.0/logout?post_logout_redirect_uri=FRONTEND_URL`).
   - `GET /auth/me`: return the current user (`getUserById(req.session.userId)`) or 401 —
     lets the SPA know login state.
5. **CREATE** `backend/app/middleware/requireAuth.js`: if `req.session.userId` → set
   `req.userId` and `next()`; else `401 { error: "Unauthorized" }`.
6. **MODIFY** `backend/index.js`: `SESSION_SECRET` from env; `resave: false`;
   `saveUninitialized: false`; `cookie { httpOnly: true, sameSite: "lax", secure: prod,
   maxAge }`. Replace wide-open `cors()` with `{ origin: FRONTEND_URL, credentials: true }`.
   Mount the auth and API routes. Keep the existing `/route` and `/places`.

## Phase 2 — Prove the Chain (protected data route)

7. **CREATE** `backend/app/routes/trips.js`: `GET /api/trips` (behind `requireAuth`) →
   `TripRepository.getTripsByUserId(req.userId)`; optional `POST /api/trips`.
8. Composition: instantiate the pool + `UserRepository`/`TripRepository` once (small module
   or in `index.js`) and inject into the routes.

## Phase 3 — Frontend Login/Logout UI

9. On app load, call `GET /auth/me` (axios `withCredentials`) → store the user in
   Redux/state.
10. "Sign in" button → `window.location = ${backendBase}/auth/login` (full-page redirect).
    "Sign out" → `POST /auth/logout` then clear the user/redirect.
11. Header (`frontend/src/components/header/Header.jsx`) or a new `AuthButton`: show
    "Sign in" when logged out; display name + "Sign out" when logged in.
12. Set axios `withCredentials: true` (global or per auth call). Add
    `REACT_APP_BACKEND_URL` to `frontend/src/config/config.js` (currently only `NODE_ENV`
    and `GOOGLE_API_KEY`).

## Phase 4 — Config, Docs, Tests

13. **UPDATE** `backend/.env.example` (create if missing) and
    `.devcontainer/devcontainer.env.example` with `ENTRA_*` + `SESSION_SECRET` +
    `FRONTEND_URL` (placeholders / local values).
14. Reconcile docs: `docs/authentication/implementation-guide.md` references
    `app/models/User` and `Trip.findByUserId` → update to `repositories/UserRepository`
    and `getTripsByUserId`.
15. Tests: `upsertByExternalId` (repository); `requireAuth` (unit); auth routes (mock
    `msalClient` + upsert). Keep the existing 74 passing.

## Relevant Files

- `backend/index.js` — session/CORS hardening, mount routes.
- `backend/app/db/pool.js` — reuse the shared pool (no change).
- `backend/app/repositories/UserRepository.js` — add `upsertByExternalId` (+ `.test.js`).
- `backend/app/repositories/TripRepository.js` — reuse `getTripsByUserId`.
- **New**: `backend/config/auth.js`, `backend/app/routes/auth.js`,
  `backend/app/routes/trips.js`, `backend/app/middleware/requireAuth.js`.
- `frontend/src/config/config.js` — add backend URL; `frontend/src/App.js` /
  `frontend/src/components/header/Header.jsx` — auth UI.
- `docs/authentication/implementation-guide.md` — naming reconcile.

## Verification

1. `npm test` in `backend/` — new tests pass, 74 existing still green.
2. Manual E2E: start the stack → **Sign in** → Entra hosted sign-up → create a test
   account → callback → `GET /auth/me` returns the user → a row appears in `users` keyed
   by `external_id` → `GET /api/trips` returns `[]` scoped to that user → **Sign out**
   clears the session.
3. Confirm the session cookie is `httpOnly`, and an unauthenticated `GET /api/trips`
   returns 401.

## Further Considerations (decide during build)

1. **Logout scope** — full Entra logout (ends the IdP SSO session, user re-enters password
   next time) vs. local-only (clears the app session, Entra still remembers).
   **Recommendation: full Entra logout** for a true "logout" story.
2. **Session contents** — store `userId` only and fetch via `/auth/me` (DB = source of
   truth) vs. store the whole user object. **Recommendation: `userId` only.**
3. **Dev cross-origin cookie** — explicit CORS `origin` + `credentials: true`
   (**recommended**) vs. a CRA `proxy` for same-origin dev.
4. **Frontend state** — a small Redux auth reducer (matches the existing pattern,
   **recommended**) vs. local component state.

## Out of Scope (this pass)

- Google/social login. A second (prod) Entra tenant. Azure Key Vault wiring. DB
  migrations. Full trip/detour REST CRUD beyond the one proof route. Node version bump.
