import { eq, and, or, like, sql } from 'drizzle-orm';
import { db } from '../db';
import { terms, termContexts } from '../db/schema';

export interface CreateTermDto {
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'deprecated';
}

export interface UpdateTermDto {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'deprecated';
  isEssential?: boolean;
  nextReviewDate?: Date | null;
  reviewInterval?: number | null;
}

export interface AddTermToContextDto {
  termId: string;
  contextId: string;
  definition: string;
  examples?: string;
}

export class TermRepository {
  /**
   * 新しい用語を作成
   */
  async create(data: CreateTermDto) {
    const [term] = await db
      .insert(terms)
      .values({
        name: data.name,
        description: data.description,
        status: data.status || 'draft',
      })
      .returning();

    return term;
  }

  /**
   * IDで用語を検索
   */
  async findById(id: string) {
    const [term] = await db
      .select()
      .from(terms)
      .where(eq(terms.id, id));

    return term || null;
  }

  /**
   * すべての用語を取得
   */
  async findAll() {
    return await db.select().from(terms);
  }

  /**
   * コンテキストIDで用語を検索
   */
  async findByContextId(contextId: string) {
    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        description: terms.description,
        status: terms.status,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        definition: termContexts.definition,
        examples: termContexts.examples,
      })
      .from(termContexts)
      .innerJoin(terms, eq(termContexts.termId, terms.id))
      .where(eq(termContexts.contextId, contextId));

    return result;
  }

  /**
   * 名前で用語を検索
   */
  async searchByName(query: string) {
    return await db
      .select()
      .from(terms)
      .where(like(terms.name, `%${query}%`));
  }

  /**
   * 用語を更新
   */
  async update(id: string, data: UpdateTermDto) {
    const [updated] = await db
      .update(terms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, id))
      .returning();

    return updated || null;
  }

  /**
   * 用語をソフト削除（ステータスを廃止予定に設定）
   */
  async softDelete(id: string) {
    const [deleted] = await db
      .update(terms)
      .set({
        status: 'deprecated',
        updatedAt: new Date(),
      })
      .where(eq(terms.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * 用語を完全に削除
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(terms)
      .where(eq(terms.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * 名前で用語が存在するか確認
   */
  async existsByName(name: string): Promise<boolean> {
    const [term] = await db
      .select({ id: terms.id })
      .from(terms)
      .where(eq(terms.name, name));

    return !!term;
  }

  /**
   * 特定のコンテキストで用語が存在するか確認
   */
  async existsInContext(termId: string, contextId: string): Promise<boolean> {
    const [record] = await db
      .select({ id: termContexts.id })
      .from(termContexts)
      .where(
        and(
          eq(termContexts.termId, termId),
          eq(termContexts.contextId, contextId)
        )
      );

    return !!record;
  }

  /**
   * 定義付きでコンテキストに用語を追加
   */
  async addToContext(data: AddTermToContextDto) {
    const [termContext] = await db
      .insert(termContexts)
      .values({
        termId: data.termId,
        contextId: data.contextId,
        definition: data.definition,
        examples: data.examples,
      })
      .returning();

    return termContext;
  }

  /**
   * 特定のコンテキストで用語の定義を更新
   */
  async updateInContext(termId: string, contextId: string, definition: string, examples?: string) {
    const [updated] = await db
      .update(termContexts)
      .set({
        definition,
        examples,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(termContexts.termId, termId),
          eq(termContexts.contextId, contextId)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * コンテキストから用語を削除
   */
  async removeFromContext(termId: string, contextId: string) {
    const [deleted] = await db
      .delete(termContexts)
      .where(
        and(
          eq(termContexts.termId, termId),
          eq(termContexts.contextId, contextId)
        )
      )
      .returning();

    return deleted || null;
  }

  /**
   * すべてのコンテキスト付き用語を取得
   */
  async getWithContexts(termId: string) {
    const term = await this.findById(termId);
    if (!term) return null;

    const contexts = await db
      .select({
        contextId: termContexts.contextId,
        definition: termContexts.definition,
        examples: termContexts.examples,
        createdAt: termContexts.createdAt,
        updatedAt: termContexts.updatedAt,
      })
      .from(termContexts)
      .where(eq(termContexts.termId, termId));

    return {
      ...term,
      contexts,
    };
  }

  /**
   * すべての重要な用語を取得
   */
  async findEssentialTerms() {
    return await db
      .select()
      .from(terms)
      .where(eq(terms.isEssential, true));
  }

  /**
   * 重要な用語IDを取得
   */
  async getEssentialTermIds(): Promise<string[]> {
    const essentialTerms = await this.findEssentialTerms();
    return essentialTerms.map((term) => term.id);
  }
}

export const termRepository = new TermRepository();
