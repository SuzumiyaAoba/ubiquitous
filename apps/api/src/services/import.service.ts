import { termRepository } from '../repositories/term.repository';
import { contextRepository } from '../repositories/context.repository';
import { termRelationshipRepository } from '../repositories/term-relationship.repository';
import type { ExportData } from './export.service';

export interface ImportResult {
  success: boolean;
  imported: {
    contexts: number;
    terms: number;
    termContexts: number;
    relationships: number;
  };
  errors: string[];
  warnings: string[];
}

export interface ImportOptions {
  skipExisting?: boolean;
  validateOnly?: boolean;
}

export class ImportService {
  /**
   * Import data from JSON
   */
  async importFromJSON(jsonData: string, options: ImportOptions = {}): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: {
        contexts: 0,
        terms: 0,
        termContexts: 0,
        relationships: 0,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Parse JSON
      const data: ExportData = JSON.parse(jsonData);

      // Validate structure
      const validationErrors = this.validateImportData(data);
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors);
        return result;
      }

      // If validation only, return here
      if (options.validateOnly) {
        result.success = true;
        result.warnings.push('Validation only - no data was imported');
        return result;
      }

      // Import contexts first
      for (const contextData of data.contexts || []) {
        try {
          // Check if context already exists
          const existing = await contextRepository.findByName(contextData.name);

          if (existing && options.skipExisting) {
            result.warnings.push(`Context "${contextData.name}" already exists - skipped`);
            continue;
          }

          if (!existing) {
            await contextRepository.create({
              name: contextData.name,
              description: contextData.description,
            });
            result.imported.contexts++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to import context "${contextData.name}": ${message}`);
        }
      }

      // Import terms
      for (const termData of data.terms || []) {
        try {
          // Check if term already exists
          const existing = await termRepository.existsByName(termData.name);

          if (existing && options.skipExisting) {
            result.warnings.push(`Term "${termData.name}" already exists - skipped`);
            continue;
          }

          if (!existing) {
            await termRepository.create({
              name: termData.name,
              description: termData.description,
              status: termData.status || 'draft',
            });
            result.imported.terms++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to import term "${termData.name}": ${message}`);
        }
      }

      // Import term-context relationships
      for (const tcData of data.termContexts || []) {
        try {
          // Find term and context by name (since IDs might be different)
          const term = await termRepository.searchByName(tcData.termName);
          const context = await contextRepository.findByName(tcData.contextName);

          if (term.length === 0) {
            result.warnings.push(
              `Term "${tcData.termName}" not found for context assignment - skipped`
            );
            continue;
          }

          if (!context) {
            result.warnings.push(
              `Context "${tcData.contextName}" not found for term assignment - skipped`
            );
            continue;
          }

          // Check if already exists
          const exists = await termRepository.existsInContext(term[0].id, context.id);

          if (exists && options.skipExisting) {
            result.warnings.push(
              `Term "${tcData.termName}" already in context "${tcData.contextName}" - skipped`
            );
            continue;
          }

          if (!exists) {
            await termRepository.addToContext({
              termId: term[0].id,
              contextId: context.id,
              definition: tcData.definition,
              examples: tcData.examples,
            });
            result.imported.termContexts++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(
            `Failed to import term-context relationship for "${tcData.termName}": ${message}`
          );
        }
      }

      // Import relationships
      for (const relData of data.relationships || []) {
        try {
          // Find source and target terms
          const sourceTerms = await termRepository.searchByName(relData.sourceTerm || '');
          const targetTerms = await termRepository.searchByName(relData.targetTerm || '');

          if (sourceTerms.length === 0 || targetTerms.length === 0) {
            result.warnings.push(
              `Terms for relationship "${relData.sourceTerm}" -> "${relData.targetTerm}" not found - skipped`
            );
            continue;
          }

          // Check if relationship already exists
          const existing = await termRelationshipRepository.findByTerms(
            sourceTerms[0].id,
            targetTerms[0].id,
            relData.relationshipType
          );

          if (existing && options.skipExisting) {
            result.warnings.push(
              `Relationship "${relData.sourceTerm}" -> "${relData.targetTerm}" already exists - skipped`
            );
            continue;
          }

          if (!existing) {
            await termRelationshipRepository.create({
              sourceTermId: sourceTerms[0].id,
              targetTermId: targetTerms[0].id,
              relationshipType: relData.relationshipType,
              description: relData.description,
            });
            result.imported.relationships++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to import relationship: ${message}`);
        }
      }

      result.success = result.errors.length === 0;

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to parse import data: ${message}`);
      return result;
    }
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: any): string[] {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format - expected JSON object');
      return errors;
    }

    if (!data.version) {
      errors.push('Missing version field');
    }

    if (!Array.isArray(data.contexts)) {
      errors.push('Missing or invalid contexts array');
    }

    if (!Array.isArray(data.terms)) {
      errors.push('Missing or invalid terms array');
    }

    // Validate contexts
    if (Array.isArray(data.contexts)) {
      data.contexts.forEach((context: any, index: number) => {
        if (!context.name) {
          errors.push(`Context at index ${index} is missing required field: name`);
        }
      });
    }

    // Validate terms
    if (Array.isArray(data.terms)) {
      data.terms.forEach((term: any, index: number) => {
        if (!term.name) {
          errors.push(`Term at index ${index} is missing required field: name`);
        }
      });
    }

    return errors;
  }

  /**
   * Validate JSON data without importing
   */
  async validateJSON(jsonData: string): Promise<ImportResult> {
    return this.importFromJSON(jsonData, { validateOnly: true });
  }
}

export const importService = new ImportService();
