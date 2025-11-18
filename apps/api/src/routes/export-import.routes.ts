/**
 * @file データエクスポート/インポートルート
 * @description プロジェクトデータのエクスポート（JSON/Markdown形式）およびインポート機能のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { exportService } from '../services/export.service';
import { importService } from '../services/import.service';
import type { ImportOptions } from '../services/import.service';

export const exportImportRouter = new Hono();

/**
 * すべてのデータをJSON形式でエクスポートします。
 * @route GET /api/export/json
 * @returns {string} 200 - JSON形式のエクスポートデータ
 * @returns {object} 500 - サーバーエラー
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
 * すべてのデータをMarkdown形式でエクスポートします。
 * @route GET /api/export/markdown
 * @returns {string} 200 - Markdown形式のエクスポートデータ
 * @returns {object} 500 - サーバーエラー
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
 * JSONからデータをインポートします。
 * @route POST /api/import
 * @param {object} body - リクエストボディ
 * @param {string} body.data - インポートするJSON文字列（必須）
 * @param {ImportOptions} body.options - インポートオプション（オプション）
 * @returns {object} 200 - インポート成功メッセージと結果
 * @returns {object} 400 - 必須フィールドが不足している、またはインポートにエラーがある場合
 * @returns {object} 500 - サーバーエラー
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
 * インポートデータを実際のインポートなしで検証します。
 * @route POST /api/import/validate
 * @param {object} body - リクエストボディ
 * @param {string} body.data - 検証するJSON文字列（必須）
 * @returns {object} 200 - 検証結果（valid, errors, warnings）
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 500 - サーバーエラー
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
