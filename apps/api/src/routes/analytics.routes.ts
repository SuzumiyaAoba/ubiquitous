import { Hono } from 'hono';
import { analyticsService } from '../services/analytics.service';
import type { ExportFormat } from '../services/analytics.service';

export const analyticsRouter = new Hono();

/**
 * GET /api/analytics/metrics
 * Get all system metrics
 */
analyticsRouter.get('/metrics', async (c) => {
  try {
    const metrics = await analyticsService.getAllMetrics();
    return c.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return c.json({ error: 'Failed to fetch metrics' }, 500);
  }
});

/**
 * GET /api/analytics/metrics/system
 * Get system metrics only
 */
analyticsRouter.get('/metrics/system', async (c) => {
  try {
    const metrics = await analyticsService.getSystemMetrics();
    return c.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return c.json({ error: 'Failed to fetch system metrics' }, 500);
  }
});

/**
 * GET /api/analytics/metrics/user-activity
 * Get user activity metrics
 */
analyticsRouter.get('/metrics/user-activity', async (c) => {
  try {
    const metrics = await analyticsService.getUserActivityMetrics();
    return c.json(metrics);
  } catch (error) {
    console.error('Error fetching user activity metrics:', error);
    return c.json({ error: 'Failed to fetch user activity metrics' }, 500);
  }
});

/**
 * GET /api/analytics/metrics/coverage
 * Get coverage metrics
 */
analyticsRouter.get('/metrics/coverage', async (c) => {
  try {
    const metrics = await analyticsService.getCoverageMetrics();
    return c.json(metrics);
  } catch (error) {
    console.error('Error fetching coverage metrics:', error);
    return c.json({ error: 'Failed to fetch coverage metrics' }, 500);
  }
});

/**
 * GET /api/analytics/export
 * Export metrics in specified format (json or csv)
 */
analyticsRouter.get('/export', async (c) => {
  try {
    const format = (c.req.query('format') || 'json') as ExportFormat;

    // Validate format
    if (format !== 'json' && format !== 'csv') {
      return c.json({ error: 'Invalid format. Must be "json" or "csv"' }, 400);
    }

    const exportData = await analyticsService.exportMetrics(format);

    // Set appropriate content type and headers
    if (format === 'json') {
      c.header('Content-Type', 'application/json');
      c.header('Content-Disposition', 'attachment; filename="metrics.json"');
      return c.text(exportData);
    } else {
      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', 'attachment; filename="metrics.csv"');
      return c.text(exportData);
    }
  } catch (error) {
    console.error('Error exporting metrics:', error);
    const message = error instanceof Error ? error.message : 'Failed to export metrics';
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /api/analytics/top-proposers
 * Get most active proposers
 */
analyticsRouter.get('/top-proposers', async (c) => {
  try {
    const limitStr = c.req.query('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 10;

    if (isNaN(limit) || limit < 1) {
      return c.json({ error: 'Invalid limit parameter' }, 400);
    }

    const topProposers = await analyticsService.getMostActiveProposers(limit);
    return c.json(topProposers);
  } catch (error) {
    console.error('Error fetching top proposers:', error);
    return c.json({ error: 'Failed to fetch top proposers' }, 500);
  }
});

/**
 * GET /api/analytics/top-reviewers
 * Get most active reviewers
 */
analyticsRouter.get('/top-reviewers', async (c) => {
  try {
    const limitStr = c.req.query('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 10;

    if (isNaN(limit) || limit < 1) {
      return c.json({ error: 'Invalid limit parameter' }, 400);
    }

    const topReviewers = await analyticsService.getMostActiveReviewers(limit);
    return c.json(topReviewers);
  } catch (error) {
    console.error('Error fetching top reviewers:', error);
    return c.json({ error: 'Failed to fetch top reviewers' }, 500);
  }
});
