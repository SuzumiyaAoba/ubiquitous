import { Hono } from 'hono';
import { contextService } from '../services/context.service';
import type { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

export const contextsRouter = new Hono();

/**
 * POST /api/contexts
 * Create a new bounded context
 */
contextsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateContextDto>();

    // Validate required fields
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const context = await contextService.createContext(body);
    return c.json(context, 201);
  } catch (error) {
    console.error('Error creating context:', error);
    const message = error instanceof Error ? error.message : 'Failed to create context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('already exists') ? 409 : 500);
  }
});

/**
 * GET /api/contexts
 * Get all bounded contexts
 */
contextsRouter.get('/', async (c) => {
  try {
    const contexts = await contextService.getAllContexts();
    return c.json(contexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    return c.json({ error: 'Failed to fetch contexts' }, 500);
  }
});

/**
 * GET /api/contexts/:id
 * Get a specific bounded context by ID
 */
contextsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const context = await contextService.getContextById(id);
    return c.json(context);
  } catch (error) {
    console.error('Error fetching context:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * GET /api/contexts/:id/terms
 * Get a context with all its associated terms
 */
contextsRouter.get('/:id/terms', async (c) => {
  try {
    const id = c.req.param('id');
    const contextWithTerms = await contextService.getContextWithTerms(id);
    return c.json(contextWithTerms);
  } catch (error) {
    console.error('Error fetching context with terms:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch context with terms';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * PUT /api/contexts/:id
 * Update a bounded context
 */
contextsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateContextDto>();

    const updated = await contextService.updateContext(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating context:', error);
    const message = error instanceof Error ? error.message : 'Failed to update context';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already exists')) status = 409;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * DELETE /api/contexts/:id
 * Delete a bounded context
 */
contextsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await contextService.deleteContext(id);
    return c.json({ message: 'Context deleted successfully' });
  } catch (error) {
    console.error('Error deleting context:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete context';
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    return c.json({ error: message }, status as any);
  }
});
