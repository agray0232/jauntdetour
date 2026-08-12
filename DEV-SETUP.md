---
title: Development Scripts and Commands
description: Commands and environment setup for local JauntDetour development
author: JauntDetour Development Team
ms.date: 2026-08-12
ms.topic: how-to
---

## Quick Start

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them individually
npm run backend:dev
npm run frontend:dev
```

## Individual Commands

### Backend (Node.js/Express)

```bash
cd backend
npm install
npm run dev        # Start with nodemon (auto-restart)
npm start          # Start normally
```

### Frontend (React)

```bash
cd frontend
npm install
npm start          # Start development server on port 3001
npm run build      # Build for production
```

## Ports

- Backend API: http://localhost:3000
- Frontend Dev Server: http://localhost:3001
- Frontend Production Build: http://localhost:8080

## Environment Variables

Make sure to set these in your environment:

```bash
export GOOGLE_API_KEY=your_api_key_here
export NODE_ENV=development
export NODE_OPTIONS=--openssl-legacy-provider
```

Enable Places API (New) and the Directions API for `GOOGLE_API_KEY` in Google
Cloud. The backend uses Places API (New) for Start and Destination autocomplete.
The frontend map continues to use `REACT_APP_GOOGLE_API_KEY`.

## DevContainer Features

- Automatic dependency installation for both frontend and backend
- Port forwarding configured for all services
- VS Code extensions pre-installed for React/Node.js development
- Nodemon for backend auto-restart on file changes
- React fast refresh for frontend live reloading

## Local Database (Dev Container)

The dev container runs a PostgreSQL 14 sidecar (via `.devcontainer/docker-compose.yml`),
so you can develop against a local database with no Azure dependency or cost.

### First-time setup

1. Copy the environment template and add your Google Maps API key:
   ```bash
   cp .devcontainer/devcontainer.env.example .devcontainer/devcontainer.env
   # edit GOOGLE_API_KEY / REACT_APP_GOOGLE_API_KEY (DB_* values work as-is)
   ```
2. In VS Code, run **Dev Containers: Reopen in Container**. On first build the database
   is created and seeded automatically:
   - `01-schema.sql` loads the schema (tables, indexes, triggers, demo data).
   - `02-create-app-user.sql` creates the least-privilege `jauntdetour_app` user.
3. `npm run dev` starts the frontend and backend, which connect to the `db` service.

### Connecting to the database

- **From the app container:** host `db`, port `5432`.
- **From your host machine** (DBeaver, pgAdmin, psql): `localhost:5432`.
- The backend connects as `jauntdetour_app` (least privilege). The `dbadmin` superuser
  (password `localdev`) is used only for initialization.

### Resetting the database

Init scripts run only when the data volume is empty (first boot). To wipe and reseed (note: `-v` also removes `node_modules_*` volumes, so deps will reinstall on next start):

```bash
docker compose -f .devcontainer/docker-compose.yml down -v
```

Then rebuild/reopen the container.

## Development Tips

1. The backend will auto-restart when you change files (thanks to nodemon)
2. The frontend has fast refresh enabled for live updates
3. Both services can run simultaneously using `npm run dev`
4. The devcontainer automatically installs all dependencies when created
