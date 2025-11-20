/**
 * コンテキスト一覧ページ
 */

"use client";

import type { BoundedContext } from "@ubiquitous/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { contextsApi } from "@/shared/api";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Loading,
} from "@/shared/ui";

export default function ContextsPage() {
	const [contexts, setContexts] = useState<BoundedContext[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadContexts();
	}, [loadContexts]);

	const loadContexts = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await contextsApi.getAll();
			setContexts(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "読み込みに失敗しました");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <Loading text="読み込み中..." />;
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-600">エラー: {error}</p>
					<Button onClick={loadContexts} className="mt-4">
						再試行
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">有界コンテキスト</h1>
				<Link href="/contexts/new">
					<Button>新規作成</Button>
				</Link>
			</div>

			{contexts.length === 0 ? (
				<Card>
					<CardContent>
						<p className="text-gray-500 text-center py-8">
							コンテキストがまだ登録されていません。
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{contexts.map((context) => (
						<Link key={context.id} href={`/contexts/${context.id}`}>
							<Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
								<CardHeader>
									<CardTitle>{context.name}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600 text-sm line-clamp-3">
										{context.description || "説明なし"}
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
