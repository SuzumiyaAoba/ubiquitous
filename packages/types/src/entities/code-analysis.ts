/**
 * コード要素
 *
 * ソースコードから抽出されたクラス、メソッド、変数などの要素を表します。
 */
export interface CodeElement {
	/** 要素名 */
	name: string;

	/** 要素の種類 */
	type: "class" | "method" | "variable";

	/** マッチした用語の ID（オプション） */
	matchedTermId?: string;

	/** 改善提案（オプション） */
	suggestion?: string;
}

/**
 * コード分析エンティティ
 *
 * アップロードされたソースコードの分析結果を表します。
 * コード内の要素とユビキタス言語の用語との整合性を分析します。
 */
export interface CodeAnalysis {
	/** 分析の一意識別子 */
	id: string;

	/** 分析対象のファイル名 */
	fileName: string;

	/** アップロード者のユーザーID */
	uploadedBy: string;

	/** アップロード日時 */
	uploadedAt: Date;

	/** 抽出されたコード要素の配列 */
	extractedElements: CodeElement[];

	/** 用語とのマッチ率（0-100） */
	matchRate: number;
}

/**
 * 分析レポート
 *
 * コード分析の詳細なレポートを表します。
 * マッチした要素、マッチしなかった要素、改善提案などを含みます。
 */
export interface AnalysisReport {
	/** 分析ID */
	analysisId: string;

	/** ファイル名 */
	fileName: string;

	/** マッチ率（0-100） */
	matchRate: number;

	/** マッチした要素の配列 */
	matchedElements: CodeElement[];

	/** マッチしなかった要素の配列 */
	unmatchedElements: CodeElement[];

	/** 改善提案の配列 */
	suggestions: string[];
}
