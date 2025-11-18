import { MeiliSearch, Index } from 'meilisearch';
import { meiliSearchConfig } from './meilisearch.config';

export interface TermSearchDocument {
  id: string;
  name: string;
  description: string | null;
  status: string;
  contexts: Array<{
    contextId: string;
    contextName: string;
    definition: string;
    examples: string | null;
  }>;
  createdAt: number;
  updatedAt: number;
}

class MeiliSearchClient {
  private client: MeiliSearch;
  private termsIndex: Index<TermSearchDocument> | null = null;

  constructor() {
    this.client = new MeiliSearch({
      host: meiliSearchConfig.host,
      apiKey: meiliSearchConfig.apiKey,
    });
  }

  /**
   * Initialize the terms index
   */
  async initializeTermsIndex(): Promise<Index<TermSearchDocument>> {
    const indexName = 'terms';

    try {
      // Try to get existing index
      this.termsIndex = this.client.index<TermSearchDocument>(indexName);
      await this.termsIndex.getRawInfo();
    } catch (error) {
      // Index doesn't exist, create it
      await this.client.createIndex(indexName, { primaryKey: 'id' });
      this.termsIndex = this.client.index<TermSearchDocument>(indexName);

      // Configure searchable attributes
      await this.termsIndex.updateSearchableAttributes([
        'name',
        'description',
        'contexts.contextName',
        'contexts.definition',
      ]);

      // Configure filterable attributes
      await this.termsIndex.updateFilterableAttributes([
        'status',
        'contexts.contextId',
      ]);

      // Configure sortable attributes
      await this.termsIndex.updateSortableAttributes([
        'createdAt',
        'updatedAt',
        'name',
      ]);

      // Configure ranking rules
      await this.termsIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ]);
    }

    return this.termsIndex;
  }

  /**
   * Get the terms index
   */
  async getTermsIndex(): Promise<Index<TermSearchDocument>> {
    if (!this.termsIndex) {
      return await this.initializeTermsIndex();
    }
    return this.termsIndex;
  }

  /**
   * Add or update a term in the search index
   */
  async indexTerm(term: TermSearchDocument): Promise<void> {
    const index = await this.getTermsIndex();
    await index.addDocuments([term]);
  }

  /**
   * Add or update multiple terms in the search index
   */
  async indexTerms(terms: TermSearchDocument[]): Promise<void> {
    const index = await this.getTermsIndex();
    await index.addDocuments(terms);
  }

  /**
   * Remove a term from the search index
   */
  async deleteTerm(termId: string): Promise<void> {
    const index = await this.getTermsIndex();
    await index.deleteDocument(termId);
  }

  /**
   * Search for terms
   */
  async searchTerms(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      filter?: string;
      sort?: string[];
    }
  ) {
    const index = await this.getTermsIndex();

    return await index.search(query, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      filter: options?.filter,
      sort: options?.sort,
    });
  }

  /**
   * Get term by ID from search index
   */
  async getTerm(termId: string): Promise<TermSearchDocument | null> {
    const index = await this.getTermsIndex();
    try {
      const doc = await index.getDocument(termId);
      return doc as TermSearchDocument;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all terms from the index
   */
  async clearTermsIndex(): Promise<void> {
    const index = await this.getTermsIndex();
    await index.deleteAllDocuments();
  }

  /**
   * Get index statistics
   */
  async getIndexStats() {
    const index = await this.getTermsIndex();
    return await index.getStats();
  }

  /**
   * Test connection to MeiliSearch
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.health();
      return true;
    } catch (error) {
      console.error('MeiliSearch connection failed:', error);
      return false;
    }
  }
}

export const meiliSearchClient = new MeiliSearchClient();
