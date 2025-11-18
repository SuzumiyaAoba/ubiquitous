/**
 * 用語エンティティ
 *
 * ユビキタス言語における用語を表します。
 * 各用語は特定の Bounded Context に属し、定義、例、使用上の注意などの情報を持ちます。
 */
export interface Term {
  /** 用語の一意識別子 */
  id: string;

  /** 用語名 */
  name: string;

  /** 用語の定義 */
  definition: string;

  /** 用語が属する Bounded Context の ID */
  boundedContextId: string;

  /** 用語のステータス */
  status: 'draft' | 'active' | 'archived';

  /** 用語の使用例（オプション） */
  examples?: string[];

  /** 使用上の注意（オプション） */
  usageNotes?: string;

  /** 用語の品質スコア（0-100） */
  qualityScore: number;

  /** オンボーディングに必須の用語かどうか */
  essentialForOnboarding: boolean;

  /** レビューサイクル日数（オプション） */
  reviewCycleDays?: number;

  /** 次回レビュー日（オプション） */
  nextReviewDate?: Date;

  /** 作成者のユーザーID */
  createdBy: string;

  /** 作成日時 */
  createdAt: Date;

  /** 最終更新者のユーザーID */
  updatedBy: string;

  /** 最終更新日時 */
  updatedAt: Date;

  /** 削除日時（ソフトデリート用、オプション） */
  deletedAt?: Date;
}
