import { eq, desc, or, and } from 'drizzle-orm';
import { db } from '../db';
import { discussionThreads, comments } from '../db/schema';

export type ThreadStatus = 'open' | 'closed';

export interface CreateDiscussionThreadDto {
  termId?: string;
  proposalId?: string;
  title: string;
  createdBy: string;
}

export interface UpdateDiscussionThreadDto {
  title?: string;
  status?: ThreadStatus;
}

export interface CreateCommentDto {
  threadId: string;
  content: string;
  postedBy: string;
}

export interface UpdateCommentDto {
  content: string;
}

export class DiscussionRepository {
  // ===== スレッド操作 =====

  /**
   * 新しいディスカッションスレッドを作成
   */
  async createThread(data: CreateDiscussionThreadDto) {
    const [thread] = await db
      .insert(discussionThreads)
      .values({
        termId: data.termId,
        proposalId: data.proposalId,
        title: data.title,
        createdBy: data.createdBy,
        status: 'open',
      })
      .returning();

    return thread;
  }

  /**
   * IDでスレッドを検索
   */
  async findThreadById(id: string) {
    const [thread] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, id));

    return thread || null;
  }

  /**
   * すべてのスレッドを取得
   */
  async findAllThreads() {
    return await db
      .select()
      .from(discussionThreads)
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * 用語でスレッドを検索
   */
  async findThreadsByTermId(termId: string) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.termId, termId))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * 提案でスレッドを検索
   */
  async findThreadsByProposalId(proposalId: string) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.proposalId, proposalId))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * ステータスでスレッドを検索
   */
  async findThreadsByStatus(status: ThreadStatus) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.status, status))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * 作成者でスレッドを検索
   */
  async findThreadsByCreator(createdBy: string) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.createdBy, createdBy))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * スレッドを更新
   */
  async updateThread(id: string, data: UpdateDiscussionThreadDto) {
    const [updated] = await db
      .update(discussionThreads)
      .set(data)
      .where(eq(discussionThreads.id, id))
      .returning();

    return updated || null;
  }

  /**
   * スレッドをクローズ
   */
  async closeThread(id: string) {
    return await this.updateThread(id, { status: 'closed' });
  }

  /**
   * スレッドを再度開く
   */
  async reopenThread(id: string) {
    return await this.updateThread(id, { status: 'open' });
  }

  /**
   * スレッドを削除
   */
  async deleteThread(id: string) {
    const [deleted] = await db
      .delete(discussionThreads)
      .where(eq(discussionThreads.id, id))
      .returning();

    return deleted || null;
  }

  // ===== コメント操作 =====

  /**
   * 新しいコメントを作成
   */
  async createComment(data: CreateCommentDto) {
    const [comment] = await db
      .insert(comments)
      .values({
        threadId: data.threadId,
        content: data.content,
        postedBy: data.postedBy,
      })
      .returning();

    return comment;
  }

  /**
   * IDでコメントを検索
   */
  async findCommentById(id: string) {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    return comment || null;
  }

  /**
   * スレッドのすべてのコメントを取得
   */
  async findCommentsByThreadId(threadId: string) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.threadId, threadId))
      .orderBy(comments.postedAt);
  }

  /**
   * ユーザーでコメントを検索
   */
  async findCommentsByUser(postedBy: string) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postedBy, postedBy))
      .orderBy(desc(comments.postedAt));
  }

  /**
   * コメントを更新
   */
  async updateComment(id: string, data: UpdateCommentDto) {
    const [updated] = await db
      .update(comments)
      .set({
        content: data.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    return updated || null;
  }

  /**
   * コメントを削除
   */
  async deleteComment(id: string) {
    const [deleted] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * すべてのコメント付きスレッドを取得
   */
  async getThreadWithComments(threadId: string) {
    const thread = await this.findThreadById(threadId);
    if (!thread) return null;

    const threadComments = await this.findCommentsByThreadId(threadId);

    return {
      ...thread,
      comments: threadComments,
    };
  }

  /**
   * スレッド内のコメント数をカウント
   */
  async countCommentsInThread(threadId: string): Promise<number> {
    const threadComments = await this.findCommentsByThreadId(threadId);
    return threadComments.length;
  }
}

export const discussionRepository = new DiscussionRepository();
