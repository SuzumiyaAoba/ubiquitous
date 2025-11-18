# Docker Setup Guide

This guide explains how to run the development environment using Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Services

The `docker-compose.yml` file defines two services:

### PostgreSQL
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: ubiquitous_language
- **Credentials**:
  - Username: postgres
  - Password: postgres

### MeiliSearch
- **Image**: getmeili/meilisearch:v1.5
- **Port**: 7700
- **Master Key**: masterKey
- **Environment**: development

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

This command will:
- Pull the necessary Docker images if not already downloaded
- Create and start both PostgreSQL and MeiliSearch containers
- Create persistent volumes for data storage

### 2. Verify Services are Running

```bash
docker-compose ps
```

You should see both services with status "Up".

### 3. Check Service Health

PostgreSQL:
```bash
docker-compose exec postgres pg_isready -U postgres
```

MeiliSearch:
```bash
curl http://localhost:7700/health
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f meilisearch
```

## Managing Services

### Stop Services

```bash
docker-compose stop
```

### Start Stopped Services

```bash
docker-compose start
```

### Restart Services

```bash
docker-compose restart
```

### Stop and Remove Services

```bash
docker-compose down
```

### Stop and Remove Services with Volumes (⚠️ This will delete all data!)

```bash
docker-compose down -v
```

## Accessing Services

### PostgreSQL

Using psql:
```bash
docker-compose exec postgres psql -U postgres -d ubiquitous_language
```

Using a database client:
- Host: localhost
- Port: 5432
- Database: ubiquitous_language
- Username: postgres
- Password: postgres

### MeiliSearch

Web interface:
```
http://localhost:7700
```

API:
```bash
curl http://localhost:7700/health
```

## Data Persistence

Data is persisted using Docker volumes:
- `postgres_data` - PostgreSQL database files
- `meilisearch_data` - MeiliSearch index files

These volumes persist even after `docker-compose down`, ensuring your data is not lost.

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. Check what's using the port:
   ```bash
   lsof -i :5432  # for PostgreSQL
   lsof -i :7700  # for MeiliSearch
   ```

2. Either stop the conflicting service or modify `docker-compose.yml` to use different ports:
   ```yaml
   ports:
     - "5433:5432"  # Changed from 5432:5432
   ```

### Connection Refused

If the API can't connect to the services:

1. Ensure services are running:
   ```bash
   docker-compose ps
   ```

2. Check service logs:
   ```bash
   docker-compose logs postgres
   docker-compose logs meilisearch
   ```

3. Verify environment variables in `apps/api/.env` match the Docker Compose configuration.

### Reset Everything

To completely reset the development environment:

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Remove all Docker images (optional)
docker-compose down --rmi all -v

# Start fresh
docker-compose up -d
```

## Production Considerations

⚠️ **This Docker Compose configuration is for DEVELOPMENT ONLY!**

For production:
- Use strong, unique passwords
- Enable SSL/TLS for PostgreSQL
- Configure proper MeiliSearch API keys
- Use production-grade images
- Set up proper backup strategies
- Configure resource limits
- Use Docker secrets for sensitive data
- Set up monitoring and logging
