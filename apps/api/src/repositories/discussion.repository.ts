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
  // ===== Thread Operations =====

  /**
   * Create a new discussion thread
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
   * Find a thread by ID
   */
  async findThreadById(id: string) {
    const [thread] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, id));

    return thread || null;
  }

  /**
   * Find all threads
   */
  async findAllThreads() {
    return await db
      .select()
      .from(discussionThreads)
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * Find threads by term
   */
  async findThreadsByTermId(termId: string) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.termId, termId))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * Find threads by proposal
   */
  async findThreadsByProposalId(proposalId: string) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.proposalId, proposalId))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * Find threads by status
   */
  async findThreadsByStatus(status: ThreadStatus) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.status, status))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * Find threads by creator
   */
  async findThreadsByCreator(createdBy: string) {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.createdBy, createdBy))
      .orderBy(desc(discussionThreads.createdAt));
  }

  /**
   * Update a thread
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
   * Close a thread
   */
  async closeThread(id: string) {
    return await this.updateThread(id, { status: 'closed' });
  }

  /**
   * Reopen a thread
   */
  async reopenThread(id: string) {
    return await this.updateThread(id, { status: 'open' });
  }

  /**
   * Delete a thread
   */
  async deleteThread(id: string) {
    const [deleted] = await db
      .delete(discussionThreads)
      .where(eq(discussionThreads.id, id))
      .returning();

    return deleted || null;
  }

  // ===== Comment Operations =====

  /**
   * Create a new comment
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
   * Find a comment by ID
   */
  async findCommentById(id: string) {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    return comment || null;
  }

  /**
   * Find all comments for a thread
   */
  async findCommentsByThreadId(threadId: string) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.threadId, threadId))
      .orderBy(comments.postedAt);
  }

  /**
   * Find comments by user
   */
  async findCommentsByUser(postedBy: string) {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postedBy, postedBy))
      .orderBy(desc(comments.postedAt));
  }

  /**
   * Update a comment
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
   * Delete a comment
   */
  async deleteComment(id: string) {
    const [deleted] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Get thread with all comments
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
   * Count comments in a thread
   */
  async countCommentsInThread(threadId: string): Promise<number> {
    const threadComments = await this.findCommentsByThreadId(threadId);
    return threadComments.length;
  }
}

export const discussionRepository = new DiscussionRepository();
