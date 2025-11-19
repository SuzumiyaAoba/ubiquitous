import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";

export default function Home() {
  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Ubiquitous Language System</h1>
        <p className="text-xl text-gray-600">
          DDD（ドメイン駆動設計）におけるユビキタス言語の管理・共有・進化を支援するシステム
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Link href="/contexts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle>有界コンテキスト</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                ドメインの境界を定義し、コンテキストごとに用語の意味を管理します。
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/terms">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle>用語管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                ユビキタス言語の用語を登録・管理し、チーム全体で共有します。
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/search">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle>検索機能</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                高速な全文検索で必要な用語をすぐに見つけることができます。
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>主な機能</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-600">
            <li>✓ コンテキスト別の用語管理</li>
            <li>✓ 用語の変更履歴追跡</li>
            <li>✓ 用語間の関係性管理</li>
            <li>✓ 高速な全文検索</li>
            <li>✓ ディスカッション機能</li>
            <li>✓ レビュー・承認ワークフロー</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
