import { Hono } from 'hono';
import { ContextService } from '../services/context.service';
import { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

const contexts = new Hono();
const contextService = new ContextService();

// POST /api/contexts - Create a new context
contexts.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateContextDto>();

    // Validate required fields
    if (!body.name || !body.description) {
      return c.json({ error: 'Name and description are required' }, 400);
    }

    // TODO: Get userId from authentication middleware
    const userId = 'system'; // Temporary placeholder

    const context = await contextService.createContext(body, userId);
    return c.json(context, 201);
  } catch (error) {
    console.error('Error creating context:', error);
    return c.json({ error: 'Failed to create context' }, 500);
  }
});

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

// GET /api/contexts/:id - Get a specific context
contexts.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const context = await contextService.getContext(id);
    return c.json(context);
  } catch (error) {
    if (error instanceof Error && error.message === 'Context not found') {
      return c.json({ error: 'Context not found' }, 404);
    }
    console.error('Error fetching context:', error);
    return c.json({ error: 'Failed to fetch context' }, 500);
  }
});

// GET /api/contexts/:id/terms - Get a context with its terms
contexts.get('/:id/terms', async (c) => {
  try {
    const id = c.req.param('id');
    const contextWithTerms = await contextService.getContextWithTerms(id);
    return c.json(contextWithTerms);
  } catch (error) {
    if (error instanceof Error && error.message === 'Context not found') {
      return c.json({ error: 'Context not found' }, 404);
    }
    console.error('Error fetching context with terms:', error);
    return c.json({ error: 'Failed to fetch context with terms' }, 500);
  }
});

// PUT /api/contexts/:id - Update a context
contexts.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateContextDto>();

    const context = await contextService.updateContext(id, body);
    return c.json(context);
  } catch (error) {
    if (error instanceof Error && error.message === 'Context not found') {
      return c.json({ error: 'Context not found' }, 404);
    }
    console.error('Error updating context:', error);
    return c.json({ error: 'Failed to update context' }, 500);
  }
});

export default contexts;
