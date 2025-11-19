/**
 * 検索関連のAPI
 */

import { apiClient } from "./client";

/**
 * 検索オプション
 */
export interface SearchOptions {
  q: string;
  contextId?: string;
  limit?: number;
  offset?: number;
}

/**
 * 検索結果
 */
export interface SearchResult {
  id: string;
  name: string;
  definition: string;
  contextName?: string;
  score?: number;
}

/**
 * サジェスチョン
 */
export interface Suggestion {
  value: string;
  count?: number;
}

/**
 * インデックス統計
 */
export interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: Record<string, number>;
}

/**
 * ヘルスチェック結果
 */
export interface HealthStatus {
  status: "available" | "unavailable";
}

/**
 * 検索API
 */
export const searchApi = {
  /**
   * 用語を検索
   */
  search: (options: SearchOptions) =>
    apiClient.get<SearchResult[]>("/api/search", { params: options }),

  /**
   * サジェスチョンを取得
   */
  getSuggestions: (q: string) =>
    apiClient.get<Suggestion[]>("/api/search/suggestions", { params: { q } }),

  /**
   * インデックスを再構築
   */
  rebuildIndex: () => apiClient.post<void>("/api/search/index/rebuild"),

  /**
   * インデックス統計を取得
   */
  getIndexStats: () => apiClient.get<IndexStats>("/api/search/index/stats"),

  /**
   * 個別の用語をインデックス化
   */
  indexTerm: (termId: string) => apiClient.post<void>(`/api/search/index/term/${termId}`),

  /**
   * 検索エンジンのヘルスチェック
   */
  healthCheck: () => apiClient.get<HealthStatus>("/api/search/health"),
};
