import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { termHistory } from "../db/schema";

export interface CreateTermHistoryDto {
	termId: string;
	version: number;
	previousDefinition: string;
	newDefinition: string;
	changedFields: string[];
	changedBy: string;
	changeReason?: string;
}

export class TermHistoryRepository {
	/**
	 * 新しい履歴レコードを作成
	 */
	async create(data: CreateTermHistoryDto) {
		const [history] = await db
			.insert(termHistory)
			.values({
				termId: data.termId,
				version: data.version,
				previousDefinition: data.previousDefinition,
				newDefinition: data.newDefinition,
				changedFields: data.changedFields,
				changedBy: data.changedBy,
				changeReason: data.changeReason,
			})
			.returning();

		return history;
	}

	/**
	 * 用語のすべての履歴を取得
	 */
	async findByTermId(termId: string) {
		return await db
			.select()
			.from(termHistory)
			.where(eq(termHistory.termId, termId))
			.orderBy(desc(termHistory.version));
	}

	/**
	 * 用語の最新バージョン番号を取得
	 */
	async getLatestVersion(termId: string): Promise<number> {
		const [latest] = await db
			.select({ version: termHistory.version })
			.from(termHistory)
			.where(eq(termHistory.termId, termId))
			.orderBy(desc(termHistory.version))
			.limit(1);

		return latest?.version ?? 0;
	}

	/**
	 * 用語の特定のバージョンを取得
	 */
	async findByVersion(termId: string, version: number) {
		const [history] = await db
			.select()
			.from(termHistory)
			.where(
				and(eq(termHistory.termId, termId), eq(termHistory.version, version)),
			);

		return history || null;
	}

	/**
	 * 2つの定義間の差分を計算
	 */
	calculateDiff(oldDef: string, newDef: string): string[] {
		const changedFields: string[] = [];

		if (oldDef !== newDef) {
			changedFields.push("definition");
		}

		return changedFields;
	}
}

export const termHistoryRepository = new TermHistoryRepository();
