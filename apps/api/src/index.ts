import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import 'dotenv/config';
import { testConnection, closeConnection } from './db';
import { validateDbConfig } from './db/config';
import { contextsRouter } from './routes/contexts.routes';
import { termsRouter } from './routes/terms.routes';
import { searchRouter } from './routes/search.routes';
import { relationshipsRouter } from './routes/relationships.routes';
import { proposalsRouter } from './routes/proposals.routes';
import { discussionsRouter } from './routes/discussions.routes';
import { reviewsRouter } from './routes/reviews.routes';
import { onboardingRouter } from './routes/onboarding.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { exportImportRouter } from './routes/export-import.routes';
import { termService } from './services/term.service';
import { searchService } from './services/search.service';

// Set up search service integration with term service
termService.setSearchService(searchService);

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
app.route('/api/terms', termsRouter);
app.route('/api/search', searchRouter);
app.route('/api/relationships', relationshipsRouter);
app.route('/api/proposals', proposalsRouter);
app.route('/api/discussions', discussionsRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/onboarding', onboardingRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api', exportImportRouter);

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
