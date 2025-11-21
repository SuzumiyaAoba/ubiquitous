"use client";

import type { BoundedContext, Term } from "@ubiquitous/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { contextsApi, termsApi } from "@/shared/api";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ConfirmModal,
	Loading,
} from "@/shared/ui";

const statusConfig = {
	active: { label: "有効", variant: "success" as const },
	draft: { label: "下書き", variant: "warning" as const },
	archived: { label: "アーカイブ済み", variant: "default" as const },
};

export default function TermDetailPage({ params }: { params: { id: string } }) {
	const router = useRouter();
	const [term, setTerm] = useState<Term | null>(null);
	const [context, setContext] = useState<BoundedContext | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [_deleting, setDeleting] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const termData = await termsApi.getById(params.id);
				setTerm(termData);

				if (termData.boundedContextId) {
					const contextData = await contextsApi.getById(
						termData.boundedContextId,
					);
					setContext(contextData);
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "用語の取得に失敗しました",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [params.id]);

	const handleDelete = async () => {
		if (!term) return;

		try {
			setDeleting(true);
			await termsApi.delete(term.id);
			router.push("/terms");
		} catch (err) {
			setError(err instanceof Error ? err.message : "削除に失敗しました");
		} finally {
			setDeleting(false);
			setDeleteModalOpen(false);
		}
	};

	if (loading) {
		return <Loading>読み込み中...</Loading>;
	}

	if (error) {
		return (
			<div className="max-w-4xl mx-auto p-8">
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<p className="text-red-600">{error}</p>
					<Button
						variant="secondary"
						onClick={() => router.push("/terms")}
						className="mt-4"
					>
						用語一覧に戻る
					</Button>
				</div>
			</div>
		);
	}

	if (!term) {
		return (
			<div className="max-w-4xl mx-auto p-8">
				<div className="text-center">
					<p className="text-gray-600 mb-4">用語が見つかりませんでした</p>
					<Button variant="secondary" onClick={() => router.push("/terms")}>
						用語一覧に戻る
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-8">
			<div className="mb-6">
				<Link
					href="/terms"
					className="text-blue-600 hover:text-blue-800 text-sm"
				>
					← 用語一覧に戻る
				</Link>
			</div>

			<div className="flex items-start justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold mb-2">{term.name}</h1>
					<Badge variant={statusConfig[term.status].variant}>
						{statusConfig[term.status].label}
					</Badge>
				</div>
				<div className="flex gap-2">
					<Link href={`/terms/${term.id}/edit`}>
						<Button variant="secondary">編集</Button>
					</Link>
					<Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
						削除
					</Button>
				</div>
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>基本情報</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-4">
							<div>
								<dt className="text-sm font-medium text-gray-500">定義</dt>
								<dd className="mt-1 text-gray-900">{term.definition}</dd>
							</div>

							{context && (
								<div>
									<dt className="text-sm font-medium text-gray-500">
										Bounded Context
									</dt>
									<dd className="mt-1">
										<Link
											href={`/contexts/${context.id}`}
											className="text-blue-600 hover:text-blue-800"
										>
											{context.name}
										</Link>
									</dd>
								</div>
							)}

							{term.usageNotes && (
								<div>
									<dt className="text-sm font-medium text-gray-500">
										使用上の注意
									</dt>
									<dd className="mt-1 text-gray-900 whitespace-pre-wrap">
										{term.usageNotes}
									</dd>
								</div>
							)}

							{term.examples && term.examples.length > 0 && (
								<div>
									<dt className="text-sm font-medium text-gray-500">使用例</dt>
									<dd className="mt-1">
										<ul className="list-disc list-inside space-y-1">
											{term.examples.map((example, index) => (
												<li key={index} className="text-gray-900">
													{example}
												</li>
											))}
										</ul>
									</dd>
								</div>
							)}
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>メタデータ</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-2 gap-4">
							<div>
								<dt className="text-sm font-medium text-gray-500">
									品質スコア
								</dt>
								<dd className="mt-1 text-gray-900">{term.qualityScore}/100</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-gray-500">
									オンボーディング必須
								</dt>
								<dd className="mt-1 text-gray-900">
									{term.essentialForOnboarding ? "はい" : "いいえ"}
								</dd>
							</div>

							{term.reviewCycleDays && (
								<div>
									<dt className="text-sm font-medium text-gray-500">
										レビューサイクル
									</dt>
									<dd className="mt-1 text-gray-900">
										{term.reviewCycleDays}日
									</dd>
								</div>
							)}

							{term.nextReviewDate && (
								<div>
									<dt className="text-sm font-medium text-gray-500">
										次回レビュー日
									</dt>
									<dd className="mt-1 text-gray-900">
										{new Date(term.nextReviewDate).toLocaleDateString("ja-JP")}
									</dd>
								</div>
							)}

							<div>
								<dt className="text-sm font-medium text-gray-500">作成日時</dt>
								<dd className="mt-1 text-gray-900">
									{new Date(term.createdAt).toLocaleDateString("ja-JP", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-gray-500">更新日時</dt>
								<dd className="mt-1 text-gray-900">
									{new Date(term.updatedAt).toLocaleDateString("ja-JP", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			</div>

			<ConfirmModal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				onConfirm={handleDelete}
				title="用語を削除"
				message={`「${term.name}」を削除してもよろしいですか？この操作は取り消せません。`}
				confirmText="削除"
				cancelText="キャンセル"
				variant="danger"
			/>
		</div>
	);
}
