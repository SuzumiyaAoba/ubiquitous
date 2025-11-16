export type ReviewStatus = 'confirmed' | 'needs_update' | 'needs_discussion';

export interface Review {
  id: string;
  termId: string;
  reviewedBy: string;
  reviewedAt: Date;
  status: ReviewStatus;
  notes?: string;
}
