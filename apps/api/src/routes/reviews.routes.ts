/**
 * @file 用語レビュー管理ルート
 * @description 用語の定期的なレビュースケジューリング、実行、履歴管理のエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { reviewService } from '../services/review.service';
import type { ScheduleReviewDto, ExecuteReviewDto } from '../services/review.service';
import type { ReviewStatus } from '../repositories/review.repository';

export const reviewsRouter = new Hono();

/**
 * 用語のレビューをスケジュールします。
 * @route POST /api/reviews/schedule
 * @param {object} body - スケジュールデータ
 * @param {string} body.termId - 用語ID（必須）
 * @param {number} body.intervalDays - レビュー間隔（日数、必須、正数）
 * @returns {object} 201 - スケジュール設定されたレビューオブジェクト
 * @returns {object} 400 - バリデーションエラー
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.post('/schedule', async (c) => {
  try {
    const body = await c.req.json<ScheduleReviewDto>();

    // Validate required fields
    if (!body.termId || !body.intervalDays) {
      return c.json({ error: 'termId and intervalDays are required' }, 400);
    }

    if (body.intervalDays <= 0) {
      return c.json({ error: 'intervalDays must be a positive number' }, 400);
    }

    const term = await reviewService.scheduleReview(body);
    return c.json(term, 201);
  } catch (error) {
    console.error('Error scheduling review:', error);
    const message = error instanceof Error ? error.message : 'Failed to schedule review';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * スケジュール済みのレビューをキャンセルします。
 * @route DELETE /api/reviews/schedule/:termId
 * @param {string} termId - 用語ID
 * @returns {object} 200 - キャンセル後の用語オブジェクト
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.delete('/schedule/:termId', async (c) => {
  try {
    const termId = c.req.param('termId');
    const term = await reviewService.cancelReviewSchedule(termId);
    return c.json(term);
  } catch (error) {
    console.error('Error canceling review schedule:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel review schedule';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * レビュー予定日を過ぎた用語を取得します。
 * @route GET /api/reviews/due
 * @query {string} asOfDate - チェック基準日（ISO 8601形式、オプション、デフォルト: 今日）
 * @returns {object[]} 200 - レビュー予定超過の用語配列
 * @returns {object} 400 - 無効な日付形式
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.get('/due', async (c) => {
  try {
    const asOfDateStr = c.req.query('asOfDate');
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : undefined;

    // Validate date if provided
    if (asOfDateStr && isNaN(asOfDate!.getTime())) {
      return c.json({ error: 'Invalid asOfDate format. Use ISO 8601 format.' }, 400);
    }

    const dueTerms = await reviewService.getTermsDueForReview(asOfDate);
    return c.json(dueTerms);
  } catch (error) {
    console.error('Error fetching terms due for review:', error);
    return c.json({ error: 'Failed to fetch terms due for review' }, 500);
  }
});

/**
 * 用語のレビューを実行します。
 * @route POST /api/reviews
 * @param {object} body - レビュー実行データ
 * @param {string} body.termId - 用語ID（必須）
 * @param {string} body.reviewedBy - レビュアーID（必須）
 * @param {string} body.status - レビューステータス（必須、confirmed/needs_update/needs_discussion）
 * @returns {object} 201 - 実行されたレビューオブジェクト
 * @returns {object} 400 - バリデーションエラーまたは無効なステータス
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json<ExecuteReviewDto>();

    // Validate required fields
    if (!body.termId || !body.reviewedBy || !body.status) {
      return c.json({ error: 'termId, reviewedBy, and status are required' }, 400);
    }

    // Validate status
    const validStatuses: ReviewStatus[] = ['confirmed', 'needs_update', 'needs_discussion'];
    if (!validStatuses.includes(body.status)) {
      return c.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        400
      );
    }

    const review = await reviewService.executeReview(body);
    return c.json(review, 201);
  } catch (error) {
    console.error('Error executing review:', error);
    const message = error instanceof Error ? error.message : 'Failed to execute review';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 用語のレビュー履歴を取得します。
 * @route GET /api/reviews/terms/:termId
 * @param {string} termId - 用語ID
 * @returns {object[]} 200 - レビュー履歴の配列
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.get('/terms/:termId', async (c) => {
  try {
    const termId = c.req.param('termId');
    const reviews = await reviewService.getReviewHistory(termId);
    return c.json(reviews);
  } catch (error) {
    console.error('Error fetching review history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch review history';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * IDで指定されたレビューを取得します。
 * @route GET /api/reviews/:id
 * @param {string} id - レビューID
 * @returns {object} 200 - レビューオブジェクト
 * @returns {object} 404 - レビューが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const review = await reviewService.getReviewById(id);
    return c.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch review';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 指定された用語のレビュー通知を送信します。
 * @route POST /api/reviews/notifications
 * @param {object} body - リクエストボディ
 * @param {string[]} body.termIds - 通知対象の用語ID配列（必須）
 * @returns {object} 200 - 通知送信結果
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 500 - サーバーエラー
 */
reviewsRouter.post('/notifications', async (c) => {
  try {
    const body = await c.req.json<{ termIds: string[] }>();

    if (!body.termIds || !Array.isArray(body.termIds)) {
      return c.json({ error: 'termIds array is required' }, 400);
    }

    const result = await reviewService.sendReviewNotifications(body.termIds);
    return c.json(result);
  } catch (error) {
    console.error('Error sending review notifications:', error);
    return c.json({ error: 'Failed to send review notifications' }, 500);
  }
});
