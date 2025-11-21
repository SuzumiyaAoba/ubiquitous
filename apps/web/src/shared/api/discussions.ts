/**
 * ディスカッション関連のAPI
 */

import type { Comment, DiscussionThread } from "@ubiquitous/types";
import { apiClient } from "./client";

/**
 * スレッド作成データ
 */
export interface CreateThreadDto {
	termId?: string;
	proposalId?: string;
	title: string;
	content: string;
	authorId: string;
}

/**
 * スレッド更新データ
 */
export interface UpdateThreadDto {
	title?: string;
	content?: string;
	status?: "open" | "closed";
}

/**
 * コメント作成データ
 */
export interface CreateCommentDto {
	content: string;
	authorId: string;
	parentId?: string;
}

/**
 * スレッド検索オプション
 */
export interface ThreadSearchOptions {
	termId?: string;
	proposalId?: string;
	status?: "open" | "closed";
}

/**
 * ディスカッションAPI
 */
export const discussionsApi = {
	/**
	 * スレッド一覧を取得
	 */
	getThreads: (options?: ThreadSearchOptions) =>
		apiClient.get<DiscussionThread[]>("/api/discussions/threads", {
			params: options as Record<string, string | number | boolean | undefined>,
		}),

	/**
	 * スレッドを取得
	 */
	getThreadById: (id: string) =>
		apiClient.get<DiscussionThread>(`/api/discussions/threads/${id}`),

	/**
	 * スレッドを作成
	 */
	createThread: (data: CreateThreadDto) =>
		apiClient.post<DiscussionThread>("/api/discussions/threads", data),

	/**
	 * スレッドを更新
	 */
	updateThread: (id: string, data: UpdateThreadDto) =>
		apiClient.put<DiscussionThread>(`/api/discussions/threads/${id}`, data),

	/**
	 * スレッドを削除
	 */
	deleteThread: (id: string) =>
		apiClient.delete<void>(`/api/discussions/threads/${id}`),

	/**
	 * コメントを投稿
	 */
	createComment: (threadId: string, data: CreateCommentDto) =>
		apiClient.post<Comment>(
			`/api/discussions/threads/${threadId}/comments`,
			data,
		),
};
