import { termRepository } from "../repositories/term.repository";
import { termRelationshipRepository } from "../repositories/term-relationship.repository";
import {
	type MarkLearnedDto,
	userLearningRepository,
} from "../repositories/user-learning.repository";

export interface LearningProgress {
	userId: string;
	totalEssentialTerms: number;
	learnedEssentialTerms: number;
	percentComplete: number;
	remainingTerms: string[];
	learnedTermIds: string[];
}

export interface LearningPath {
	termId: string;
	termName: string;
	order: number;
	dependencies: string[];
	isLearned: boolean;
}

export class OnboardingService {
	/**
	 * 必須タームをすべて取得
	 */
	async getEssentialTerms() {
		return await termRepository.findEssentialTerms();
	}

	/**
	 * タームを必須としてマーク
	 */
	async markTermAsEssential(termId: string) {
		const term = await termRepository.findById(termId);
		if (!term) {
			throw new Error(`Term with ID "${termId}" not found`);
		}

		return await termRepository.update(termId, { isEssential: true });
	}

	/**
	 * タームを必須としてアンマーク
	 */
	async unmarkTermAsEssential(termId: string) {
		const term = await termRepository.findById(termId);
		if (!term) {
			throw new Error(`Term with ID "${termId}" not found`);
		}

		return await termRepository.update(termId, { isEssential: false });
	}

	/**
	 * ユーザーがタームを学習したとしてマーク
	 */
	async markTermAsLearned(data: MarkLearnedDto) {
		// ターム存在することを検証
		const term = await termRepository.findById(data.termId);
		if (!term) {
			throw new Error(`Term with ID "${data.termId}" not found`);
		}

		return await userLearningRepository.markAsLearned(data);
	}

	/**
	 * ユーザーがタームを学習したとしてアンマーク
	 */
	async unmarkTermAsLearned(userId: string, termId: string) {
		return await userLearningRepository.unmarkAsLearned(userId, termId);
	}

	/**
	 * ユーザーの学習進度を取得
	 */
	async getLearningProgress(userId: string): Promise<LearningProgress> {
		// 必須タームを取得
		const essentialTermIds = await termRepository.getEssentialTermIds();
		const _essentialTerms = await termRepository.findEssentialTerms();

		// 学習したタームを取得
		const learnedTermIds =
			await userLearningRepository.getLearnedTermIds(userId);

		// 学習した必須タームを計算
		const learnedEssentialIds = learnedTermIds.filter((id) =>
			essentialTermIds.includes(id),
		);

		// 残りのタームを計算
		const remainingTermIds = essentialTermIds.filter(
			(id) => !learnedEssentialIds.includes(id),
		);

		return {
			userId,
			totalEssentialTerms: essentialTermIds.length,
			learnedEssentialTerms: learnedEssentialIds.length,
			percentComplete:
				essentialTermIds.length > 0
					? Math.round(
							(learnedEssentialIds.length / essentialTermIds.length) * 100,
						)
					: 0,
			remainingTerms: remainingTermIds,
			learnedTermIds: learnedEssentialIds,
		};
	}

	/**
	 * 依存関係に基づいて推奨される学習順序を取得
	 */
	async getRecommendedLearningPath(userId: string): Promise<LearningPath[]> {
		// 必須タームを取得
		const essentialTerms = await termRepository.findEssentialTerms();
		const essentialTermIds = essentialTerms.map((t) => t.id);

		// 学習したタームを取得
		const learnedTermIds =
			await userLearningRepository.getLearnedTermIds(userId);

		// 関係から依存関係グラフを構築
		const dependencyMap = new Map<string, string[]>();

		for (const term of essentialTerms) {
			const relationships =
				await termRelationshipRepository.findOutgoingByTermId(term.id);

			// 親の関係は依存関係を示しています（最初に親を学習する必要があります）
			const dependencies = relationships
				.filter((rel: any) => rel.relationshipType === "parent")
				.map((rel: any) => rel.targetTermId)
				.filter((id: string) => essentialTermIds.includes(id)); // 必須タームのみ

			dependencyMap.set(term.id, dependencies);
		}

		// 学習順序を決定するためのトポロジカルソート
		const learningPath: LearningPath[] = [];
		const visited = new Set<string>();
		const tempMark = new Set<string>();

		const visit = (termId: string, depth: number = 0) => {
			if (tempMark.has(termId)) {
				// 循環依存が検出されました、とにかく続行
				return;
			}

			if (visited.has(termId)) {
				return;
			}

			tempMark.add(termId);

			const dependencies = dependencyMap.get(termId) || [];

			// 最初に依存関係を訪問
			for (const depId of dependencies) {
				visit(depId, depth + 1);
			}

			tempMark.delete(termId);
			visited.add(termId);

			const term = essentialTerms.find((t) => t.id === termId);
			if (term) {
				learningPath.push({
					termId: term.id,
					termName: term.name,
					order: learningPath.length + 1,
					dependencies,
					isLearned: learnedTermIds.includes(term.id),
				});
			}
		};

		// すべての必須タームを訪問
		for (const term of essentialTerms) {
			visit(term.id);
		}

		return learningPath;
	}

	/**
	 * 次に学習するべき推奨タームを取得
	 */
	async getNextRecommendedTerms(userId: string, limit: number = 5) {
		const learningPath = await this.getRecommendedLearningPath(userId);

		// すべての依存関係が学習されているいわれていないタームにフィルター
		const recommendations = learningPath
			.filter((item) => !item.isLearned)
			.filter((item) => {
				// すべての依存関係が学習されているかをチェック
				return item.dependencies.every((depId) => {
					const dep = learningPath.find((p) => p.termId === depId);
					return dep?.isLearned || false;
				});
			})
			.slice(0, limit);

		// 完全なターム詳細で充実
		const enriched = await Promise.all(
			recommendations.map(async (rec) => {
				const term = await termRepository.findById(rec.termId);
				return {
					...rec,
					term,
				};
			}),
		);

		return enriched;
	}

	/**
	 * ユーザーがタームを学習できるかをチェック（すべての依存関係が満たされている）
	 */
	async canLearnTerm(userId: string, termId: string): Promise<boolean> {
		const term = await termRepository.findById(termId);
		if (!term) {
			throw new Error(`Term with ID "${termId}" not found`);
		}

		// ターム依存関係を取得（親の関係）
		const relationships =
			await termRelationshipRepository.findOutgoingByTermId(termId);
		const parentIds = relationships
			.filter((rel: any) => rel.relationshipType === "parent")
			.map((rel: any) => rel.targetTermId);

		if (parentIds.length === 0) {
			// 依存関係なし、学習できます
			return true;
		}

		// すべての親が学習されているかをチェック
		const learnedTermIds =
			await userLearningRepository.getLearnedTermIds(userId);
		return parentIds.every((parentId: string) =>
			learnedTermIds.includes(parentId),
		);
	}
}

export const onboardingService = new OnboardingService();
