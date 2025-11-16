import { Hono } from 'hono';
import { contextService } from '../services/context.service';
import type { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

const contexts = new Hono();

// GET /api/contexts - Get all contexts
contexts.get('/', async (c) => {
  try {
    const allContexts = await contextService.getAllContexts();
    return c.json(allContexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    return c.json({ error: 'Failed to fetch contexts' }, 500);
  }
});

// GET /api/contexts/:id - Get specific context
contexts.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const context = await contextService.getContext(id);
    return c.json(context);
  } catch (error: any) {
    console.error('Error fetching context:', error);
    if (error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: 'Failed to fetch context' }, 500);
  }
});

// GET /api/contexts/:id/terms - Get context with terms
contexts.get('/:id/terms', async (c) => {
  try {
    const id = c.req.param('id');
    const contextWithTerms = await contextService.getContextWithTerms(id);
    return c.json(contextWithTerms);
  } catch (error: any) {
    console.error('Error fetching context with terms:', error);
    if (error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: 'Failed to fetch context with terms' }, 500);
  }
});

// POST /api/contexts - Create context
contexts.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateContextDto>();

    // Validation
    if (!body.name || body.name.trim() === '') {
      return c.json({ error: 'Name is required' }, 400);
    }

    // TODO: Get userId from authentication
    const userId = 'system';

    const context = await contextService.createContext(body, userId);
    return c.json(context, 201);
  } catch (error) {
    console.error('Error creating context:', error);
    return c.json({ error: 'Failed to create context' }, 500);
  }
});

// PUT /api/contexts/:id - Update context
contexts.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateContextDto>();

    const context = await contextService.updateContext(id, body);
    return c.json(context);
  } catch (error: any) {
    console.error('Error updating context:', error);
    if (error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: 'Failed to update context' }, 500);
  }
});

// DELETE /api/contexts/:id - Delete context
contexts.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await contextService.deleteContext(id);
    return c.json({ message: 'Context deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting context:', error);
    if (error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: 'Failed to delete context' }, 500);
  }
});

export default contexts;
