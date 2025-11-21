import type { CreateContextDto, UpdateContextDto } from "@ubiquitous/types";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { termContexts, terms } from "../db/schema";
import { contextRepository } from "../repositories/context.repository";

export class ContextService {
	/**
	 * 新しいバウンドされたコンテキストを作成
	 * 作成前に名前がユニークであることを検証
	 */
	async createContext(data: CreateContextDto) {
		// 同じ名前のコンテキストが既に存在するかを確認
		const exists = await contextRepository.existsByName(data.name);
		if (exists) {
			throw new Error(`Context with name "${data.name}" already exists`);
		}

		return await contextRepository.create(data);
	}

	/**
	 * IDでコンテキストを取得
	 */
	async getContextById(id: string) {
		const context = await contextRepository.findById(id);
		if (!context) {
			throw new Error(`Context with ID "${id}" not found`);
		}
		return context;
	}

	/**
	 * すべてのコンテキストを取得
	 */
	async getAllContexts() {
		return await contextRepository.findAll();
	}

	/**
	 * コンテキストを更新
	 */
	async updateContext(id: string, data: UpdateContextDto) {
		// コンテキストが存在するかを確認
		await this.getContextById(id);

		// 名前を更新する場合、ユニークネスを確認
		if (data.name) {
			const existingContext = await contextRepository.findById(id);
			if (existingContext && existingContext.name !== data.name) {
				const exists = await contextRepository.existsByName(data.name);
				if (exists) {
					throw new Error(`Context with name "${data.name}" already exists`);
				}
			}
		}

		return await contextRepository.update(id, data);
	}

	/**
	 * コンテキストを削除
	 * 注記：これは、すべての関連するターム-コンテキスト関係をカスケード削除します
	 */
	async deleteContext(id: string) {
		// コンテキストが存在するかを確認
		await this.getContextById(id);

		return await contextRepository.delete(id);
	}

	/**
	 * 関連するすべてのターム付きコンテキストを取得
	 */
	async getContextWithTerms(id: string) {
		const context = await this.getContextById(id);

		// このコンテキストに関連するすべてのタームを取得
		const contextTerms = await db
			.select({
				id: terms.id,
				name: terms.name,
				description: terms.description,
				status: terms.status,
				createdAt: terms.createdAt,
				updatedAt: terms.updatedAt,
				definition: termContexts.definition,
				examples: termContexts.examples,
			})
			.from(termContexts)
			.innerJoin(terms, eq(termContexts.termId, terms.id))
			.where(eq(termContexts.contextId, id));

		return {
			...context,
			terms: contextTerms,
		};
	}
}

export const contextService = new ContextService();
