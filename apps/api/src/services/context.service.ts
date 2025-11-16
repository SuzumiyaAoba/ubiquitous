import { contextRepository } from '../repositories/context.repository';
import { db, termContexts, terms } from '../db';
import { eq, inArray } from 'drizzle-orm';
import type {
  IContextService,
  BoundedContext,
  CreateContextDto,
  UpdateContextDto,
  ContextWithTerms
} from '@ubiquitous/types';

export class ContextService implements IContextService {
  async createContext(data: CreateContextDto, userId: string): Promise<BoundedContext> {
    const context = await contextRepository.create(
      data.name,
      data.description,
      userId
    );
    return context;
  }

  async updateContext(id: string, data: UpdateContextDto): Promise<BoundedContext> {
    const context = await contextRepository.update(id, data.name, data.description);

    if (!context) {
      throw new Error(`Context with id ${id} not found`);
    }

    return context;
  }

  async getContext(id: string): Promise<BoundedContext> {
    const context = await contextRepository.findById(id);

    if (!context) {
      throw new Error(`Context with id ${id} not found`);
    }

    return context;
  }

  async getAllContexts(): Promise<BoundedContext[]> {
    return await contextRepository.findAll();
  }

  async getContextWithTerms(id: string): Promise<ContextWithTerms> {
    const context = await contextRepository.findById(id);

    if (!context) {
      throw new Error(`Context with id ${id} not found`);
    }

    // Get all terms associated with this context
    const termContextRelations = await db
      .select()
      .from(termContexts)
      .where(eq(termContexts.contextId, id));

    const termIds = termContextRelations.map(tc => tc.termId);

    let contextTerms: typeof terms.$inferSelect[] = [];
    if (termIds.length > 0) {
      contextTerms = await db
        .select()
        .from(terms)
        .where(inArray(terms.id, termIds));
    }

    return {
      id: context.id,
      name: context.name,
      description: context.description,
      terms: contextTerms,
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
    };
  }

  async deleteContext(id: string): Promise<void> {
    const deleted = await contextRepository.delete(id);

    if (!deleted) {
      throw new Error(`Context with id ${id} not found`);
    }
  }
}

export const contextService = new ContextService();
