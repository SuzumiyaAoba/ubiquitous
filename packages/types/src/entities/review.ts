/**
 * レビューステータス型
 * 用語レビューの結果を表します。
 * - confirmed: レビュー完了で問題なし
 * - needs_update: 更新が必要
 * - needs_discussion: さらなる議論が必要
 */
export type ReviewStatus = "confirmed" | "needs_update" | "needs_discussion";

/**
 * レビューエンティティ
 * 用語定義のピアレビュー結果を表します。
 */
export interface Review {
	/** レビューの一意識別子 */
	id: string;
	/** レビュー対象の用語のID */
	termId: string;
	/** レビューを実施したユーザーID */
	reviewedBy: string;
	/** レビュー実施日時 */
	reviewedAt: Date;
	/** レビューのステータス */
	status: ReviewStatus;
	/** レビューのメモまたはコメント（オプション） */
	notes?: string;
}
