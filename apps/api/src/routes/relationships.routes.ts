/**
 * @file 用語間関係管理ルート
 * @description 用語間の関係（同義語、反義語、親子関係など）の作成、管理、
 * 関連用語の取得のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { relationshipService } from '../services/relationship.service';
import type { CreateTermRelationshipDto, UpdateTermRelationshipDto, RelationshipType } from '../repositories/term-relationship.repository';

export const relationshipsRouter = new Hono();

/**
 * 2つの用語間に新しい関係を作成します。
 * @route POST /api/relationships
 * @param {object} body - 関係作成データ
 * @param {string} body.sourceTermId - ソース用語ID（必須）
 * @param {string} body.targetTermId - ターゲット用語ID（必須）
 * @param {string} body.relationshipType - 関係タイプ（必須、synonym/antonym/related/parent/child）
 * @returns {object} 201 - 作成された関係オブジェクト
 * @returns {object} 400 - バリデーションエラー、無効な関係タイプ、または循環依存
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 409 - 既に同じ関係が存在する場合
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateTermRelationshipDto>();

    // Validate required fields
    if (!body.sourceTermId || !body.targetTermId || !body.relationshipType) {
      return c.json(
        { error: 'sourceTermId, targetTermId, and relationshipType are required' },
        400
      );
    }

    // Validate relationship type
    const validTypes: RelationshipType[] = ['synonym', 'antonym', 'related', 'parent', 'child'];
    if (!validTypes.includes(body.relationshipType)) {
      return c.json(
        { error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}` },
        400
      );
    }

    const relationship = await relationshipService.createRelationship(body);
    return c.json(relationship, 201);
  } catch (error) {
    console.error('Error creating relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to create relationship';

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json({ error: message }, 404);
      } else if (error.message.includes('already exists')) {
        return c.json({ error: message }, 409);
      } else if (error.message.includes('circular dependency') || error.message.includes('itself')) {
        return c.json({ error: message }, 400);
      }
    }

    return c.json({ error: message }, 500);
  }
});

/**
 * IDで指定された用語間の関係を取得します。
 * @route GET /api/relationships/:id
 * @param {string} id - 関係ID
 * @returns {object} 200 - 関係オブジェクト
 * @returns {object} 404 - 関係が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const relationship = await relationshipService.getRelationshipById(id);
    return c.json(relationship);
  } catch (error) {
    console.error('Error fetching relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch relationship';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 用語間の関係を更新します。
 * @route PUT /api/relationships/:id
 * @param {string} id - 関係ID
 * @param {object} body - 更新データ
 * @param {string} body.relationshipType - 関係タイプ（オプション、synonym/antonym/related/parent/child）
 * @returns {object} 200 - 更新された関係オブジェクト
 * @returns {object} 400 - 無効な関係タイプまたは循環依存
 * @returns {object} 404 - 関係が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTermRelationshipDto>();

    // Validate relationship type if provided
    if (body.relationshipType) {
      const validTypes: RelationshipType[] = ['synonym', 'antonym', 'related', 'parent', 'child'];
      if (!validTypes.includes(body.relationshipType)) {
        return c.json(
          { error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}` },
          400
        );
      }
    }

    const updated = await relationshipService.updateRelationship(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to update relationship';

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json({ error: message }, 404);
      } else if (error.message.includes('circular dependency')) {
        return c.json({ error: message }, 400);
      }
    }

    return c.json({ error: message }, 500);
  }
});

/**
 * 用語間の関係を削除します。
 * @route DELETE /api/relationships/:id
 * @param {string} id - 関係ID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 関係が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await relationshipService.deleteRelationship(id);
    return c.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete relationship';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 特定の用語に関連するすべての関係を取得します。
 * @route GET /api/terms/:termId/relationships
 * @param {string} termId - 用語ID
 * @query {boolean} includeDetails - 詳細情報を含めるか（true の場合含める、オプション）
 * @returns {object} 200 - 関係の配列、またはdetailsを含むオブジェクト
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.get('/terms/:termId', async (c) => {
  try {
    const termId = c.req.param('termId');
    const includeDetails = c.req.query('includeDetails') === 'true';

    if (includeDetails) {
      const result = await relationshipService.getTermWithRelationships(termId);
      return c.json(result);
    } else {
      const relationships = await relationshipService.getRelationshipsForTerm(termId);
      return c.json(relationships);
    }
  } catch (error) {
    console.error('Error fetching term relationships:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch term relationships';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 特定の関係タイプで関連する用語を取得します。
 * @route GET /api/terms/:termId/type/:type
 * @param {string} termId - 用語ID
 * @param {string} type - 関係タイプ（synonym/antonym/related/parent/child）
 * @returns {object[]} 200 - 関連用語の配列
 * @returns {object} 400 - 無効な関係タイプ
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.get('/terms/:termId/type/:type', async (c) => {
  try {
    const termId = c.req.param('termId');
    const type = c.req.param('type') as RelationshipType;

    // Validate relationship type
    const validTypes: RelationshipType[] = ['synonym', 'antonym', 'related', 'parent', 'child'];
    if (!validTypes.includes(type)) {
      return c.json(
        { error: `Invalid relationship type. Must be one of: ${validTypes.join(', ')}` },
        400
      );
    }

    const relatedTerms = await relationshipService.getRelatedTermsByType(termId, type);
    return c.json(relatedTerms);
  } catch (error) {
    console.error('Error fetching related terms:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch related terms';
    return c.json({ error: message }, 500);
  }
});

/**
 * 2つの特定の用語間の関係を削除します。
 * @route DELETE /api/relationships/between/:sourceId/:targetId
 * @param {string} sourceId - ソース用語ID
 * @param {string} targetId - ターゲット用語ID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 関係が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.delete('/between/:sourceId/:targetId', async (c) => {
  try {
    const sourceId = c.req.param('sourceId');
    const targetId = c.req.param('targetId');

    await relationshipService.deleteRelationshipBetweenTerms(sourceId, targetId);
    return c.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete relationship';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * コンテキスト内の用語関係を可視化するための図表データを取得します。
 * @route GET /api/contexts/:contextId/diagram
 * @param {string} contextId - コンテキストID
 * @returns {object} 200 - 図表データ（ノードとエッジを含むオブジェクト）
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.get('/contexts/:contextId/diagram', async (c) => {
  try {
    const contextId = c.req.param('contextId');
    const diagramData = await relationshipService.getDiagramDataForContext(contextId);
    return c.json(diagramData);
  } catch (error) {
    console.error('Error fetching diagram data:', error);
    return c.json({ error: 'Failed to fetch diagram data' }, 500);
  }
});

/**
 * 用語の階層構造（親子関係）を取得します。
 * @route GET /api/relationships/hierarchy
 * @query {string} rootTermId - ルート用語ID（オプション）
 * @returns {object} 200 - 階層構造を表すオブジェクト
 * @returns {object} 500 - サーバーエラー
 */
relationshipsRouter.get('/hierarchy', async (c) => {
  try {
    const rootTermId = c.req.query('rootTermId');
    const hierarchy = await relationshipService.getTermHierarchy(rootTermId);
    return c.json(hierarchy);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return c.json({ error: 'Failed to fetch hierarchy' }, 500);
  }
});
