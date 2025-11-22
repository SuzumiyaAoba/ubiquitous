import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
	title: "Ubiquitous Language System",
	description: "A system for managing and evolving ubiquitous language in DDD",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja">
			<body className="min-h-screen bg-gray-50">
				<nav className="bg-white shadow-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between h-16">
							<div className="flex space-x-8">
								<Link
									href="/"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
								>
									ホーム
								</Link>
								<Link
									href="/dashboard"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
								>
									ダッシュボード
								</Link>
								<Link
									href="/contexts"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
								>
									コンテキスト
								</Link>
								<Link
									href="/terms"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
								>
									用語
								</Link>
								<Link
									href="/search"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
								>
									検索
								</Link>
								<Link
									href="/relationships"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
								>
									関係性
								</Link>
								<Link
									href="/discussions"
									className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
								>
									ディスカッション
								</Link>
							</div>
						</div>
					</div>
				</nav>
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{children}
				</main>
			</body>
		</html>
	);
}
