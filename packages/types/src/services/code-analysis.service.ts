import { CodeAnalysis, CodeElement, AnalysisReport } from '../entities';

/**
 * コード分析サービスのインターフェース
 *
 * ソースコードを分析し、コード内の要素をユビキタス言語の用語と照合して、
 * コードと概念モデルの一貫性を検証するサービスです。
 */
export interface ICodeAnalysisService {
  /**
   * 提供されたコードを分析します
   *
   * @param code - 分析対象のソースコード文字列
   * @param fileName - コードが属するファイルの名前
   * @param userId - 分析を実施するユーザーのID
   * @returns 分析結果（特定された要素、用語マッチングなど）
   * @throws コードが無効な場合、またはファイル形式がサポートされていない場合
   */
  analyzeCode(code: string, fileName: string, userId: string): Promise<CodeAnalysis>;

  /**
   * コードから構造要素（クラス、関数、変数など）を抽出します
   *
   * @param code - 分析対象のソースコード文字列
   * @returns 抽出されたコード要素のリスト
   */
  extractElements(code: string): Promise<CodeElement[]>;

  /**
   * 抽出されたコード要素をユビキタス言語の用語と照合します
   *
   * @param elements - マッチング対象のコード要素
   * @returns 用語マッチング情報が追加されたコード要素のリスト
   */
  matchWithTerms(elements: CodeElement[]): Promise<CodeElement[]>;

  /**
   * コード分析の結果レポートを生成します
   *
   * @param analysisId - レポート対象の分析のID
   * @returns 分析結果のレポート（サマリー、問題点、推奨事項など）
   * @throws 分析が見つからない場合
   */
  generateReport(analysisId: string): Promise<AnalysisReport>;
}
