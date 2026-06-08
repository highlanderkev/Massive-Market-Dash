# Massive Market Dash

Massive Market Dash is a monorepo for building market dashboards and supporting API/data services.

## Workspace overview

- `artifacts/market-dashboard` — React + Vite market dashboard app
- `artifacts/mockup-sandbox` — UI sandbox for mockups and component experiments
- `artifacts/api-server` — Express API server
- `artifacts/dashboard` — Streamlit dashboard prototype
- `lib/api-spec` — OpenAPI/Orval code generation package
- `lib/api-zod` — shared Zod API schemas
- `lib/api-client-react` — generated React Query API client package
- `lib/db` — Drizzle/Postgres database package
- `scripts` — workspace utility scripts

## Prerequisites

- Node.js 24+
- `pnpm` (workspace package manager)
- Python 3.11+ (for Streamlit dashboard work)

## Install

```bash
pnpm install
```

## Common commands

```bash
pnpm run typecheck
pnpm run build
```

Run individual apps/services:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/market-dashboard run dev
pnpm --filter @workspace/mockup-sandbox run dev
```

Run the Streamlit dashboard prototype:

```bash
streamlit run artifacts/dashboard/app.py
```

## Environment variables

- `PORT` — required by the API server and Vite dashboards
- `BASE_PATH` — required by Vite dashboards
- `DATABASE_URL` — required by `@workspace/db` and API server DB usage
- `MASSIVE_API_KEY` — used by Streamlit dashboard prototypes

## API code generation

```bash
pnpm --filter @workspace/api-spec run codegen
```
