import { eq, and, or } from 'drizzle-orm';
import { db } from '../db';
import { termRelationships } from '../db/schema';

export type RelationshipType = 'synonym' | 'antonym' | 'related' | 'parent' | 'child';

export interface CreateTermRelationshipDto {
  sourceTermId: string;
  targetTermId: string;
  relationshipType: RelationshipType;
  description?: string;
}

export interface UpdateTermRelationshipDto {
  relationshipType?: RelationshipType;
  description?: string;
}

export class TermRelationshipRepository {
  /**
   * Create a new term relationship
   */
  async create(data: CreateTermRelationshipDto) {
    const [relationship] = await db
      .insert(termRelationships)
      .values({
        sourceTermId: data.sourceTermId,
        targetTermId: data.targetTermId,
        relationshipType: data.relationshipType,
        description: data.description,
      })
      .returning();

    return relationship;
  }

  /**
   * Find a relationship by ID
   */
  async findById(id: string) {
    const [relationship] = await db
      .select()
      .from(termRelationships)
      .where(eq(termRelationships.id, id));

    return relationship || null;
  }

  /**
   * Find all relationships for a term
   * Returns both outgoing (as source) and incoming (as target) relationships
   */
  async findByTermId(termId: string) {
    const relationships = await db
      .select()
      .from(termRelationships)
      .where(
        or(
          eq(termRelationships.sourceTermId, termId),
          eq(termRelationships.targetTermId, termId)
        )
      );

    return relationships;
  }

  /**
   * Find outgoing relationships (where term is the source)
   */
  async findOutgoingByTermId(termId: string) {
    return await db
      .select()
      .from(termRelationships)
      .where(eq(termRelationships.sourceTermId, termId));
  }

  /**
   * Find incoming relationships (where term is the target)
   */
  async findIncomingByTermId(termId: string) {
    return await db
      .select()
      .from(termRelationships)
      .where(eq(termRelationships.targetTermId, termId));
  }

  /**
   * Find relationships by type
   */
  async findByType(relationshipType: RelationshipType) {
    return await db
      .select()
      .from(termRelationships)
      .where(eq(termRelationships.relationshipType, relationshipType));
  }

  /**
   * Find specific relationship between two terms
   */
  async findByTerms(sourceTermId: string, targetTermId: string, relationshipType?: RelationshipType) {
    const conditions = [
      eq(termRelationships.sourceTermId, sourceTermId),
      eq(termRelationships.targetTermId, targetTermId),
    ];

    if (relationshipType) {
      conditions.push(eq(termRelationships.relationshipType, relationshipType));
    }

    const [relationship] = await db
      .select()
      .from(termRelationships)
      .where(and(...conditions));

    return relationship || null;
  }

  /**
   * Check if a relationship exists between two terms
   */
  async exists(sourceTermId: string, targetTermId: string, relationshipType?: RelationshipType): Promise<boolean> {
    const relationship = await this.findByTerms(sourceTermId, targetTermId, relationshipType);
    return !!relationship;
  }

  /**
   * Update a relationship
   */
  async update(id: string, data: UpdateTermRelationshipDto) {
    const [updated] = await db
      .update(termRelationships)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(termRelationships.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Delete a relationship
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(termRelationships)
      .where(eq(termRelationships.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Delete all relationships for a term
   */
  async deleteByTermId(termId: string) {
    const deleted = await db
      .delete(termRelationships)
      .where(
        or(
          eq(termRelationships.sourceTermId, termId),
          eq(termRelationships.targetTermId, termId)
        )
      )
      .returning();

    return deleted;
  }

  /**
   * Delete a specific relationship between two terms
   */
  async deleteByTerms(sourceTermId: string, targetTermId: string) {
    const [deleted] = await db
      .delete(termRelationships)
      .where(
        and(
          eq(termRelationships.sourceTermId, sourceTermId),
          eq(termRelationships.targetTermId, targetTermId)
        )
      )
      .returning();

    return deleted || null;
  }

  /**
   * Get all parent-child relationships (useful for hierarchy traversal)
   */
  async getHierarchyRelationships() {
    return await db
      .select()
      .from(termRelationships)
      .where(
        or(
          eq(termRelationships.relationshipType, 'parent'),
          eq(termRelationships.relationshipType, 'child')
        )
      );
  }

  /**
   * Find all descendants of a term (for circular dependency check)
   */
  async findDescendants(termId: string, visited: Set<string> = new Set()): Promise<string[]> {
    if (visited.has(termId)) {
      return [];
    }

    visited.add(termId);
    const descendants: string[] = [];

    // Find all child relationships where this term is the parent
    const childRelationships = await db
      .select()
      .from(termRelationships)
      .where(
        and(
          eq(termRelationships.sourceTermId, termId),
          eq(termRelationships.relationshipType, 'child')
        )
      );

    for (const rel of childRelationships) {
      descendants.push(rel.targetTermId);
      // Recursively find descendants of this child
      const childDescendants = await this.findDescendants(rel.targetTermId, visited);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}

export const termRelationshipRepository = new TermRelationshipRepository();
