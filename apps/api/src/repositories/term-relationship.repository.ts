import { and, eq, or } from "drizzle-orm";
import { db } from "../db";
import { termRelationships } from "../db/schema";

export type RelationshipType =
	| "synonym"
	| "antonym"
	| "related"
	| "parent"
	| "child";

export interface CreateTermRelationshipDto {
	sourceTermId: string;
	targetTermId: string;
	relationshipType: RelationshipType;
	description?: string;
}

export interface UpdateTermRelationshipDto {
	relationshipType?: RelationshipType;
	description?: string;
}

export class TermRelationshipRepository {
	/**
	 * 新しい用語関係を作成
	 */
	async create(data: CreateTermRelationshipDto) {
		const [relationship] = await db
			.insert(termRelationships)
			.values({
				sourceTermId: data.sourceTermId,
				targetTermId: data.targetTermId,
				relationshipType: data.relationshipType,
				description: data.description,
			})
			.returning();

		return relationship;
	}

	/**
	 * IDで関係を検索
	 */
	async findById(id: string) {
		const [relationship] = await db
			.select()
			.from(termRelationships)
			.where(eq(termRelationships.id, id));

		return relationship || null;
	}

	/**
	 * 用語のすべての関係を検索
	 * 送信側（ソース）と受信側（ターゲット）の両方の関係を返す
	 */
	async findByTermId(termId: string) {
		const relationships = await db
			.select()
			.from(termRelationships)
			.where(
				or(
					eq(termRelationships.sourceTermId, termId),
					eq(termRelationships.targetTermId, termId),
				),
			);

		return relationships;
	}

	/**
	 * 送信側関係を検索（用語がソースの場合）
	 */
	async findOutgoingByTermId(termId: string) {
		return await db
			.select()
			.from(termRelationships)
			.where(eq(termRelationships.sourceTermId, termId));
	}

	/**
	 * 受信側関係を検索（用語がターゲットの場合）
	 */
	async findIncomingByTermId(termId: string) {
		return await db
			.select()
			.from(termRelationships)
			.where(eq(termRelationships.targetTermId, termId));
	}

	/**
	 * タイプで関係を検索
	 */
	async findByType(relationshipType: RelationshipType) {
		return await db
			.select()
			.from(termRelationships)
			.where(eq(termRelationships.relationshipType, relationshipType));
	}

	/**
	 * 2つの用語間の特定の関係を検索
	 */
	async findByTerms(
		sourceTermId: string,
		targetTermId: string,
		relationshipType?: RelationshipType,
	) {
		const conditions = [
			eq(termRelationships.sourceTermId, sourceTermId),
			eq(termRelationships.targetTermId, targetTermId),
		];

		if (relationshipType) {
			conditions.push(eq(termRelationships.relationshipType, relationshipType));
		}

		const [relationship] = await db
			.select()
			.from(termRelationships)
			.where(and(...conditions));

		return relationship || null;
	}

	/**
	 * 2つの用語間に関係が存在するか確認
	 */
	async exists(
		sourceTermId: string,
		targetTermId: string,
		relationshipType?: RelationshipType,
	): Promise<boolean> {
		const relationship = await this.findByTerms(
			sourceTermId,
			targetTermId,
			relationshipType,
		);
		return !!relationship;
	}

	/**
	 * 関係を更新
	 */
	async update(id: string, data: UpdateTermRelationshipDto) {
		const [updated] = await db
			.update(termRelationships)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(termRelationships.id, id))
			.returning();

		return updated || null;
	}

	/**
	 * 関係を削除
	 */
	async delete(id: string) {
		const [deleted] = await db
			.delete(termRelationships)
			.where(eq(termRelationships.id, id))
			.returning();

		return deleted || null;
	}

	/**
	 * 用語のすべての関係を削除
	 */
	async deleteByTermId(termId: string) {
		const deleted = await db
			.delete(termRelationships)
			.where(
				or(
					eq(termRelationships.sourceTermId, termId),
					eq(termRelationships.targetTermId, termId),
				),
			)
			.returning();

		return deleted;
	}

	/**
	 * 2つの用語間の特定の関係を削除
	 */
	async deleteByTerms(sourceTermId: string, targetTermId: string) {
		const [deleted] = await db
			.delete(termRelationships)
			.where(
				and(
					eq(termRelationships.sourceTermId, sourceTermId),
					eq(termRelationships.targetTermId, targetTermId),
				),
			)
			.returning();

		return deleted || null;
	}

	/**
	 * すべての親子関係を取得（階層トラバーサルに有用）
	 */
	async getHierarchyRelationships() {
		return await db
			.select()
			.from(termRelationships)
			.where(
				or(
					eq(termRelationships.relationshipType, "parent"),
					eq(termRelationships.relationshipType, "child"),
				),
			);
	}

	/**
	 * 用語のすべての子孫を検索（循環依存チェック用）
	 */
	async findDescendants(
		termId: string,
		visited: Set<string> = new Set(),
	): Promise<string[]> {
		if (visited.has(termId)) {
			return [];
		}

		visited.add(termId);
		const descendants: string[] = [];

		// この用語がソースである子関係をすべて検索
		const childRelationships = await db
			.select()
			.from(termRelationships)
			.where(
				and(
					eq(termRelationships.sourceTermId, termId),
					eq(termRelationships.relationshipType, "child"),
				),
			);

		for (const rel of childRelationships) {
			descendants.push(rel.targetTermId);
			// この子の子孫を再帰的に検索
			const childDescendants = await this.findDescendants(
				rel.targetTermId,
				visited,
			);
			descendants.push(...childDescendants);
		}

		return descendants;
	}
}

export const termRelationshipRepository = new TermRelationshipRepository();
