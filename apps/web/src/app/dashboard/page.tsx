/**
 * ダッシュボードページ
 * システム全体のメトリクスと分析を表示
 */

"use client";

import { useEffect, useState } from "react";
import { analyticsApi } from "@/shared/api";
import type {
	AllMetrics,
	TopProposer,
	TopReviewer,
} from "@/shared/api/analytics";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Loading,
} from "@/shared/ui";

export default function DashboardPage() {
	const [metrics, setMetrics] = useState<AllMetrics | null>(null);
	const [topProposers, setTopProposers] = useState<TopProposer[]>([]);
	const [topReviewers, setTopReviewers] = useState<TopReviewer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadDashboardData();
	}, []);

	const loadDashboardData = async () => {
		try {
			setLoading(true);
			setError(null);

			const [metricsData, proposersData, reviewersData] = await Promise.all([
				analyticsApi.getAllMetrics(),
				analyticsApi.getTopProposers(5),
				analyticsApi.getTopReviewers(5),
			]);

			setMetrics(metricsData);
			setTopProposers(proposersData);
			setTopReviewers(reviewersData);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "データの読み込みに失敗しました",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleExport = async (format: "json" | "csv") => {
		try {
			const data = await analyticsApi.exportMetrics(format);
			const blob = new Blob([data], {
				type: format === "json" ? "application/json" : "text/csv",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `metrics.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "エクスポートに失敗しました",
			);
		}
	};

	if (loading) {
		return <Loading text="ダッシュボードを読み込み中..." />;
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-600">エラー: {error}</p>
					<Button onClick={loadDashboardData} className="mt-4">
						再試行
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!metrics) {
		return (
			<Card>
				<CardContent>
					<p className="text-gray-500">メトリクスデータがありません</p>
				</CardContent>
			</Card>
		);
	}

	const { system, userActivity, coverage } = metrics;

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={() => handleExport("json")}>
						JSON エクスポート
					</Button>
					<Button variant="secondary" onClick={() => handleExport("csv")}>
						CSV エクスポート
					</Button>
					<Button onClick={loadDashboardData}>更新</Button>
				</div>
			</div>

			{/* システム概要 */}
			<div className="grid gap-6 md:grid-cols-4 mb-6">
				<MetricCard
					title="総用語数"
					value={system.totalTerms}
					subtitle={`有効: ${system.activeTerms}`}
					color="blue"
				/>
				<MetricCard
					title="コンテキスト"
					value={system.totalContexts}
					subtitle="境界づけられたコンテキスト"
					color="green"
				/>
				<MetricCard
					title="提案"
					value={system.totalProposals}
					subtitle={`保留中: ${system.pendingProposals}`}
					color="yellow"
				/>
				<MetricCard
					title="アクティブユーザー"
					value={userActivity.totalActiveUsers}
					subtitle="ユニークユーザー数"
					color="purple"
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2 mb-6">
				{/* 用語ステータス */}
				<Card>
					<CardHeader>
						<CardTitle>用語ステータス</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<StatusBar
								label="有効"
								value={system.activeTerms}
								total={system.totalTerms}
								color="green"
							/>
							<StatusBar
								label="ドラフト"
								value={system.draftTerms}
								total={system.totalTerms}
								color="gray"
							/>
							<StatusBar
								label="非推奨"
								value={system.deprecatedTerms}
								total={system.totalTerms}
								color="red"
							/>
							<StatusBar
								label="必須用語"
								value={system.essentialTerms}
								total={system.totalTerms}
								color="blue"
							/>
						</div>
					</CardContent>
				</Card>

				{/* ユーザーアクティビティ */}
				<Card>
					<CardHeader>
						<CardTitle>ユーザーアクティビティ</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<ActivityItem
								label="レビュアー"
								value={userActivity.uniqueReviewers}
								icon="👥"
							/>
							<ActivityItem
								label="提案者"
								value={userActivity.uniqueProposers}
								icon="💡"
							/>
							<ActivityItem
								label="コメント投稿者"
								value={userActivity.uniqueCommenters}
								icon="💬"
							/>
							<ActivityItem
								label="学習者"
								value={userActivity.uniqueLearners}
								icon="📚"
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2 mb-6">
				{/* カバレッジメトリクス */}
				<Card>
					<CardHeader>
						<CardTitle>カバレッジメトリクス</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<CoverageItem
								label="コンテキスト付き用語"
								value={coverage.termsWithContexts}
								total={coverage.totalTerms}
							/>
							<CoverageItem
								label="関連性定義済み用語"
								value={coverage.termsWithRelationships}
								total={coverage.totalTerms}
							/>
							<CoverageItem
								label="レビュー済み用語"
								value={coverage.termsWithReviews}
								total={coverage.totalTerms}
							/>
							<div className="pt-2 border-t">
								<p className="text-sm text-gray-600">
									用語あたりの平均コンテキスト数:{" "}
									<span className="font-semibold text-gray-900">
										{coverage.averageContextsPerTerm.toFixed(2)}
									</span>
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* ディスカッション・レビュー */}
				<Card>
					<CardHeader>
						<CardTitle>ディスカッション・レビュー</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-gray-600">総ディスカッション数:</span>
								<span className="text-2xl font-bold text-gray-900">
									{system.totalDiscussionThreads}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">オープン:</span>
								<span className="text-2xl font-bold text-green-600">
									{system.openThreads}
								</span>
							</div>
							<div className="flex justify-between items-center pt-4 border-t">
								<span className="text-gray-600">総レビュー数:</span>
								<span className="text-2xl font-bold text-gray-900">
									{system.totalReviews}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* トップコントリビューター */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* トップ提案者 */}
				<Card>
					<CardHeader>
						<CardTitle>トップ提案者</CardTitle>
					</CardHeader>
					<CardContent>
						{topProposers.length === 0 ? (
							<p className="text-gray-500 text-center py-4">
								データがありません
							</p>
						) : (
							<div className="space-y-2">
								{topProposers.map((proposer, index) => (
									<div
										key={proposer.userId}
										className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
									>
										<div className="flex items-center gap-2">
											<span className="text-lg font-bold text-gray-400">
												#{index + 1}
											</span>
											<span className="text-gray-900">
												{proposer.userId}
											</span>
										</div>
										<span className="text-sm font-semibold text-blue-600">
											{proposer.proposalCount} 件
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* トップレビュアー */}
				<Card>
					<CardHeader>
						<CardTitle>トップレビュアー</CardTitle>
					</CardHeader>
					<CardContent>
						{topReviewers.length === 0 ? (
							<p className="text-gray-500 text-center py-4">
								データがありません
							</p>
						) : (
							<div className="space-y-2">
								{topReviewers.map((reviewer, index) => (
									<div
										key={reviewer.userId}
										className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
									>
										<div className="flex items-center gap-2">
											<span className="text-lg font-bold text-gray-400">
												#{index + 1}
											</span>
											<span className="text-gray-900">
												{reviewer.userId}
											</span>
										</div>
										<span className="text-sm font-semibold text-green-600">
											{reviewer.reviewCount} 件
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* タイムスタンプ */}
			<div className="mt-6 text-center text-sm text-gray-500">
				最終更新: {new Date(system.timestamp).toLocaleString("ja-JP")}
			</div>
		</div>
	);
}

// サブコンポーネント

interface MetricCardProps {
	title: string;
	value: number;
	subtitle: string;
	color: "blue" | "green" | "yellow" | "purple";
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
	const colorClasses = {
		blue: "bg-blue-50 text-blue-600",
		green: "bg-green-50 text-green-600",
		yellow: "bg-yellow-50 text-yellow-600",
		purple: "bg-purple-50 text-purple-600",
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<p className="text-sm font-medium text-gray-600">{title}</p>
				<p className={`text-3xl font-bold mt-2 ${colorClasses[color]}`}>
					{value}
				</p>
				<p className="text-xs text-gray-500 mt-1">{subtitle}</p>
			</CardContent>
		</Card>
	);
}

interface StatusBarProps {
	label: string;
	value: number;
	total: number;
	color: "green" | "gray" | "red" | "blue";
}

function StatusBar({ label, value, total, color }: StatusBarProps) {
	const percentage = total > 0 ? (value / total) * 100 : 0;

	const colorClasses = {
		green: "bg-green-500",
		gray: "bg-gray-400",
		red: "bg-red-500",
		blue: "bg-blue-500",
	};

	return (
		<div>
			<div className="flex justify-between text-sm mb-1">
				<span className="text-gray-600">{label}</span>
				<span className="font-semibold text-gray-900">
					{value} ({percentage.toFixed(1)}%)
				</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className={`${colorClasses[color]} h-2 rounded-full transition-all`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

interface ActivityItemProps {
	label: string;
	value: number;
	icon: string;
}

function ActivityItem({ label, value, icon }: ActivityItemProps) {
	return (
		<div className="flex justify-between items-center">
			<div className="flex items-center gap-2">
				<span className="text-2xl">{icon}</span>
				<span className="text-gray-600">{label}</span>
			</div>
			<span className="text-2xl font-bold text-gray-900">{value}</span>
		</div>
	);
}

interface CoverageItemProps {
	label: string;
	value: number;
	total: number;
}

function CoverageItem({ label, value, total }: CoverageItemProps) {
	const percentage = total > 0 ? (value / total) * 100 : 0;

	return (
		<div>
			<div className="flex justify-between text-sm mb-2">
				<span className="text-gray-600">{label}</span>
				<span className="font-semibold text-gray-900">
					{value} / {total}
				</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className="bg-blue-500 h-2 rounded-full transition-all"
					style={{ width: `${percentage}%` }}
				/>
			</div>
			<p className="text-xs text-gray-500 mt-1 text-right">
				{percentage.toFixed(1)}%
			</p>
		</div>
	);
}
