import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { termRelationships } from "../db/schema";
import { termRepository } from "../repositories/term.repository";
import {
	type CreateTermRelationshipDto,
	type RelationshipType,
	termRelationshipRepository,
	type UpdateTermRelationshipDto,
} from "../repositories/term-relationship.repository";

export class RelationshipService {
	/**
	 * 親-子関係の循環依存をチェック
	 * この関係を追加すると循環が作成される場合、trueを返す
	 */
	async wouldCreateCycle(
		sourceTermId: string,
		targetTermId: string,
	): Promise<boolean> {
		// B がAの祖先である場合、AからBへの関係は循環を作成します
		const descendants =
			await termRelationshipRepository.findDescendants(targetTermId);
		return descendants.includes(sourceTermId);
	}

	/**
	 * 新しいターム関係を作成
	 * ターム存在することを検証し、親-子関係の循環依存を防ぎます
	 */
	async createRelationship(data: CreateTermRelationshipDto) {
		// ソースタームとターゲットタームが存在することを検証
		const sourceTerm = await termRepository.findById(data.sourceTermId);
		if (!sourceTerm) {
			throw new Error(`Source term with ID "${data.sourceTermId}" not found`);
		}

		const targetTerm = await termRepository.findById(data.targetTermId);
		if (!targetTerm) {
			throw new Error(`Target term with ID "${data.targetTermId}" not found`);
		}

		// ターム自体への関係を作成できません
		if (data.sourceTermId === data.targetTermId) {
			throw new Error("Cannot create a relationship from a term to itself");
		}

		// 関係が既に存在するかをチェック
		const existingRelationship = await termRelationshipRepository.findByTerms(
			data.sourceTermId,
			data.targetTermId,
			data.relationshipType,
		);

		if (existingRelationship) {
			throw new Error(
				`Relationship of type "${data.relationshipType}" already exists between these terms`,
			);
		}

		// 親-子関係については、循環依存をチェック
		if (
			data.relationshipType === "parent" ||
			data.relationshipType === "child"
		) {
			const wouldCycle = await this.wouldCreateCycle(
				data.sourceTermId,
				data.targetTermId,
			);
			if (wouldCycle) {
				throw new Error(
					"Cannot create this relationship as it would create a circular dependency",
				);
			}
		}

		return await termRelationshipRepository.create(data);
	}

	/**
	 * IDで関係を取得
	 */
	async getRelationshipById(id: string) {
		const relationship = await termRelationshipRepository.findById(id);
		if (!relationship) {
			throw new Error(`Relationship with ID "${id}" not found`);
		}
		return relationship;
	}

	/**
	 * ターム用のすべての関係を取得
	 */
	async getRelationshipsForTerm(termId: string) {
		// ターム存在することを検証
		const term = await termRepository.findById(termId);
		if (!term) {
			throw new Error(`Term with ID "${termId}" not found`);
		}

		return await termRelationshipRepository.findByTermId(termId);
	}

	/**
	 * 関連するターム詳細を含むすべての関係を持つターム取得
	 */
	async getTermWithRelationships(termId: string) {
		// ターム存在することを検証
		const term = await termRepository.findById(termId);
		if (!term) {
			throw new Error(`Term with ID "${termId}" not found`);
		}

		// すべての関係を取得
		const relationships = await termRelationshipRepository.findByTermId(termId);

		// 関連するターム詳細を取得
		const enrichedRelationships = await Promise.all(
			relationships.map(async (rel) => {
				const relatedTermId =
					rel.sourceTermId === termId ? rel.targetTermId : rel.sourceTermId;
				const relatedTerm = await termRepository.findById(relatedTermId);

				return {
					id: rel.id,
					relationshipType: rel.relationshipType,
					description: rel.description,
					direction: rel.sourceTermId === termId ? "outgoing" : "incoming",
					relatedTerm: relatedTerm
						? {
								id: relatedTerm.id,
								name: relatedTerm.name,
								description: relatedTerm.description,
								status: relatedTerm.status,
							}
						: null,
					createdAt: rel.createdAt,
					updatedAt: rel.updatedAt,
				};
			}),
		);

		return {
			term,
			relationships: enrichedRelationships,
		};
	}

	/**
	 * 関係を更新
	 */
	async updateRelationship(id: string, data: UpdateTermRelationshipDto) {
		// 関係が存在するかをチェック
		const existing = await this.getRelationshipById(id);

		// 関係タイプを親/子に変更する場合は、サイクルをチェック
		if (
			data.relationshipType &&
			(data.relationshipType === "parent" || data.relationshipType === "child")
		) {
			if (existing.relationshipType !== data.relationshipType) {
				const wouldCycle = await this.wouldCreateCycle(
					existing.sourceTermId,
					existing.targetTermId,
				);
				if (wouldCycle) {
					throw new Error(
						"Cannot change to this relationship type as it would create a circular dependency",
					);
				}
			}
		}

		return await termRelationshipRepository.update(id, data);
	}

	/**
	 * 関係を削除
	 */
	async deleteRelationship(id: string) {
		// 関係が存在するかをチェック
		await this.getRelationshipById(id);

		return await termRelationshipRepository.delete(id);
	}

	/**
	 * 2つのターム間の特定の関係を削除
	 */
	async deleteRelationshipBetweenTerms(
		sourceTermId: string,
		targetTermId: string,
	) {
		const deleted = await termRelationshipRepository.deleteByTerms(
			sourceTermId,
			targetTermId,
		);
		if (!deleted) {
			throw new Error("Relationship not found between these terms");
		}
		return deleted;
	}

	/**
	 * コンテキスト用の図データを取得（すべてのターム と関係）
	 */
	async getDiagramDataForContext(contextId: string) {
		// このコンテキスト内のすべてのターム取得
		const contextTerms = await termRepository.findByContextId(contextId);
		const termIds = contextTerms.map((t) => t.id);

		if (termIds.length === 0) {
			return {
				nodes: [],
				edges: [],
			};
		}

		// これらのターム間のすべての関係を取得
		const allRelationships = await db
			.select()
			.from(termRelationships)
			.where(
				or(
					...termIds.flatMap((id) => [
						eq(termRelationships.sourceTermId, id),
						eq(termRelationships.targetTermId, id),
					]),
				),
			);

		// 両方のターム コンテキストに含まれている関係のみを含むようにフィルター
		const contextRelationships = allRelationships.filter(
			(rel) =>
				termIds.includes(rel.sourceTermId) &&
				termIds.includes(rel.targetTermId),
		);

		// 図の視覚化用にフォーマット
		const nodes = contextTerms.map((term) => ({
			id: term.id,
			label: term.name,
			description: term.description,
			status: term.status,
		}));

		const edges = contextRelationships.map((rel) => ({
			id: rel.id,
			source: rel.sourceTermId,
			target: rel.targetTermId,
			type: rel.relationshipType,
			description: rel.description,
		}));

		return {
			nodes,
			edges,
		};
	}

	/**
	 * 関係タイプで指定されたタームに関連するすべてのターム取得
	 */
	async getRelatedTermsByType(
		termId: string,
		relationshipType: RelationshipType,
	) {
		// ターム存在することを検証
		await termRepository.findById(termId);

		const relationships = await db
			.select()
			.from(termRelationships)
			.where(
				or(
					eq(termRelationships.sourceTermId, termId),
					eq(termRelationships.targetTermId, termId),
				),
			);

		const relatedTermIds = relationships
			.filter((rel) => rel.relationshipType === relationshipType)
			.map((rel) =>
				rel.sourceTermId === termId ? rel.targetTermId : rel.sourceTermId,
			);

		// ターム詳細を取得
		const relatedTerms = await Promise.all(
			relatedTermIds.map((id) => termRepository.findById(id)),
		);

		return relatedTerms.filter((term) => term !== null);
	}

	/**
	 * ターム階層を取得（親-子関係）
	 */
	async getTermHierarchy(rootTermId?: string) {
		const hierarchyRelationships =
			await termRelationshipRepository.getHierarchyRelationships();

		if (rootTermId) {
			// ルートターム から階層を構築
			return await this.buildHierarchyTree(rootTermId, hierarchyRelationships);
		}

		// すべての階層関係を返す
		return hierarchyRelationships;
	}

	/**
	 * 関係から階層ツリー構造を構築
	 */
	private async buildHierarchyTree(
		termId: string,
		allRelationships: any[],
		visited: Set<string> = new Set(),
	): Promise<any> {
		if (visited.has(termId)) {
			return null; // 無限ループを防ぐ
		}

		visited.add(termId);

		const term = await termRepository.findById(termId);
		if (!term) return null;

		// 子関係を検索
		const childRelationships = allRelationships.filter(
			(rel) => rel.sourceTermId === termId && rel.relationshipType === "child",
		);

		const children = await Promise.all(
			childRelationships.map((rel) =>
				this.buildHierarchyTree(rel.targetTermId, allRelationships, visited),
			),
		);

		return {
			id: term.id,
			name: term.name,
			description: term.description,
			status: term.status,
			children: children.filter((child) => child !== null),
		};
	}
}

export const relationshipService = new RelationshipService();
