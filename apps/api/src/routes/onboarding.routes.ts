import { Hono } from 'hono';
import { onboardingService } from '../services/onboarding.service';
import type { MarkLearnedDto } from '../repositories/user-learning.repository';

export const onboardingRouter = new Hono();

/**
 * GET /api/onboarding/essential-terms
 * Get all essential terms
 */
onboardingRouter.get('/essential-terms', async (c) => {
  try {
    const essentialTerms = await onboardingService.getEssentialTerms();
    return c.json(essentialTerms);
  } catch (error) {
    console.error('Error fetching essential terms:', error);
    return c.json({ error: 'Failed to fetch essential terms' }, 500);
  }
});

/**
 * PUT /api/onboarding/essential-terms/:id
 * Mark a term as essential
 */
onboardingRouter.put('/essential-terms/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const term = await onboardingService.markTermAsEssential(id);
    return c.json(term);
  } catch (error) {
    console.error('Error marking term as essential:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark term as essential';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * DELETE /api/onboarding/essential-terms/:id
 * Unmark a term as essential
 */
onboardingRouter.delete('/essential-terms/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const term = await onboardingService.unmarkTermAsEssential(id);
    return c.json(term);
  } catch (error) {
    console.error('Error unmarking term as essential:', error);
    const message = error instanceof Error ? error.message : 'Failed to unmark term as essential';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * POST /api/onboarding/mark-learned
 * Mark a term as learned for a user
 */
onboardingRouter.post('/mark-learned', async (c) => {
  try {
    const body = await c.req.json<MarkLearnedDto>();

    // Validate required fields
    if (!body.userId || !body.termId) {
      return c.json({ error: 'userId and termId are required' }, 400);
    }

    const learned = await onboardingService.markTermAsLearned(body);
    return c.json(learned, 201);
  } catch (error) {
    console.error('Error marking term as learned:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark term as learned';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * DELETE /api/onboarding/mark-learned/:userId/:termId
 * Unmark a term as learned for a user
 */
onboardingRouter.delete('/mark-learned/:userId/:termId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const termId = c.req.param('termId');

    const result = await onboardingService.unmarkTermAsLearned(userId, termId);
    if (!result) {
      return c.json({ message: 'Learning record not found or already removed' });
    }
    return c.json({ message: 'Learning record removed successfully' });
  } catch (error) {
    console.error('Error unmarking term as learned:', error);
    return c.json({ error: 'Failed to unmark term as learned' }, 500);
  }
});

/**
 * GET /api/onboarding/progress/:userId
 * Get learning progress for a user
 */
onboardingRouter.get('/progress/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const progress = await onboardingService.getLearningProgress(userId);
    return c.json(progress);
  } catch (error) {
    console.error('Error fetching learning progress:', error);
    return c.json({ error: 'Failed to fetch learning progress' }, 500);
  }
});

/**
 * GET /api/onboarding/learning-path/:userId
 * Get recommended learning path based on dependencies
 */
onboardingRouter.get('/learning-path/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const learningPath = await onboardingService.getRecommendedLearningPath(userId);
    return c.json(learningPath);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return c.json({ error: 'Failed to fetch learning path' }, 500);
  }
});

/**
 * GET /api/onboarding/next-terms/:userId
 * Get next recommended terms to learn
 */
onboardingRouter.get('/next-terms/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const limitStr = c.req.query('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 5;

    if (isNaN(limit) || limit < 1) {
      return c.json({ error: 'Invalid limit parameter' }, 400);
    }

    const nextTerms = await onboardingService.getNextRecommendedTerms(userId, limit);
    return c.json(nextTerms);
  } catch (error) {
    console.error('Error fetching next recommended terms:', error);
    return c.json({ error: 'Failed to fetch next recommended terms' }, 500);
  }
});

/**
 * GET /api/onboarding/can-learn/:userId/:termId
 * Check if a user can learn a term (dependencies met)
 */
onboardingRouter.get('/can-learn/:userId/:termId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const termId = c.req.param('termId');

    const canLearn = await onboardingService.canLearnTerm(userId, termId);
    return c.json({ canLearn });
  } catch (error) {
    console.error('Error checking if user can learn term:', error);
    const message = error instanceof Error ? error.message : 'Failed to check learning eligibility';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});
