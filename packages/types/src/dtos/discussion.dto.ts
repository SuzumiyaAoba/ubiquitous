/**
 * 議論スレッドを作成するためのDTO
 *
 * 用語または提案に関する議論をコメント形式で進めるためのスレッドを開始します。
 * 既存の用語に関する改善提案や、新規提案の審議に使用されます。
 */
export interface CreateThreadDto {
	/** スレッドが紐付く既存の用語ID。termIdまたはproposalIdのいずれかを指定 */
	termId?: string;
	/** スレッドが紐付く提案ID。termIdまたはproposalIdのいずれかを指定 */
	proposalId?: string;
	/** スレッドのタイトル（必須） */
	title: string;
}
