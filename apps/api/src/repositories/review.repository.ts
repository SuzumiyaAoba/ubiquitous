import { eq, desc, lte, and } from 'drizzle-orm';
import { db } from '../db';
import { reviews, terms } from '../db/schema';

export type ReviewStatus = 'confirmed' | 'needs_update' | 'needs_discussion';

export interface CreateReviewDto {
  termId: string;
  reviewedBy: string;
  status: ReviewStatus;
  notes?: string;
}

export class ReviewRepository {
  /**
   * Create a new review
   */
  async create(data: CreateReviewDto) {
    const [review] = await db
      .insert(reviews)
      .values({
        termId: data.termId,
        reviewedBy: data.reviewedBy,
        status: data.status,
        notes: data.notes,
      })
      .returning();

    return review;
  }

  /**
   * Find a review by ID
   */
  async findById(id: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));

    return review || null;
  }

  /**
   * Find all reviews for a term
   */
  async findByTermId(termId: string) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.termId, termId))
      .orderBy(desc(reviews.reviewedAt));
  }

  /**
   * Find reviews by reviewer
   */
  async findByReviewer(reviewedBy: string) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.reviewedBy, reviewedBy))
      .orderBy(desc(reviews.reviewedAt));
  }

  /**
   * Find reviews by status
   */
  async findByStatus(status: ReviewStatus) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.reviewedAt));
  }

  /**
   * Get the latest review for a term
   */
  async getLatestReview(termId: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.termId, termId))
      .orderBy(desc(reviews.reviewedAt))
      .limit(1);

    return review || null;
  }

  /**
   * Delete a review
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Get terms due for review
   */
  async getTermsDueForReview(asOfDate?: Date) {
    const checkDate = asOfDate || new Date();

    return await db
      .select()
      .from(terms)
      .where(
        and(
          lte(terms.nextReviewDate, checkDate),
          eq(terms.status, 'active')
        )
      )
      .orderBy(terms.nextReviewDate);
  }

  /**
   * Count reviews for a term
   */
  async countReviewsForTerm(termId: string): Promise<number> {
    const termReviews = await this.findByTermId(termId);
    return termReviews.length;
  }
}

export const reviewRepository = new ReviewRepository();
