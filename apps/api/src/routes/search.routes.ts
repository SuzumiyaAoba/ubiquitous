import { Hono } from 'hono';
import { searchService } from '../services/search.service';

export const searchRouter = new Hono();

/**
 * GET /api/search
 * Search for terms
 */
searchRouter.get('/', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const contextId = c.req.query('contextId');
    const status = c.req.query('status');

    if (!query) {
      return c.json({ error: 'Query parameter "q" is required' }, 400);
    }

    const results = await searchService.searchTerms(query, {
      limit,
      offset,
      contextId,
      status,
    });

    return c.json(results);
  } catch (error) {
    console.error('Error searching terms:', error);
    return c.json({ error: 'Failed to search terms' }, 500);
  }
});

/**
 * GET /api/search/suggestions
 * Get autocomplete suggestions
 */
searchRouter.get('/suggestions', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const limit = parseInt(c.req.query('limit') || '5', 10);

    if (!query) {
      return c.json({ error: 'Query parameter "q" is required' }, 400);
    }

    const suggestions = await searchService.getSuggestions(query, limit);
    return c.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return c.json({ error: 'Failed to get suggestions' }, 500);
  }
});

/**
 * POST /api/search/index/rebuild
 * Rebuild the entire search index
 */
searchRouter.post('/index/rebuild', async (c) => {
  try {
    const count = await searchService.rebuildIndex();
    return c.json({
      message: 'Index rebuilt successfully',
      indexedTerms: count,
    });
  } catch (error) {
    console.error('Error rebuilding index:', error);
    return c.json({ error: 'Failed to rebuild index' }, 500);
  }
});

/**
 * GET /api/search/index/stats
 * Get search index statistics
 */
searchRouter.get('/index/stats', async (c) => {
  try {
    const stats = await searchService.getIndexStats();
    return c.json(stats);
  } catch (error) {
    console.error('Error getting index stats:', error);
    return c.json({ error: 'Failed to get index stats' }, 500);
  }
});

/**
 * POST /api/search/index/term/:id
 * Index a specific term
 */
searchRouter.post('/index/term/:id', async (c) => {
  try {
    const termId = c.req.param('id');
    await searchService.indexTerm(termId);
    return c.json({ message: 'Term indexed successfully' });
  } catch (error) {
    console.error('Error indexing term:', error);
    return c.json({ error: 'Failed to index term' }, 500);
  }
});

/**
 * GET /api/search/health
 * Check MeiliSearch connection
 */
searchRouter.get('/health', async (c) => {
  try {
    const isHealthy = await searchService.testConnection();
    return c.json({
      healthy: isHealthy,
      service: 'MeiliSearch',
    }, isHealthy ? 200 : 503);
  } catch (error) {
    console.error('Error checking MeiliSearch health:', error);
    return c.json({
      healthy: false,
      service: 'MeiliSearch',
      error: 'Connection failed',
    }, 503);
  }
});
