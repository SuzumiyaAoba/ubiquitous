import { Hono } from 'hono';
import { exportService } from '../services/export.service';
import { importService } from '../services/import.service';
import type { ImportOptions } from '../services/import.service';

export const exportImportRouter = new Hono();

/**
 * GET /api/export/json
 * Export all data as JSON
 */
exportImportRouter.get('/export/json', async (c) => {
  try {
    const jsonData = await exportService.exportAsJSON();

    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', 'attachment; filename="ubiquitous-language-export.json"');

    return c.text(jsonData);
  } catch (error) {
    console.error('Error exporting data as JSON:', error);
    return c.json({ error: 'Failed to export data as JSON' }, 500);
  }
});

/**
 * GET /api/export/markdown
 * Export all data as Markdown
 */
exportImportRouter.get('/export/markdown', async (c) => {
  try {
    const markdownData = await exportService.exportAsMarkdown();

    c.header('Content-Type', 'text/markdown');
    c.header('Content-Disposition', 'attachment; filename="ubiquitous-language-export.md"');

    return c.text(markdownData);
  } catch (error) {
    console.error('Error exporting data as Markdown:', error);
    return c.json({ error: 'Failed to export data as Markdown' }, 500);
  }
});

/**
 * POST /api/import
 * Import data from JSON
 */
exportImportRouter.post('/import', async (c) => {
  try {
    const body = await c.req.json<{
      data: string;
      options?: ImportOptions;
    }>();

    if (!body.data) {
      return c.json({ error: 'data field is required' }, 400);
    }

    const options: ImportOptions = body.options || {};

    const result = await importService.importFromJSON(body.data, options);

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: 'Import completed with errors',
          result,
        },
        400
      );
    }

    return c.json({
      success: true,
      message: 'Import completed successfully',
      result,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    const message = error instanceof Error ? error.message : 'Failed to import data';
    return c.json({ error: message }, 500);
  }
});

/**
 * POST /api/import/validate
 * Validate import data without actually importing
 */
exportImportRouter.post('/import/validate', async (c) => {
  try {
    const body = await c.req.json<{ data: string }>();

    if (!body.data) {
      return c.json({ error: 'data field is required' }, 400);
    }

    const result = await importService.validateJSON(body.data);

    return c.json({
      valid: result.success,
      errors: result.errors,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error validating import data:', error);
    const message = error instanceof Error ? error.message : 'Failed to validate import data';
    return c.json({ error: message }, 500);
  }
});
