/**
 * 用語関係エンティティ
 *
 * 2つの用語間の関係を表します。
 * DDD における集約、関連、依存、継承などの関係性をモデル化します。
 */
export interface TermRelationship {
  /** 関係の一意識別子 */
  id: string;

  /** 関係の起点となる用語の ID */
  sourceTermId: string;

  /** 関係の終点となる用語の ID */
  targetTermId: string;

  /** 関係の種類 */
  relationshipType: 'aggregation' | 'association' | 'dependency' | 'inheritance';

  /** 関係の説明（オプション） */
  description?: string;

  /** 作成者のユーザーID */
  createdBy: string;

  /** 作成日時 */
  createdAt: Date;
}
