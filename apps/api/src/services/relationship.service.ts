import {
  termRelationshipRepository,
  CreateTermRelationshipDto,
  UpdateTermRelationshipDto,
  RelationshipType,
} from '../repositories/term-relationship.repository';
import { termRepository } from '../repositories/term.repository';
import { db } from '../db';
import { terms, termRelationships } from '../db/schema';
import { eq, or } from 'drizzle-orm';

export class RelationshipService {
  /**
   * Check for circular dependencies in parent-child relationships
   * Returns true if adding this relationship would create a cycle
   */
  async wouldCreateCycle(sourceTermId: string, targetTermId: string): Promise<boolean> {
    // A relationship from A to B creates a cycle if B is already an ancestor of A
    const descendants = await termRelationshipRepository.findDescendants(targetTermId);
    return descendants.includes(sourceTermId);
  }

  /**
   * Create a new term relationship
   * Validates terms exist and prevents circular dependencies for parent-child relationships
   */
  async createRelationship(data: CreateTermRelationshipDto) {
    // Validate source and target terms exist
    const sourceTerm = await termRepository.findById(data.sourceTermId);
    if (!sourceTerm) {
      throw new Error(`Source term with ID "${data.sourceTermId}" not found`);
    }

    const targetTerm = await termRepository.findById(data.targetTermId);
    if (!targetTerm) {
      throw new Error(`Target term with ID "${data.targetTermId}" not found`);
    }

    // Can't create a relationship from a term to itself
    if (data.sourceTermId === data.targetTermId) {
      throw new Error('Cannot create a relationship from a term to itself');
    }

    // Check if relationship already exists
    const existingRelationship = await termRelationshipRepository.findByTerms(
      data.sourceTermId,
      data.targetTermId,
      data.relationshipType
    );

    if (existingRelationship) {
      throw new Error(
        `Relationship of type "${data.relationshipType}" already exists between these terms`
      );
    }

    // For parent-child relationships, check for circular dependencies
    if (data.relationshipType === 'parent' || data.relationshipType === 'child') {
      const wouldCycle = await this.wouldCreateCycle(data.sourceTermId, data.targetTermId);
      if (wouldCycle) {
        throw new Error(
          'Cannot create this relationship as it would create a circular dependency'
        );
      }
    }

    return await termRelationshipRepository.create(data);
  }

  /**
   * Get a relationship by ID
   */
  async getRelationshipById(id: string) {
    const relationship = await termRelationshipRepository.findById(id);
    if (!relationship) {
      throw new Error(`Relationship with ID "${id}" not found`);
    }
    return relationship;
  }

  /**
   * Get all relationships for a term
   */
  async getRelationshipsForTerm(termId: string) {
    // Validate term exists
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    return await termRelationshipRepository.findByTermId(termId);
  }

  /**
   * Get term with all its relationships and related term details
   */
  async getTermWithRelationships(termId: string) {
    // Validate term exists
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    // Get all relationships
    const relationships = await termRelationshipRepository.findByTermId(termId);

    // Fetch related term details
    const enrichedRelationships = await Promise.all(
      relationships.map(async (rel) => {
        const relatedTermId = rel.sourceTermId === termId ? rel.targetTermId : rel.sourceTermId;
        const relatedTerm = await termRepository.findById(relatedTermId);

        return {
          id: rel.id,
          relationshipType: rel.relationshipType,
          description: rel.description,
          direction: rel.sourceTermId === termId ? 'outgoing' : 'incoming',
          relatedTerm: relatedTerm
            ? {
                id: relatedTerm.id,
                name: relatedTerm.name,
                description: relatedTerm.description,
                status: relatedTerm.status,
              }
            : null,
          createdAt: rel.createdAt,
          updatedAt: rel.updatedAt,
        };
      })
    );

    return {
      term,
      relationships: enrichedRelationships,
    };
  }

  /**
   * Update a relationship
   */
  async updateRelationship(id: string, data: UpdateTermRelationshipDto) {
    // Check if relationship exists
    const existing = await this.getRelationshipById(id);

    // If changing relationship type to parent/child, check for cycles
    if (data.relationshipType && (data.relationshipType === 'parent' || data.relationshipType === 'child')) {
      if (existing.relationshipType !== data.relationshipType) {
        const wouldCycle = await this.wouldCreateCycle(existing.sourceTermId, existing.targetTermId);
        if (wouldCycle) {
          throw new Error(
            'Cannot change to this relationship type as it would create a circular dependency'
          );
        }
      }
    }

    return await termRelationshipRepository.update(id, data);
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string) {
    // Check if relationship exists
    await this.getRelationshipById(id);

    return await termRelationshipRepository.delete(id);
  }

  /**
   * Delete a specific relationship between two terms
   */
  async deleteRelationshipBetweenTerms(sourceTermId: string, targetTermId: string) {
    const deleted = await termRelationshipRepository.deleteByTerms(sourceTermId, targetTermId);
    if (!deleted) {
      throw new Error('Relationship not found between these terms');
    }
    return deleted;
  }

  /**
   * Get diagram data for a context (all terms and their relationships)
   */
  async getDiagramDataForContext(contextId: string) {
    // Get all terms in this context
    const contextTerms = await termRepository.findByContextId(contextId);
    const termIds = contextTerms.map((t) => t.id);

    if (termIds.length === 0) {
      return {
        nodes: [],
        edges: [],
      };
    }

    // Get all relationships between these terms
    const allRelationships = await db
      .select()
      .from(termRelationships)
      .where(
        or(
          ...termIds.flatMap((id) => [
            eq(termRelationships.sourceTermId, id),
            eq(termRelationships.targetTermId, id),
          ])
        )
      );

    // Filter to only include relationships where both terms are in the context
    const contextRelationships = allRelationships.filter(
      (rel) => termIds.includes(rel.sourceTermId) && termIds.includes(rel.targetTermId)
    );

    // Format for diagram visualization
    const nodes = contextTerms.map((term) => ({
      id: term.id,
      label: term.name,
      description: term.description,
      status: term.status,
    }));

    const edges = contextRelationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceTermId,
      target: rel.targetTermId,
      type: rel.relationshipType,
      description: rel.description,
    }));

    return {
      nodes,
      edges,
    };
  }

  /**
   * Get all terms related to a given term by relationship type
   */
  async getRelatedTermsByType(termId: string, relationshipType: RelationshipType) {
    // Validate term exists
    await termRepository.findById(termId);

    const relationships = await db
      .select()
      .from(termRelationships)
      .where(
        or(
          eq(termRelationships.sourceTermId, termId),
          eq(termRelationships.targetTermId, termId)
        )
      );

    const relatedTermIds = relationships
      .filter((rel) => rel.relationshipType === relationshipType)
      .map((rel) => (rel.sourceTermId === termId ? rel.targetTermId : rel.sourceTermId));

    // Fetch term details
    const relatedTerms = await Promise.all(
      relatedTermIds.map((id) => termRepository.findById(id))
    );

    return relatedTerms.filter((term) => term !== null);
  }

  /**
   * Get term hierarchy (parent-child relationships)
   */
  async getTermHierarchy(rootTermId?: string) {
    const hierarchyRelationships = await termRelationshipRepository.getHierarchyRelationships();

    if (rootTermId) {
      // Build hierarchy starting from root term
      return await this.buildHierarchyTree(rootTermId, hierarchyRelationships);
    }

    // Return all hierarchy relationships
    return hierarchyRelationships;
  }

  /**
   * Build a hierarchical tree structure from relationships
   */
  private async buildHierarchyTree(
    termId: string,
    allRelationships: any[],
    visited: Set<string> = new Set()
  ): Promise<any> {
    if (visited.has(termId)) {
      return null; // Prevent infinite loops
    }

    visited.add(termId);

    const term = await termRepository.findById(termId);
    if (!term) return null;

    // Find child relationships
    const childRelationships = allRelationships.filter(
      (rel) => rel.sourceTermId === termId && rel.relationshipType === 'child'
    );

    const children = await Promise.all(
      childRelationships.map((rel) =>
        this.buildHierarchyTree(rel.targetTermId, allRelationships, visited)
      )
    );

    return {
      id: term.id,
      name: term.name,
      description: term.description,
      status: term.status,
      children: children.filter((child) => child !== null),
    };
  }
}

export const relationshipService = new RelationshipService();
