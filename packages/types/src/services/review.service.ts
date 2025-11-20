import type { Review, ReviewStatus, Term } from "../entities";

/**
 * 学習復習サービスのインターフェース
 *
 * スペーシング反復学習（SRS：Spaced Repetition System）に基づいて、
 * ユーザーの学習進捗を管理し、復習スケジュールを管理するサービスです。
 */
export interface IReviewService {
	/**
	 * 指定された用語の復習をスケジュール登録します
	 *
	 * @param termId - スケジュール対象の用語のID
	 * @param cycleDays - 復習サイクルの日数
	 * @returns なし
	 */
	scheduleReview(termId: string, cycleDays: number): Promise<void>;

	/**
	 * 現在復習対象となっているすべての用語を取得します
	 *
	 * @returns 復習期日が到来した用語のリスト
	 */
	getTermsDueForReview(): Promise<Term[]>;

	/**
	 * 用語の復習を実施します
	 *
	 * @param termId - 復習対象の用語のID
	 * @param userId - 復習を実施するユーザーのID
	 * @param status - 復習の結果ステータス（成功、失敗など）
	 * @param notes - オプション：復習時のメモまたはコメント
	 * @returns 作成または更新された復習レコード
	 * @throws 用語が見つからない場合、または権限がない場合
	 */
	performReview(
		termId: string,
		userId: string,
		status: ReviewStatus,
		notes?: string,
	): Promise<Review>;

	/**
	 * 指定された用語の復習履歴を取得します
	 *
	 * @param termId - 対象用語のID
	 * @returns その用語の復習履歴のリスト（時系列で並び替え）
	 */
	getReviewHistory(termId: string): Promise<Review[]>;

	/**
	 * 復習期日に達したユーザーに通知を送信します
	 *
	 * @returns なし
	 */
	sendReviewNotifications(): Promise<void>;
}
