import type { CreateRelationshipDto, DiagramData } from "../dtos";
import type { TermRelationship } from "../entities";

/**
 * 用語関連性管理サービスのインターフェース
 *
 * 用語間の関係（継承、包含、依存など）を管理し、概念的なマッピングと
 * ダイアグラム生成を担当するサービスです。
 */
export interface IRelationshipService {
	/**
	 * 用語間の新しい関連性を作成します
	 *
	 * @param data - 関連性作成データ（ソース用語ID、ターゲット用語ID、関連性のタイプなど）
	 * @param userId - 関連性を作成するユーザーのID
	 * @returns 作成された用語関連性オブジェクト
	 * @throws 無効なデータが提供された場合、または権限がない場合
	 */
	createRelationship(
		data: CreateRelationshipDto,
		userId: string,
	): Promise<TermRelationship>;

	/**
	 * 指定された関連性を削除します
	 *
	 * @param id - 削除する関連性のID
	 * @returns なし
	 * @throws 関連性が見つからない場合
	 */
	deleteRelationship(id: string): Promise<void>;

	/**
	 * 指定された用語に関連するすべての関連性を取得します
	 *
	 * @param termId - 対象用語のID
	 * @returns その用語に関連する用語関連性のリスト
	 */
	getRelationships(termId: string): Promise<TermRelationship[]>;

	/**
	 * 新しい関連性作成時に循環依存がないかを検証します
	 *
	 * @param sourceId - ソース用語のID
	 * @param targetId - ターゲット用語のID
	 * @returns 循環依存がない場合は true、ある場合は false
	 */
	validateNoCircularDependency(
		sourceId: string,
		targetId: string,
	): Promise<boolean>;

	/**
	 * 用語の関連性をダイアグラムとして生成します
	 *
	 * @param contextId - オプション：特定のコンテキスト内のダイアグラムを生成する場合のID
	 * @returns ダイアグラムデータ（ノード、エッジなど）
	 */
	generateDiagram(contextId?: string): Promise<DiagramData>;
}
