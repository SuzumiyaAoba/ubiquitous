/**
 * 用語一覧ページ
 */

"use client";

import type { Term } from "@ubiquitous/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { termsApi } from "@/shared/api";
import {
	Button,
	Card,
	CardContent,
	Input,
	Loading,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui";

export default function TermsPage() {
	const [terms, setTerms] = useState<Term[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		loadTerms();
	}, [loadTerms]);

	const loadTerms = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await termsApi.getAll();
			setTerms(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "読み込みに失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await termsApi.getAll({ search: searchQuery });
			setTerms(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "検索に失敗しました");
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
					<Button onClick={loadTerms} className="mt-4">
						再試行
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">用語</h1>
				<Link href="/terms/new">
					<Button>新規作成</Button>
				</Link>
			</div>

			<Card className="mb-6">
				<CardContent>
					<div className="flex gap-2">
						<Input
							placeholder="用語を検索..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSearch();
								}
							}}
						/>
						<Button onClick={handleSearch}>検索</Button>
						{searchQuery && (
							<Button
								variant="secondary"
								onClick={() => {
									setSearchQuery("");
									loadTerms();
								}}
							>
								クリア
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{terms.length === 0 ? (
				<Card>
					<CardContent>
						<p className="text-gray-500 text-center py-8">
							{searchQuery
								? "検索結果がありません"
								: "用語がまだ登録されていません。"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>用語名</TableHead>
									<TableHead>定義</TableHead>
									<TableHead>ステータス</TableHead>
									<TableHead>作成日</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{terms.map((term) => (
									<TableRow key={term.id}>
										<TableCell>
											<Link
												href={`/terms/${term.id}`}
												className="text-blue-600 hover:underline font-medium"
											>
												{term.name}
											</Link>
										</TableCell>
										<TableCell>
											<p className="line-clamp-2 text-gray-600">
												{term.definition || "定義なし"}
											</p>
										</TableCell>
										<TableCell>
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													term.status === "active"
														? "bg-green-100 text-green-800"
														: term.status === "draft"
															? "bg-gray-100 text-gray-800"
															: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{term.status}
											</span>
										</TableCell>
										<TableCell>
											{term.createdAt
												? new Date(term.createdAt).toLocaleDateString("ja-JP")
												: "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
