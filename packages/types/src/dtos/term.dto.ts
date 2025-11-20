/**
 * 新しい用語を作成するためのDTO
 *
 * ユビキタス言語における新規用語の定義、例示、およびメタデータを指定します。
 */
export interface CreateTermDto {
	/** 用語名（必須） */
	name: string;
	/** 用語の詳細な定義（必須） */
	definition: string;
	/** 所属する境界付きコンテキストのID（必須） */
	boundedContextId: string;
	/** 用語の使用例（複数指定可能） */
	examples?: string[];
	/** 用語の使用上の注意や補足説明 */
	usageNotes?: string;
	/** オンボーディング時に必須となるかどうか */
	essentialForOnboarding?: boolean;
	/** レビューサイクル間隔（日数）。デフォルトは未設定 */
	reviewCycleDays?: number;
}

/**
 * 既存の用語を更新するためのDTO
 *
 * 用語の情報を段階的に更新できます。すべてのプロパティはオプショナルです。
 */
export interface UpdateTermDto {
	/** 用語名を更新する場合に指定 */
	name?: string;
	/** 用語の定義を更新する場合に指定 */
	definition?: string;
	/** 用語の使用例を更新する場合に指定 */
	examples?: string[];
	/** 用語の使用上の注意を更新する場合に指定 */
	usageNotes?: string;
	/** オンボーディング必須フラグを更新する場合に指定 */
	essentialForOnboarding?: boolean;
	/** レビューサイクル間隔を更新する場合に指定 */
	reviewCycleDays?: number;
	/** 変更理由の説明 */
	changeReason?: string;
}
