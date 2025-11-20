/**
 * コンテキスト関連のAPI
 */

import type {
	BoundedContext,
	CreateContextDto,
	UpdateContextDto,
} from "@ubiquitous/types";
import { apiClient } from "./client";

/**
 * コンテキストAPI
 */
export const contextsApi = {
	/**
	 * コンテキスト一覧を取得
	 */
	getAll: () => apiClient.get<BoundedContext[]>("/api/contexts"),

	/**
	 * コンテキストを取得
	 */
	getById: (id: string) => apiClient.get<BoundedContext>(`/api/contexts/${id}`),

	/**
	 * コンテキストを作成
	 */
	create: (data: CreateContextDto) =>
		apiClient.post<BoundedContext>("/api/contexts", data),

	/**
	 * コンテキストを更新
	 */
	update: (id: string, data: UpdateContextDto) =>
		apiClient.put<BoundedContext>(`/api/contexts/${id}`, data),

	/**
	 * コンテキストを削除
	 */
	delete: (id: string) => apiClient.delete<void>(`/api/contexts/${id}`),

	/**
	 * コンテキスト内の用語を取得
	 */
	getTerms: (id: string) => apiClient.get(`/api/contexts/${id}/terms`),
};
