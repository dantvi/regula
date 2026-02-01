# regula
Regula is an AI-powered policy and data copilot built on Swedish public regulations and statistics, designed to demonstrate production-grade RAG, tool integration, and governance-focused AI architecture.

## Monorepo Structure

This project is organized as a public monorepo using pnpm workspaces:

- **apps/api**: Backend service (AI orchestration, RAG, SCB tool integration, auth, quotas)
- **apps/web**: Next.js/React frontend application (demo/UI layer)
- **packages/shared**: Shared types and utilities
- **packages/rag**: RAG retrieval layer
- **packages/ingestion**: AFS document ingestion pipeline
- **packages/scb**: SCB API tool integration
- **packages/observability**: Logging and tracing
- **packages/evals**: Evaluation framework

## Getting Started

Install dependencies:
```bash
pnpm install
```

Build all packages and apps:
```bash
pnpm -r build
```

Run the API server:
```bash
pnpm --filter @regula/api dev
```

Run the web app:
```bash
pnpm --filter @regula/web dev
```
