/**
 * ディスカッションスレッドエンティティ
 * 用語または提案に関する議論のスレッドを表します。
 */
export interface DiscussionThread {
	/** スレッドの一意識別子 */
	id: string;
	/** 関連する用語のID（オプション） */
	termId?: string;
	/** 関連する提案のID（オプション） */
	proposalId?: string;
	/** スレッドのタイトル */
	title: string;
	/** スレッドを作成したユーザーID */
	createdBy: string;
	/** スレッド作成日時 */
	createdAt: Date;
	/** スレッドのステータス（開放中または終了） */
	status: "open" | "closed";
}

/**
 * コメントエンティティ
 * ディスカッションスレッド内の個別のコメントを表します。
 */
export interface Comment {
	/** コメントの一意識別子 */
	id: string;
	/** このコメントが属するスレッドのID */
	threadId: string;
	/** コメントの内容 */
	content: string;
	/** コメントを投稿したユーザーID */
	postedBy: string;
	/** コメント投稿日時 */
	postedAt: Date;
	/** コメント更新日時（オプション） */
	updatedAt?: Date;
}

/**
 * コメント付きスレッド
 * DiscussionThread を拡張し、スレッドに関連するコメントを含むインターフェースです。
 */
export interface ThreadWithComments extends DiscussionThread {
	/** スレッドに属するコメントの配列 */
	comments: Comment[];
}
