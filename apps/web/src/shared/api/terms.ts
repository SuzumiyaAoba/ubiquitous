/**
 * 用語関連のAPI
 */

import type { Term, CreateTermDto, UpdateTermDto, TermHistory } from "@ubiquitous/types";
import { apiClient } from "./client";

/**
 * 用語検索オプション
 */
export interface TermSearchOptions {
  search?: string;
  contextId?: string;
  status?: string;
  tags?: string;
}

/**
 * 用語API
 */
export const termsApi = {
  /**
   * 用語一覧を取得
   */
  getAll: (options?: TermSearchOptions) =>
    apiClient.get<Term[]>("/api/terms", {
      params: options as Record<string, string | number | boolean | undefined>,
    }),

  /**
   * 用語を取得
   */
  getById: (id: string) => apiClient.get<Term>(`/api/terms/${id}`),

  /**
   * 用語を作成
   */
  create: (data: CreateTermDto) => apiClient.post<Term>("/api/terms", data),

  /**
   * 用語を更新
   */
  update: (id: string, data: UpdateTermDto) => apiClient.put<Term>(`/api/terms/${id}`, data),

  /**
   * 用語を削除（ソフト削除）
   */
  delete: (id: string) => apiClient.delete<void>(`/api/terms/${id}`),

  /**
   * 用語を完全削除
   */
  hardDelete: (id: string) =>
    apiClient.delete<void>(`/api/terms/${id}`, {
      params: { hard: true } as Record<string, string | number | boolean | undefined>,
    }),

  /**
   * 用語の変更履歴を取得
   */
  getHistory: (id: string) => apiClient.get<TermHistory[]>(`/api/terms/${id}/history`),

  /**
   * 用語にコンテキストを追加
   */
  addContext: (id: string, contextId: string, definition: string) =>
    apiClient.post(`/api/terms/${id}/contexts`, { contextId, definition }),

  /**
   * コンテキスト内の定義を更新
   */
  updateContext: (id: string, contextId: string, definition: string) =>
    apiClient.put(`/api/terms/${id}/contexts/${contextId}`, { definition }),

  /**
   * コンテキストから用語を削除
   */
  removeContext: (id: string, contextId: string) =>
    apiClient.delete<void>(`/api/terms/${id}/contexts/${contextId}`),
};
