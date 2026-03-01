# regula

Regula is an AI-powered policy and data copilot built on Swedish public regulations and statistics, designed to demonstrate production-grade RAG, tool integration, and governance-focused AI architecture.

## Monorepo Structure

This project is organized as a public monorepo using pnpm workspaces:

- **apps/api**: Backend service (AI orchestration, RAG, SCB tool integration, auth, quotas)
- **apps/web**: Next.js/React frontend application (demo/UI layer)
- **packages/config**: Configuration loader with validation
- **packages/shared**: Shared types and utilities
- **packages/rag**: RAG retrieval layer
- **packages/ingestion**: AFS document ingestion pipeline
- **packages/scb**: SCB API tool integration
- **packages/observability**: Logging and tracing
- **packages/evals**: Evaluation framework

## Tech Stack

- **Database**: PostgreSQL + pgvector (local via Docker, production via managed Postgres)
- **Backend**: Node.js + TypeScript
- **Frontend**: Next.js + React + styled-components
- **Monorepo**: pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose (for local database)

### Setup

1. **Install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

3. **Start PostgreSQL (Docker):**

```bash
cd infra/docker
docker compose up -d
cd ../..
```

4. **Build all packages:**

```bash
pnpm -r build
```

5. **Run database migrations:**

```bash
pnpm --filter @regula/api db:generate
pnpm --filter @regula/api db:migrate
```

6. **Run the API server:**

```bash
pnpm --filter @regula/api dev
```

7. **Run the web app (in a separate terminal):**

```bash
pnpm --filter @regula/web dev
```

### Database Management

**View database with Drizzle Studio:**

```bash
pnpm --filter @regula/api db:studio
```

**Stop database:**

```bash
cd infra/docker
docker compose down
```

**Wipe database and start fresh:**

```bash
cd infra/docker
docker compose down -v
docker compose up -d
cd ../..
pnpm --filter @regula/api db:migrate
```

### Auth testing

With the API running (`pnpm --filter @regula/api dev`), you can exercise auth with curl. The API uses a session cookie `regula_session` (HttpOnly, SameSite=Lax).

**Register**

```bash
curl -i -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword10","preferred_language":"en"}'
```

Use a password of at least 10 characters. Optional `preferred_language` is `sv` or `en` (default `sv`).

**Login**

```bash
curl -i -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword10"}'
```

Save the `Set-Cookie` header from the response to send the session on later requests.

**Me (with cookie jar)**

```bash
curl -c cookies.txt -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword10"}'

curl -b cookies.txt http://localhost:3001/auth/me
```

**Update language (PATCH settings)**

```bash
curl -b cookies.txt -X PATCH http://localhost:3001/settings \
  -H "Content-Type: application/json" \
  -d '{"preferred_language":"sv"}'
```

**Logout**

```bash
curl -b cookies.txt -X POST http://localhost:3001/auth/logout
```

### Quota and usage

Authenticated endpoints that consume quota (e.g. `PATCH /settings`) are limited per user per period. Defaults: 200 requests per 30 days. Configure in `.env`:

- `QUOTA_PERIOD_DAYS` (default: 30)
- `DEMO_REQUEST_LIMIT` (default: 200). Set to a small value (e.g. `2`) to test quota quickly.

**Check current usage (does not consume quota)**

```bash
curl -b cookies.txt http://localhost:3001/usage/me
```

Response shape: `period_start`, `period_end`, `request_limit`, `requests_used`, `remaining_requests`.

**Trigger quota (429)**

After login, call `PATCH /settings` until `remaining_requests` is 0, then one more request returns 429 with `quota.exceeded`:

```bash
curl -b cookies.txt -X PATCH http://localhost:3001/settings \
  -H "Content-Type: application/json" \
  -d '{"preferred_language":"en"}'
```
