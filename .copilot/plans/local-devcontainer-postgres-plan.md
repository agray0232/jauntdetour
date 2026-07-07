<!-- markdownlint-disable-file -->
# Plan: Local Dev Container with PostgreSQL Sidecar

## Goal

Convert the single-image dev container into a Docker Compose setup with the existing
`app` service plus a `postgres:14` `db` sidecar, so local full-stack development runs
against a containerized database (no Azure, no cost). No application code changes are
required — `backend/app/db/pool.js` already honors `DB_SSL=false`, and `.env.example`
already documents the `DB_*` variables.

## Branch Workflow (do first)

1. PR the current branch (`49-database-initialization`: repositories, Husky, `.vscode`, formatting).
2. After merge:

   ```bash
   git checkout main && git pull && git checkout -b feature/local-devcontainer-postgres
   ```

   Do all the work below on that new branch.

## Current State (investigated)

- `.devcontainer/devcontainer.json`: single `image`
  (`mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye`), features git + gh,
  `forwardPorts` 3000/3001/8080, `postCreateCommand` commented out, and
  `runArgs: ["--env-file", ".devcontainer/devcontainer.env"]`.
- `.devcontainer/devcontainer.env` EXISTS (gitignored): `GOOGLE_API_KEY`,
  `REACT_APP_GOOGLE_API_KEY`, `NODE_ENV`, `NODE_OPTIONS`, `BACKEND_PORT`,
  `FRONTEND_PORT`, and a commented `DATABASE_URL` placeholder.
- SECURITY: the Google API key value appears in git history (6 commits, some pushed).
  Rotate the key before continuing.
- `backend/` and `frontend/` have PRODUCTION Dockerfiles — separate concern; do NOT
  reuse them for the dev container.
- Schema lives at `docs/database/schema.sql` (PostgreSQL 14; includes demo data,
  which is acceptable for local dev).

## Files to Create / Modify

1. CREATE `.devcontainer/docker-compose.yml`
   - Service `app`: image `mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye`;
     `command: sleep infinity`; bind-mount `..:/workspaces/jauntdetour`;
     `env_file: devcontainer.env`; `depends_on: db` (condition `service_healthy`);
     shared network.
   - Service `db`: image `postgres:14`; environment `POSTGRES_USER=dbadmin`,
     `POSTGRES_PASSWORD=localdev`, `POSTGRES_DB=jauntdetour`; volume
     `pgdata:/var/lib/postgresql/data`; mount
     `../docs/database/schema.sql -> /docker-entrypoint-initdb.d/init.sql:ro`
     (auto-load on first init only); `ports: 5432:5432`; healthcheck
     `pg_isready -U dbadmin`.
   - Volumes: `pgdata` (named; persists across restarts).
2. MODIFY `.devcontainer/devcontainer.json`
   - Remove `image` and `runArgs` (`--env-file`); env now flows via Compose `env_file`.
   - Add `dockerComposeFile: "docker-compose.yml"`, `service: "app"`,
     `workspaceFolder: "/workspaces/jauntdetour"`.
   - Keep features, customizations (extensions/settings), `portsAttributes`.
   - `forwardPorts`: add `5432` (host DB GUI tools); keep 3000/3001/8080.
   - Re-enable `postCreateCommand`:
     `npm install --prefix ./backend && npm install --prefix ./frontend && npm install`.
3. MODIFY `.devcontainer/devcontainer.env` (gitignored) — add:
   `DB_HOST=db`, `DB_PORT=5432`, `DB_NAME=jauntdetour`, `DB_USER=dbadmin`,
   `DB_PASSWORD=localdev`, `DB_SSL=false`.
4. CREATE `.devcontainer/devcontainer.env.example` (committed) — same keys, placeholder
   secrets, so teammates know what to fill in. Ensure the real `devcontainer.env` stays
   gitignored.
5. (Optional) Update `DEV-SETUP.md` / `README.md` with "Open in Dev Container"
   local-DB instructions.

## Key Decisions / Considerations

- Pin `postgres:14` to match Azure + the schema.
- `node_modules`: bind-mounting the workspace is simplest; if host/container
  native-module conflicts appear, switch to a named volume for `node_modules`
  (decide during implementation).
- `depends_on` with `service_healthy` + a healthcheck so the backend never races the DB.
- Schema auto-load runs ONLY when the `pgdata` volume is empty (first create); demo
  data is included.
- Reset the DB: `docker compose down -v` (wipes `pgdata`), then reopen/rebuild.
- Local DB credentials are throwaway/local-only — safe to keep in the compose/env file.
- Do NOT reuse the production `backend`/`frontend` Dockerfiles for the dev container.
- Windows: ensure any mounted `.sql`/scripts use LF line endings.

## Verification

1. Dev Containers: Rebuild and Reopen in Container — builds `app` + `db`.
2. `docker compose ps` (or VS Code) shows `db` healthy.
3. From the `app` container:
   `psql -h db -U dbadmin -d jauntdetour -c "\dt"` shows `users`/`trips`/`detours`;
   `SELECT email FROM users;` returns `demo@jauntdetour.com`.
4. Backend: with `DB_*` env set, run a quick query (or start the backend) — connects,
   no SSL error.
5. Frontend: `npm start` serves on 3001; forwarded.
6. Persistence: restart the container — data remains. `down -v` resets and reloads schema.
7. Confirm `devcontainer.env` is NOT tracked (`git check-ignore`) and the `.example` IS tracked.
