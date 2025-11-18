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
   * ターム用のレビューをスケジュール
   */
  async scheduleReview(data: ScheduleReviewDto) {
    // ターム存在することを検証
    const term = await termRepository.findById(data.termId);
    if (!term) {
      throw new Error(`Term with ID "${data.termId}" not found`);
    }

    // 指定されていない場合は次のレビュー日付を計算
    const nextReviewDate = data.nextReviewDate || this.calculateNextReviewDate(data.intervalDays);

    // レビュースケジュールを使用してターム更新
    const updated = await termRepository.update(data.termId, {
      nextReviewDate,
      reviewInterval: data.intervalDays,
    });

    return updated;
  }

  /**
   * レビュー期限のターム取得
   */
  async getTermsDueForReview(asOfDate?: Date) {
    const dueTerms = await reviewRepository.getTermsDueForReview(asOfDate);

    // 最新のレビュー情報で充実
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
   * レビューを実行
   */
  async executeReview(data: ExecuteReviewDto) {
    // ターム存在することを検証
    const term = await termRepository.findById(data.termId);
    if (!term) {
      throw new Error(`Term with ID "${data.termId}" not found`);
    }

    // レビューレコードを作成
    const review = await reviewRepository.create({
      termId: data.termId,
      reviewedBy: data.reviewedBy,
      status: data.status,
      notes: data.notes,
    });

    // ディスカッションが必要な場合は、ディスカッションスレッドを作成
    if (data.status === 'needs_discussion') {
      await this.createDiscussionThreadForReview(data.termId, review.id, data.reviewedBy);
    }

    // タームがレビュー間隔を構成している場合、次のレビュー日付を更新
    if (term.reviewInterval) {
      const nextReviewDate = this.calculateNextReviewDate(term.reviewInterval);
      await termRepository.update(data.termId, { nextReviewDate });
    }

    return review;
  }

  /**
   * ターム用のレビュー履歴を取得
   */
  async getReviewHistory(termId: string) {
    // ターム存在することを検証
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    return await reviewRepository.findByTermId(termId);
  }

  /**
   * IDで特定のレビューを取得
   */
  async getReviewById(id: string) {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new Error(`Review with ID "${id}" not found`);
    }
    return review;
  }

  /**
   * スケジュール済みレビューをキャンセル/削除
   */
  async cancelReviewSchedule(termId: string) {
    // ターム存在することを検証
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    // レビュースケジュールをクリア
    const updated = await termRepository.update(termId, {
      nextReviewDate: null,
      reviewInterval: null,
    });

    return updated;
  }

  /**
   * レビュー通知を送信（今後の実装用プレースホルダー）
   */
  async sendReviewNotifications(termIds: string[]) {
    // これは通知機能用プレースホルダーです
    // 実装では、以下を実行します：
    // 1. ターム詳細を取得
    // 2. 各ターム用のステークホルダーを取得
    // 3. メール/Webhook通知を送信

    console.log(`以下の用のレビュー通知を送信します${termIds.length} terms`);

    return {
      sent: termIds.length,
      message: 'Notifications queued (placeholder)',
    };
  }

  /**
   * 間隔に基づいて次のレビュー日付を計算
   */
  private calculateNextReviewDate(intervalDays: number): Date {
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  /**
   * ディスカッションが必要なレビュー用にディスカッションスレッドを作成
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

      // レビューコンテキストを説明する初期コメントを追加
      await discussionRepository.createComment({
        threadId: thread.id,
        content: `このディスカッションはレビュー（ID："${reviewId}") に自動的に作成されました。`,
        postedBy: createdBy,
      });

      return thread;
    } catch (error) {
      console.error('レビュー用のディスカッションスレッドを作成できませんでした：', error);
      // スローしない - レビュー自体は成功しました
    }
  }
}

export const reviewService = new ReviewService();
