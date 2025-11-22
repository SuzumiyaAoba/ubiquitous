/**
 * 分析・メトリクス関連のAPI
 */

import { apiClient } from "./client";

/**
 * システムメトリクス
 */
export interface SystemMetrics {
	totalTerms: number;
	activeTerms: number;
	draftTerms: number;
	deprecatedTerms: number;
	totalContexts: number;
	totalProposals: number;
	pendingProposals: number;
	approvedProposals: number;
	totalDiscussionThreads: number;
	openThreads: number;
	totalReviews: number;
	essentialTerms: number;
	timestamp: string;
}

/**
 * ユーザーアクティビティメトリクス
 */
export interface UserActivityMetrics {
	uniqueReviewers: number;
	uniqueLearners: number;
	uniqueProposers: number;
	uniqueCommenters: number;
	totalActiveUsers: number;
}

/**
 * カバレッジメトリクス
 */
export interface CoverageMetrics {
	totalTerms: number;
	termsWithContexts: number;
	termsWithRelationships: number;
	termsWithReviews: number;
	essentialTermsCoverage: number;
	averageContextsPerTerm: number;
}

/**
 * 全メトリクス
 */
export interface AllMetrics {
	system: SystemMetrics;
	userActivity: UserActivityMetrics;
	coverage: CoverageMetrics;
}

/**
 * トップ提案者
 */
export interface TopProposer {
	userId: string;
	proposalCount: number;
}

/**
 * トップレビュアー
 */
export interface TopReviewer {
	userId: string;
	reviewCount: number;
}

/**
 * エクスポート形式
 */
export type ExportFormat = "json" | "csv";

/**
 * Analytics API
 */
export const analyticsApi = {
	/**
	 * 全メトリクスを取得
	 */
	getAllMetrics: () => apiClient.get<AllMetrics>("/api/analytics/metrics"),

	/**
	 * システムメトリクスを取得
	 */
	getSystemMetrics: () =>
		apiClient.get<SystemMetrics>("/api/analytics/metrics/system"),

	/**
	 * ユーザーアクティビティメトリクスを取得
	 */
	getUserActivityMetrics: () =>
		apiClient.get<UserActivityMetrics>(
			"/api/analytics/metrics/user-activity",
		),

	/**
	 * カバレッジメトリクスを取得
	 */
	getCoverageMetrics: () =>
		apiClient.get<CoverageMetrics>("/api/analytics/metrics/coverage"),

	/**
	 * 最もアクティブな提案者を取得
	 */
	getTopProposers: (limit: number = 10) =>
		apiClient.get<TopProposer[]>("/api/analytics/top-proposers", {
			params: { limit },
		}),

	/**
	 * 最もアクティブなレビュアーを取得
	 */
	getTopReviewers: (limit: number = 10) =>
		apiClient.get<TopReviewer[]>("/api/analytics/top-reviewers", {
			params: { limit },
		}),

	/**
	 * メトリクスをエクスポート
	 */
	exportMetrics: (format: ExportFormat = "json") =>
		apiClient.get<string>("/api/analytics/export", {
			params: { format },
		}),
};
