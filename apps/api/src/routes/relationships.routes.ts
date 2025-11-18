import { Hono } from 'hono';
import { relationshipService } from '../services/relationship.service';
import type { CreateTermRelationshipDto, UpdateTermRelationshipDto, RelationshipType } from '../repositories/term-relationship.repository';

export const relationshipsRouter = new Hono();

/**
 * POST /api/relationships
 * Create a new relationship between terms
 */
relationshipsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateTermRelationshipDto>();

    // Validate required fields
    if (!body.sourceTermId || !body.targetTermId || !body.relationshipType) {
      return c.json(
        { error: 'sourceTermId, targetTermId, and relationshipType are required' },
        400
      );
    }

    // Validate relationship type
    const validTypes: RelationshipType[] = ['synonym', 'antonym', 'related', 'parent', 'child'];
    if (!validTypes.includes(body.relationshipType)) {
      return c.json(
        { error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}` },
        400
      );
    }

    const relationship = await relationshipService.createRelationship(body);
    return c.json(relationship, 201);
  } catch (error) {
    console.error('Error creating relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to create relationship';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already exists')) status = 409;
      else if (error.message.includes('circular dependency') || error.message.includes('itself')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * GET /api/relationships/:id
 * Get a specific relationship by ID
 */
relationshipsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const relationship = await relationshipService.getRelationshipById(id);
    return c.json(relationship);
  } catch (error) {
    console.error('Error fetching relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch relationship';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * PUT /api/relationships/:id
 * Update a relationship
 */
relationshipsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTermRelationshipDto>();

    // Validate relationship type if provided
    if (body.relationshipType) {
      const validTypes: RelationshipType[] = ['synonym', 'antonym', 'related', 'parent', 'child'];
      if (!validTypes.includes(body.relationshipType)) {
        return c.json(
          { error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}` },
          400
        );
      }
    }

    const updated = await relationshipService.updateRelationship(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to update relationship';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('circular dependency')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * DELETE /api/relationships/:id
 * Delete a relationship
 */
relationshipsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await relationshipService.deleteRelationship(id);
    return c.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete relationship';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/terms/:id/relationships
 * Get all relationships for a specific term
 */
relationshipsRouter.get('/terms/:termId', async (c) => {
  try {
    const termId = c.req.param('termId');
    const includeDetails = c.req.query('includeDetails') === 'true';

    if (includeDetails) {
      const result = await relationshipService.getTermWithRelationships(termId);
      return c.json(result);
    } else {
      const relationships = await relationshipService.getRelationshipsForTerm(termId);
      return c.json(relationships);
    }
  } catch (error) {
    console.error('Error fetching term relationships:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch term relationships';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/terms/:id/relationships/:type
 * Get related terms by relationship type
 */
relationshipsRouter.get('/terms/:termId/type/:type', async (c) => {
  try {
    const termId = c.req.param('termId');
    const type = c.req.param('type') as RelationshipType;

    // Validate relationship type
    const validTypes: RelationshipType[] = ['synonym', 'antonym', 'related', 'parent', 'child'];
    if (!validTypes.includes(type)) {
      return c.json(
        { error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}` },
        400
      );
    }

    const relatedTerms = await relationshipService.getRelatedTermsByType(termId, type);
    return c.json(relatedTerms);
  } catch (error) {
    console.error('Error fetching related terms:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch related terms';
    return c.json({ error: message }, 500);
  }
});

/**
 * DELETE /api/relationships/between/:sourceId/:targetId
 * Delete relationship between two specific terms
 */
relationshipsRouter.delete('/between/:sourceId/:targetId', async (c) => {
  try {
    const sourceId = c.req.param('sourceId');
    const targetId = c.req.param('targetId');

    await relationshipService.deleteRelationshipBetweenTerms(sourceId, targetId);
    return c.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete relationship';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/contexts/:contextId/diagram
 * Get diagram data for visualizing term relationships in a context
 */
relationshipsRouter.get('/contexts/:contextId/diagram', async (c) => {
  try {
    const contextId = c.req.param('contextId');
    const diagramData = await relationshipService.getDiagramDataForContext(contextId);
    return c.json(diagramData);
  } catch (error) {
    console.error('Error fetching diagram data:', error);
    return c.json({ error: 'Failed to fetch diagram data' }, 500);
  }
});

/**
 * GET /api/relationships/hierarchy
 * Get term hierarchy (parent-child relationships)
 */
relationshipsRouter.get('/hierarchy', async (c) => {
  try {
    const rootTermId = c.req.query('rootTermId');
    const hierarchy = await relationshipService.getTermHierarchy(rootTermId);
    return c.json(hierarchy);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return c.json({ error: 'Failed to fetch hierarchy' }, 500);
  }
});
