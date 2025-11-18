/**
 * @file 検索ルート
 * @description MeiliSearchを使用した用語検索、オートコンプリート、インデックス管理のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { searchService } from '../services/search.service';

export const searchRouter = new Hono();

/**
 * 用語を検索します。
 * @route GET /api/search
 * @query {string} q - 検索クエリ（必須）
 * @query {number} limit - 返す結果の最大数（デフォルト: 20）
 * @query {number} offset - スキップする結果数（デフォルト: 0）
 * @query {string} contextId - コンテキストID でフィルタ（オプション）
 * @query {string} status - ステータスでフィルタ（オプション）
 * @returns {object} 200 - 検索結果オブジェクト
 * @returns {object} 400 - 検索クエリが指定されていない場合
 * @returns {object} 500 - サーバーエラー
 */
searchRouter.get('/', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const contextId = c.req.query('contextId');
    const status = c.req.query('status');

    if (!query) {
      return c.json({ error: 'Query parameter "q" is required' }, 400);
    }

    const results = await searchService.searchTerms(query, {
      limit,
      offset,
      contextId,
      status,
    });

    return c.json(results);
  } catch (error) {
    console.error('Error searching terms:', error);
    return c.json({ error: 'Failed to search terms' }, 500);
  }
});

/**
 * オートコンプリート用のサジェストを取得します。
 * @route GET /api/search/suggestions
 * @query {string} q - 検索クエリ（必須）
 * @query {number} limit - サジェスト候補の最大数（デフォルト: 5）
 * @returns {object[]} 200 - サジェスト候補の配列
 * @returns {object} 400 - 検索クエリが指定されていない場合
 * @returns {object} 500 - サーバーエラー
 */
searchRouter.get('/suggestions', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const limit = parseInt(c.req.query('limit') || '5', 10);

    if (!query) {
      return c.json({ error: 'Query parameter "q" is required' }, 400);
    }

    const suggestions = await searchService.getSuggestions(query, limit);
    return c.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return c.json({ error: 'Failed to get suggestions' }, 500);
  }
});

/**
 * 検索インデックス全体を再構築します。
 * @route POST /api/search/index/rebuild
 * @returns {object} 200 - インデックス再構築結果（インデックスされた用語数）
 * @returns {object} 500 - サーバーエラー
 */
searchRouter.post('/index/rebuild', async (c) => {
  try {
    const count = await searchService.rebuildIndex();
    return c.json({
      message: 'Index rebuilt successfully',
      indexedTerms: count,
    });
  } catch (error) {
    console.error('Error rebuilding index:', error);
    return c.json({ error: 'Failed to rebuild index' }, 500);
  }
});

/**
 * 検索インデックスの統計情報を取得します。
 * @route GET /api/search/index/stats
 * @returns {object} 200 - インデックス統計情報
 * @returns {object} 500 - サーバーエラー
 */
searchRouter.get('/index/stats', async (c) => {
  try {
    const stats = await searchService.getIndexStats();
    return c.json(stats);
  } catch (error) {
    console.error('Error getting index stats:', error);
    return c.json({ error: 'Failed to get index stats' }, 500);
  }
});

/**
 * 特定の用語をインデックスに登録します。
 * @route POST /api/search/index/term/:id
 * @param {string} id - 用語ID
 * @returns {object} 200 - インデックス登録成功メッセージ
 * @returns {object} 500 - サーバーエラー
 */
searchRouter.post('/index/term/:id', async (c) => {
  try {
    const termId = c.req.param('id');
    await searchService.indexTerm(termId);
    return c.json({ message: 'Term indexed successfully' });
  } catch (error) {
    console.error('Error indexing term:', error);
    return c.json({ error: 'Failed to index term' }, 500);
  }
});

/**
 * MeiliSearch の接続状態をチェックします。
 * @route GET /api/search/health
 * @returns {object} 200 - 接続状態が良好な場合
 * @returns {object} 503 - MeiliSearch に接続できない場合
 */
searchRouter.get('/health', async (c) => {
  try {
    const isHealthy = await searchService.testConnection();
    return c.json({
      healthy: isHealthy,
      service: 'MeiliSearch',
    }, isHealthy ? 200 : 503);
  } catch (error) {
    console.error('Error checking MeiliSearch health:', error);
    return c.json({
      healthy: false,
      service: 'MeiliSearch',
      error: 'Connection failed',
    }, 503);
  }
});
