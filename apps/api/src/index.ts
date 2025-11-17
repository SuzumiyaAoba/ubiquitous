import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import 'dotenv/config';
import { db, terms, testConnection, closeConnection } from './db';
import { validateDbConfig } from './db/config';
import { contextsRouter } from './routes/contexts.routes';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (c) => {
  return c.json({ message: 'Ubiquitous Language System API' });
});

// Mount context routes
app.route('/api/contexts', contextsRouter);

// Terms endpoints (temporary, will be refactored later)
app.get('/api/terms', async (c) => {
  try {
    const allTerms = await db.select().from(terms);
    return c.json(allTerms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return c.json({ error: 'Failed to fetch terms' }, 500);
  }
});

const port = Number(process.env.PORT) || 3001;

// Initialize database connection
async function startServer() {
  try {
    validateDbConfig();
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    console.log(`Server is running on http://localhost:${port}`);
    
    serve({
      fetch: app.fetch,
      port,
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeConnection();
  process.exit(0);
});

startServer();
