import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db';
import { userLearning, terms } from '../db/schema';

export interface MarkLearnedDto {
  userId: string;
  termId: string;
}

export class UserLearningRepository {
  /**
   * Mark a term as learned by a user
   */
  async markAsLearned(data: MarkLearnedDto) {
    // Check if already marked as learned
    const existing = await this.findByUserAndTerm(data.userId, data.termId);
    if (existing) {
      return existing;
    }

    const [learned] = await db
      .insert(userLearning)
      .values({
        userId: data.userId,
        termId: data.termId,
      })
      .returning();

    return learned;
  }

  /**
   * Unmark a term as learned
   */
  async unmarkAsLearned(userId: string, termId: string) {
    const [deleted] = await db
      .delete(userLearning)
      .where(
        and(
          eq(userLearning.userId, userId),
          eq(userLearning.termId, termId)
        )
      )
      .returning();

    return deleted || null;
  }

  /**
   * Find a learning record by user and term
   */
  async findByUserAndTerm(userId: string, termId: string) {
    const [record] = await db
      .select()
      .from(userLearning)
      .where(
        and(
          eq(userLearning.userId, userId),
          eq(userLearning.termId, termId)
        )
      );

    return record || null;
  }

  /**
   * Get all learned terms for a user
   */
  async findLearnedByUser(userId: string) {
    return await db
      .select()
      .from(userLearning)
      .where(eq(userLearning.userId, userId));
  }

  /**
   * Get learned term IDs for a user
   */
  async getLearnedTermIds(userId: string): Promise<string[]> {
    const records = await this.findLearnedByUser(userId);
    return records.map((record) => record.termId);
  }

  /**
   * Check if a user has learned a term
   */
  async hasLearned(userId: string, termId: string): Promise<boolean> {
    const record = await this.findByUserAndTerm(userId, termId);
    return record !== null;
  }

  /**
   * Get learning count for a user
   */
  async countLearnedTerms(userId: string): Promise<number> {
    const records = await this.findLearnedByUser(userId);
    return records.length;
  }

  /**
   * Get users who learned a specific term
   */
  async findUsersWhoLearned(termId: string) {
    return await db
      .select()
      .from(userLearning)
      .where(eq(userLearning.termId, termId));
  }

  /**
   * Bulk mark terms as learned
   */
  async bulkMarkAsLearned(userId: string, termIds: string[]) {
    const records = await Promise.all(
      termIds.map((termId) => this.markAsLearned({ userId, termId }))
    );
    return records;
  }

  /**
   * Get learning statistics for a user
   */
  async getUserLearningStats(userId: string, essentialTermIds: string[]) {
    const learnedTermIds = await this.getLearnedTermIds(userId);
    const learnedEssentialIds = learnedTermIds.filter((id) =>
      essentialTermIds.includes(id)
    );

    return {
      totalLearned: learnedTermIds.length,
      essentialLearned: learnedEssentialIds.length,
      essentialTotal: essentialTermIds.length,
      percentComplete:
        essentialTermIds.length > 0
          ? (learnedEssentialIds.length / essentialTermIds.length) * 100
          : 0,
    };
  }
}

export const userLearningRepository = new UserLearningRepository();
