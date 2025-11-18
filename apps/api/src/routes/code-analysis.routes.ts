import { Hono } from 'hono';
import { codeAnalysisService } from '../services/code-analysis.service';

export const codeAnalysisRouter = new Hono();

/**
 * POST /api/code-analysis/upload
 * Upload and analyze code
 */
codeAnalysisRouter.post('/upload', async (c) => {
  try {
    const body = await c.req.json<{
      fileName: string;
      code: string;
      uploadedBy: string;
    }>();

    // Validate required fields
    if (!body.fileName || !body.code || !body.uploadedBy) {
      return c.json({ error: 'fileName, code, and uploadedBy are required' }, 400);
    }

    const analysisId = await codeAnalysisService.analyzeCode(
      body.fileName,
      body.code,
      body.uploadedBy
    );

    return c.json({ analysisId }, 201);
  } catch (error) {
    console.error('Error analyzing code:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze code';
    return c.json({ error: message }, 500);
  }
});

/**
 * GET /api/code-analysis/:id/report
 * Get analysis report
 */
codeAnalysisRouter.get('/:id/report', async (c) => {
  try {
    const id = c.req.param('id');

    const report = await codeAnalysisService.getReport(id);

    if (!report) {
      return c.json({ error: 'Analysis not found' }, 404);
    }

    return c.json(report);
  } catch (error) {
    console.error('Error fetching analysis report:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analysis report';
    return c.json({ error: message }, 500);
  }
});
