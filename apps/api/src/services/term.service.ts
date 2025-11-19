import { termRepository, CreateTermDto, UpdateTermDto, AddTermToContextDto } from '../repositories/term.repository';
import { termHistoryRepository } from '../repositories/term-history.repository';
import type { ISearchService } from './search-service.interface';

export class TermService {
  private searchService: ISearchService | null = null;

  /**
   * 検索サービスを設定（循環依存を回避するため）
   */
  setSearchService(service: ISearchService) {
    this.searchService = service;
  }

  /**
   * 検索サービスが利用可能な場合、検索インデックスにタームを同期
   */
  private async syncToSearchIndex(termId: string) {
    if (this.searchService) {
      try {
        await this.searchService.indexTerm(termId);
      } catch (error) {
        console.error('検索インデックスにタームを同期できませんでした：', error);
        // スローしない - 検索同期は重要ではありません
      }
    }
  }

  /**
   * 検索サービスが利用可能な場合、検索インデックスからタームを削除
   */
  private async removeFromSearchIndex(termId: string) {
    if (this.searchService) {
      try {
        await this.searchService.removeTermFromIndex(termId);
      } catch (error) {
        console.error('検索インデックスからタームを削除できませんでした：', error);
        // スローしない - 検索同期は重要ではありません
      }
    }
  }

  /**
   * 新しいタームを作成
   */
  async createTerm(data: CreateTermDto, createdBy: string = 'system') {
    // 同じ名前のターム既に存在するかを確認
    const exists = await termRepository.existsByName(data.name);
    if (exists) {
      throw new Error(`Term with name "${data.name}" already exists`);
    }

    const term = await termRepository.create(data);

    // 検索インデックスに同期
    await this.syncToSearchIndex(term.id);

    return term;
  }

  /**
   * IDでタームを取得
   */
  async getTermById(id: string) {
    const term = await termRepository.findById(id);
    if (!term) {
      throw new Error(`Term with ID "${id}" not found`);
    }
    return term;
  }

  /**
   * 関連するすべてのコンテキスト付きのタームを取得
   */
  async getTermWithContexts(id: string) {
    const term = await termRepository.getWithContexts(id);
    if (!term) {
      throw new Error(`Term with ID "${id}" not found`);
    }
    return term;
  }

  /**
   * すべてのタームを取得
   */
  async getAllTerms() {
    return await termRepository.findAll();
  }

  /**
   * コンテキストIDでタームを取得
   */
  async getTermsByContext(contextId: string) {
    return await termRepository.findByContextId(contextId);
  }

  /**
   * 名前でターム検索
   */
  async searchTerms(query: string) {
    return await termRepository.searchByName(query);
  }

  /**
   * タームを更新
   * タームが変更された場合は履歴レコードを作成
   */
  async updateTerm(id: string, data: UpdateTermDto, changedBy: string = 'system', changeReason?: string) {
    // 現在のタームを取得
    const currentTerm = await this.getTermById(id);

    // 名前が変更されており、新しい名前が既に存在するかをチェック
    if (data.name && data.name !== currentTerm.name) {
      const exists = await termRepository.existsByName(data.name);
      if (exists) {
        throw new Error(`Term with name "${data.name}" already exists`);
      }
    }

    // 変更されたフィールドを計算
    const changedFields: string[] = [];
    if (data.name && data.name !== currentTerm.name) changedFields.push('name');
    if (data.description && data.description !== currentTerm.description) changedFields.push('description');
    if (data.status && data.status !== currentTerm.status) changedFields.push('status');

    // タームを更新
    const updated = await termRepository.update(id, data);

    // 変更があった場合は履歴レコードを作成
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

    // 検索インデックスに同期
    await this.syncToSearchIndex(id);

    return updated;
  }

  /**
   * タームを削除（デフォルトではソフト削除）
   */
  async deleteTerm(id: string, permanent: boolean = false) {
    // ターム存在することを確認
    await this.getTermById(id);

    let result;
    if (permanent) {
      result = await termRepository.delete(id);
      // 完全削除時に検索インデックスから削除
      await this.removeFromSearchIndex(id);
    } else {
      result = await termRepository.softDelete(id);
      // 検索インデックスを更新（推奨されない ステータス）
      await this.syncToSearchIndex(id);
    }

    return result;
  }

  /**
   * 定義を持つコンテキストにタームを追加
   */
  async addTermToContext(data: AddTermToContextDto, changedBy: string = 'system') {
    // ターム存在することを確認
    await this.getTermById(data.termId);

    // 既にコンテキストに含まれているかをチェック
    const existsInContext = await termRepository.existsInContext(data.termId, data.contextId);
    if (existsInContext) {
      throw new Error('Term already exists in this context');
    }

    // コンテキストに追加
    const termContext = await termRepository.addToContext(data);

    // 履歴レコードを作成
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

    // 検索インデックスに同期
    await this.syncToSearchIndex(data.termId);

    return termContext;
  }

  /**
   * 特定のコンテキストでターム定義を更新
   */
  async updateTermInContext(
    termId: string,
    contextId: string,
    definition: string,
    examples?: string,
    changedBy: string = 'system'
  ) {
    // ターム存在するかをチェック
    const existsInContext = await termRepository.existsInContext(termId, contextId);
    if (!existsInContext) {
      throw new Error('Term not found in this context');
    }

    // 現在の定義を取得
    const term = await termRepository.getWithContexts(termId);
    const currentContext = term?.contexts.find(c => c.contextId === contextId);
    const previousDefinition = currentContext?.definition || '';

    // 定義を更新
    const updated = await termRepository.updateInContext(termId, contextId, definition, examples);

    // 履歴レコードを作成
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

    // Sync to search index
    await this.syncToSearchIndex(termId);

    return updated;
  }

  /**
   * コンテキストからターム削除
   */
  async removeTermFromContext(termId: string, contextId: string) {
    // ターム存在するかをチェック
    const existsInContext = await termRepository.existsInContext(termId, contextId);
    if (!existsInContext) {
      throw new Error('Term not found in this context');
    }

    const result = await termRepository.removeFromContext(termId, contextId);

    // 検索インデックスに同期
    await this.syncToSearchIndex(termId);

    return result;
  }

  /**
   * ターム履歴を取得
   */
  async getTermHistory(id: string) {
    // ターム存在することを確認
    await this.getTermById(id);

    return await termHistoryRepository.findByTermId(id);
  }
}

export const termService = new TermService();
