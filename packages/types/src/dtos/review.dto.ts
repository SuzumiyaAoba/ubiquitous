import { ReviewStatus } from '../entities';

export interface PerformReviewDto {
  termId: string;
  status: ReviewStatus;
  notes?: string;
}
