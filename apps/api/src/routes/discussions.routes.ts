/**
 * @file ディスカッションスレッドとコメント管理ルート
 * @description 用語やプロポーザルに関連するディスカッションスレッドの作成、管理、
 * およびコメント機能のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { discussionService } from '../services/discussion.service';
import type {
  CreateDiscussionThreadDto,
  UpdateDiscussionThreadDto,
  CreateCommentDto,
  UpdateCommentDto,
  ThreadStatus,
} from '../repositories/discussion.repository';

export const discussionsRouter = new Hono();

// ===== スレッドエンドポイント =====

/**
 * 新しいディスカッションスレッドを作成します。
 * @route POST /api/discussions/threads
 * @param {object} body - スレッド作成データ
 * @param {string} body.title - スレッドタイトル（必須）
 * @param {string} body.createdBy - 作成者ID（必須）
 * @param {string} body.termId - 関連する用語ID（termId または proposalId が必須）
 * @param {string} body.proposalId - 関連するプロポーザルID（termId または proposalId が必須）
 * @returns {object} 201 - 作成されたスレッドオブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 404 - 関連する用語またはプロポーザルが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.post('/threads', async (c) => {
  try {
    const body = await c.req.json<CreateDiscussionThreadDto>();

    // Validate required fields
    if (!body.title || !body.createdBy) {
      return c.json({ error: 'title and createdBy are required' }, 400);
    }

    if (!body.termId && !body.proposalId) {
      return c.json({ error: 'Either termId or proposalId must be provided' }, 400);
    }

    const thread = await discussionService.createThread(body);
    return c.json(thread, 201);
  } catch (error) {
    console.error('Error creating thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to create thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * すべてのディスカッションスレッドを取得し、ステータスやコンテキストでフィルタリングできます。
 * @route GET /api/discussions/threads
 * @query {string} status - スレッドステータス（open または closed、オプション）
 * @query {string} termId - 関連する用語でフィルタ（オプション）
 * @query {string} proposalId - 関連するプロポーザルでフィルタ（オプション）
 * @returns {object[]} 200 - スレッドの配列
 * @returns {object} 400 - 無効なステータス値
 * @returns {object} 404 - コンテキスト指定時にコンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.get('/threads', async (c) => {
  try {
    const status = c.req.query('status') as ThreadStatus | undefined;
    const termId = c.req.query('termId');
    const proposalId = c.req.query('proposalId');

    // Validate status if provided
    if (status) {
      const validStatuses: ThreadStatus[] = ['open', 'closed'];
      if (!validStatuses.includes(status)) {
        return c.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    let threads;
    if (termId) {
      threads = await discussionService.getThreadsForTerm(termId);
    } else if (proposalId) {
      threads = await discussionService.getThreadsForProposal(proposalId);
    } else {
      threads = await discussionService.getAllThreads(status);
    }

    return c.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch threads';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * IDで指定されたディスカッションスレッドを取得します。
 * @route GET /api/discussions/threads/:id
 * @param {string} id - スレッドID
 * @query {boolean} includeComments - コメントを含めるか（true の場合含める、オプション）
 * @returns {object} 200 - スレッドオブジェクト（コメント含む場合あり）
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.get('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const includeComments = c.req.query('includeComments') === 'true';

    const thread = await discussionService.getThreadById(id, includeComments);
    return c.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * ディスカッションスレッドを更新します。
 * @route PUT /api/discussions/threads/:id
 * @param {string} id - スレッドID
 * @param {object} body - 更新データ（UpdateDiscussionThreadDto）
 * @param {string} body.status - スレッドステータス（open または closed、オプション）
 * @returns {object} 200 - 更新されたスレッドオブジェクト
 * @returns {object} 400 - 無効なステータス値
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.put('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateDiscussionThreadDto>();

    // Validate status if provided
    if (body.status) {
      const validStatuses: ThreadStatus[] = ['open', 'closed'];
      if (!validStatuses.includes(body.status)) {
        return c.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          400
        );
      }
    }

    const updated = await discussionService.updateThread(id, body);
    return c.json(updated);
  } catch (error) {
    console.error('Error updating thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to update thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * ディスカッションスレッドをクローズします。
 * @route POST /api/discussions/threads/:id/close
 * @param {string} id - スレッドID
 * @returns {object} 200 - クローズされたスレッドオブジェクト
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.post('/threads/:id/close', async (c) => {
  try {
    const id = c.req.param('id');
    const updated = await discussionService.closeThread(id);
    return c.json(updated);
  } catch (error) {
    console.error('Error closing thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to close thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * クローズされたディスカッションスレッドを再度オープンします。
 * @route POST /api/discussions/threads/:id/reopen
 * @param {string} id - スレッドID
 * @returns {object} 200 - 再度オープンされたスレッドオブジェクト
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.post('/threads/:id/reopen', async (c) => {
  try {
    const id = c.req.param('id');
    const updated = await discussionService.reopenThread(id);
    return c.json(updated);
  } catch (error) {
    console.error('Error reopening thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to reopen thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * ディスカッションスレッドを削除します。
 * @route DELETE /api/discussions/threads/:id
 * @param {string} id - スレッドID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.delete('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await discussionService.deleteThread(id);
    return c.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete thread';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

// ===== コメントエンドポイント =====

/**
 * スレッドにコメントを追加します。
 * @route POST /api/discussions/comments
 * @param {object} body - コメント作成データ
 * @param {string} body.threadId - スレッドID（必須）
 * @param {string} body.content - コメント内容（必須）
 * @param {string} body.postedBy - 投稿者ID（必須）
 * @returns {object} 201 - 作成されたコメントオブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合またはスレッドがクローズされている場合
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.post('/comments', async (c) => {
  try {
    const body = await c.req.json<CreateCommentDto>();

    // Validate required fields
    if (!body.threadId || !body.content || !body.postedBy) {
      return c.json({ error: 'threadId, content, and postedBy are required' }, 400);
    }

    const comment = await discussionService.addComment(body);
    return c.json(comment, 201);
  } catch (error) {
    console.error('Error adding comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to add comment';

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json({ error: message }, 404);
      } else if (error.message.includes('closed')) {
        return c.json({ error: message }, 400);
      }
    }

    return c.json({ error: message }, 500);
  }
});

/**
 * スレッドのすべてのコメントを取得します。
 * @route GET /api/discussions/threads/:threadId/comments
 * @param {string} threadId - スレッドID
 * @returns {object[]} 200 - コメントの配列
 * @returns {object} 404 - スレッドが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.get('/threads/:threadId/comments', async (c) => {
  try {
    const threadId = c.req.param('threadId');
    const comments = await discussionService.getCommentsForThread(threadId);
    return c.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * IDで指定されたコメントを取得します。
 * @route GET /api/discussions/comments/:id
 * @param {string} id - コメントID
 * @returns {object} 200 - コメントオブジェクト
 * @returns {object} 404 - コメントが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.get('/comments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const comment = await discussionService.getCommentById(id);
    return c.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch comment';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * コメントを更新します。
 * @route PUT /api/discussions/comments/:id
 * @param {string} id - コメントID
 * @param {object} body - 更新データ
 * @param {string} body.content - コメント内容（必須）
 * @param {string} body.userId - ユーザーID（必須、コメント作成者のみ可能）
 * @returns {object} 200 - 更新されたコメントオブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 403 - コメント作成者以外による更新
 * @returns {object} 404 - コメントが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.put('/comments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateCommentDto & { userId: string }>();

    if (!body.content) {
      return c.json({ error: 'content is required' }, 400);
    }

    if (!body.userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const updated = await discussionService.updateComment(
      id,
      { content: body.content },
      body.userId
    );
    return c.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to update comment';

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json({ error: message }, 404);
      } else if (error.message.includes('only')) {
        return c.json({ error: message }, 403);
      }
    }

    return c.json({ error: message }, 500);
  }
});

/**
 * コメントを削除します。
 * @route DELETE /api/discussions/comments/:id
 * @param {string} id - コメントID
 * @query {string} userId - ユーザーID（必須、コメント作成者のみ可能）
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 403 - コメント作成者以外による削除
 * @returns {object} 404 - コメントが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
discussionsRouter.delete('/comments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    await discussionService.deleteComment(id, userId);
    return c.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete comment';

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json({ error: message }, 404);
      } else if (error.message.includes('only')) {
        return c.json({ error: message }, 403);
      }
    }

    return c.json({ error: message }, 500);
  }
});
