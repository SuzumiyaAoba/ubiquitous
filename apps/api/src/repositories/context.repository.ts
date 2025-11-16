import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contexts, terms, termContexts } from '../db/schema';
import { BoundedContext } from '@ubiquitous/types';

export class ContextRepository {
  async create(data: {
    name: string;
    description: string;
    createdBy: string;
  }): Promise<BoundedContext> {
    const [context] = await db
      .insert(contexts)
      .values({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
      })
      .returning();

    return this.mapToEntity(context);
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
  }): Promise<BoundedContext | null> {
    const [context] = await db
      .update(contexts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contexts.id, id))
      .returning();

    return context ? this.mapToEntity(context) : null;
  }

  async findById(id: string): Promise<BoundedContext | null> {
    const [context] = await db
      .select()
      .from(contexts)
      .where(eq(contexts.id, id));

    return context ? this.mapToEntity(context) : null;
  }

  async findAll(): Promise<BoundedContext[]> {
    const allContexts = await db.select().from(contexts);
    return allContexts.map(this.mapToEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(contexts)
      .where(eq(contexts.id, id));

    return true;
  }

  private mapToEntity(row: any): BoundedContext {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
