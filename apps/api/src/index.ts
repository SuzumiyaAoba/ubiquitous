import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import 'dotenv/config';
import { db, terms } from './db';

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

const port = Number(process.env.PORT) || 3001;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
