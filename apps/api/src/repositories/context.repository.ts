import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contexts } from '../db/schema';
import type { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

export class ContextRepository {
  /**
   * Create a new bounded context
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
   * Find a context by ID
   */
  async findById(id: string) {
    const [context] = await db
      .select()
      .from(contexts)
      .where(eq(contexts.id, id));

    return context || null;
  }

  /**
   * Find all contexts
   */
  async findAll() {
    return await db.select().from(contexts);
  }

  /**
   * Update a context
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
   * Delete a context
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(contexts)
      .where(eq(contexts.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Check if a context exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const [context] = await db
      .select({ id: contexts.id })
      .from(contexts)
      .where(eq(contexts.name, name));

    return !!context;
  }
}

export const contextRepository = new ContextRepository();
