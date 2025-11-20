"use client";

import type { ThreadWithComments } from "@ubiquitous/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { discussionsApi } from "@/shared/api";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Loading,
	Textarea,
} from "@/shared/ui";

export default function DiscussionDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const router = useRouter();
	const [thread, setThread] = useState<ThreadWithComments | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [commentContent, setCommentContent] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		loadThread();
	}, [loadThread]);

	const loadThread = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await discussionsApi.getThreadById(params.id);
			setThread(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "スレッドの取得に失敗しました",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!commentContent.trim()) {
			return;
		}

		try {
			setSubmitting(true);
			setError(null);
			await discussionsApi.createComment(params.id, {
				content: commentContent,
			});
			setCommentContent("");
			await loadThread();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "コメントの投稿に失敗しました",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleToggleStatus = async () => {
		if (!thread) return;

		try {
			setError(null);
			const newStatus = thread.status === "open" ? "closed" : "open";
			await discussionsApi.updateThread(thread.id, { status: newStatus });
			await loadThread();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "ステータスの更新に失敗しました",
			);
		}
	};

	if (loading) {
		return <Loading>読み込み中...</Loading>;
	}

	if (error && !thread) {
		return (
			<div className="max-w-4xl mx-auto p-8">
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<p className="text-red-600">{error}</p>
					<Button
						variant="secondary"
						onClick={() => router.push("/discussions")}
						className="mt-4"
					>
						ディスカッション一覧に戻る
					</Button>
				</div>
			</div>
		);
	}

	if (!thread) {
		return (
			<div className="max-w-4xl mx-auto p-8">
				<div className="text-center">
					<p className="text-gray-600 mb-4">スレッドが見つかりませんでした</p>
					<Button
						variant="secondary"
						onClick={() => router.push("/discussions")}
					>
						ディスカッション一覧に戻る
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-8">
			<div className="mb-6">
				<Link
					href="/discussions"
					className="text-blue-600 hover:text-blue-800 text-sm"
				>
					← ディスカッション一覧に戻る
				</Link>
			</div>

			<div className="flex items-start justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold mb-2">{thread.title}</h1>
					<Badge variant={thread.status === "open" ? "success" : "default"}>
						{thread.status === "open" ? "開放中" : "終了"}
					</Badge>
				</div>
				<Button variant="secondary" onClick={handleToggleStatus}>
					{thread.status === "open" ? "スレッドを終了" : "スレッドを再開"}
				</Button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>コメント ({thread.comments?.length || 0})</CardTitle>
					</CardHeader>
					<CardContent>
						{thread.comments && thread.comments.length > 0 ? (
							<div className="space-y-4">
								{thread.comments.map((comment) => (
									<div
										key={comment.id}
										className="border-b border-gray-200 pb-4 last:border-b-0"
									>
										<p className="text-gray-900 whitespace-pre-wrap mb-2">
											{comment.content}
										</p>
										<p className="text-sm text-gray-500">
											{new Date(comment.postedAt).toLocaleDateString("ja-JP", {
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500 text-center py-8">
								コメントがまだありません
							</p>
						)}
					</CardContent>
				</Card>

				{thread.status === "open" && (
					<Card>
						<CardHeader>
							<CardTitle>コメントを投稿</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmitComment}>
								<Textarea
									value={commentContent}
									onChange={(e) => setCommentContent(e.target.value)}
									rows={4}
									placeholder="コメントを入力してください"
									className="mb-4"
								/>
								<div className="flex justify-end">
									<Button
										type="submit"
										disabled={submitting || !commentContent.trim()}
									>
										{submitting ? "投稿中..." : "投稿"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
