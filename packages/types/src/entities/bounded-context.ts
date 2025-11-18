/**
 * Bounded Context エンティティ
 * ドメイン駆動設計（DDD）における Bounded Context を表します。
 * ドメインを論理的に区分し、境界内で一貫した言語とモデルを持つ領域です。
 */
export interface BoundedContext {
  /** Bounded Context の一意識別子 */
  id: string;
  /** Bounded Context の名前 */
  name: string;
  /** Bounded Context の説明 */
  description: string;
  /** Bounded Context を作成したユーザーID */
  createdBy: string;
  /** Bounded Context 作成日時 */
  createdAt: Date;
  /** Bounded Context 更新日時 */
  updatedAt: Date;
}
