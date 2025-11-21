"use client";

import type {
	CreateRelationshipDto,
	Term,
	TermRelationship,
} from "@ubiquitous/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { relationshipsApi, termsApi } from "@/shared/api";
import {
	Button,
	Card,
	CardContent,
	Loading,
	Modal,
	Select,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Textarea,
} from "@/shared/ui";

const relationshipTypeLabels = {
	aggregation: "集約",
	association: "関連",
	dependency: "依存",
	inheritance: "継承",
};

export default function RelationshipsPage() {
	const [relationships, setRelationships] = useState<TermRelationship[]>([]);
	const [terms, setTerms] = useState<Term[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [formData, setFormData] = useState<CreateRelationshipDto>({
		sourceTermId: "",
		targetTermId: "",
		relationshipType: "association",
		description: "",
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		loadData();
	}, [loadData]);

	const loadData = async () => {
		try {
			setLoading(true);
			setError(null);
			const [relationshipsData, termsData] = await Promise.all([
				relationshipsApi.getAll(),
				termsApi.getAll(),
			]);
			setRelationships(relationshipsData);
			setTerms(termsData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "読み込みに失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const validateForm = (): boolean => {
		const errors: Record<string, string> = {};

		if (!formData.sourceTermId) {
			errors.sourceTermId = "起点の用語を選択してください";
		}

		if (!formData.targetTermId) {
			errors.targetTermId = "終点の用語を選択してください";
		}

		if (formData.sourceTermId === formData.targetTermId) {
			errors.targetTermId = "起点と終点に同じ用語は選択できません";
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			setSubmitting(true);
			setError(null);
			await relationshipsApi.create(formData);
			setModalOpen(false);
			setFormData({
				sourceTermId: "",
				targetTermId: "",
				relationshipType: "association",
				description: "",
			});
			setFormErrors({});
			await loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "作成に失敗しました");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("この関係性を削除してもよろしいですか？")) {
			return;
		}

		try {
			setError(null);
			await relationshipsApi.delete(id);
			await loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "削除に失敗しました");
		}
	};

	const getTermName = (termId: string) => {
		const term = terms.find((t) => t.id === termId);
		return term ? term.name : "不明";
	};

	if (loading) {
		return <Loading>読み込み中...</Loading>;
	}

	if (error && relationships.length === 0) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-600">エラー: {error}</p>
					<Button onClick={loadData} className="mt-4">
						再試行
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">用語の関係性</h1>
				<Button onClick={() => setModalOpen(true)}>関係を追加</Button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{relationships.length === 0 ? (
				<Card>
					<CardContent>
						<p className="text-gray-500 text-center py-8">
							用語間の関係性がまだ登録されていません
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>起点の用語</TableHead>
									<TableHead>関係</TableHead>
									<TableHead>終点の用語</TableHead>
									<TableHead>説明</TableHead>
									<TableHead>操作</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{relationships.map((rel) => (
									<TableRow key={rel.id}>
										<TableCell>
											<Link
												href={`/terms/${rel.sourceTermId}`}
												className="text-blue-600 hover:underline"
											>
												{getTermName(rel.sourceTermId)}
											</Link>
										</TableCell>
										<TableCell>
											<span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
												{relationshipTypeLabels[rel.relationshipType]}
											</span>
										</TableCell>
										<TableCell>
											<Link
												href={`/terms/${rel.targetTermId}`}
												className="text-blue-600 hover:underline"
											>
												{getTermName(rel.targetTermId)}
											</Link>
										</TableCell>
										<TableCell>
											<p className="line-clamp-2 text-gray-600">
												{rel.description || "-"}
											</p>
										</TableCell>
										<TableCell>
											<Button
												variant="danger"
												size="sm"
												onClick={() => handleDelete(rel.id)}
											>
												削除
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			<Modal
				isOpen={modalOpen}
				onClose={() => {
					setModalOpen(false);
					setFormErrors({});
				}}
				title="関係性を追加"
				footer={
					<>
						<Button variant="secondary" onClick={() => setModalOpen(false)}>
							キャンセル
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? "作成中..." : "作成"}
						</Button>
					</>
				}
			>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<Select
							label="起点の用語"
							value={formData.sourceTermId}
							onChange={(value) =>
								setFormData({ ...formData, sourceTermId: value })
							}
							options={terms.map((term) => ({
								value: term.id,
								label: term.name,
							}))}
							placeholder="用語を選択"
							error={formErrors.sourceTermId}
							required
						/>

						<Select
							label="関係の種類"
							value={formData.relationshipType}
							onChange={(value) =>
								setFormData({
									...formData,
									relationshipType:
										value as CreateRelationshipDto["relationshipType"],
								})
							}
							options={[
								{ value: "association", label: "関連" },
								{ value: "aggregation", label: "集約" },
								{ value: "dependency", label: "依存" },
								{ value: "inheritance", label: "継承" },
							]}
							required
						/>

						<Select
							label="終点の用語"
							value={formData.targetTermId}
							onChange={(value) =>
								setFormData({ ...formData, targetTermId: value })
							}
							options={terms.map((term) => ({
								value: term.id,
								label: term.name,
							}))}
							placeholder="用語を選択"
							error={formErrors.targetTermId}
							required
						/>

						<Textarea
							label="説明"
							value={formData.description || ""}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
							placeholder="この関係性について説明してください（任意）"
						/>
					</div>
				</form>
			</Modal>
		</div>
	);
}
