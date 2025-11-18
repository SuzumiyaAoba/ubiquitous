import { ReviewStatus } from '../entities';

/**
 * 用語レビューを実行するためのDTO
 *
 * 用語の定義、例示、用法に関する定期的なレビューを記録します。
 * チーム内でユビキタス言語の定義を保つために使用されます。
 */
export interface PerformReviewDto {
  /** レビュー対象の用語ID（必須） */
  termId: string;
  /** レビュー結果のステータス（必須）。承認、変更必要、棄却など */
  status: ReviewStatus;
  /** レビュー時の注記やコメント */
  notes?: string;
}
