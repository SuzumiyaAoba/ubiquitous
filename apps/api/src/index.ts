import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { db, terms } from './db';
import contextsRouter from './routes/contexts';

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

// Mount routers
app.route('/api/contexts', contextsRouter);

// Terms endpoints
app.get('/api/terms', async (c) => {
  try {
    const allTerms = await db.select().from(terms);
    return c.json(allTerms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return c.json({ error: 'Failed to fetch terms' }, 500);
  }
});

const port = process.env.PORT || 3001;

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
