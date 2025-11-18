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
   * 新しいコード分析レコードを作成
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
   * IDで分析を検索
   */
  async findById(id: string) {
    const [analysis] = await db
      .select()
      .from(codeAnalyses)
      .where(eq(codeAnalyses.id, id));

    return analysis || null;
  }

  /**
   * すべての分析を取得
   */
  async findAll() {
    return await db
      .select()
      .from(codeAnalyses)
      .orderBy(desc(codeAnalyses.uploadedAt));
  }

  /**
   * アップロード者で分析を検索
   */
  async findByUploader(uploadedBy: string) {
    return await db
      .select()
      .from(codeAnalyses)
      .where(eq(codeAnalyses.uploadedBy, uploadedBy))
      .orderBy(desc(codeAnalyses.uploadedAt));
  }

  /**
   * 分析を削除
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
