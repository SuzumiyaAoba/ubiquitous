import { meiliSearchClient, TermSearchDocument } from '../search/meilisearch.client';
import { termRepository } from '../repositories/term.repository';
import { db } from '../db';
import { terms, termContexts, contexts } from '../db/schema';
import { eq } from 'drizzle-orm';

export class SearchService {
  /**
   * Convert a term from database to search document
   */
  private async termToSearchDocument(termId: string): Promise<TermSearchDocument | null> {
    const term = await termRepository.findById(termId);
    if (!term) return null;

    // Get all contexts for this term
    const termContextList = await db
      .select({
        contextId: termContexts.contextId,
        contextName: contexts.name,
        definition: termContexts.definition,
        examples: termContexts.examples,
      })
      .from(termContexts)
      .innerJoin(contexts, eq(termContexts.contextId, contexts.id))
      .where(eq(termContexts.termId, termId));

    return {
      id: term.id,
      name: term.name,
      description: term.description,
      status: term.status,
      contexts: termContextList.map(ctx => ({
        contextId: ctx.contextId,
        contextName: ctx.contextName,
        definition: ctx.definition,
        examples: ctx.examples,
      })),
      createdAt: term.createdAt.getTime(),
      updatedAt: term.updatedAt.getTime(),
    };
  }

  /**
   * Index a single term
   */
  async indexTerm(termId: string): Promise<void> {
    const searchDoc = await this.termToSearchDocument(termId);
    if (searchDoc) {
      await meiliSearchClient.indexTerm(searchDoc);
    }
  }

  /**
   * Index all terms in the database
   */
  async indexAllTerms(): Promise<number> {
    const allTerms = await termRepository.findAll();

    const searchDocs: TermSearchDocument[] = [];
    for (const term of allTerms) {
      const searchDoc = await this.termToSearchDocument(term.id);
      if (searchDoc) {
        searchDocs.push(searchDoc);
      }
    }

    if (searchDocs.length > 0) {
      await meiliSearchClient.indexTerms(searchDocs);
    }

    return searchDocs.length;
  }

  /**
   * Remove a term from search index
   */
  async removeTermFromIndex(termId: string): Promise<void> {
    await meiliSearchClient.deleteTerm(termId);
  }

  /**
   * Search terms with full-text search
   */
  async searchTerms(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      contextId?: string;
      status?: string;
    }
  ) {
    // Build filter
    const filters: string[] = [];
    if (options?.contextId) {
      filters.push(`contexts.contextId = "${options.contextId}"`);
    }
    if (options?.status) {
      filters.push(`status = "${options.status}"`);
    }

    const filterString = filters.length > 0 ? filters.join(' AND ') : undefined;

    const results = await meiliSearchClient.searchTerms(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      filter: filterString,
    });

    return {
      hits: results.hits,
      query: results.query,
      processingTimeMs: results.processingTimeMs,
      limit: results.limit,
      offset: results.offset,
      estimatedTotalHits: results.estimatedTotalHits,
    };
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit: number = 5) {
    const results = await meiliSearchClient.searchTerms(query, {
      limit,
    });

    return results.hits.map(hit => ({
      id: hit.id,
      name: hit.name,
      description: hit.description,
    }));
  }

  /**
   * Rebuild entire search index
   */
  async rebuildIndex(): Promise<number> {
    await meiliSearchClient.clearTermsIndex();
    return await this.indexAllTerms();
  }

  /**
   * Get search index statistics
   */
  async getIndexStats() {
    return await meiliSearchClient.getIndexStats();
  }

  /**
   * Test MeiliSearch connection
   */
  async testConnection(): Promise<boolean> {
    return await meiliSearchClient.testConnection();
  }
}

export const searchService = new SearchService();
