import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.get('/api', (c) => {
  return c.json({ message: 'Ubiquitous Language System API' });
});

const port = process.env.PORT || 3001;

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
