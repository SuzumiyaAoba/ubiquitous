/**
 * オンボーディング・学習進捗関連のAPI
 */

import type { Term } from "@ubiquitous/types";
import { apiClient } from "./client";

/**
 * 学習進捗
 */
export interface LearningProgress {
	totalEssentialTerms: number;
	learnedTerms: number;
	remainingTerms: number;
	progressPercentage: number;
	lastUpdated?: string;
}

/**
 * 学習パス
 */
export interface LearningPath {
	levels: LearningLevel[];
	totalTerms: number;
	estimatedTime?: string;
}

/**
 * 学習レベル
 */
export interface LearningLevel {
	level: number;
	terms: Term[];
	description?: string;
}

/**
 * 学習記録DTO
 */
export interface MarkLearnedDto {
	userId: string;
	termId: string;
}

/**
 * 学習記録
 */
export interface UserLearning {
	id: string;
	userId: string;
	termId: string;
	learnedAt: string;
	term?: Term;
}

/**
 * Onboarding API
 */
export const onboardingApi = {
	/**
	 * 必須用語一覧を取得
	 */
	getEssentialTerms: () =>
		apiClient.get<Term[]>("/api/onboarding/essential-terms"),

	/**
	 * 用語を必須としてマーク
	 */
	markAsEssential: (termId: string) =>
		apiClient.put<Term>(`/api/onboarding/essential-terms/${termId}`),

	/**
	 * 用語の必須マークを解除
	 */
	unmarkAsEssential: (termId: string) =>
		apiClient.delete<Term>(`/api/onboarding/essential-terms/${termId}`),

	/**
	 * 用語を学習済みとしてマーク
	 */
	markAsLearned: (data: MarkLearnedDto) =>
		apiClient.post<UserLearning>("/api/onboarding/mark-learned", data),

	/**
	 * 学習済みマークを解除
	 */
	unmarkAsLearned: (userId: string, termId: string) =>
		apiClient.delete<void>(`/api/onboarding/mark-learned/${userId}/${termId}`),

	/**
	 * 学習進捗を取得
	 */
	getProgress: (userId: string) =>
		apiClient.get<LearningProgress>(`/api/onboarding/progress/${userId}`),

	/**
	 * 推奨学習パスを取得
	 */
	getLearningPath: (userId: string) =>
		apiClient.get<LearningPath>(`/api/onboarding/learning-path/${userId}`),

	/**
	 * 次の推奨用語を取得
	 */
	getNextTerms: (userId: string, limit: number = 5) =>
		apiClient.get<Term[]>(`/api/onboarding/next-terms/${userId}`, {
			params: { limit },
		}),

	/**
	 * 学習可能かチェック
	 */
	canLearn: (userId: string, termId: string) =>
		apiClient.get<{ canLearn: boolean }>(
			`/api/onboarding/can-learn/${userId}/${termId}`,
		),
};
