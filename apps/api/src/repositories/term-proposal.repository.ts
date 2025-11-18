import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { termProposals } from '../db/schema';

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'on_hold';

export interface CreateTermProposalDto {
  name: string;
  definition: string;
  boundedContextId: string;
  proposedBy: string;
}

export interface UpdateTermProposalDto {
  name?: string;
  definition?: string;
  boundedContextId?: string;
}

export interface ApproveProposalDto {
  approvedBy: string;
}

export interface RejectProposalDto {
  rejectionReason: string;
}

export class TermProposalRepository {
  /**
   * 新しい用語提案を作成
   */
  async create(data: CreateTermProposalDto) {
    const [proposal] = await db
      .insert(termProposals)
      .values({
        name: data.name,
        definition: data.definition,
        boundedContextId: data.boundedContextId,
        proposedBy: data.proposedBy,
        status: 'pending',
      })
      .returning();

    return proposal;
  }

  /**
   * IDで提案を検索
   */
  async findById(id: string) {
    const [proposal] = await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.id, id));

    return proposal || null;
  }

  /**
   * すべての提案を取得
   */
  async findAll() {
    return await db
      .select()
      .from(termProposals)
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * ステータスで提案を検索
   */
  async findByStatus(status: ProposalStatus) {
    return await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.status, status))
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * コンテキストで提案を検索
   */
  async findByContextId(contextId: string) {
    return await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.boundedContextId, contextId))
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * 提案者で提案を検索
   */
  async findByProposer(proposedBy: string) {
    return await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.proposedBy, proposedBy))
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * 提案を更新
   */
  async update(id: string, data: UpdateTermProposalDto) {
    const [updated] = await db
      .update(termProposals)
      .set(data)
      .where(eq(termProposals.id, id))
      .returning();

    return updated || null;
  }

  /**
   * 提案を承認
   */
  async approve(id: string, approvedBy: string) {
    const [updated] = await db
      .update(termProposals)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(termProposals.id, id))
      .returning();

    return updated || null;
  }

  /**
   * 提案を却下
   */
  async reject(id: string, rejectionReason: string) {
    const [updated] = await db
      .update(termProposals)
      .set({
        status: 'rejected',
        rejectionReason,
      })
      .where(eq(termProposals.id, id))
      .returning();

    return updated || null;
  }

  /**
   * 提案を保留に設定
   */
  async putOnHold(id: string) {
    const [updated] = await db
      .update(termProposals)
      .set({
        status: 'on_hold',
      })
      .where(eq(termProposals.id, id))
      .returning();

    return updated || null;
  }

  /**
   * 提案を削除
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(termProposals)
      .where(eq(termProposals.id, id))
      .returning();

    return deleted || null;
  }
}

export const termProposalRepository = new TermProposalRepository();
