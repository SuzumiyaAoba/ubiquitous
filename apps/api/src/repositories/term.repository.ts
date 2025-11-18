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
   * Create a new term
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
   * Find a term by ID
   */
  async findById(id: string) {
    const [term] = await db
      .select()
      .from(terms)
      .where(eq(terms.id, id));

    return term || null;
  }

  /**
   * Find all terms
   */
  async findAll() {
    return await db.select().from(terms);
  }

  /**
   * Find terms by context ID
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
   * Search terms by name
   */
  async searchByName(query: string) {
    return await db
      .select()
      .from(terms)
      .where(like(terms.name, `%${query}%`));
  }

  /**
   * Update a term
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
   * Delete a term (soft delete by setting status to deprecated)
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
   * Permanently delete a term
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(terms)
      .where(eq(terms.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Check if a term exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const [term] = await db
      .select({ id: terms.id })
      .from(terms)
      .where(eq(terms.name, name));

    return !!term;
  }

  /**
   * Check if a term exists in a specific context
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
   * Add a term to a context with definition
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
   * Update term definition in a specific context
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
   * Remove a term from a context
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
   * Get term with all its contexts
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
   * Get all essential terms
   */
  async findEssentialTerms() {
    return await db
      .select()
      .from(terms)
      .where(eq(terms.isEssential, true));
  }

  /**
   * Get essential term IDs
   */
  async getEssentialTermIds(): Promise<string[]> {
    const essentialTerms = await this.findEssentialTerms();
    return essentialTerms.map((term) => term.id);
  }
}

export const termRepository = new TermRepository();
