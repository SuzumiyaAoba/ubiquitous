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
   * 新しいレビューを作成
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
   * IDでレビューを検索
   */
  async findById(id: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));

    return review || null;
  }

  /**
   * 用語のすべてのレビューを取得
   */
  async findByTermId(termId: string) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.termId, termId))
      .orderBy(desc(reviews.reviewedAt));
  }

  /**
   * レビュー者でレビューを検索
   */
  async findByReviewer(reviewedBy: string) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.reviewedBy, reviewedBy))
      .orderBy(desc(reviews.reviewedAt));
  }

  /**
   * ステータスでレビューを検索
   */
  async findByStatus(status: ReviewStatus) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.reviewedAt));
  }

  /**
   * 用語の最新レビューを取得
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
   * レビューを削除
   */
  async delete(id: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * レビュー予定の用語を取得
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
   * 用語のレビュー数をカウント
   */
  async countReviewsForTerm(termId: string): Promise<number> {
    const termReviews = await this.findByTermId(termId);
    return termReviews.length;
  }
}

export const reviewRepository = new ReviewRepository();
