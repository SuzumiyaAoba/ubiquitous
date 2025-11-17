import { termRepository, CreateTermDto, UpdateTermDto, AddTermToContextDto } from '../repositories/term.repository';
import { termHistoryRepository } from '../repositories/term-history.repository';

export class TermService {
  /**
   * Create a new term
   */
  async createTerm(data: CreateTermDto, createdBy: string = 'system') {
    // Check if term with same name already exists
    const exists = await termRepository.existsByName(data.name);
    if (exists) {
      throw new Error(`Term with name "${data.name}" already exists`);
    }

    const term = await termRepository.create(data);

    return term;
  }

  /**
   * Get a term by ID
   */
  async getTermById(id: string) {
    const term = await termRepository.findById(id);
    if (!term) {
      throw new Error(`Term with ID "${id}" not found`);
    }
    return term;
  }

  /**
   * Get a term with all its contexts
   */
  async getTermWithContexts(id: string) {
    const term = await termRepository.getWithContexts(id);
    if (!term) {
      throw new Error(`Term with ID "${id}" not found`);
    }
    return term;
  }

  /**
   * Get all terms
   */
  async getAllTerms() {
    return await termRepository.findAll();
  }

  /**
   * Get terms by context ID
   */
  async getTermsByContext(contextId: string) {
    return await termRepository.findByContextId(contextId);
  }

  /**
   * Search terms by name
   */
  async searchTerms(query: string) {
    return await termRepository.searchByName(query);
  }

  /**
   * Update a term
   * Creates a history record if the term was changed
   */
  async updateTerm(id: string, data: UpdateTermDto, changedBy: string = 'system', changeReason?: string) {
    // Get current term
    const currentTerm = await this.getTermById(id);

    // Check if name is being changed and if new name already exists
    if (data.name && data.name !== currentTerm.name) {
      const exists = await termRepository.existsByName(data.name);
      if (exists) {
        throw new Error(`Term with name "${data.name}" already exists`);
      }
    }

    // Calculate changed fields
    const changedFields: string[] = [];
    if (data.name && data.name !== currentTerm.name) changedFields.push('name');
    if (data.description && data.description !== currentTerm.description) changedFields.push('description');
    if (data.status && data.status !== currentTerm.status) changedFields.push('status');

    // Update the term
    const updated = await termRepository.update(id, data);

    // Create history record if there were changes
    if (changedFields.length > 0) {
      const latestVersion = await termHistoryRepository.getLatestVersion(id);
      await termHistoryRepository.create({
        termId: id,
        version: latestVersion + 1,
        previousDefinition: currentTerm.description || '',
        newDefinition: updated?.description || '',
        changedFields,
        changedBy,
        changeReason,
      });
    }

    return updated;
  }

  /**
   * Delete a term (soft delete by default)
   */
  async deleteTerm(id: string, permanent: boolean = false) {
    // Check if term exists
    await this.getTermById(id);

    if (permanent) {
      return await termRepository.delete(id);
    } else {
      return await termRepository.softDelete(id);
    }
  }

  /**
   * Add a term to a context with definition
   */
  async addTermToContext(data: AddTermToContextDto, changedBy: string = 'system') {
    // Check if term exists
    await this.getTermById(data.termId);

    // Check if already in context
    const existsInContext = await termRepository.existsInContext(data.termId, data.contextId);
    if (existsInContext) {
      throw new Error('Term already exists in this context');
    }

    // Add to context
    const termContext = await termRepository.addToContext(data);

    // Create history record
    const latestVersion = await termHistoryRepository.getLatestVersion(data.termId);
    await termHistoryRepository.create({
      termId: data.termId,
      version: latestVersion + 1,
      previousDefinition: '',
      newDefinition: data.definition,
      changedFields: ['definition', 'context'],
      changedBy,
      changeReason: `Added to context ${data.contextId}`,
    });

    return termContext;
  }

  /**
   * Update term definition in a specific context
   */
  async updateTermInContext(
    termId: string,
    contextId: string,
    definition: string,
    examples?: string,
    changedBy: string = 'system'
  ) {
    // Check if term exists in context
    const existsInContext = await termRepository.existsInContext(termId, contextId);
    if (!existsInContext) {
      throw new Error('Term not found in this context');
    }

    // Get current definition
    const term = await termRepository.getWithContexts(termId);
    const currentContext = term?.contexts.find(c => c.contextId === contextId);
    const previousDefinition = currentContext?.definition || '';

    // Update definition
    const updated = await termRepository.updateInContext(termId, contextId, definition, examples);

    // Create history record
    const latestVersion = await termHistoryRepository.getLatestVersion(termId);
    await termHistoryRepository.create({
      termId,
      version: latestVersion + 1,
      previousDefinition,
      newDefinition: definition,
      changedFields: ['definition'],
      changedBy,
      changeReason: `Updated definition in context ${contextId}`,
    });

    return updated;
  }

  /**
   * Remove a term from a context
   */
  async removeTermFromContext(termId: string, contextId: string) {
    // Check if term exists in context
    const existsInContext = await termRepository.existsInContext(termId, contextId);
    if (!existsInContext) {
      throw new Error('Term not found in this context');
    }

    return await termRepository.removeFromContext(termId, contextId);
  }

  /**
   * Get term history
   */
  async getTermHistory(id: string) {
    // Check if term exists
    await this.getTermById(id);

    return await termHistoryRepository.findByTermId(id);
  }
}

export const termService = new TermService();
