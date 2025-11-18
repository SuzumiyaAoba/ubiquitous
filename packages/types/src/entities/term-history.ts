/**
 * 用語履歴エンティティ
 *
 * 用語の変更履歴を追跡します。
 * 各変更はバージョン管理され、変更前後の定義や変更理由が記録されます。
 */
export interface TermHistory {
  /** 履歴レコードの一意識別子 */
  id: string;

  /** 対象用語の ID */
  termId: string;

  /** バージョン番号 */
  version: number;

  /** 変更前の定義 */
  previousDefinition: string;

  /** 変更後の定義 */
  newDefinition: string;

  /** 変更されたフィールドの配列 */
  changedFields: string[];

  /** 変更者のユーザーID */
  changedBy: string;

  /** 変更日時 */
  changedAt: Date;

  /** 変更理由（オプション） */
  changeReason?: string;
}
