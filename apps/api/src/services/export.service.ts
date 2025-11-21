import { contextRepository } from "../repositories/context.repository";
import { discussionRepository } from "../repositories/discussion.repository";
import { reviewRepository } from "../repositories/review.repository";
import { termRepository } from "../repositories/term.repository";
import { termProposalRepository } from "../repositories/term-proposal.repository";
import { termRelationshipRepository } from "../repositories/term-relationship.repository";

export interface ExportData {
	version: string;
	exportedAt: string;
	contexts: any[];
	terms: any[];
	termContexts: any[];
	relationships: any[];
	proposals: any[];
	discussions: any[];
	reviews: any[];
}

export class ExportService {
	/**
	 * すべてのデータをJSONでエクスポート
	 */
	async exportAsJSON(): Promise<string> {
		const data = await this.getAllData();
		return JSON.stringify(data, null, 2);
	}

	/**
	 * すべてのデータをコンテキストに関連付けて整理されたMarkdownでエクスポート
	 */
	async exportAsMarkdown(): Promise<string> {
		const contexts = await contextRepository.findAll();
		const terms = await termRepository.findAll();

		const lines: string[] = [];

		// ヘッダー
		lines.push("# Ubiquitous Language Documentation");
		lines.push("");
		lines.push(`Generated on: ${new Date().toISOString()}`);
		lines.push("");
		lines.push("---");
		lines.push("");

		// 目次
		lines.push("## Table of Contents");
		lines.push("");
		for (const context of contexts) {
			lines.push(`- [${context.name}](#${this.slugify(context.name)})`);
		}
		lines.push("");
		lines.push("---");
		lines.push("");

		// 各コンテキストごと
		for (const context of contexts) {
			lines.push(`## ${context.name}`);
			lines.push("");

			if (context.description) {
				lines.push(context.description);
				lines.push("");
			}

			// このコンテキスト内のターム取得
			const contextTerms = await termRepository.findByContextId(context.id);

			if (contextTerms.length > 0) {
				lines.push("### ターム");
				lines.push("");

				for (const termInContext of contextTerms) {
					lines.push(`#### ${termInContext.name}`);
					lines.push("");

					// ステータスバッジ
					lines.push(`**Status:** \`${termInContext.status}\``);
					lines.push("");

					// このコンテキスト内の定義
					if (termInContext.definition) {
						lines.push("**Definition:**");
						lines.push("");
						lines.push(termInContext.definition);
						lines.push("");
					}

					// 例
					if (termInContext.examples) {
						lines.push("**例:**");
						lines.push("");
						lines.push(termInContext.examples);
						lines.push("");
					}

					// 関係を取得
					const relationships =
						await termRelationshipRepository.findOutgoingByTermId(
							termInContext.id,
						);

					if (relationships.length > 0) {
						lines.push("**関係:**");
						lines.push("");

						for (const rel of relationships) {
							// ターゲットターム名を取得
							const targetTerm = terms.find((t) => t.id === rel.targetTermId);
							if (targetTerm) {
								lines.push(`- **${rel.relationshipType}:** ${targetTerm.name}`);
								if (rel.description) {
									lines.push(`  - ${rel.description}`);
								}
							}
						}
						lines.push("");
					}

					// レビューを取得
					const termReviews = await reviewRepository.findByTermId(
						termInContext.id,
					);
					if (termReviews.length > 0) {
						const latestReview = termReviews[0]; // 日付の降順でソート済み
						lines.push("**最新レビュー:**");
						lines.push("");
						lines.push(
							`- Status: \`${latestReview.status}\` (${new Date(latestReview.reviewedAt).toLocaleDateString()})`,
						);
						if (latestReview.notes) {
							lines.push(`- Notes: ${latestReview.notes}`);
						}
						lines.push("");
					}

					lines.push("---");
					lines.push("");
				}
			} else {
				lines.push("*No terms defined in this context yet.*");
				lines.push("");
			}

			lines.push("");
		}

		// Unassigned terms (terms not in any context)
		const unassignedTerms: any[] = [];
		for (const term of terms) {
			const termWithContexts = await termRepository.getWithContexts(term.id);
			if (termWithContexts && termWithContexts.contexts.length === 0) {
				unassignedTerms.push(term);
			}
		}

		if (unassignedTerms.length > 0) {
			lines.push("## 未割り当てターム");
			lines.push("");
			lines.push(
				"*まだバウンドされたコンテキストに割り当てられていないターム。*",
			);
			lines.push("");

			for (const term of unassignedTerms) {
				lines.push(`### ${term.name}`);
				lines.push("");
				lines.push(`**Status:** \`${term.status}\``);
				lines.push("");

				if (term.description) {
					lines.push(term.description);
					lines.push("");
				}

				lines.push("---");
				lines.push("");
			}
		}

		return lines.join("\n");
	}

	/**
	 * エクスポート用にすべてのデータを取得
	 */
	private async getAllData(): Promise<ExportData> {
		const [contexts, terms, allProposals, allThreads] = await Promise.all([
			contextRepository.findAll(),
			termRepository.findAll(),
			termProposalRepository.findAll(),
			discussionRepository.findAllThreads(),
		]);

		// すべてのターム-コンテキストを取得
		const termContexts = (
			await Promise.all(
				terms.map(async (term) => {
					const withContexts = await termRepository.getWithContexts(term.id);
					return (withContexts?.contexts ?? []).map((context) => ({
						termId: term.id,
						termName: term.name,
						...context,
					}));
				}),
			)
		).flat();

		// すべての関係を取得
		const relationships = (
			await Promise.all(
				terms.map((term) => termRelationshipRepository.findByTermId(term.id)),
			)
		).flat();

		// コメント付きのすべてのディスカッションを取得
		const discussions = (
			await Promise.all(
				allThreads.map((thread) =>
					discussionRepository.getThreadWithComments(thread.id),
				),
			)
		).filter((d): d is NonNullable<typeof d> => d !== null);

		// すべてのレビューを取得
		const reviews = (
			await Promise.all(
				terms.map((term) => reviewRepository.findByTermId(term.id)),
			)
		).flat();

		return {
			version: "1.0.0",
			exportedAt: new Date().toISOString(),
			contexts,
			terms,
			termContexts,
			relationships,
			proposals: allProposals,
			discussions,
			reviews,
		};
	}

	/**
	 * 文字列をURL対応スラッグに変換
	 */
	private slugify(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
}

export const exportService = new ExportService();
