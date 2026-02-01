# Docker Infrastructure

## Local Development Database

This directory contains Docker Compose configuration for local Postgres + pgvector database.

### Commands

Start the database:
```bash
docker compose up -d
```

Stop the database:
```bash
docker compose down
```

Stop and wipe all data:
```bash
docker compose down -v
```

Check database status:
```bash
docker compose ps
```

View logs:
```bash
docker compose logs -f postgres
```

### Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: regula_dev
- **User**: regula
- **Password**: dev_password
- **Connection URL**: `postgresql://regula:dev_password@localhost:5432/regula_dev`
