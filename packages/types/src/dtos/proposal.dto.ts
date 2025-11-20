/**
 * 新しい用語提案を作成するためのDTO
 *
 * ユーザーが新しい用語を提案し、チームレビュープロセスに提出します。
 * 提案は最終的に用語として承認されるか、棄却されます。
 */
export interface CreateProposalDto {
	/** 提案する用語の名前（必須） */
	name: string;
	/** 提案する用語の定義（必須） */
	definition: string;
	/** 提案する用語が属する境界付きコンテキストのID（必須） */
	boundedContextId: string;
}
