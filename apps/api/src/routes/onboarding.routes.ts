/**
 * @file オンボーディングと学習進度管理ルート
 * @description ユーザーの学習進度管理、必須用語の設定、学習パスの推奨などのエンドポイントを定義します。
 */

import { Hono } from 'hono';
import { onboardingService } from '../services/onboarding.service';
import type { MarkLearnedDto } from '../repositories/user-learning.repository';

export const onboardingRouter = new Hono();

/**
 * すべての必須用語を取得します。
 * @route GET /api/onboarding/essential-terms
 * @returns {object[]} 200 - 必須用語の配列
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.get('/essential-terms', async (c) => {
  try {
    const essentialTerms = await onboardingService.getEssentialTerms();
    return c.json(essentialTerms);
  } catch (error) {
    console.error('Error fetching essential terms:', error);
    return c.json({ error: 'Failed to fetch essential terms' }, 500);
  }
});

/**
 * 用語を必須としてマークします。
 * @route PUT /api/onboarding/essential-terms/:id
 * @param {string} id - 用語ID
 * @returns {object} 200 - 更新された用語オブジェクト
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.put('/essential-terms/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const term = await onboardingService.markTermAsEssential(id);
    return c.json(term);
  } catch (error) {
    console.error('Error marking term as essential:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark term as essential';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * 用語の必須マークを削除します。
 * @route DELETE /api/onboarding/essential-terms/:id
 * @param {string} id - 用語ID
 * @returns {object} 200 - 更新された用語オブジェクト
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.delete('/essential-terms/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const term = await onboardingService.unmarkTermAsEssential(id);
    return c.json(term);
  } catch (error) {
    console.error('Error unmarking term as essential:', error);
    const message = error instanceof Error ? error.message : 'Failed to unmark term as essential';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * ユーザーが用語を習得したとしてマークします。
 * @route POST /api/onboarding/mark-learned
 * @param {object} body - マーク学習データ
 * @param {string} body.userId - ユーザーID（必須）
 * @param {string} body.termId - 用語ID（必須）
 * @returns {object} 201 - 習得記録オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 404 - ユーザーまたは用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.post('/mark-learned', async (c) => {
  try {
    const body = await c.req.json<MarkLearnedDto>();

    // Validate required fields
    if (!body.userId || !body.termId) {
      return c.json({ error: 'userId and termId are required' }, 400);
    }

    const learned = await onboardingService.markTermAsLearned(body);
    return c.json(learned, 201);
  } catch (error) {
    console.error('Error marking term as learned:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark term as learned';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});

/**
 * ユーザーの用語習得マークを削除します。
 * @route DELETE /api/onboarding/mark-learned/:userId/:termId
 * @param {string} userId - ユーザーID
 * @param {string} termId - 用語ID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.delete('/mark-learned/:userId/:termId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const termId = c.req.param('termId');

    const result = await onboardingService.unmarkTermAsLearned(userId, termId);
    if (!result) {
      return c.json({ message: 'Learning record not found or already removed' });
    }
    return c.json({ message: 'Learning record removed successfully' });
  } catch (error) {
    console.error('Error unmarking term as learned:', error);
    return c.json({ error: 'Failed to unmark term as learned' }, 500);
  }
});

/**
 * ユーザーの学習進度を取得します。
 * @route GET /api/onboarding/progress/:userId
 * @param {string} userId - ユーザーID
 * @returns {object} 200 - 学習進度情報オブジェクト
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.get('/progress/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const progress = await onboardingService.getLearningProgress(userId);
    return c.json(progress);
  } catch (error) {
    console.error('Error fetching learning progress:', error);
    return c.json({ error: 'Failed to fetch learning progress' }, 500);
  }
});

/**
 * 依存関係に基づいて推奨される学習パスを取得します。
 * @route GET /api/onboarding/learning-path/:userId
 * @param {string} userId - ユーザーID
 * @returns {object} 200 - 推奨学習パス情報
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.get('/learning-path/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const learningPath = await onboardingService.getRecommendedLearningPath(userId);
    return c.json(learningPath);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return c.json({ error: 'Failed to fetch learning path' }, 500);
  }
});

/**
 * ユーザーが次に学習すべき推奨用語を取得します。
 * @route GET /api/onboarding/next-terms/:userId
 * @param {string} userId - ユーザーID
 * @query {number} limit - 取得する用語数（デフォルト: 5）
 * @returns {object[]} 200 - 推奨用語の配列
 * @returns {object} 400 - 無効なlimitパラメータ
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.get('/next-terms/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const limitStr = c.req.query('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 5;

    if (isNaN(limit) || limit < 1) {
      return c.json({ error: 'Invalid limit parameter' }, 400);
    }

    const nextTerms = await onboardingService.getNextRecommendedTerms(userId, limit);
    return c.json(nextTerms);
  } catch (error) {
    console.error('Error fetching next recommended terms:', error);
    return c.json({ error: 'Failed to fetch next recommended terms' }, 500);
  }
});

/**
 * ユーザーが用語を学習できるかチェックします（依存関係の確認）。
 * @route GET /api/onboarding/can-learn/:userId/:termId
 * @param {string} userId - ユーザーID
 * @param {string} termId - 用語ID
 * @returns {object} 200 - 学習可能フラグを含むオブジェクト
 * @returns {object} 404 - ユーザーまたは用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
onboardingRouter.get('/can-learn/:userId/:termId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const termId = c.req.param('termId');

    const canLearn = await onboardingService.canLearnTerm(userId, termId);
    return c.json({ canLearn });
  } catch (error) {
    console.error('Error checking if user can learn term:', error);
    const message = error instanceof Error ? error.message : 'Failed to check learning eligibility';
    return c.json(
      { error: message },
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
});
