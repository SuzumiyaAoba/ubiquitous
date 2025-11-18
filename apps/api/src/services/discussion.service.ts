import {
  termProposalRepository,
  CreateTermProposalDto,
  UpdateTermProposalDto,
  ProposalStatus,
} from '../repositories/term-proposal.repository';
import {
  discussionRepository,
  CreateDiscussionThreadDto,
  UpdateDiscussionThreadDto,
  CreateCommentDto,
  UpdateCommentDto,
  ThreadStatus,
} from '../repositories/discussion.repository';
import { termRepository, CreateTermDto } from '../repositories/term.repository';
import { termHistoryRepository } from '../repositories/term-history.repository';
import { contextRepository } from '../repositories/context.repository';

export class DiscussionService {
  // ===== Proposal Operations =====

  /**
   * Create a new term proposal
   */
  async createProposal(data: CreateTermProposalDto) {
    // Validate that the bounded context exists
    const context = await contextRepository.findById(data.boundedContextId);
    if (!context) {
      throw new Error(`Bounded context with ID "${data.boundedContextId}" not found`);
    }

    // Check if a term with the same name already exists
    const existingTerm = await termRepository.existsByName(data.name);
    if (existingTerm) {
      throw new Error(
        `A term with name "${data.name}" already exists. Consider discussing changes to the existing term instead.`
      );
    }

    return await termProposalRepository.create(data);
  }

  /**
   * Get a proposal by ID
   */
  async getProposalById(id: string) {
    const proposal = await termProposalRepository.findById(id);
    if (!proposal) {
      throw new Error(`Proposal with ID "${id}" not found`);
    }
    return proposal;
  }

  /**
   * Get all proposals
   */
  async getAllProposals(status?: ProposalStatus) {
    if (status) {
      return await termProposalRepository.findByStatus(status);
    }
    return await termProposalRepository.findAll();
  }

  /**
   * Get proposals by context
   */
  async getProposalsByContext(contextId: string) {
    // Validate context exists
    const context = await contextRepository.findById(contextId);
    if (!context) {
      throw new Error(`Bounded context with ID "${contextId}" not found`);
    }

    return await termProposalRepository.findByContextId(contextId);
  }

  /**
   * Update a proposal
   */
  async updateProposal(id: string, data: UpdateTermProposalDto) {
    // Check if proposal exists
    const proposal = await this.getProposalById(id);

    // Can only update pending or on_hold proposals
    if (proposal.status === 'approved' || proposal.status === 'rejected') {
      throw new Error(`Cannot update a proposal that has been ${proposal.status}`);
    }

    // If updating context, validate it exists
    if (data.boundedContextId) {
      const context = await contextRepository.findById(data.boundedContextId);
      if (!context) {
        throw new Error(`Bounded context with ID "${data.boundedContextId}" not found`);
      }
    }

    return await termProposalRepository.update(id, data);
  }

  /**
   * Approve a proposal and create the term
   */
  async approveProposal(id: string, approvedBy: string) {
    const proposal = await this.getProposalById(id);

    // Can only approve pending or on_hold proposals
    if (proposal.status === 'approved') {
      throw new Error('Proposal has already been approved');
    }
    if (proposal.status === 'rejected') {
      throw new Error('Cannot approve a rejected proposal');
    }

    // Create the term from the proposal
    const termData: CreateTermDto = {
      name: proposal.name,
      description: proposal.definition,
      status: 'active',
    };

    const term = await termRepository.create(termData);

    // Add the term to the context with the proposal's definition
    await termRepository.addToContext({
      termId: term.id,
      contextId: proposal.boundedContextId,
      definition: proposal.definition,
    });

    // Create initial history record
    await termHistoryRepository.create({
      termId: term.id,
      version: 1,
      previousDefinition: '',
      newDefinition: proposal.definition,
      changedFields: ['definition', 'status'],
      changedBy: approvedBy,
      changeReason: `Created from proposal ${id}`,
    });

    // Update proposal status
    await termProposalRepository.approve(id, approvedBy);

    return {
      term,
      proposal: await this.getProposalById(id),
    };
  }

  /**
   * Reject a proposal
   */
  async rejectProposal(id: string, rejectionReason: string) {
    const proposal = await this.getProposalById(id);

    // Can only reject pending or on_hold proposals
    if (proposal.status === 'approved') {
      throw new Error('Cannot reject an approved proposal');
    }
    if (proposal.status === 'rejected') {
      throw new Error('Proposal has already been rejected');
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    return await termProposalRepository.reject(id, rejectionReason);
  }

  /**
   * Put a proposal on hold
   */
  async putProposalOnHold(id: string) {
    const proposal = await this.getProposalById(id);

    // Can only put pending proposals on hold
    if (proposal.status !== 'pending') {
      throw new Error('Can only put pending proposals on hold');
    }

    return await termProposalRepository.putOnHold(id);
  }

  /**
   * Delete a proposal
   */
  async deleteProposal(id: string) {
    // Check if proposal exists
    await this.getProposalById(id);

    return await termProposalRepository.delete(id);
  }

  // ===== Discussion Thread Operations =====

  /**
   * Create a new discussion thread
   */
  async createThread(data: CreateDiscussionThreadDto) {
    // Validate that either termId or proposalId is provided
    if (!data.termId && !data.proposalId) {
      throw new Error('Either termId or proposalId must be provided');
    }

    // Validate term or proposal exists
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
   * Get a thread by ID
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
   * Get all threads
   */
  async getAllThreads(status?: ThreadStatus) {
    if (status) {
      return await discussionRepository.findThreadsByStatus(status);
    }
    return await discussionRepository.findAllThreads();
  }

  /**
   * Get threads for a term
   */
  async getThreadsForTerm(termId: string) {
    // Validate term exists
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    return await discussionRepository.findThreadsByTermId(termId);
  }

  /**
   * Get threads for a proposal
   */
  async getThreadsForProposal(proposalId: string) {
    // Validate proposal exists
    const proposal = await termProposalRepository.findById(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID "${proposalId}" not found`);
    }

    return await discussionRepository.findThreadsByProposalId(proposalId);
  }

  /**
   * Update a thread
   */
  async updateThread(id: string, data: UpdateDiscussionThreadDto) {
    // Check if thread exists
    await this.getThreadById(id);

    return await discussionRepository.updateThread(id, data);
  }

  /**
   * Close a thread
   */
  async closeThread(id: string) {
    // Check if thread exists
    await this.getThreadById(id);

    return await discussionRepository.closeThread(id);
  }

  /**
   * Reopen a thread
   */
  async reopenThread(id: string) {
    // Check if thread exists
    await this.getThreadById(id);

    return await discussionRepository.reopenThread(id);
  }

  /**
   * Delete a thread
   */
  async deleteThread(id: string) {
    // Check if thread exists
    await this.getThreadById(id);

    return await discussionRepository.deleteThread(id);
  }

  // ===== Comment Operations =====

  /**
   * Add a comment to a thread
   */
  async addComment(data: CreateCommentDto) {
    // Validate thread exists
    const thread = await discussionRepository.findThreadById(data.threadId);
    if (!thread) {
      throw new Error(`Thread with ID "${data.threadId}" not found`);
    }

    // Can only comment on open threads
    if (thread.status === 'closed') {
      throw new Error('Cannot comment on a closed thread');
    }

    return await discussionRepository.createComment(data);
  }

  /**
   * Get a comment by ID
   */
  async getCommentById(id: string) {
    const comment = await discussionRepository.findCommentById(id);
    if (!comment) {
      throw new Error(`Comment with ID "${id}" not found`);
    }
    return comment;
  }

  /**
   * Get comments for a thread
   */
  async getCommentsForThread(threadId: string) {
    // Validate thread exists
    await this.getThreadById(threadId);

    return await discussionRepository.findCommentsByThreadId(threadId);
  }

  /**
   * Update a comment
   */
  async updateComment(id: string, data: UpdateCommentDto, userId: string) {
    const comment = await this.getCommentById(id);

    // Only the comment author can update it
    if (comment.postedBy !== userId) {
      throw new Error('You can only update your own comments');
    }

    return await discussionRepository.updateComment(id, data);
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string, userId: string) {
    const comment = await this.getCommentById(id);

    // Only the comment author can delete it
    if (comment.postedBy !== userId) {
      throw new Error('You can only delete your own comments');
    }

    return await discussionRepository.deleteComment(id);
  }
}

export const discussionService = new DiscussionService();
