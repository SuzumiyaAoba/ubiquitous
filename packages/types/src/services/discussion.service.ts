import { TermProposal, DiscussionThread, Comment, ThreadWithComments, Term } from '../entities';
import { CreateProposalDto, CreateThreadDto } from '../dtos';

export interface IDiscussionService {
  createProposal(data: CreateProposalDto, userId: string): Promise<TermProposal>;
  approveProposal(proposalId: string, approverId: string): Promise<Term>;
  rejectProposal(proposalId: string, approverId: string, reason: string): Promise<void>;
  createThread(data: CreateThreadDto, userId: string): Promise<DiscussionThread>;
  addComment(threadId: string, content: string, userId: string): Promise<Comment>;
  getThread(threadId: string): Promise<ThreadWithComments>;
  closeThread(threadId: string): Promise<void>;
}
