import type { CreateProposalDto, CreateThreadDto } from "../dtos";
import type {
	Comment,
	DiscussionThread,
	Term,
	TermProposal,
	ThreadWithComments,
} from "../entities";

/**
 * 議論・提案管理サービスのインターフェース
 *
 * 新しい用語の提案、用語の改善に関する議論、チームでの合意形成を管理
 * するサービスです。
 */
export interface IDiscussionService {
	/**
	 * 新しい用語の提案を作成します
	 *
	 * @param data - 提案データ（用語名、定義案、提案理由など）
	 * @param userId - 提案するユーザーのID
	 * @returns 作成された用語提案オブジェクト
	 * @throws 無効なデータが提供された場合、または権限がない場合
	 */
	createProposal(
		data: CreateProposalDto,
		userId: string,
	): Promise<TermProposal>;

	/**
	 * 提案を承認し、新しい用語として確定します
	 *
	 * @param proposalId - 承認する提案のID
	 * @param approverId - 承認するユーザーのID
	 * @returns 提案から作成された用語オブジェクト
	 * @throws 提案が見つからない場合、または権限がない場合
	 */
	approveProposal(proposalId: string, approverId: string): Promise<Term>;

	/**
	 * 提案を却下します
	 *
	 * @param proposalId - 却下する提案のID
	 * @param approverId - 却下するユーザーのID
	 * @param reason - 却下の理由
	 * @returns なし
	 * @throws 提案が見つからない場合、または権限がない場合
	 */
	rejectProposal(
		proposalId: string,
		approverId: string,
		reason: string,
	): Promise<void>;

	/**
	 * 新しいディスカッションスレッドを作成します
	 *
	 * @param data - スレッド作成データ（タイトル、説明、対象用語など）
	 * @param userId - スレッドを作成するユーザーのID
	 * @returns 作成されたディスカッションスレッドオブジェクト
	 * @throws 無効なデータが提供された場合、または権限がない場合
	 */
	createThread(
		data: CreateThreadDto,
		userId: string,
	): Promise<DiscussionThread>;

	/**
	 * スレッドにコメントを追加します
	 *
	 * @param threadId - コメント対象のスレッドのID
	 * @param content - コメントの内容
	 * @param userId - コメントするユーザーのID
	 * @returns 作成されたコメントオブジェクト
	 * @throws スレッドが見つからない場合、またはスレッドが閉鎖されている場合
	 */
	addComment(
		threadId: string,
		content: string,
		userId: string,
	): Promise<Comment>;

	/**
	 * 指定されたスレッドとそのすべてのコメントを取得します
	 *
	 * @param threadId - 取得するスレッドのID
	 * @returns スレッドとコメントを含むオブジェクト
	 * @throws スレッドが見つからない場合
	 */
	getThread(threadId: string): Promise<ThreadWithComments>;

	/**
	 * 指定されたスレッドを閉鎖します
	 *
	 * @param threadId - 閉鎖するスレッドのID
	 * @returns なし
	 * @throws スレッドが見つからない場合
	 */
	closeThread(threadId: string): Promise<void>;
}
