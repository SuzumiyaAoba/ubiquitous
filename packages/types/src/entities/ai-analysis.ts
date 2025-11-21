/**
 * 類似用語
 *
 * AI分析によって検出された類似する用語を表します。
 */
export interface SimilarTerm {
	/** 用語ID */
	termId: string;

	/** 用語名 */
	termName: string;

	/** 類似度（0-1） */
	similarity: number;

	/** 類似と判断した理由 */
	reason: string;
}

/**
 * AI分析エンティティ
 *
 * AIによる用語や提案の分析結果を表します。
 * 明瞭性、一貫性、改善提案、Q&Aなどの分析タイプをサポートします。
 */
export interface AIAnalysis {
	/** 分析の一意識別子 */
	id: string;

	/** 分析対象の用語ID（オプション） */
	termId?: string;

	/** 分析対象の提案ID（オプション） */
	proposalId?: string;

	/** 分析の種類 */
	analysisType: "clarity" | "consistency" | "suggestion" | "qa";

	/** 分析への入力テキスト */
	input: string;

	/** 分析結果の出力 */
	output: string;

	/** 明瞭性スコア（0-100、オプション） */
	clarityScore?: number;

	/** 改善提案の配列 */
	suggestions: string[];

	/** 類似用語の配列 */
	similarTerms: SimilarTerm[];

	/** 分析実施日時 */
	analyzedAt: Date;
}

/**
 * 明瞭性の問題
 *
 * 用語定義の明瞭性に関する問題を表します。
 */
export interface ClarityIssue {
	/** 問題の種類 */
	type: "ambiguity" | "vagueness" | "complexity" | "missing_context";

	/** 問題の説明 */
	description: string;

	/** 深刻度 */
	severity: "low" | "medium" | "high";
}

/**
 * 明瞭性分析
 *
 * 用語定義の明瞭性分析結果を表します。
 */
export interface ClarityAnalysis {
	/** 明瞭性スコア（0-100） */
	score: number;

	/** 検出された問題の配列 */
	issues: ClarityIssue[];

	/** 改善提案の配列 */
	suggestions: string[];
}

/**
 * 競合
 *
 * 用語間の矛盾や競合を表します。
 */
export interface Conflict {
	/** 競合する用語のID */
	conflictingTermId: string;

	/** 競合する用語の名前 */
	conflictingTermName: string;

	/** 競合の理由 */
	reason: string;
}

/**
 * 一貫性チェック
 *
 * 用語の一貫性チェック結果を表します。
 */
export interface ConsistencyCheck {
	/** 一貫性があるかどうか */
	isConsistent: boolean;

	/** 検出された競合の配列 */
	conflicts: Conflict[];

	/** 推奨事項の配列 */
	recommendations: string[];
}
