import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { termHistory } from '../db/schema';

export interface CreateTermHistoryDto {
  termId: string;
  version: number;
  previousDefinition: string;
  newDefinition: string;
  changedFields: string[];
  changedBy: string;
  changeReason?: string;
}

export class TermHistoryRepository {
  /**
   * Create a new history record
   */
  async create(data: CreateTermHistoryDto) {
    const [history] = await db
      .insert(termHistory)
      .values({
        termId: data.termId,
        version: data.version,
        previousDefinition: data.previousDefinition,
        newDefinition: data.newDefinition,
        changedFields: data.changedFields,
        changedBy: data.changedBy,
        changeReason: data.changeReason,
      })
      .returning();

    return history;
  }

  /**
   * Get all history for a term
   */
  async findByTermId(termId: string) {
    return await db
      .select()
      .from(termHistory)
      .where(eq(termHistory.termId, termId))
      .orderBy(desc(termHistory.version));
  }

  /**
   * Get the latest version number for a term
   */
  async getLatestVersion(termId: string): Promise<number> {
    const [latest] = await db
      .select({ version: termHistory.version })
      .from(termHistory)
      .where(eq(termHistory.termId, termId))
      .orderBy(desc(termHistory.version))
      .limit(1);

    return latest?.version ?? 0;
  }

  /**
   * Get a specific version of a term
   */
  async findByVersion(termId: string, version: number) {
    const [history] = await db
      .select()
      .from(termHistory)
      .where(
        and(
          eq(termHistory.termId, termId),
          eq(termHistory.version, version)
        )
      );

    return history || null;
  }

  /**
   * Calculate diff between two definitions
   */
  calculateDiff(oldDef: string, newDef: string): string[] {
    const changedFields: string[] = [];

    if (oldDef !== newDef) {
      changedFields.push('definition');
    }

    return changedFields;
  }
}

export const termHistoryRepository = new TermHistoryRepository();
