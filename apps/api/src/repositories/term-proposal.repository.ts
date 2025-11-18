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
   * Create a new term proposal
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
   * Find a proposal by ID
   */
  async findById(id: string) {
    const [proposal] = await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.id, id));

    return proposal || null;
  }

  /**
   * Find all proposals
   */
  async findAll() {
    return await db
      .select()
      .from(termProposals)
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * Find proposals by status
   */
  async findByStatus(status: ProposalStatus) {
    return await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.status, status))
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * Find proposals by context
   */
  async findByContextId(contextId: string) {
    return await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.boundedContextId, contextId))
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * Find proposals by proposer
   */
  async findByProposer(proposedBy: string) {
    return await db
      .select()
      .from(termProposals)
      .where(eq(termProposals.proposedBy, proposedBy))
      .orderBy(desc(termProposals.proposedAt));
  }

  /**
   * Update a proposal
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
   * Approve a proposal
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
   * Reject a proposal
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
   * Put proposal on hold
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
   * Delete a proposal
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
