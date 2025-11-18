import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contexts } from '../db/schema';
import type { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

export class ContextRepository {
  /**
   * 新しいバウンデッドコンテキストを作成
   */
  async create(data: CreateContextDto) {
    const [context] = await db
      .insert(contexts)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    return context;
  }

  /**
   * IDでバウンデッドコンテキストを検索
   */
  async findById(id: string) {
    const [context] = await db
      .select()
      .from(contexts)
      .where(eq(contexts.id, id));

    return context || null;
  }

  /**
   * すべてのバウンデッドコンテキストを取得
   */
  async findAll() {
    return await db.select().from(contexts);
  }

  /**
   * バウンデッドコンテキストを更新
   */
  async update(id: string, data: UpdateContextDto) {
    const [updated] = await db
      .update(contexts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contexts.id, id))
      .returning();

    return updated || null;
  }

  /**
   * バウンデッドコンテキストを削除
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(contexts)
      .where(eq(contexts.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * 名前でバウンデッドコンテキストが存在するか確認
   */
  async existsByName(name: string): Promise<boolean> {
    const [context] = await db
      .select({ id: contexts.id })
      .from(contexts)
      .where(eq(contexts.name, name));

    return !!context;
  }

  /**
   * 名前でバウンデッドコンテキストを検索
   */
  async findByName(name: string) {
    const [context] = await db
      .select()
      .from(contexts)
      .where(eq(contexts.name, name));

    return context || null;
  }
}

export const contextRepository = new ContextRepository();
