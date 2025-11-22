/**
 * オンボーディングダッシュボードページ
 * 新規メンバー向けの学習進捗管理
 */

"use client";

import type { Term } from "@ubiquitous/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onboardingApi } from "@/shared/api";
import type {
	LearningLevel,
	LearningPath,
	LearningProgress,
} from "@/shared/api/onboarding";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Loading,
} from "@/shared/ui";

// デモ用のユーザーID（実際は認証システムから取得）
const DEMO_USER_ID = "demo-user";

export default function OnboardingPage() {
	const [progress, setProgress] = useState<LearningProgress | null>(null);
	const [essentialTerms, setEssentialTerms] = useState<Term[]>([]);
	const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
	const [nextTerms, setNextTerms] = useState<Term[]>([]);
	const [learnedTermIds, setLearnedTermIds] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadOnboardingData();
	}, []);

	const loadOnboardingData = async () => {
		try {
			setLoading(true);
			setError(null);

			const [progressData, termsData, pathData, nextData] = await Promise.all([
				onboardingApi.getProgress(DEMO_USER_ID),
				onboardingApi.getEssentialTerms(),
				onboardingApi.getLearningPath(DEMO_USER_ID),
				onboardingApi.getNextTerms(DEMO_USER_ID, 5),
			]);

			setProgress(progressData);
			setEssentialTerms(termsData);
			setLearningPath(pathData);
			setNextTerms(nextData);

			// 学習済み用語のIDセットを作成（progressDataから取得する実装が必要）
			// ここでは簡易的にSetを初期化
			setLearnedTermIds(new Set());
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "データの読み込みに失敗しました",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleToggleLearned = async (termId: string) => {
		try {
			if (learnedTermIds.has(termId)) {
				// 学習済みマークを解除
				await onboardingApi.unmarkAsLearned(DEMO_USER_ID, termId);
				setLearnedTermIds((prev) => {
					const newSet = new Set(prev);
					newSet.delete(termId);
					return newSet;
				});
			} else {
				// 学習済みとしてマーク
				await onboardingApi.markAsLearned({
					userId: DEMO_USER_ID,
					termId,
				});
				setLearnedTermIds((prev) => new Set([...prev, termId]));
			}

			// 進捗を再取得
			const updatedProgress = await onboardingApi.getProgress(DEMO_USER_ID);
			setProgress(updatedProgress);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "学習済みマークの更新に失敗しました",
			);
		}
	};

	if (loading) {
		return <Loading text="オンボーディング情報を読み込み中..." />;
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-600">エラー: {error}</p>
					<Button onClick={loadOnboardingData} className="mt-4">
						再試行
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!progress) {
		return (
			<Card>
				<CardContent>
					<p className="text-gray-500">オンボーディング情報がありません</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">
						オンボーディングダッシュボード
					</h1>
					<p className="text-gray-600 mt-1">
						ユビキタス言語の学習を始めましょう
					</p>
				</div>
				<Button onClick={loadOnboardingData}>更新</Button>
			</div>

			{/* 学習進捗カード */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>学習進捗</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-gray-600">進捗状況:</span>
							<span className="text-2xl font-bold text-blue-600">
								{progress.progressPercentage.toFixed(1)}%
							</span>
						</div>

						{/* プログレスバー */}
						<div className="w-full bg-gray-200 rounded-full h-4">
							<div
								className="bg-blue-500 h-4 rounded-full transition-all flex items-center justify-end pr-2"
								style={{ width: `${progress.progressPercentage}%` }}
							>
								{progress.progressPercentage > 10 && (
									<span className="text-xs text-white font-semibold">
										{progress.progressPercentage.toFixed(0)}%
									</span>
								)}
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4 pt-4 border-t">
							<div className="text-center">
								<p className="text-sm text-gray-600">総必須用語</p>
								<p className="text-2xl font-bold text-gray-900">
									{progress.totalEssentialTerms}
								</p>
							</div>
							<div className="text-center">
								<p className="text-sm text-gray-600">学習済み</p>
								<p className="text-2xl font-bold text-green-600">
									{progress.learnedTerms}
								</p>
							</div>
							<div className="text-center">
								<p className="text-sm text-gray-600">残り</p>
								<p className="text-2xl font-bold text-orange-600">
									{progress.remainingTerms}
								</p>
							</div>
						</div>

						{progress.remainingTerms === 0 && (
							<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
								<p className="text-green-800 font-semibold text-center">
									🎉 おめでとうございます！すべての必須用語を学習完了しました！
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2 mb-6">
				{/* 次の推奨用語 */}
				<Card>
					<CardHeader>
						<CardTitle>次に学習すべき用語</CardTitle>
					</CardHeader>
					<CardContent>
						{nextTerms.length === 0 ? (
							<p className="text-gray-500 text-center py-4">
								推奨用語がありません
							</p>
						) : (
							<div className="space-y-3">
								{nextTerms.map((term) => (
									<div
										key={term.id}
										className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<Link
													href={`/terms/${term.id}`}
													className="font-semibold text-blue-600 hover:underline"
												>
													{term.name}
												</Link>
												{term.isEssential && (
													<Badge variant="default">必須</Badge>
												)}
											</div>
											<p className="text-sm text-gray-600 line-clamp-2">
												{term.definition}
											</p>
										</div>
										<Button
											size="sm"
											variant={
												learnedTermIds.has(term.id) ? "default" : "secondary"
											}
											onClick={() => handleToggleLearned(term.id)}
											className="ml-3"
										>
											{learnedTermIds.has(term.id) ? "✓ 完了" : "学習"}
										</Button>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* 必須用語一覧 */}
				<Card>
					<CardHeader>
						<CardTitle>必須用語一覧</CardTitle>
					</CardHeader>
					<CardContent>
						{essentialTerms.length === 0 ? (
							<p className="text-gray-500 text-center py-4">
								必須用語が設定されていません
							</p>
						) : (
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{essentialTerms.map((term) => (
									<div
										key={term.id}
										className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
									>
										<div className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={learnedTermIds.has(term.id)}
												onChange={() => handleToggleLearned(term.id)}
												className="w-4 h-4 text-blue-600"
											/>
											<Link
												href={`/terms/${term.id}`}
												className="text-sm text-blue-600 hover:underline"
											>
												{term.name}
											</Link>
										</div>
										{learnedTermIds.has(term.id) && (
											<span className="text-green-600 text-sm">✓</span>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* 学習パス */}
			{learningPath && learningPath.levels.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>推奨学習パス</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							依存関係に基づいた推奨学習順序です。上のレベルから順に学習することをお勧めします。
						</p>
						<div className="space-y-6">
							{learningPath.levels.map((level) => (
								<LearningLevelComponent
									key={level.level}
									level={level}
									learnedTermIds={learnedTermIds}
									onToggleLearned={handleToggleLearned}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// サブコンポーネント

interface LearningLevelComponentProps {
	level: LearningLevel;
	learnedTermIds: Set<string>;
	onToggleLearned: (termId: string) => void;
}

function LearningLevelComponent({
	level,
	learnedTermIds,
	onToggleLearned,
}: LearningLevelComponentProps) {
	const learnedCount = level.terms.filter((t) => learnedTermIds.has(t.id))
		.length;
	const totalCount = level.terms.length;
	const percentage = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

	return (
		<div className="border rounded-lg p-4">
			<div className="flex justify-between items-center mb-3">
				<div>
					<h3 className="font-semibold text-gray-900">
						レベル {level.level}
					</h3>
					{level.description && (
						<p className="text-sm text-gray-600">{level.description}</p>
					)}
				</div>
				<div className="text-sm text-gray-600">
					{learnedCount} / {totalCount} 完了
				</div>
			</div>

			{/* プログレスバー */}
			<div className="w-full bg-gray-200 rounded-full h-2 mb-3">
				<div
					className="bg-green-500 h-2 rounded-full transition-all"
					style={{ width: `${percentage}%` }}
				/>
			</div>

			{/* 用語リスト */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
				{level.terms.map((term) => (
					<div
						key={term.id}
						className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
					>
						<input
							type="checkbox"
							checked={learnedTermIds.has(term.id)}
							onChange={() => onToggleLearned(term.id)}
							className="w-4 h-4 text-blue-600"
						/>
						<Link
							href={`/terms/${term.id}`}
							className="text-sm text-blue-600 hover:underline flex-1"
						>
							{term.name}
						</Link>
						{learnedTermIds.has(term.id) && (
							<span className="text-green-600 text-sm">✓</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
