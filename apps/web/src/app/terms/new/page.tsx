"use client";

import type { BoundedContext, CreateTermDto } from "@ubiquitous/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { contextsApi, termsApi } from "@/shared/api";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Loading,
	Select,
	Textarea,
} from "@/shared/ui";

export default function NewTermPage() {
	const router = useRouter();
	const [contexts, setContexts] = useState<BoundedContext[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState<CreateTermDto>({
		name: "",
		definition: "",
		boundedContextId: "",
		examples: [""],
		usageNotes: "",
		essentialForOnboarding: false,
		reviewCycleDays: undefined,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		const fetchContexts = async () => {
			try {
				setLoading(true);
				const data = await contextsApi.getAll();
				setContexts(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "コンテキストの取得に失敗しました",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchContexts();
	}, []);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "用語名は必須です";
		}

		if (!formData.definition.trim()) {
			newErrors.definition = "定義は必須です";
		}

		if (!formData.boundedContextId) {
			newErrors.boundedContextId = "Bounded Contextは必須です";
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

			const dataToSubmit = {
				...formData,
				examples: formData.examples?.filter((ex) => ex.trim() !== ""),
			};

			const createdTerm = await termsApi.create(dataToSubmit);
			router.push(`/terms/${createdTerm.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "作成に失敗しました");
		} finally {
			setSubmitting(false);
		}
	};

	const addExample = () => {
		setFormData({
			...formData,
			examples: [...(formData.examples || []), ""],
		});
	};

	const removeExample = (index: number) => {
		const newExamples = [...(formData.examples || [])];
		newExamples.splice(index, 1);
		setFormData({
			...formData,
			examples: newExamples,
		});
	};

	const updateExample = (index: number, value: string) => {
		const newExamples = [...(formData.examples || [])];
		newExamples[index] = value;
		setFormData({
			...formData,
			examples: newExamples,
		});
	};

	if (loading) {
		return <Loading>読み込み中...</Loading>;
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

			<h1 className="text-3xl font-bold mb-6">新しい用語を作成</h1>

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
								label="用語名"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								error={errors.name}
								required
							/>

							<Textarea
								label="定義"
								value={formData.definition}
								onChange={(e) =>
									setFormData({ ...formData, definition: e.target.value })
								}
								error={errors.definition}
								rows={4}
								required
							/>

							<Select
								label="Bounded Context"
								value={formData.boundedContextId}
								onChange={(value) =>
									setFormData({ ...formData, boundedContextId: value })
								}
								options={contexts.map((ctx) => ({
									value: ctx.id,
									label: ctx.name,
								}))}
								placeholder="コンテキストを選択してください"
								error={errors.boundedContextId}
								required
							/>

							<Textarea
								label="使用上の注意"
								value={formData.usageNotes || ""}
								onChange={(e) =>
									setFormData({ ...formData, usageNotes: e.target.value })
								}
								rows={3}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>使用例</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{formData.examples?.map((example, index) => (
								<div key={index} className="flex gap-2">
									<Input
										value={example}
										onChange={(e) => updateExample(index, e.target.value)}
										placeholder={`例 ${index + 1}`}
										className="flex-1"
									/>
									{formData.examples && formData.examples.length > 1 && (
										<Button
											type="button"
											variant="secondary"
											onClick={() => removeExample(index)}
										>
											削除
										</Button>
									)}
								</div>
							))}
							<Button type="button" variant="secondary" onClick={addExample}>
								例を追加
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>オプション</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center">
								<input
									type="checkbox"
									id="essentialForOnboarding"
									checked={formData.essentialForOnboarding}
									onChange={(e) =>
										setFormData({
											...formData,
											essentialForOnboarding: e.target.checked,
										})
									}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label
									htmlFor="essentialForOnboarding"
									className="ml-2 text-sm text-gray-700"
								>
									オンボーディングに必須
								</label>
							</div>

							<Input
								type="number"
								label="レビューサイクル（日数）"
								value={formData.reviewCycleDays || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										reviewCycleDays: e.target.value
											? parseInt(e.target.value, 10)
											: undefined,
									})
								}
								min={1}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex gap-3 justify-end">
					<Link href="/terms">
						<Button type="button" variant="secondary">
							キャンセル
						</Button>
					</Link>
					<Button type="submit" disabled={submitting}>
						{submitting ? "作成中..." : "作成"}
					</Button>
				</div>
			</form>
		</div>
	);
}
