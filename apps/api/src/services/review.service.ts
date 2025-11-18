import { reviewRepository, CreateReviewDto, ReviewStatus } from '../repositories/review.repository';
import { termRepository } from '../repositories/term.repository';
import { discussionRepository } from '../repositories/discussion.repository';

export interface ScheduleReviewDto {
  termId: string;
  intervalDays: number;
  nextReviewDate?: Date;
}

export interface ExecuteReviewDto {
  termId: string;
  reviewedBy: string;
  status: ReviewStatus;
  notes?: string;
}

export class ReviewService {
  /**
   * Schedule a review for a term
   */
  async scheduleReview(data: ScheduleReviewDto) {
    // Validate term exists
    const term = await termRepository.findById(data.termId);
    if (!term) {
      throw new Error(`Term with ID "${data.termId}" not found`);
    }

    // Calculate next review date if not provided
    const nextReviewDate = data.nextReviewDate || this.calculateNextReviewDate(data.intervalDays);

    // Update term with review schedule
    const updated = await termRepository.update(data.termId, {
      nextReviewDate,
      reviewInterval: data.intervalDays,
    });

    return updated;
  }

  /**
   * Get terms that are due for review
   */
  async getTermsDueForReview(asOfDate?: Date) {
    const dueTerms = await reviewRepository.getTermsDueForReview(asOfDate);

    // Enrich with latest review information
    const enrichedTerms = await Promise.all(
      dueTerms.map(async (term) => {
        const latestReview = await reviewRepository.getLatestReview(term.id);
        const reviewCount = await reviewRepository.countReviewsForTerm(term.id);

        return {
          ...term,
          latestReview,
          reviewCount,
        };
      })
    );

    return enrichedTerms;
  }

  /**
   * Execute a review
   */
  async executeReview(data: ExecuteReviewDto) {
    // Validate term exists
    const term = await termRepository.findById(data.termId);
    if (!term) {
      throw new Error(`Term with ID "${data.termId}" not found`);
    }

    // Create review record
    const review = await reviewRepository.create({
      termId: data.termId,
      reviewedBy: data.reviewedBy,
      status: data.status,
      notes: data.notes,
    });

    // If needs discussion, create a discussion thread
    if (data.status === 'needs_discussion') {
      await this.createDiscussionThreadForReview(data.termId, review.id, data.reviewedBy);
    }

    // Update next review date if term has review interval configured
    if (term.reviewInterval) {
      const nextReviewDate = this.calculateNextReviewDate(term.reviewInterval);
      await termRepository.update(data.termId, { nextReviewDate });
    }

    return review;
  }

  /**
   * Get review history for a term
   */
  async getReviewHistory(termId: string) {
    // Validate term exists
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    return await reviewRepository.findByTermId(termId);
  }

  /**
   * Get a specific review by ID
   */
  async getReviewById(id: string) {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new Error(`Review with ID "${id}" not found`);
    }
    return review;
  }

  /**
   * Cancel/delete a scheduled review
   */
  async cancelReviewSchedule(termId: string) {
    // Validate term exists
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    // Clear review schedule
    const updated = await termRepository.update(termId, {
      nextReviewDate: null,
      reviewInterval: null,
    });

    return updated;
  }

  /**
   * Send review notifications (placeholder for future implementation)
   */
  async sendReviewNotifications(termIds: string[]) {
    // This is a placeholder for notification functionality
    // In a real implementation, this would:
    // 1. Get term details
    // 2. Get stakeholders for each term
    // 3. Send email/webhook notifications

    console.log(`Would send review notifications for ${termIds.length} terms`);

    return {
      sent: termIds.length,
      message: 'Notifications queued (placeholder)',
    };
  }

  /**
   * Calculate next review date based on interval
   */
  private calculateNextReviewDate(intervalDays: number): Date {
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  /**
   * Create a discussion thread for a review that needs discussion
   */
  private async createDiscussionThreadForReview(
    termId: string,
    reviewId: string,
    createdBy: string
  ) {
    const term = await termRepository.findById(termId);
    if (!term) return;

    const title = `Review Discussion: ${term.name}`;

    try {
      const thread = await discussionRepository.createThread({
        termId,
        title,
        createdBy,
      });

      // Add an initial comment explaining the review context
      await discussionRepository.createComment({
        threadId: thread.id,
        content: `This discussion was automatically created following a review (ID: ${reviewId}) that indicated this term needs discussion.`,
        postedBy: createdBy,
      });

      return thread;
    } catch (error) {
      console.error('Failed to create discussion thread for review:', error);
      // Don't throw - the review itself succeeded
    }
  }
}

export const reviewService = new ReviewService();
