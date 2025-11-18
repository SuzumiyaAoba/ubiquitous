import { Hono } from 'hono';
import { discussionService } from '../services/discussion.service';
import type { CreateTermProposalDto, UpdateTermProposalDto, ProposalStatus } from '../repositories/term-proposal.repository';

export const proposalsRouter = new Hono();

/**
 * POST /api/proposals
 * Create a new term proposal
 */
proposalsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateTermProposalDto>();

    // Validate required fields
    if (!body.name || !body.definition || !body.boundedContextId || !body.proposedBy) {
      return c.json(
        { error: 'name, definition, boundedContextId, and proposedBy are required' },
        400
      );
    }

    const proposal = await discussionService.createProposal(body);
    return c.json(proposal, 201);
  } catch (error) {
    console.error('Error creating proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to create proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already exists')) status = 409;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * GET /api/proposals
 * Get all proposals, optionally filtered by status
 */
proposalsRouter.get('/', async (c) => {
  try {
    const status = c.req.query('status') as ProposalStatus | undefined;

    // Validate status if provided
    if (status) {
      const validStatuses: ProposalStatus[] = ['pending', 'approved', 'rejected', 'on_hold'];
      if (!validStatuses.includes(status)) {
        return c.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    const proposals = await discussionService.getAllProposals(status);
    return c.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return c.json({ error: 'Failed to fetch proposals' }, 500);
  }
});

/**
 * GET /api/proposals/:id
 * Get a specific proposal by ID
 */
proposalsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const proposal = await discussionService.getProposalById(id);
    return c.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch proposal';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * PUT /api/proposals/:id
 * Update a proposal
 */
proposalsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTermProposalDto>();

    const updated = await discussionService.updateProposal(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to update proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('Cannot update')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * POST /api/proposals/:id/approve
 * Approve a proposal and create the term
 */
proposalsRouter.post('/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ approvedBy: string }>();

    if (!body.approvedBy) {
      return c.json({ error: 'approvedBy is required' }, 400);
    }

    const result = await discussionService.approveProposal(id, body.approvedBy);
    return c.json(result);
  } catch (error) {
    console.error('Error approving proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already') || error.message.includes('Cannot')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * POST /api/proposals/:id/reject
 * Reject a proposal
 */
proposalsRouter.post('/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ rejectionReason: string }>();

    if (!body.rejectionReason) {
      return c.json({ error: 'rejectionReason is required' }, 400);
    }

    const updated = await discussionService.rejectProposal(id, body.rejectionReason);
    return c.json(updated);
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('Cannot') || error.message.includes('already')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * POST /api/proposals/:id/hold
 * Put a proposal on hold
 */
proposalsRouter.post('/:id/hold', async (c) => {
  try {
    const id = c.req.param('id');
    const updated = await discussionService.putProposalOnHold(id);
    return c.json(updated);
  } catch (error) {
    console.error('Error putting proposal on hold:', error);
    const message = error instanceof Error ? error.message : 'Failed to put proposal on hold';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('Can only')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * DELETE /api/proposals/:id
 * Delete a proposal
 */
proposalsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await discussionService.deleteProposal(id);
    return c.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete proposal';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});
