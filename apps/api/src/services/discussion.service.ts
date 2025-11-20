import { contextRepository } from "../repositories/context.repository";
import {
	type CreateCommentDto,
	type CreateDiscussionThreadDto,
	discussionRepository,
	type ThreadStatus,
	type UpdateCommentDto,
	type UpdateDiscussionThreadDto,
} from "../repositories/discussion.repository";
import {
	type CreateTermDto,
	termRepository,
} from "../repositories/term.repository";
import { termHistoryRepository } from "../repositories/term-history.repository";
import {
	type CreateTermProposalDto,
	type ProposalStatus,
	termProposalRepository,
	type UpdateTermProposalDto,
} from "../repositories/term-proposal.repository";

export class DiscussionService {
	// ===== 提案操作 =====

	/**
	 * 新しいターム提案を作成
	 */
	async createProposal(data: CreateTermProposalDto) {
		// バウンドされたコンテキストが存在することを検証
		const context = await contextRepository.findById(data.boundedContextId);
		if (!context) {
			throw new Error(
				`Bounded context with ID "${data.boundedContextId}" not found`,
			);
		}

		// 同じ名前のターム既に存在するかを確認
		const existingTerm = await termRepository.existsByName(data.name);
		if (existingTerm) {
			throw new Error(
				`A term with name "${data.name}" already exists. Consider discussing changes to the existing term instead.`,
			);
		}

		return await termProposalRepository.create(data);
	}

	/**
	 * IDで提案を取得
	 */
	async getProposalById(id: string) {
		const proposal = await termProposalRepository.findById(id);
		if (!proposal) {
			throw new Error(`Proposal with ID "${id}" not found`);
		}
		return proposal;
	}

	/**
	 * すべての提案を取得
	 */
	async getAllProposals(status?: ProposalStatus) {
		if (status) {
			return await termProposalRepository.findByStatus(status);
		}
		return await termProposalRepository.findAll();
	}

	/**
	 * コンテキスト別に提案を取得
	 */
	async getProposalsByContext(contextId: string) {
		// コンテキストが存在することを検証
		const context = await contextRepository.findById(contextId);
		if (!context) {
			throw new Error(`Bounded context with ID "${contextId}" not found`);
		}

		return await termProposalRepository.findByContextId(contextId);
	}

	/**
	 * 提案を更新
	 */
	async updateProposal(id: string, data: UpdateTermProposalDto) {
		// 提案が存在するかを確認
		const proposal = await this.getProposalById(id);

		// 保留中またはホールド中の提案のみを更新できます
		if (proposal.status === "approved" || proposal.status === "rejected") {
			throw new Error(
				`Cannot update a proposal that has been ${proposal.status}`,
			);
		}

		// コンテキストを更新する場合、存在することを検証
		if (data.boundedContextId) {
			const context = await contextRepository.findById(data.boundedContextId);
			if (!context) {
				throw new Error(
					`Bounded context with ID "${data.boundedContextId}" not found`,
				);
			}
		}

		return await termProposalRepository.update(id, data);
	}

	/**
	 * 提案を承認してタームを作成
	 */
	async approveProposal(id: string, approvedBy: string) {
		const proposal = await this.getProposalById(id);

		// 保留中またはホールド中の提案のみを承認できます
		if (proposal.status === "approved") {
			throw new Error("Proposal has already been approved");
		}
		if (proposal.status === "rejected") {
			throw new Error("Cannot approve a rejected proposal");
		}

		// 提案からタームを作成
		const termData: CreateTermDto = {
			name: proposal.name,
			description: proposal.definition,
			status: "active",
		};

		const term = await termRepository.create(termData);

		// 提案の定義を使用してコンテキストに追加
		await termRepository.addToContext({
			termId: term.id,
			contextId: proposal.boundedContextId,
			definition: proposal.definition,
		});

		// 初期履歴レコードを作成
		await termHistoryRepository.create({
			termId: term.id,
			version: 1,
			previousDefinition: "",
			newDefinition: proposal.definition,
			changedFields: ["definition", "status"],
			changedBy: approvedBy,
			changeReason: `Created from proposal ${id}`,
		});

		// 提案ステータスを更新
		await termProposalRepository.approve(id, approvedBy);

		return {
			term,
			proposal: await this.getProposalById(id),
		};
	}

	/**
	 * 提案を却下
	 */
	async rejectProposal(id: string, rejectionReason: string) {
		const proposal = await this.getProposalById(id);

		// 保留中またはホールド中の提案のみを却下できます
		if (proposal.status === "approved") {
			throw new Error("Cannot reject an approved proposal");
		}
		if (proposal.status === "rejected") {
			throw new Error("Proposal has already been rejected");
		}

		if (!rejectionReason || rejectionReason.trim() === "") {
			throw new Error("Rejection reason is required");
		}

		return await termProposalRepository.reject(id, rejectionReason);
	}

	/**
	 * 提案をホールドにする
	 */
	async putProposalOnHold(id: string) {
		const proposal = await this.getProposalById(id);

		// 保留中の提案のみをホールドにできます
		if (proposal.status !== "pending") {
			throw new Error("Can only put pending proposals on hold");
		}

		return await termProposalRepository.putOnHold(id);
	}

	/**
	 * 提案を削除
	 */
	async deleteProposal(id: string) {
		// 提案が存在するかを確認
		await this.getProposalById(id);

		return await termProposalRepository.delete(id);
	}

	// ===== ディスカッションスレッド操作 =====

	/**
	 * 新しいディスカッションスレッドを作成
	 */
	async createThread(data: CreateDiscussionThreadDto) {
		// termIdまたはproposalIdのいずれかが提供されることを検証
		if (!data.termId && !data.proposalId) {
			throw new Error("Either termId or proposalId must be provided");
		}

		// タームまたは提案が存在することを検証
		if (data.termId) {
			const term = await termRepository.findById(data.termId);
			if (!term) {
				throw new Error(`Term with ID "${data.termId}" not found`);
			}
		}

		if (data.proposalId) {
			const proposal = await termProposalRepository.findById(data.proposalId);
			if (!proposal) {
				throw new Error(`Proposal with ID "${data.proposalId}" not found`);
			}
		}

		return await discussionRepository.createThread(data);
	}

	/**
	 * IDでスレッドを取得
	 */
	async getThreadById(id: string, includeComments: boolean = false) {
		if (includeComments) {
			const thread = await discussionRepository.getThreadWithComments(id);
			if (!thread) {
				throw new Error(`Thread with ID "${id}" not found`);
			}
			return thread;
		}

		const thread = await discussionRepository.findThreadById(id);
		if (!thread) {
			throw new Error(`Thread with ID "${id}" not found`);
		}
		return thread;
	}

	/**
	 * すべてのスレッドを取得
	 */
	async getAllThreads(status?: ThreadStatus) {
		if (status) {
			return await discussionRepository.findThreadsByStatus(status);
		}
		return await discussionRepository.findAllThreads();
	}

	/**
	 * ターム向けのスレッドを取得
	 */
	async getThreadsForTerm(termId: string) {
		// ターム存在することを検証
		const term = await termRepository.findById(termId);
		if (!term) {
			throw new Error(`Term with ID "${termId}" not found`);
		}

		return await discussionRepository.findThreadsByTermId(termId);
	}

	/**
	 * 提案向けのスレッドを取得
	 */
	async getThreadsForProposal(proposalId: string) {
		// 提案が存在することを検証
		const proposal = await termProposalRepository.findById(proposalId);
		if (!proposal) {
			throw new Error(`Proposal with ID "${proposalId}" not found`);
		}

		return await discussionRepository.findThreadsByProposalId(proposalId);
	}

	/**
	 * スレッドを更新
	 */
	async updateThread(id: string, data: UpdateDiscussionThreadDto) {
		// スレッドが存在するかを確認
		await this.getThreadById(id);

		return await discussionRepository.updateThread(id, data);
	}

	/**
	 * スレッドを閉じる
	 */
	async closeThread(id: string) {
		// スレッドが存在するかを確認
		await this.getThreadById(id);

		return await discussionRepository.closeThread(id);
	}

	/**
	 * スレッドを再開
	 */
	async reopenThread(id: string) {
		// スレッドが存在するかを確認
		await this.getThreadById(id);

		return await discussionRepository.reopenThread(id);
	}

	/**
	 * スレッドを削除
	 */
	async deleteThread(id: string) {
		// スレッドが存在するかを確認
		await this.getThreadById(id);

		return await discussionRepository.deleteThread(id);
	}

	// ===== コメント操作 =====

	/**
	 * スレッドにコメントを追加
	 */
	async addComment(data: CreateCommentDto) {
		// スレッドが存在することを検証
		const thread = await discussionRepository.findThreadById(data.threadId);
		if (!thread) {
			throw new Error(`Thread with ID "${data.threadId}" not found`);
		}

		// 開いているスレッドにのみコメントできます
		if (thread.status === "closed") {
			throw new Error("Cannot comment on a closed thread");
		}

		return await discussionRepository.createComment(data);
	}

	/**
	 * IDでコメントを取得
	 */
	async getCommentById(id: string) {
		const comment = await discussionRepository.findCommentById(id);
		if (!comment) {
			throw new Error(`Comment with ID "${id}" not found`);
		}
		return comment;
	}

	/**
	 * スレッドのコメントを取得
	 */
	async getCommentsForThread(threadId: string) {
		// スレッドが存在することを検証
		await this.getThreadById(threadId);

		return await discussionRepository.findCommentsByThreadId(threadId);
	}

	/**
	 * コメントを更新
	 */
	async updateComment(id: string, data: UpdateCommentDto, userId: string) {
		const comment = await this.getCommentById(id);

		// コメント著者のみが更新できます
		if (comment.postedBy !== userId) {
			throw new Error("You can only update your own comments");
		}

		return await discussionRepository.updateComment(id, data);
	}

	/**
	 * コメントを削除
	 */
	async deleteComment(id: string, userId: string) {
		const comment = await this.getCommentById(id);

		// コメント著者のみが削除できます
		if (comment.postedBy !== userId) {
			throw new Error("You can only delete your own comments");
		}

		return await discussionRepository.deleteComment(id);
	}
}

export const discussionService = new DiscussionService();
