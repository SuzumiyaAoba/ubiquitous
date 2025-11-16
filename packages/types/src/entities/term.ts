export interface Term {
  id: string;
  name: string;
  definition: string;
  boundedContextId: string;
  status: 'draft' | 'active' | 'archived';
  examples?: string[];
  usageNotes?: string;
  qualityScore: number;
  essentialForOnboarding: boolean;
  reviewCycleDays?: number;
  nextReviewDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  deletedAt?: Date;
}
