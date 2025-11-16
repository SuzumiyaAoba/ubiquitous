export interface TermProposal {
  id: string;
  name: string;
  definition: string;
  boundedContextId: string;
  proposedBy: string;
  proposedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}
