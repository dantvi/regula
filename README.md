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
# Copy example env file
cp .env.example .env

# Edit .env with your local values (default values work for local dev)
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
# Generate migration files (first time or after schema changes)
pnpm --filter @regula/api db:generate

# Apply migrations to database
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
