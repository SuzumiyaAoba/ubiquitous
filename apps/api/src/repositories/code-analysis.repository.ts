import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { codeAnalyses } from '../db/schema';

export interface CreateCodeAnalysisDto {
  fileName: string;
  uploadedBy: string;
  extractedElements: any;
  matchRate: number;
}

export class CodeAnalysisRepository {
  /**
   * Create a new code analysis record
   */
  async create(data: CreateCodeAnalysisDto) {
    const [analysis] = await db
      .insert(codeAnalyses)
      .values({
        fileName: data.fileName,
        uploadedBy: data.uploadedBy,
        extractedElements: data.extractedElements,
        matchRate: data.matchRate,
      })
      .returning();

    return analysis;
  }

  /**
   * Find an analysis by ID
   */
  async findById(id: string) {
    const [analysis] = await db
      .select()
      .from(codeAnalyses)
      .where(eq(codeAnalyses.id, id));

    return analysis || null;
  }

  /**
   * Find all analyses
   */
  async findAll() {
    return await db
      .select()
      .from(codeAnalyses)
      .orderBy(desc(codeAnalyses.uploadedAt));
  }

  /**
   * Find analyses by uploader
   */
  async findByUploader(uploadedBy: string) {
    return await db
      .select()
      .from(codeAnalyses)
      .where(eq(codeAnalyses.uploadedBy, uploadedBy))
      .orderBy(desc(codeAnalyses.uploadedAt));
  }

  /**
   * Delete an analysis
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(codeAnalyses)
      .where(eq(codeAnalyses.id, id))
      .returning();

    return deleted || null;
  }
}

export const codeAnalysisRepository = new CodeAnalysisRepository();
