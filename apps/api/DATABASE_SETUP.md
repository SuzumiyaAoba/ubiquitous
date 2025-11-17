# Database Setup Guide

## Quick Start

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ubiquitous_language;

# Exit psql
\q
```

### 3. Configure Environment

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ubiquitous_language
```

### 4. Generate and Run Migrations

Using Drizzle ORM:

```bash
# Generate migration files from schema definitions
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

You should see output like:
```
Starting database migrations...
✓ All migrations completed successfully
Migration process completed
```

**Alternative for development:**
```bash
# Push schema directly without generating migration files
npm run db:push
```

### 5. Verify Setup

Start the API server:
```bash
npm run dev
```

You should see:
```
Database connection test successful
Server is running on http://localhost:3001
```

## Database Schema Overview

The database includes 12 tables organized into functional groups:

### Core Domain Tables
- **bounded_contexts** - Organize terms by domain context
- **terms** - Store domain terminology with definitions
- **term_history** - Track all changes to terms
- **term_relationships** - Define relationships between terms

### Collaboration Tables
- **term_proposals** - Manage proposed new terms
- **discussion_threads** - Enable team discussions
- **comments** - Store discussion comments
- **reviews** - Track periodic term reviews

### Analytics & Learning
- **user_learning** - Track onboarding progress
- **user_activity** - Log user actions for analytics
- **code_analysis** - Store code-to-term analysis results
- **ai_analysis** - Store AI-powered analysis results

## Troubleshooting

### Connection Issues

If you see "Failed to connect to database":

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify credentials in `.env`

3. Test connection manually:
   ```bash
   psql -U postgres -d ubiquitous_language -c "SELECT NOW();"
   ```

### Migration Issues

If migrations fail:

1. Check the error message in the console
2. Verify database exists
3. Ensure you have proper permissions
4. Check Drizzle's migration tracking table:
   ```sql
   SELECT * FROM __drizzle_migrations;
   ```

To reset and rerun migrations:
```bash
# Drop and recreate database
dropdb ubiquitous_language
createdb ubiquitous_language

# Generate and run migrations again
npm run db:generate
npm run db:migrate
```

### Using Drizzle Studio

Explore and manage your database visually:

```bash
npm run db:studio
```

This opens a web interface where you can:
- Browse all tables and data
- Run queries
- Edit records
- View relationships

## Next Steps

After setting up the database:

1. Implement repository patterns for data access
2. Create service layer for business logic
3. Build API endpoints
4. Add authentication and authorization

See the main tasks.md file for the complete implementation plan.
