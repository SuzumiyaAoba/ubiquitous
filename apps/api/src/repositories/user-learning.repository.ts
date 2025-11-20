import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { userLearning } from "../db/schema";

export interface MarkLearnedDto {
	userId: string;
	termId: string;
}

export class UserLearningRepository {
	/**
	 * ユーザーが用語を学習済みとしてマーク
	 */
	async markAsLearned(data: MarkLearnedDto) {
		// 既に学習済みとしてマークされているか確認
		const existing = await this.findByUserAndTerm(data.userId, data.termId);
		if (existing) {
			return existing;
		}

		const [learned] = await db
			.insert(userLearning)
			.values({
				userId: data.userId,
				termId: data.termId,
			})
			.returning();

		return learned;
	}

	/**
	 * 用語の学習済みマークを解除
	 */
	async unmarkAsLearned(userId: string, termId: string) {
		const [deleted] = await db
			.delete(userLearning)
			.where(
				and(eq(userLearning.userId, userId), eq(userLearning.termId, termId)),
			)
			.returning();

		return deleted || null;
	}

	/**
	 * ユーザーと用語で学習レコードを検索
	 */
	async findByUserAndTerm(userId: string, termId: string) {
		const [record] = await db
			.select()
			.from(userLearning)
			.where(
				and(eq(userLearning.userId, userId), eq(userLearning.termId, termId)),
			);

		return record || null;
	}

	/**
	 * ユーザーのすべての学習済み用語を取得
	 */
	async findLearnedByUser(userId: string) {
		return await db
			.select()
			.from(userLearning)
			.where(eq(userLearning.userId, userId));
	}

	/**
	 * ユーザーの学習済み用語IDを取得
	 */
	async getLearnedTermIds(userId: string): Promise<string[]> {
		const records = await this.findLearnedByUser(userId);
		return records.map((record) => record.termId);
	}

	/**
	 * ユーザーが用語を学習したか確認
	 */
	async hasLearned(userId: string, termId: string): Promise<boolean> {
		const record = await this.findByUserAndTerm(userId, termId);
		return record !== null;
	}

	/**
	 * ユーザーの学習数をカウント
	 */
	async countLearnedTerms(userId: string): Promise<number> {
		const records = await this.findLearnedByUser(userId);
		return records.length;
	}

	/**
	 * 特定の用語を学習したユーザーを取得
	 */
	async findUsersWhoLearned(termId: string) {
		return await db
			.select()
			.from(userLearning)
			.where(eq(userLearning.termId, termId));
	}

	/**
	 * 複数の用語を一括で学習済みとしてマーク
	 */
	async bulkMarkAsLearned(userId: string, termIds: string[]) {
		const records = await Promise.all(
			termIds.map((termId) => this.markAsLearned({ userId, termId })),
		);
		return records;
	}

	/**
	 * ユーザーの学習統計を取得
	 */
	async getUserLearningStats(userId: string, essentialTermIds: string[]) {
		const learnedTermIds = await this.getLearnedTermIds(userId);
		const learnedEssentialIds = learnedTermIds.filter((id) =>
			essentialTermIds.includes(id),
		);

		return {
			totalLearned: learnedTermIds.length,
			essentialLearned: learnedEssentialIds.length,
			essentialTotal: essentialTermIds.length,
			percentComplete:
				essentialTermIds.length > 0
					? (learnedEssentialIds.length / essentialTermIds.length) * 100
					: 0,
		};
	}
}

export const userLearningRepository = new UserLearningRepository();
