import { Review, Term, ReviewStatus } from '../entities';

export interface IReviewService {
  scheduleReview(termId: string, cycleDays: number): Promise<void>;
  getTermsDueForReview(): Promise<Term[]>;
  performReview(termId: string, userId: string, status: ReviewStatus, notes?: string): Promise<Review>;
  getReviewHistory(termId: string): Promise<Review[]>;
  sendReviewNotifications(): Promise<void>;
}
