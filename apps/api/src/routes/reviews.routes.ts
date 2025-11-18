import { Hono } from 'hono';
import { reviewService } from '../services/review.service';
import type { ScheduleReviewDto, ExecuteReviewDto } from '../services/review.service';
import type { ReviewStatus } from '../repositories/review.repository';

export const reviewsRouter = new Hono();

/**
 * POST /api/reviews/schedule
 * Schedule a review for a term
 */
reviewsRouter.post('/schedule', async (c) => {
  try {
    const body = await c.req.json<ScheduleReviewDto>();

    // Validate required fields
    if (!body.termId || !body.intervalDays) {
      return c.json({ error: 'termId and intervalDays are required' }, 400);
    }

    if (body.intervalDays <= 0) {
      return c.json({ error: 'intervalDays must be a positive number' }, 400);
    }

    const term = await reviewService.scheduleReview(body);
    return c.json(term, 201);
  } catch (error) {
    console.error('Error scheduling review:', error);
    const message = error instanceof Error ? error.message : 'Failed to schedule review';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * DELETE /api/reviews/schedule/:termId
 * Cancel a scheduled review
 */
reviewsRouter.delete('/schedule/:termId', async (c) => {
  try {
    const termId = c.req.param('termId');
    const term = await reviewService.cancelReviewSchedule(termId);
    return c.json(term);
  } catch (error) {
    console.error('Error canceling review schedule:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel review schedule';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/reviews/due
 * Get terms that are due for review
 */
reviewsRouter.get('/due', async (c) => {
  try {
    const asOfDateStr = c.req.query('asOfDate');
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : undefined;

    // Validate date if provided
    if (asOfDateStr && isNaN(asOfDate!.getTime())) {
      return c.json({ error: 'Invalid asOfDate format. Use ISO 8601 format.' }, 400);
    }

    const dueTerms = await reviewService.getTermsDueForReview(asOfDate);
    return c.json(dueTerms);
  } catch (error) {
    console.error('Error fetching terms due for review:', error);
    return c.json({ error: 'Failed to fetch terms due for review' }, 500);
  }
});

/**
 * POST /api/reviews
 * Execute a review
 */
reviewsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<ExecuteReviewDto>();

    // Validate required fields
    if (!body.termId || !body.reviewedBy || !body.status) {
      return c.json({ error: 'termId, reviewedBy, and status are required' }, 400);
    }

    // Validate status
    const validStatuses: ReviewStatus[] = ['confirmed', 'needs_update', 'needs_discussion'];
    if (!validStatuses.includes(body.status)) {
      return c.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        400
      );
    }

    const review = await reviewService.executeReview(body);
    return c.json(review, 201);
  } catch (error) {
    console.error('Error executing review:', error);
    const message = error instanceof Error ? error.message : 'Failed to execute review';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/reviews/terms/:termId
 * Get review history for a term
 */
reviewsRouter.get('/terms/:termId', async (c) => {
  try {
    const termId = c.req.param('termId');
    const reviews = await reviewService.getReviewHistory(termId);
    return c.json(reviews);
  } catch (error) {
    console.error('Error fetching review history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch review history';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * GET /api/reviews/:id
 * Get a specific review by ID
 */
reviewsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const review = await reviewService.getReviewById(id);
    return c.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch review';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * POST /api/reviews/notifications
 * Send review notifications for specified terms
 */
reviewsRouter.post('/notifications', async (c) => {
  try {
    const body = await c.req.json<{ termIds: string[] }>();

    if (!body.termIds || !Array.isArray(body.termIds)) {
      return c.json({ error: 'termIds array is required' }, 400);
    }

    const result = await reviewService.sendReviewNotifications(body.termIds);
    return c.json(result);
  } catch (error) {
    console.error('Error sending review notifications:', error);
    return c.json({ error: 'Failed to send review notifications' }, 500);
  }
});
