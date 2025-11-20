import type { Term } from "../entities";

/**
 * 新しい境界付きコンテキストを作成するためのDTO
 *
 * DDD（ドメイン駆動設計）における境界付きコンテキストを定義します。
 * 各コンテキスト内で、ユビキタス言語の用語が管理されます。
 */
export interface CreateContextDto {
	/** コンテキストの名前（必須） */
	name: string;
	/** コンテキストの詳細説明（必須） */
	description: string;
}

/**
 * 既存の境界付きコンテキストを更新するためのDTO
 *
 * コンテキストの情報を段階的に更新できます。すべてのプロパティはオプショナルです。
 */
export interface UpdateContextDto {
	/** コンテキストの名前を更新する場合に指定 */
	name?: string;
	/** コンテキストの説明を更新する場合に指定 */
	description?: string;
}

/**
 * コンテキストと関連するすべての用語を含むDTO
 *
 * 特定の境界付きコンテキストとその配下のすべての用語データを返すのに使用されます。
 * 詳細表示やエクスポート時に活用されます。
 */
export interface ContextWithTerms {
	/** コンテキストの一意識別子 */
	id: string;
	/** コンテキストの名前 */
	name: string;
	/** コンテキストの説明 */
	description: string;
	/** このコンテキストに属するすべての用語 */
	terms: Term[];
	/** コンテキストの作成日時 */
	createdAt: Date;
	/** コンテキストの最終更新日時 */
	updatedAt: Date;
}
