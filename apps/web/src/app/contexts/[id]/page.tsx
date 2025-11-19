'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BoundedContext, Term } from '@ubiquitous/types';
import { contextsApi } from '@/shared/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Loading, ConfirmModal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui';

export default function ContextDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [context, setContext] = useState<BoundedContext | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const contextData = await contextsApi.getById(params.id);
        setContext(contextData);

        const termsData = await contextsApi.getTerms(params.id);
        setTerms(termsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bounded Contextの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleDelete = async () => {
    if (!context) return;

    try {
      setDeleting(true);
      await contextsApi.delete(context.id);
      router.push('/contexts');
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
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
          <Button variant="secondary" onClick={() => router.push('/contexts')} className="mt-4">
            コンテキスト一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bounded Contextが見つかりませんでした</p>
          <Button variant="secondary" onClick={() => router.push('/contexts')}>
            コンテキスト一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Link href="/contexts" className="text-blue-600 hover:text-blue-800 text-sm">
          ← コンテキスト一覧に戻る
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{context.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/contexts/${context.id}/edit`}>
            <Button variant="secondary">編集</Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
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
                <dt className="text-sm font-medium text-gray-500">説明</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{context.description}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(context.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(context.updatedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>関連する用語 ({terms.length})</CardTitle>
              <Link href="/terms/new">
                <Button size="sm">用語を追加</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {terms.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                このコンテキストに関連する用語はまだ登録されていません
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用語名</TableHead>
                    <TableHead>定義</TableHead>
                    <TableHead>ステータス</TableHead>
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
                        <p className="line-clamp-2 text-gray-600">{term.definition}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            term.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : term.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {term.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Bounded Contextを削除"
        message={`「${context.name}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
      />
    </div>
  );
}
