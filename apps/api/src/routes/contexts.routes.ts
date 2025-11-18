/**
 * @file 有界コンテキスト（Bounded Context）管理ルート
 * @description ドメイン駆動設計における有界コンテキストのCRUD操作、関連する用語の取得など、
 * コンテキスト管理に関するエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { contextService } from '../services/context.service';
import type { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

export const contextsRouter = new Hono();

/**
 * 新しい有界コンテキストを作成します。
 * @route POST /api/contexts
 * @param {CreateContextDto} body - コンテキスト作成データ（name: 必須）
 * @returns {object} 201 - 作成されたコンテキストオブジェクト
 * @returns {object} 400 - バリデーションエラー（nameが未指定）
 * @returns {object} 409 - 同名のコンテキストが既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
contextsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateContextDto>();

    // Validate required fields
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const context = await contextService.createContext(body);
    return c.json(context, 201);
  } catch (error) {
    console.error('Error creating context:', error);
    const message = error instanceof Error ? error.message : 'Failed to create context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('already exists') ? 409 : 500);
  }
});

/**
 * すべての有界コンテキストを取得します。
 * @route GET /api/contexts
 * @returns {object[]} 200 - コンテキストの配列
 * @returns {object} 500 - サーバーエラー
 */
contextsRouter.get('/', async (c) => {
  try {
    const contexts = await contextService.getAllContexts();
    return c.json(contexts);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    return c.json({ error: 'Failed to fetch contexts' }, 500);
  }
});

/**
 * IDで指定された有界コンテキストを取得します。
 * @route GET /api/contexts/:id
 * @param {string} id - コンテキストID
 * @returns {object} 200 - コンテキストオブジェクト
 * @returns {object} 404 - コンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
contextsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const context = await contextService.getContextById(id);
    return c.json(context);
  } catch (error) {
    console.error('Error fetching context:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * コンテキストに関連するすべての用語を取得します。
 * @route GET /api/contexts/:id/terms
 * @param {string} id - コンテキストID
 * @returns {object} 200 - コンテキストと関連する用語の配列を含むオブジェクト
 * @returns {object} 404 - コンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
contextsRouter.get('/:id/terms', async (c) => {
  try {
    const id = c.req.param('id');
    const contextWithTerms = await contextService.getContextWithTerms(id);
    return c.json(contextWithTerms);
  } catch (error) {
    console.error('Error fetching context with terms:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch context with terms';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * 有界コンテキストを更新します。
 * @route PUT /api/contexts/:id
 * @param {string} id - コンテキストID
 * @param {UpdateContextDto} body - 更新データ
 * @returns {object} 200 - 更新されたコンテキストオブジェクト
 * @returns {object} 404 - コンテキストが見つからない場合
 * @returns {object} 409 - 同名のコンテキストが既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
contextsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateContextDto>();

    const updated = await contextService.updateContext(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating context:', error);
    const message = error instanceof Error ? error.message : 'Failed to update context';

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json({ error: message }, 404);
      } else if (error.message.includes('already exists')) {
        return c.json({ error: message }, 409);
      }
    }

    return c.json({ error: message }, 500);
  }
});

/**
 * 有界コンテキストを削除します。
 * @route DELETE /api/contexts/:id
 * @param {string} id - コンテキストID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - コンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
contextsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await contextService.deleteContext(id);
    return c.json({ message: 'Context deleted successfully' });
  } catch (error) {
    console.error('Error deleting context:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete context';
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({ error: message }, 404);
    }
    return c.json({ error: message }, 500);
  }
});
