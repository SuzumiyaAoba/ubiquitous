/**
 * 用語提案エンティティ
 *
 * 新しい用語の提案または既存用語の変更提案を表します。
 * 提案は承認、却下、または保留のステータスを持ちます。
 */
export interface TermProposal {
	/** 提案の一意識別子 */
	id: string;

	/** 提案する用語名 */
	name: string;

	/** 提案する用語の定義 */
	definition: string;

	/** 用語が属する Bounded Context の ID */
	boundedContextId: string;

	/** 提案者のユーザーID */
	proposedBy: string;

	/** 提案日時 */
	proposedAt: Date;

	/** 提案のステータス */
	status: "pending" | "approved" | "rejected" | "on_hold";

	/** 承認者のユーザーID（オプション） */
	approvedBy?: string;

	/** 承認日時（オプション） */
	approvedAt?: Date;

	/** 却下理由（オプション） */
	rejectionReason?: string;
}
