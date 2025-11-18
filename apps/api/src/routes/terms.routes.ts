/**
 * @file 用語管理ルート
 * @description ユビキタス言語における用語の作成、更新、削除、および
 * コンテキストごとの用語定義管理のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { termService } from '../services/term.service';
import type { CreateTermDto, UpdateTermDto, AddTermToContextDto } from '../repositories/term.repository';

export const termsRouter = new Hono();

/**
 * 新しい用語を作成します。
 * @route POST /api/terms
 * @param {object} body - 用語作成データ
 * @param {string} body.name - 用語名（必須）
 * @param {string} body.createdBy - 作成者ID（オプション）
 * @returns {object} 201 - 作成された用語オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 409 - 同名の用語が既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateTermDto & { createdBy?: string }>();

    // Validate required fields
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const { createdBy, ...termData } = body;
    const term = await termService.createTerm(termData, createdBy);
    return c.json(term, 201);
  } catch (error) {
    console.error('Error creating term:', error);
    const message = error instanceof Error ? error.message : 'Failed to create term';
    return c.json({ error: message }, error instanceof Error && error.message.includes('already exists') ? 409 : 500);
  }
});

/**
 * すべての用語を取得し、コンテキストまたはキーワードで検索できます。
 * @route GET /api/terms
 * @query {string} contextId - コンテキストID でフィルタ（オプション）
 * @query {string} search - 用語名で検索（オプション）
 * @returns {object[]} 200 - 用語の配列
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.get('/', async (c) => {
  try {
    const contextId = c.req.query('contextId');
    const search = c.req.query('search');

    let terms;
    if (contextId) {
      terms = await termService.getTermsByContext(contextId);
    } else if (search) {
      terms = await termService.searchTerms(search);
    } else {
      terms = await termService.getAllTerms();
    }

    return c.json(terms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return c.json({ error: 'Failed to fetch terms' }, 500);
  }
});

/**
 * IDで指定された用語を取得します。
 * @route GET /api/terms/:id
 * @param {string} id - 用語ID
 * @query {boolean} includeContexts - コンテキスト情報を含めるか（true の場合含める、オプション）
 * @returns {object} 200 - 用語オブジェクト（コンテキスト含む場合あり）
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const includeContexts = c.req.query('includeContexts') === 'true';

    const term = includeContexts
      ? await termService.getTermWithContexts(id)
      : await termService.getTermById(id);

    return c.json(term);
  } catch (error) {
    console.error('Error fetching term:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch term';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * 用語を更新します。
 * @route PUT /api/terms/:id
 * @param {string} id - 用語ID
 * @param {object} body - 更新データ
 * @param {string} body.changedBy - 変更者ID（オプション）
 * @param {string} body.changeReason - 変更理由（オプション）
 * @returns {object} 200 - 更新された用語オブジェクト
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 409 - 同名の用語が既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTermDto & { changedBy?: string; changeReason?: string }>();

    const { changedBy, changeReason, ...termData } = body;
    const updated = await termService.updateTerm(id, termData, changedBy, changeReason);

    return c.json(updated);
  } catch (error) {
    console.error('Error updating term:', error);
    const message = error instanceof Error ? error.message : 'Failed to update term';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already exists')) status = 409;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * 用語を削除します。
 * @route DELETE /api/terms/:id
 * @param {string} id - 用語ID
 * @query {boolean} permanent - 完全削除するか（true の場合完全削除、デフォルト: false）
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const permanent = c.req.query('permanent') === 'true';

    await termService.deleteTerm(id, permanent);
    return c.json({ message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Error deleting term:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete term';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * 用語の変更履歴を取得します。
 * @route GET /api/terms/:id/history
 * @param {string} id - 用語ID
 * @returns {object[]} 200 - 変更履歴の配列
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.get('/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    const history = await termService.getTermHistory(id);
    return c.json(history);
  } catch (error) {
    console.error('Error fetching term history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch term history';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * 用語をコンテキストに追加します。
 * @route POST /api/terms/:id/contexts
 * @param {string} id - 用語ID
 * @param {object} body - コンテキスト追加データ
 * @param {string} body.contextId - コンテキストID（必須）
 * @param {string} body.definition - 当コンテキストでの定義（必須）
 * @param {string} body.examples - 使用例（オプション）
 * @param {string} body.changedBy - 変更者ID（オプション）
 * @returns {object} 201 - 追加されたコンテキスト関連情報オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 409 - 用語が既にコンテキストに追加されている場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.post('/:id/contexts', async (c) => {
  try {
    const termId = c.req.param('id');
    const body = await c.req.json<Omit<AddTermToContextDto, 'termId'> & { changedBy?: string }>();

    // Validate required fields
    if (!body.contextId || !body.definition) {
      return c.json({ error: 'Context ID and definition are required' }, 400);
    }

    const { changedBy, ...data } = body;
    const termContext = await termService.addTermToContext(
      { ...data, termId },
      changedBy
    );

    return c.json(termContext, 201);
  } catch (error) {
    console.error('Error adding term to context:', error);
    const message = error instanceof Error ? error.message : 'Failed to add term to context';
    const status = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
    return c.json({ error: message }, status as any);
  }
});

/**
 * 特定のコンテキストにおける用語の定義を更新します。
 * @route PUT /api/terms/:id/contexts/:contextId
 * @param {string} id - 用語ID
 * @param {string} contextId - コンテキストID
 * @param {object} body - 更新データ
 * @param {string} body.definition - 新しい定義（必須）
 * @param {string} body.examples - 新しい使用例（オプション）
 * @param {string} body.changedBy - 変更者ID（オプション）
 * @returns {object} 200 - 更新されたコンテキスト関連情報オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 404 - 用語またはコンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.put('/:id/contexts/:contextId', async (c) => {
  try {
    const termId = c.req.param('id');
    const contextId = c.req.param('contextId');
    const body = await c.req.json<{ definition: string; examples?: string; changedBy?: string }>();

    if (!body.definition) {
      return c.json({ error: 'Definition is required' }, 400);
    }

    const updated = await termService.updateTermInContext(
      termId,
      contextId,
      body.definition,
      body.examples,
      body.changedBy
    );

    return c.json(updated);
  } catch (error) {
    console.error('Error updating term in context:', error);
    const message = error instanceof Error ? error.message : 'Failed to update term in context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * 用語をコンテキストから削除します。
 * @route DELETE /api/terms/:id/contexts/:contextId
 * @param {string} id - 用語ID
 * @param {string} contextId - コンテキストID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 用語またはコンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.delete('/:id/contexts/:contextId', async (c) => {
  try {
    const termId = c.req.param('id');
    const contextId = c.req.param('contextId');

    await termService.removeTermFromContext(termId, contextId);
    return c.json({ message: 'Term removed from context successfully' });
  } catch (error) {
    console.error('Error removing term from context:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove term from context';
    return c.json({ error: message }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});
