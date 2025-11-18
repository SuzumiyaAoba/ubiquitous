import { Hono } from 'hono';
import { termService } from '../services/term.service';
import type { CreateTermDto, UpdateTermDto, AddTermToContextDto } from '../repositories/term.repository';

export const termsRouter = new Hono();

/**
 * POST /api/terms
 * Create a new term
 */
termsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateTermDto & { createdBy?: string }>();

    // Validate required fields
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const { createdBy, ...termData } = body;
    const term = await termService.createTerm(termData, createdBy);
    return c.json(term, 201);
  } catch (error) {
    console.error('Error creating term:', error);
    const message = error instanceof Error ? error.message : 'Failed to create term';
    return c.json({ error: message }, error instanceof Error && error.message.includes('already exists') ? 409 : 500);
  }
});

/**
 * GET /api/terms
 * Get all terms
 */
termsRouter.get('/', async (c) => {
  try {
    const contextId = c.req.query('contextId');
    const search = c.req.query('search');

    let terms;
    if (contextId) {
      terms = await termService.getTermsByContext(contextId);
    } else if (search) {
      terms = await termService.searchTerms(search);
    } else {
      terms = await termService.getAllTerms();
    }

    return c.json(terms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return c.json({ error: 'Failed to fetch terms' }, 500);
  }
});

/**
 * GET /api/terms/:id
 * Get a specific term by ID
 */
termsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const includeContexts = c.req.query('includeContexts') === 'true';

    const term = includeContexts
      ? await termService.getTermWithContexts(id)
      : await termService.getTermById(id);

    return c.json(term);
  } catch (error) {
    console.error('Error fetching term:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch term';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * PUT /api/terms/:id
 * Update a term
 */
termsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTermDto & { changedBy?: string; changeReason?: string }>();

    const { changedBy, changeReason, ...termData } = body;
    const updated = await termService.updateTerm(id, termData, changedBy, changeReason);

    return c.json(updated);
  } catch (error) {
    console.error('Error updating term:', error);
    const message = error instanceof Error ? error.message : 'Failed to update term';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already exists')) status = 409;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * DELETE /api/terms/:id
 * Delete a term
 */
termsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const permanent = c.req.query('permanent') === 'true';

    await termService.deleteTerm(id, permanent);
    return c.json({ message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Error deleting term:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete term';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * GET /api/terms/:id/history
 * Get term history
 */
termsRouter.get('/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    const history = await termService.getTermHistory(id);
    return c.json(history);
  } catch (error) {
    console.error('Error fetching term history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch term history';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * POST /api/terms/:id/contexts
 * Add a term to a context
 */
termsRouter.post('/:id/contexts', async (c) => {
  try {
    const termId = c.req.param('id');
    const body = await c.req.json<Omit<AddTermToContextDto, 'termId'> & { changedBy?: string }>();

    // Validate required fields
    if (!body.contextId || !body.definition) {
      return c.json({ error: 'Context ID and definition are required' }, 400);
    }

    const { changedBy, ...data } = body;
    const termContext = await termService.addTermToContext(
      { ...data, termId },
      changedBy
    );

    return c.json(termContext, 201);
  } catch (error) {
    console.error('Error adding term to context:', error);
    const message = error instanceof Error ? error.message : 'Failed to add term to context';
    const status = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
    return c.json({ error: message }, status as any);
  }
});

/**
 * PUT /api/terms/:id/contexts/:contextId
 * Update term definition in a specific context
 */
termsRouter.put('/:id/contexts/:contextId', async (c) => {
  try {
    const termId = c.req.param('id');
    const contextId = c.req.param('contextId');
    const body = await c.req.json<{ definition: string; examples?: string; changedBy?: string }>();

    if (!body.definition) {
      return c.json({ error: 'Definition is required' }, 400);
    }

    const updated = await termService.updateTermInContext(
      termId,
      contextId,
      body.definition,
      body.examples,
      body.changedBy
    );

    return c.json(updated);
  } catch (error) {
    console.error('Error updating term in context:', error);
    const message = error instanceof Error ? error.message : 'Failed to update term in context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * DELETE /api/terms/:id/contexts/:contextId
 * Remove a term from a context
 */
termsRouter.delete('/:id/contexts/:contextId', async (c) => {
  try {
    const termId = c.req.param('id');
    const contextId = c.req.param('contextId');

    await termService.removeTermFromContext(termId, contextId);
    return c.json({ message: 'Term removed from context successfully' });
  } catch (error) {
    console.error('Error removing term from context:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove term from context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});
