import type { BoundedContext, Term, TermRelationship } from "../entities";

/**
 * システムのデータをエクスポートするためのDTO
 *
 * 境界付きコンテキスト、用語、関係性をまとめてエクスポートします。
 * バックアップやデータ移行などに使用されます。
 */
export interface ExportData {
	/** エクスポートデータのバージョン（互換性チェック用） */
	version: string;
	/** エクスポート実行日時 */
	exportedAt: Date;
	/** エクスポートされた境界付きコンテキストの配列 */
	contexts: BoundedContext[];
	/** エクスポートされた用語の配列 */
	terms: Term[];
	/** エクスポートされた用語間関係の配列 */
	relationships: TermRelationship[];
}

/**
 * データインポート実行結果を表現するDTO
 *
 * インポート処理の成功状況と詳細な結果、エラー情報を含みます。
 */
export interface ImportResult {
	/** インポートが成功したかどうか。エラーがある場合でも一部成功はtrueになる可能性 */
	success: boolean;
	/** インポートされた境界付きコンテキストの数 */
	importedContexts: number;
	/** インポートされた用語の数 */
	importedTerms: number;
	/** インポートされた用語間関係の数 */
	importedRelationships: number;
	/** インポート時に発生したエラーメッセージのリスト */
	errors: string[];
}

/**
 * データバリデーション結果を表現するDTO
 *
 * エクスポート・インポートデータの検証結果を示します。
 */
export interface ValidationResult {
	/** バリデーションが成功したかどうか */
	valid: boolean;
	/** バリデーション時に検出されたエラーメッセージのリスト */
	errors: string[];
}
