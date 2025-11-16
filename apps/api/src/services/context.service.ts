import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contexts, terms, termContexts } from '../db/schema';
import {
  BoundedContext,
  IContextService,
  CreateContextDto,
  UpdateContextDto,
  ContextWithTerms,
  Term
} from '@ubiquitous/types';
import { ContextRepository } from '../repositories/context.repository';

export class ContextService implements IContextService {
  private repository: ContextRepository;

  constructor() {
    this.repository = new ContextRepository();
  }

  async createContext(data: CreateContextDto, userId: string): Promise<BoundedContext> {
    return this.repository.create({
      ...data,
      createdBy: userId,
    });
  }

  async updateContext(id: string, data: UpdateContextDto): Promise<BoundedContext> {
    const context = await this.repository.update(id, data);

    if (!context) {
      throw new Error('Context not found');
    }

    return context;
  }

  async getContext(id: string): Promise<BoundedContext> {
    const context = await this.repository.findById(id);

    if (!context) {
      throw new Error('Context not found');
    }

    return context;
  }

  async getAllContexts(): Promise<BoundedContext[]> {
    return this.repository.findAll();
  }

  async getContextWithTerms(id: string): Promise<ContextWithTerms> {
    const context = await this.repository.findById(id);

    if (!context) {
      throw new Error('Context not found');
    }

    // Get all terms associated with this context
    const contextTerms = await db
      .select({
        term: terms,
        termContext: termContexts,
      })
      .from(termContexts)
      .innerJoin(terms, eq(termContexts.termId, terms.id))
      .where(eq(termContexts.contextId, id));

    const mappedTerms: Term[] = contextTerms.map(({ term, termContext }) => ({
      id: term.id,
      name: term.name,
      definition: termContext.definition,
      boundedContextId: id,
      status: term.status as 'draft' | 'active' | 'archived',
      examples: termContext.examples ? [termContext.examples] : undefined,
      usageNotes: undefined,
      qualityScore: 0,
      essentialForOnboarding: false,
      reviewCycleDays: undefined,
      nextReviewDate: undefined,
      createdBy: '',
      createdAt: term.createdAt,
      updatedBy: '',
      updatedAt: term.updatedAt,
      deletedAt: undefined,
    }));

    return {
      id: context.id,
      name: context.name,
      description: context.description,
      terms: mappedTerms,
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
    };
  }
}
