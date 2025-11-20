import { countBy } from "es-toolkit";
import { contextRepository } from "../repositories/context.repository";
import { discussionRepository } from "../repositories/discussion.repository";
import { reviewRepository } from "../repositories/review.repository";
import { termRepository } from "../repositories/term.repository";
import { termProposalRepository } from "../repositories/term-proposal.repository";

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

export interface UserActivityMetrics {
	uniqueReviewers: number;
	uniqueLearners: number;
	uniqueProposers: number;
	uniqueCommenters: number;
	totalActiveUsers: number;
}

export interface CoverageMetrics {
	totalTerms: number;
	termsWithContexts: number;
	termsWithRelationships: number;
	termsWithReviews: number;
	essentialTermsCoverage: number;
	averageContextsPerTerm: number;
}

export type ExportFormat = "json" | "csv";

export class AnalyticsService {
	/**
	 * 包括的なシステムメトリクスを取得
	 */
	async getSystemMetrics(): Promise<SystemMetrics> {
		const allTerms = await termRepository.findAll();
		const allContexts = await contextRepository.findAll();
		const allProposals = await termProposalRepository.findAll();
		const pendingProposals =
			await termProposalRepository.findByStatus("pending");
		const approvedProposals =
			await termProposalRepository.findByStatus("approved");
		const allThreads = await discussionRepository.findAllThreads();
		const openThreads = await discussionRepository.findThreadsByStatus("open");
		const essentialTerms = await termRepository.findEssentialTerms();

		// ステータス別にターム数をカウント
		const statusCounts = countBy(allTerms, (t) => t.status);
		const activeTerms = statusCounts.active ?? 0;
		const draftTerms = statusCounts.draft ?? 0;
		const deprecatedTerms = statusCounts.deprecated ?? 0;

		// すべてのターム全体のレビュー数をカウント
		let totalReviews = 0;
		for (const term of allTerms) {
			totalReviews += await reviewRepository.countReviewsForTerm(term.id);
		}

		return {
			totalTerms: allTerms.length,
			activeTerms,
			draftTerms,
			deprecatedTerms,
			totalContexts: allContexts.length,
			totalProposals: allProposals.length,
			pendingProposals: pendingProposals.length,
			approvedProposals: approvedProposals.length,
			totalDiscussionThreads: allThreads.length,
			openThreads: openThreads.length,
			totalReviews,
			essentialTerms: essentialTerms.length,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * ユーザー活動メトリクスを取得
	 */
	async getUserActivityMetrics(): Promise<UserActivityMetrics> {
		const allProposals = await termProposalRepository.findAll();
		const allReviews = await reviewRepository
			.findByStatus("confirmed")
			.then((confirmed) =>
				reviewRepository
					.findByStatus("needs_update")
					.then((needsUpdate) =>
						reviewRepository
							.findByStatus("needs_discussion")
							.then((needsDiscussion) => [
								...confirmed,
								...needsUpdate,
								...needsDiscussion,
							]),
					),
			);

		// 異なるアクティビティからユニークユーザーを取得
		const uniqueProposers = new Set(allProposals.map((p) => p.proposedBy));
		const uniqueReviewers = new Set(allReviews.map((r) => r.reviewedBy));

		// 学習者については、すべてのユーザー学習記録を取得する必要があります
		// findAllメソッドがないため、回避策を使用します
		// これはプレースホルダーです。本番環境では、適切なメソッドが必要です
		const uniqueLearners = new Set<string>();

		// すべてのスレッドからユニークコメンターを取得
		const uniqueCommenters = new Set<string>();
		const allThreads = await discussionRepository.findAllThreads();
		for (const thread of allThreads) {
			const comments = await discussionRepository.findCommentsByThreadId(
				thread.id,
			);
			comments.forEach((comment) => uniqueCommenters.add(comment.postedBy));
		}

		// すべてのアクティブユーザーを結合
		const allActiveUsers = new Set([
			...uniqueProposers,
			...uniqueReviewers,
			...uniqueLearners,
			...uniqueCommenters,
		]);

		return {
			uniqueReviewers: uniqueReviewers.size,
			uniqueLearners: uniqueLearners.size,
			uniqueProposers: uniqueProposers.size,
			uniqueCommenters: uniqueCommenters.size,
			totalActiveUsers: allActiveUsers.size,
		};
	}

	/**
	 * カバレッジメトリクスを取得
	 */
	async getCoverageMetrics(): Promise<CoverageMetrics> {
		const allTerms = await termRepository.findAll();
		const essentialTerms = await termRepository.findEssentialTerms();

		let termsWithContexts = 0;
		const _termsWithRelationships = 0;
		let termsWithReviews = 0;
		let totalContextCount = 0;

		for (const term of allTerms) {
			const withContexts = await termRepository.getWithContexts(term.id);
			if (withContexts && withContexts.contexts.length > 0) {
				termsWithContexts++;
				totalContextCount += withContexts.contexts.length;
			}

			// 関係を確認（プレースホルダー）
			// 実装では、リレーションシップリポジトリを確認します

			const reviewCount = await reviewRepository.countReviewsForTerm(term.id);
			if (reviewCount > 0) {
				termsWithReviews++;
			}
		}

		const averageContextsPerTerm =
			allTerms.length > 0 ? totalContextCount / allTerms.length : 0;

		return {
			totalTerms: allTerms.length,
			termsWithContexts,
			termsWithRelationships: 0, // Placeholder
			termsWithReviews,
			essentialTermsCoverage: essentialTerms.length,
			averageContextsPerTerm: Math.round(averageContextsPerTerm * 100) / 100,
		};
	}

	/**
	 * すべてのメトリクスを結合して取得
	 */
	async getAllMetrics() {
		const [systemMetrics, userActivityMetrics, coverageMetrics] =
			await Promise.all([
				this.getSystemMetrics(),
				this.getUserActivityMetrics(),
				this.getCoverageMetrics(),
			]);

		return {
			system: systemMetrics,
			userActivity: userActivityMetrics,
			coverage: coverageMetrics,
		};
	}

	/**
	 * 指定された形式でメトリクスをエクスポート
	 */
	async exportMetrics(format: ExportFormat): Promise<string> {
		const metrics = await this.getAllMetrics();

		if (format === "json") {
			return JSON.stringify(metrics, null, 2);
		}

		if (format === "csv") {
			return this.convertMetricsToCSV(metrics);
		}

		throw new Error(`Unsupported export format: ${format}`);
	}

	/**
	 * メトリクスをCSV形式に変換
	 */
	private convertMetricsToCSV(metrics: any): string {
		const lines: string[] = [];

		// ヘッダー
		lines.push("Category,Metric,Value");

		// システムメトリクス
		lines.push(`System,Total Terms,${metrics.system.totalTerms}`);
		lines.push(`System,Active Terms,${metrics.system.activeTerms}`);
		lines.push(`System,Draft Terms,${metrics.system.draftTerms}`);
		lines.push(`System,Deprecated Terms,${metrics.system.deprecatedTerms}`);
		lines.push(`System,Total Contexts,${metrics.system.totalContexts}`);
		lines.push(`System,Total Proposals,${metrics.system.totalProposals}`);
		lines.push(`System,Pending Proposals,${metrics.system.pendingProposals}`);
		lines.push(`System,Approved Proposals,${metrics.system.approvedProposals}`);
		lines.push(
			"System,Total Discussion Threads," +
				metrics.system.totalDiscussionThreads,
		);
		lines.push(`System,Open Threads,${metrics.system.openThreads}`);
		lines.push(`System,Total Reviews,${metrics.system.totalReviews}`);
		lines.push(`System,Essential Terms,${metrics.system.essentialTerms}`);

		// ユーザー活動メトリクス
		lines.push(
			`User Activity,Unique Reviewers,${metrics.userActivity.uniqueReviewers}`,
		);
		lines.push(
			`User Activity,Unique Learners,${metrics.userActivity.uniqueLearners}`,
		);
		lines.push(
			`User Activity,Unique Proposers,${metrics.userActivity.uniqueProposers}`,
		);
		lines.push(
			"User Activity,Unique Commenters," +
				metrics.userActivity.uniqueCommenters,
		);
		lines.push(
			"User Activity,Total Active Users," +
				metrics.userActivity.totalActiveUsers,
		);

		// カバレッジメトリクス
		lines.push(`Coverage,Total Terms,${metrics.coverage.totalTerms}`);
		lines.push(
			`Coverage,Terms with Contexts,${metrics.coverage.termsWithContexts}`,
		);
		lines.push(
			"Coverage,Terms with Relationships," +
				metrics.coverage.termsWithRelationships,
		);
		lines.push(
			`Coverage,Terms with Reviews,${metrics.coverage.termsWithReviews}`,
		);
		lines.push(
			"Coverage,Essential Terms Coverage," +
				metrics.coverage.essentialTermsCoverage,
		);
		lines.push(
			"Coverage,Average Contexts per Term," +
				metrics.coverage.averageContextsPerTerm,
		);

		return lines.join("\n");
	}

	/**
	 * 最もアクティブな提案者を取得（今後の追跡用プレースホルダー）
	 */
	async getMostActiveProposers(limit: number = 10) {
		const allProposals = await termProposalRepository.findAll();

		// 提案者ごとの提案数をカウントし、トップNを取得
		const proposerCounts = countBy(allProposals, (p) => p.proposedBy);
		const sorted = Object.entries(proposerCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit);

		return sorted.map(([userId, count]) => ({
			userId,
			proposalCount: count,
		}));
	}

	/**
	 * 最もアクティブなレビュアーを取得（今後の追跡用プレースホルダー）
	 */
	async getMostActiveReviewers(limit: number = 10) {
		const allReviews = await reviewRepository
			.findByStatus("confirmed")
			.then((confirmed) =>
				reviewRepository
					.findByStatus("needs_update")
					.then((needsUpdate) =>
						reviewRepository
							.findByStatus("needs_discussion")
							.then((needsDiscussion) => [
								...confirmed,
								...needsUpdate,
								...needsDiscussion,
							]),
					),
			);

		// レビュアーごとのレビュー数をカウントし、トップNを取得
		const reviewerCounts = countBy(allReviews, (r) => r.reviewedBy);
		const sorted = Object.entries(reviewerCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit);

		return sorted.map(([userId, count]) => ({
			userId,
			reviewCount: count,
		}));
	}
}

export const analyticsService = new AnalyticsService();
