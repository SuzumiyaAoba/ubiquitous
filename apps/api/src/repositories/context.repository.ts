import { eq } from 'drizzle-orm';
import { db, contexts } from '../db';
import type { BoundedContext } from '@ubiquitous/types';

export class ContextRepository {
  async create(name: string, description: string, createdBy: string): Promise<BoundedContext> {
    const [context] = await db
      .insert(contexts)
      .values({
        name,
        description,
        createdBy,
      })
      .returning();

    return context;
  }

  async findById(id: string): Promise<BoundedContext | null> {
    const [context] = await db
      .select()
      .from(contexts)
      .where(eq(contexts.id, id));

    if (!context) {
      return null;
    }

    return context;
  }

  async findAll(): Promise<BoundedContext[]> {
    const allContexts = await db
      .select()
      .from(contexts);

    return allContexts;
  }

  async update(id: string, name?: string, description?: string): Promise<BoundedContext | null> {
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return this.findById(id);
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(contexts)
      .set(updates)
      .where(eq(contexts.id, id))
      .returning();

    if (!updated) {
      return null;
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(contexts)
      .where(eq(contexts.id, id))
      .returning();

    return result.length > 0;
  }
}

export const contextRepository = new ContextRepository();
