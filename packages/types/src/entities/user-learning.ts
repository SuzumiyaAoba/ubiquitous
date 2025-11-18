/**
 * ユーザー学習エンティティ
 *
 * ユーザーが学習した用語を追跡します。
 * オンボーディングプロセスや学習進捗の管理に使用されます。
 */
export interface UserLearning {
  /** 学習レコードの一意識別子 */
  id: string;

  /** ユーザーID */
  userId: string;

  /** 学習した用語のID */
  termId: string;

  /** 学習日時 */
  learnedAt: Date;
}
