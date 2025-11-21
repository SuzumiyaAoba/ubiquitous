import type { Metrics, TermSearchStats, TermViewStats } from "../dtos";

/**
 * 分析・メトリクスサービスのインターフェース
 *
 * ユーザー活動の追跡、ドメイン知識の成長度測定、用語の利用統計など、
 * システム全体のメトリクスと分析機能を提供するサービスです。
 */
export interface IAnalyticsService {
	/**
	 * ユーザーのアクティビティを追跡・記録します
	 *
	 * @param userId - アクティビティを記録するユーザーのID
	 * @param action - 実施されたアクション（閲覧、検索、更新など）
	 * @returns なし
	 */
	trackUserActivity(userId: string, action: string): Promise<void>;

	/**
	 * 指定された期間内のアクティブユーザー数を取得します
	 *
	 * @param startDate - 集計開始日時
	 * @param endDate - 集計終了日時
	 * @returns アクティブユーザーの人数
	 */
	getActiveUsers(startDate: Date, endDate: Date): Promise<number>;

	/**
	 * ユビキタス言語の網羅率（カバレッジ）を計算します
	 *
	 * @returns 0.0 から 1.0 の網羅率（例：0.85 は 85%）
	 */
	calculateCoverageRate(): Promise<number>;

	/**
	 * もっとも閲覧された用語をランキング形式で取得します
	 *
	 * @param limit - 取得する件数
	 * @returns 閲覧統計情報を含む用語のリスト
	 */
	getMostViewedTerms(limit: number): Promise<TermViewStats[]>;

	/**
	 * もっとも検索された用語をランキング形式で取得します
	 *
	 * @param limit - 取得する件数
	 * @returns 検索統計情報を含む用語のリスト
	 */
	getMostSearchedTerms(limit: number): Promise<TermSearchStats[]>;

	/**
	 * システム全体のメトリクスを取得します
	 *
	 * @returns メトリクス情報（ユーザー数、用語数、アクティビティ統計など）
	 */
	getMetrics(): Promise<Metrics>;

	/**
	 * メトリクスを指定された形式でエクスポートします
	 *
	 * @param format - エクスポート形式（'csv' または 'json'）
	 * @returns エクスポートされたメトリクスデータ（バイナリ）
	 */
	exportMetrics(format: "csv" | "json"): Promise<Buffer>;
}
