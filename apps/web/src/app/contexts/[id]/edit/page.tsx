"use client";

import type { BoundedContext, UpdateContextDto } from "@ubiquitous/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { contextsApi } from "@/shared/api";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Loading,
	Textarea,
} from "@/shared/ui";

export default function EditContextPage({
	params,
}: {
	params: { id: string };
}) {
	const router = useRouter();
	const [context, setContext] = useState<BoundedContext | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState<UpdateContextDto>({
		name: "",
		description: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const contextData = await contextsApi.getById(params.id);
				setContext(contextData);
				setFormData({
					name: contextData.name,
					description: contextData.description,
				});
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "データの取得に失敗しました",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [params.id]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name?.trim()) {
			newErrors.name = "コンテキスト名は必須です";
		}

		if (!formData.description?.trim()) {
			newErrors.description = "説明は必須です";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			await contextsApi.update(params.id, formData);
			router.push(`/contexts/${params.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "更新に失敗しました");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <Loading>読み込み中...</Loading>;
	}

	if (error && !context) {
		return (
			<div className="max-w-4xl mx-auto p-8">
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<p className="text-red-600">{error}</p>
					<Link href="/contexts">
						<Button variant="secondary" className="mt-4">
							コンテキスト一覧に戻る
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-8">
			<div className="mb-6">
				<Link
					href={`/contexts/${params.id}`}
					className="text-blue-600 hover:text-blue-800 text-sm"
				>
					← 詳細に戻る
				</Link>
			</div>

			<h1 className="text-3xl font-bold mb-6">Bounded Contextを編集</h1>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit}>
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>基本情報</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Input
								label="コンテキスト名"
								value={formData.name || ""}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								error={errors.name}
								required
							/>

							<Textarea
								label="説明"
								value={formData.description || ""}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								error={errors.description}
								rows={6}
								placeholder="このBounded Contextの目的や範囲について説明してください"
								required
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex gap-3 justify-end">
					<Link href={`/contexts/${params.id}`}>
						<Button type="button" variant="secondary">
							キャンセル
						</Button>
					</Link>
					<Button type="submit" disabled={submitting}>
						{submitting ? "更新中..." : "更新"}
					</Button>
				</div>
			</form>
		</div>
	);
}
