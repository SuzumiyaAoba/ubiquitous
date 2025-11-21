import type {
	ClarityAnalysis,
	ConsistencyCheck,
	SimilarTerm,
} from "../entities";

/**
 * AI支援機能サービスのインターフェース
 *
 * 大規模言語モデル（LLM）を活用して、用語定義の品質向上、整合性検証、
 * ドメイン知識に関する質問への回答などのAI支援機能を提供するサービスです。
 */
export interface IAIService {
	/**
	 * 用語定義の明確性を分析します
	 *
	 * @param definition - 分析対象の用語定義
	 * @returns 明確性の分析結果（スコア、改善提案など）
	 */
	analyzeDefinitionClarity(definition: string): Promise<ClarityAnalysis>;

	/**
	 * 用語の整合性を検証します
	 *
	 * @param termName - 検証対象の用語名
	 * @param definition - 用語の定義
	 * @param contextId - 用語が属するコンテキストのID
	 * @returns 整合性の検証結果（問題点、警告など）
	 */
	checkConsistency(
		termName: string,
		definition: string,
		contextId: string,
	): Promise<ConsistencyCheck>;

	/**
	 * 用語定義の改善提案を生成します
	 *
	 * @param definition - 改善対象の用語定義
	 * @returns 改善提案のリスト
	 */
	suggestImprovements(definition: string): Promise<string[]>;

	/**
	 * 似た意味を持つ既存の用語を検索します
	 *
	 * @param termName - 検索対象の用語名
	 * @param definition - 用語の定義
	 * @returns 類似した用語のリスト
	 */
	findSimilarTerms(
		termName: string,
		definition: string,
	): Promise<SimilarTerm[]>;

	/**
	 * ドメイン知識に関する質問に回答します
	 *
	 * @param question - ユーザーからの質問
	 * @param contextId - オプション：特定のコンテキスト内での回答が必要な場合のコンテキストID
	 * @returns 質問に対する回答文
	 */
	answerQuestion(question: string, contextId?: string): Promise<string>;

	/**
	 * ドメイン知識の文脈情報を構築します
	 *
	 * @returns ドメイン知識を活用したAI処理用の文脈情報
	 */
	buildKnowledgeContext(): Promise<string>;
}
