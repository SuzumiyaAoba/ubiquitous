export interface DiscussionThread {
  id: string;
  termId?: string;
  proposalId?: string;
  title: string;
  createdBy: string;
  createdAt: Date;
  status: 'open' | 'closed';
}

export interface Comment {
  id: string;
  threadId: string;
  content: string;
  postedBy: string;
  postedAt: Date;
  updatedAt?: Date;
}

export interface ThreadWithComments extends DiscussionThread {
  comments: Comment[];
}
