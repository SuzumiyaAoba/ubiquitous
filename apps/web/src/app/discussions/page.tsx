'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DiscussionThread } from '@ubiquitous/types';
import { discussionsApi } from '@/shared/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Loading, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui';

export default function DiscussionsPage() {
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await discussionsApi.getThreads();
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading>読み込み中...</Loading>;
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-600">エラー: {error}</p>
          <Button onClick={loadThreads} className="mt-4">
            再試行
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ディスカッション</h1>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              ディスカッションスレッドがまだ作成されていません
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {threads.map((thread) => (
                  <TableRow key={thread.id}>
                    <TableCell>
                      <Link
                        href={`/discussions/${thread.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {thread.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={thread.status === 'open' ? 'success' : 'default'}>
                        {thread.status === 'open' ? '開放中' : '終了'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(thread.createdAt).toLocaleDateString('ja-JP')}
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
