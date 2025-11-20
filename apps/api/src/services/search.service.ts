import { eq } from "drizzle-orm";
import { db } from "../db";
import { contexts, termContexts } from "../db/schema";
import { termRepository } from "../repositories/term.repository";
import {
	meiliSearchClient,
	type TermSearchDocument,
} from "../search/meilisearch.client";

export class SearchService {
	/**
	 * データベースのターム検索ドキュメントに変換
	 */
	private async termToSearchDocument(
		termId: string,
	): Promise<TermSearchDocument | null> {
		const term = await termRepository.findById(termId);
		if (!term) return null;

		// このターム用のすべてのコンテキストを取得
		const termContextList = await db
			.select({
				contextId: termContexts.contextId,
				contextName: contexts.name,
				definition: termContexts.definition,
				examples: termContexts.examples,
			})
			.from(termContexts)
			.innerJoin(contexts, eq(termContexts.contextId, contexts.id))
			.where(eq(termContexts.termId, termId));

		return {
			id: term.id,
			name: term.name,
			description: term.description,
			status: term.status,
			contexts: termContextList.map((ctx) => ({
				contextId: ctx.contextId,
				contextName: ctx.contextName,
				definition: ctx.definition,
				examples: ctx.examples,
			})),
			createdAt: term.createdAt.getTime(),
			updatedAt: term.updatedAt.getTime(),
		};
	}

	/**
	 * 単一のターム をインデックス
	 */
	async indexTerm(termId: string): Promise<void> {
		const searchDoc = await this.termToSearchDocument(termId);
		if (searchDoc) {
			await meiliSearchClient.indexTerm(searchDoc);
		}
	}

	/**
	 * データベース内のすべてのターム をインデックス
	 */
	async indexAllTerms(): Promise<number> {
		const allTerms = await termRepository.findAll();

		const searchDocs: TermSearchDocument[] = [];
		for (const term of allTerms) {
			const searchDoc = await this.termToSearchDocument(term.id);
			if (searchDoc) {
				searchDocs.push(searchDoc);
			}
		}

		if (searchDocs.length > 0) {
			await meiliSearchClient.indexTerms(searchDocs);
		}

		return searchDocs.length;
	}

	/**
	 * 検索インデックスからターム削除
	 */
	async removeTermFromIndex(termId: string): Promise<void> {
		await meiliSearchClient.deleteTerm(termId);
	}

	/**
	 * 全文検索でターム検索
	 */
	async searchTerms(
		query: string,
		options?: {
			limit?: number;
			offset?: number;
			contextId?: string;
			status?: string;
		},
	) {
		// フィルターを構築
		const filters: string[] = [];
		if (options?.contextId) {
			filters.push(`contexts.contextId = "${options.contextId}"`);
		}
		if (options?.status) {
			filters.push(`status = "${options.status}"`);
		}

		const filterString = filters.length > 0 ? filters.join(" AND ") : undefined;

		const results = await meiliSearchClient.searchTerms(query, {
			limit: options?.limit || 20,
			offset: options?.offset || 0,
			filter: filterString,
		});

		return {
			hits: results.hits,
			query: results.query,
			processingTimeMs: results.processingTimeMs,
			limit: results.limit,
			offset: results.offset,
			estimatedTotalHits: results.estimatedTotalHits,
		};
	}

	/**
	 * 検索提案を取得（オートコンプリート）
	 */
	async getSuggestions(query: string, limit: number = 5) {
		const results = await meiliSearchClient.searchTerms(query, {
			limit,
		});

		return results.hits.map((hit) => ({
			id: hit.id,
			name: hit.name,
			description: hit.description,
		}));
	}

	/**
	 * 検索インデックス全体を再構築
	 */
	async rebuildIndex(): Promise<number> {
		await meiliSearchClient.clearTermsIndex();
		return await this.indexAllTerms();
	}

	/**
	 * 検索インデックス統計を取得
	 */
	async getIndexStats() {
		return await meiliSearchClient.getIndexStats();
	}

	/**
	 * MeiliSearch接続をテスト
	 */
	async testConnection(): Promise<boolean> {
		return await meiliSearchClient.testConnection();
	}
}

export const searchService = new SearchService();
