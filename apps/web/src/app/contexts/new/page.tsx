'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateContextDto } from '@ubiquitous/types';
import { contextsApi } from '@/shared/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Textarea } from '@/shared/ui';

export default function NewContextPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateContextDto>({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'コンテキスト名は必須です';
    }

    if (!formData.description.trim()) {
      newErrors.description = '説明は必須です';
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

      const createdContext = await contextsApi.create(formData);
      router.push(`/contexts/${createdContext.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Link href="/contexts" className="text-blue-600 hover:text-blue-800 text-sm">
          ← コンテキスト一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">新しいBounded Contextを作成</h1>

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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />

              <Textarea
                label="説明"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={errors.description}
                rows={6}
                placeholder="このBounded Contextの目的や範囲について説明してください"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/contexts">
            <Button type="button" variant="secondary">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? '作成中...' : '作成'}
          </Button>
        </div>
      </form>
    </div>
  );
}
