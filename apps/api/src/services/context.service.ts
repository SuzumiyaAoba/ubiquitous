import { contextRepository } from '../repositories/context.repository';
import { db } from '../db';
import { termContexts, terms } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateContextDto, UpdateContextDto } from '@ubiquitous/types';

export class ContextService {
  /**
   * Create a new bounded context
   * Validates that the name is unique before creating
   */
  async createContext(data: CreateContextDto) {
    // Check if context with same name already exists
    const exists = await contextRepository.existsByName(data.name);
    if (exists) {
      throw new Error(`Context with name "${data.name}" already exists`);
    }

    return await contextRepository.create(data);
  }

  /**
   * Get a context by ID
   */
  async getContextById(id: string) {
    const context = await contextRepository.findById(id);
    if (!context) {
      throw new Error(`Context with ID "${id}" not found`);
    }
    return context;
  }

  /**
   * Get all contexts
   */
  async getAllContexts() {
    return await contextRepository.findAll();
  }

  /**
   * Update a context
   */
  async updateContext(id: string, data: UpdateContextDto) {
    // Check if context exists
    await this.getContextById(id);

    // If updating name, check for uniqueness
    if (data.name) {
      const existingContext = await contextRepository.findById(id);
      if (existingContext && existingContext.name !== data.name) {
        const exists = await contextRepository.existsByName(data.name);
        if (exists) {
          throw new Error(`Context with name "${data.name}" already exists`);
        }
      }
    }

    return await contextRepository.update(id, data);
  }

  /**
   * Delete a context
   * Note: This will cascade delete all associated term-context relationships
   */
  async deleteContext(id: string) {
    // Check if context exists
    await this.getContextById(id);

    return await contextRepository.delete(id);
  }

  /**
   * Get context with all associated terms
   */
  async getContextWithTerms(id: string) {
    const context = await this.getContextById(id);

    // Get all terms associated with this context
    const contextTerms = await db
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
      .where(eq(termContexts.contextId, id));

    return {
      ...context,
      terms: contextTerms,
    };
  }
}

export const contextService = new ContextService();
