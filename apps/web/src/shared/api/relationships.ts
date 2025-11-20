/**
 * 用語関係性関連のAPI
 */

import type {
	CreateRelationshipDto,
	TermRelationship,
} from "@ubiquitous/types";
import { apiClient } from "./client";

/**
 * 関係性API
 */
export const relationshipsApi = {
	/**
	 * 関係性一覧を取得
	 */
	getAll: () => apiClient.get<TermRelationship[]>("/api/relationships"),

	/**
	 * 関係性を取得
	 */
	getById: (id: string) =>
		apiClient.get<TermRelationship>(`/api/relationships/${id}`),

	/**
	 * 関係性を作成
	 */
	create: (data: CreateRelationshipDto) =>
		apiClient.post<TermRelationship>("/api/relationships", data),

	/**
	 * 関係性を更新
	 */
	update: (id: string, data: Partial<CreateRelationshipDto>) =>
		apiClient.put<TermRelationship>(`/api/relationships/${id}`, data),

	/**
	 * 関係性を削除
	 */
	delete: (id: string) => apiClient.delete<void>(`/api/relationships/${id}`),

	/**
	 * 特定用語の関係性を取得
	 */
	getByTermId: (termId: string) =>
		apiClient.get<TermRelationship[]>(`/api/relationships/term/${termId}`),
};
