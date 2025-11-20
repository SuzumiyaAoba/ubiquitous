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
   * JSONからデータをインポート
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
      // JSONをパース
      const data = JSON.parse(jsonData) as ExportData;

      // 構造を検証
      const validationErrors = this.validateImportData(data);
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors);
        return result;
      }

      // 検証のみの場合、ここで返す
      if (options.validateOnly) {
        result.success = true;
        result.warnings.push('Validation only - no data was imported');
        return result;
      }

      // 最初にコンテキストをインポート
      for (const contextData of data.contexts || []) {
        try {
          // コンテキストが既に存在するかを確認
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

      // タームをインポート
      for (const termData of data.terms || []) {
        try {
          // ターム既に存在するかを確認
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

      // ターム-コンテキスト関係をインポート
      for (const tcData of data.termContexts || []) {
        try {
          // 名前でターム とコンテキストを検索（IDが異なる可能性があるため）
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

          // 既に存在するかを確認
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

      // 関係をインポート
      for (const relData of data.relationships || []) {
        try {
          // ソースタームとターゲットタームを検索
          const sourceTerms = await termRepository.searchByName(relData.sourceTerm || '');
          const targetTerms = await termRepository.searchByName(relData.targetTerm || '');

          if (sourceTerms.length === 0 || targetTerms.length === 0) {
            result.warnings.push(
              `Terms for relationship "${relData.sourceTerm}" -> "${relData.targetTerm}" not found - skipped`
            );
            continue;
          }

          // 関係が既に存在するかを確認
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
   * インポートデータ構造を検証
   */
  private validateImportData(data: unknown): string[] {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format - expected JSON object');
      return errors;
    }

    const dataObj = data as Record<string, unknown>;

    if (!dataObj.version) {
      errors.push('Missing version field');
    }

    if (!Array.isArray(dataObj.contexts)) {
      errors.push('Missing or invalid contexts array');
    }

    if (!Array.isArray(dataObj.terms)) {
      errors.push('Missing or invalid terms array');
    }

    // コンテキストを検証
    if (Array.isArray(dataObj.contexts)) {
      dataObj.contexts.forEach((context: unknown, index: number) => {
        if (!context || typeof context !== 'object') {
          errors.push(`Context at index ${index} is not a valid object`);
          return;
        }
        const contextObj = context as Record<string, unknown>;
        if (!contextObj.name) {
          errors.push(`Context at index ${index} is missing required field: name`);
        }
      });
    }

    // タームを検証
    if (Array.isArray(dataObj.terms)) {
      dataObj.terms.forEach((term: unknown, index: number) => {
        if (!term || typeof term !== 'object') {
          errors.push(`Term at index ${index} is not a valid object`);
          return;
        }
        const termObj = term as Record<string, unknown>;
        if (!termObj.name) {
          errors.push(`Term at index ${index} is missing required field: name`);
        }
      });
    }

    return errors;
  }

  /**
   * インポートせずにJSONデータを検証
   */
  async validateJSON(jsonData: string): Promise<ImportResult> {
    return this.importFromJSON(jsonData, { validateOnly: true });
  }
}

export const importService = new ImportService();
