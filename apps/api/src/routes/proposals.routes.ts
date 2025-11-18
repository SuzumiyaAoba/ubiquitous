/**
 * @file 用語提案管理ルート
 * @description 新しい用語の提案作成、管理、承認/却下処理のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { discussionService } from '../services/discussion.service';
import type { CreateTermProposalDto, UpdateTermProposalDto, ProposalStatus } from '../repositories/term-proposal.repository';

export const proposalsRouter = new Hono();

/**
 * 新しい用語提案を作成します。
 * @route POST /api/proposals
 * @param {object} body - 提案作成データ
 * @param {string} body.name - 提案する用語の名前（必須）
 * @param {string} body.definition - 用語の定義（必須）
 * @param {string} body.boundedContextId - 対象の有界コンテキストID（必須）
 * @param {string} body.proposedBy - 提案者ID（必須）
 * @returns {object} 201 - 作成された提案オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 404 - コンテキストが見つからない場合
 * @returns {object} 409 - 同名の用語が既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateTermProposalDto>();

    // Validate required fields
    if (!body.name || !body.definition || !body.boundedContextId || !body.proposedBy) {
      return c.json(
        { error: 'name, definition, boundedContextId, and proposedBy are required' },
        400
      );
    }

    const proposal = await discussionService.createProposal(body);
    return c.json(proposal, 201);
  } catch (error) {
    console.error('Error creating proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to create proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already exists')) status = 409;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * すべての用語提案を取得し、ステータスでフィルタリングできます。
 * @route GET /api/proposals
 * @query {string} status - 提案ステータス（pending/approved/rejected/on_hold、オプション）
 * @returns {object[]} 200 - 提案の配列
 * @returns {object} 400 - 無効なステータス値
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.get('/', async (c) => {
  try {
    const status = c.req.query('status') as ProposalStatus | undefined;

    // Validate status if provided
    if (status) {
      const validStatuses: ProposalStatus[] = ['pending', 'approved', 'rejected', 'on_hold'];
      if (!validStatuses.includes(status)) {
        return c.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    const proposals = await discussionService.getAllProposals(status);
    return c.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return c.json({ error: 'Failed to fetch proposals' }, 500);
  }
});

/**
 * IDで指定された用語提案を取得します。
 * @route GET /api/proposals/:id
 * @param {string} id - 提案ID
 * @returns {object} 200 - 提案オブジェクト
 * @returns {object} 404 - 提案が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const proposal = await discussionService.getProposalById(id);
    return c.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch proposal';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 用語提案を更新します。
 * @route PUT /api/proposals/:id
 * @param {string} id - 提案ID
 * @param {object} body - 更新データ（UpdateTermProposalDto）
 * @returns {object} 200 - 更新された提案オブジェクト
 * @returns {object} 400 - ステータス更新不可の提案を更新しようとした場合
 * @returns {object} 404 - 提案が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTermProposalDto>();

    const updated = await discussionService.updateProposal(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to update proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('Cannot update')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * 用語提案を承認し、用語を作成します。
 * @route POST /api/proposals/:id/approve
 * @param {string} id - 提案ID
 * @param {object} body - リクエストボディ
 * @param {string} body.approvedBy - 承認者ID（必須）
 * @returns {object} 200 - 承認結果オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している、または既に承認/却下済み
 * @returns {object} 404 - 提案が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.post('/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ approvedBy: string }>();

    if (!body.approvedBy) {
      return c.json({ error: 'approvedBy is required' }, 400);
    }

    const result = await discussionService.approveProposal(id, body.approvedBy);
    return c.json(result);
  } catch (error) {
    console.error('Error approving proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('already') || error.message.includes('Cannot')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * 用語提案を却下します。
 * @route POST /api/proposals/:id/reject
 * @param {string} id - 提案ID
 * @param {object} body - リクエストボディ
 * @param {string} body.rejectionReason - 却下理由（必須）
 * @returns {object} 200 - 却下後の提案オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している、または既に承認/却下済み
 * @returns {object} 404 - 提案が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.post('/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ rejectionReason: string }>();

    if (!body.rejectionReason) {
      return c.json({ error: 'rejectionReason is required' }, 400);
    }

    const updated = await discussionService.rejectProposal(id, body.rejectionReason);
    return c.json(updated);
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject proposal';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('Cannot') || error.message.includes('already')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * 用語提案を保留状態にします。
 * @route POST /api/proposals/:id/hold
 * @param {string} id - 提案ID
 * @returns {object} 200 - 保留状態に変更された提案オブジェクト
 * @returns {object} 400 - 保留状態に変更できない提案（既に承認/却下済み）
 * @returns {object} 404 - 提案が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.post('/:id/hold', async (c) => {
  try {
    const id = c.req.param('id');
    const updated = await discussionService.putProposalOnHold(id);
    return c.json(updated);
  } catch (error) {
    console.error('Error putting proposal on hold:', error);
    const message = error instanceof Error ? error.message : 'Failed to put proposal on hold';

    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404;
      else if (error.message.includes('Can only')) status = 400;
    }

    return c.json({ error: message }, status as any);
  }
});

/**
 * 用語提案を削除します。
 * @route DELETE /api/proposals/:id
 * @param {string} id - 提案ID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 提案が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
proposalsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await discussionService.deleteProposal(id);
    return c.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete proposal';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});
