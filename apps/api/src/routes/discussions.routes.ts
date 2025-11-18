import { Hono } from 'hono';
import { discussionService } from '../services/discussion.service';
import type {
  CreateDiscussionThreadDto,
  UpdateDiscussionThreadDto,
  CreateCommentDto,
  UpdateCommentDto,
  ThreadStatus,
} from '../repositories/discussion.repository';

export const discussionsRouter = new Hono();

// ===== Thread Endpoints =====

/**
 * POST /api/discussions/threads
 * Create a new discussion thread
 */
discussionsRouter.post('/threads', async (c) => {
  try {
    const body = await c.req.json<CreateDiscussionThreadDto>();

    // Validate required fields
    if (!body.title || !body.createdBy) {
      return c.json({ error: 'title and createdBy are required' }, 400);
    }

    if (!body.termId && !body.proposalId) {
      return c.json({ error: 'Either termId or proposalId must be provided' }, 400);
    }

    const thread = await discussionService.createThread(body);
    return c.json(thread, 201);
  } catch (error) {
    console.error('Error creating thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to create thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/discussions/threads
 * Get all threads, optionally filtered by status
 */
discussionsRouter.get('/threads', async (c) => {
  try {
    const status = c.req.query('status') as ThreadStatus | undefined;
    const termId = c.req.query('termId');
    const proposalId = c.req.query('proposalId');

    // Validate status if provided
    if (status) {
      const validStatuses: ThreadStatus[] = ['open', 'closed'];
      if (!validStatuses.includes(status)) {
        return c.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    let threads;
    if (termId) {
      threads = await discussionService.getThreadsForTerm(termId);
    } else if (proposalId) {
      threads = await discussionService.getThreadsForProposal(proposalId);
    } else {
      threads = await discussionService.getAllThreads(status);
    }

    return c.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch threads';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/discussions/threads/:id
 * Get a specific thread by ID
 */
discussionsRouter.get('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const includeComments = c.req.query('includeComments') === 'true';

    const thread = await discussionService.getThreadById(id, includeComments);
    return c.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * PUT /api/discussions/threads/:id
 * Update a thread
 */
discussionsRouter.put('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateDiscussionThreadDto>();

    // Validate status if provided
    if (body.status) {
      const validStatuses: ThreadStatus[] = ['open', 'closed'];
      if (!validStatuses.includes(body.status)) {
        return c.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    const updated = await discussionService.updateThread(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to update thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * POST /api/discussions/threads/:id/close
 * Close a thread
 */
discussionsRouter.post('/threads/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const updated = await discussionService.closeThread(id);
    return c.json(updated);
  } catch (error) {
    console.error('Error closing thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to close thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * POST /api/discussions/threads/:id/reopen
 * Reopen a thread
 */
discussionsRouter.post('/threads/:id/reopen', async (c) => {
  try {
    const id = c.req.param('id');
    const updated = await discussionService.reopenThread(id);
    return c.json(updated);
  } catch (error) {
    console.error('Error reopening thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to reopen thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * DELETE /api/discussions/threads/:id
 * Delete a thread
 */
discussionsRouter.delete('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await discussionService.deleteThread(id);
    return c.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

// ===== Comment Endpoints =====

/**
 * POST /api/discussions/comments
 * Add a comment to a thread
 */
discussionsRouter.post('/comments', async (c) => {
  try {
    const body = await c.req.json<CreateCommentDto>();

    // Validate required fields
    if (!body.threadId || !body.content || !body.postedBy) {
      return c.json({ error: 'threadId, content, and postedBy are required' }, 400);
    }

    const comment = await discussionService.addComment(body);
    return c.json(comment, 201);
  } catch (error) {
    console.error('Error adding comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to add comment';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('closed')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * GET /api/discussions/threads/:threadId/comments
 * Get all comments for a thread
 */
discussionsRouter.get('/threads/:threadId/comments', async (c) => {
  try {
    const threadId = c.req.param('threadId');
    const comments = await discussionService.getCommentsForThread(threadId);
    return c.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/discussions/comments/:id
 * Get a specific comment by ID
 */
discussionsRouter.get('/comments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const comment = await discussionService.getCommentById(id);
    return c.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch comment';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * PUT /api/discussions/comments/:id
 * Update a comment
 */
discussionsRouter.put('/comments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateCommentDto & { userId: string }>();

    if (!body.content) {
      return c.json({ error: 'content is required' }, 400);
    }

    if (!body.userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const updated = await discussionService.updateComment(
      id,
      { content: body.content },
      body.userId
    );
    return c.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to update comment';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('only')) status = 403;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * DELETE /api/discussions/comments/:id
 * Delete a comment
 */
discussionsRouter.delete('/comments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    await discussionService.deleteComment(id, userId);
    return c.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete comment';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('only')) status = 403;
    }

    return c.json({ error: message }, status as any);
  }
});
