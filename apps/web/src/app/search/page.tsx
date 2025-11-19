/**
 * 検索ページ
 */

"use client";

import { useState } from "react";
import { searchApi, type SearchResult } from "@/shared/api";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Loading } from "@/shared/ui";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      const data = await searchApi.search({ q: query });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);

    // サジェスチョンを取得（2文字以上入力時）
    if (value.length >= 2) {
      try {
        const data = await searchApi.getSuggestions(value);
        setSuggestions(data.map((s) => s.value));
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">用語検索</h1>

      <Card className="mb-6">
        <CardContent>
          <div className="relative">
            <div className="flex gap-2">
              <Input
                placeholder="用語を検索..."
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                    setSuggestions([]);
                  }
                }}
              />
              <Button onClick={handleSearch} disabled={!query.trim()}>
                検索
              </Button>
            </div>

            {/* サジェスチョン */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-2">用語名や定義の内容で検索できます。</p>
        </CardContent>
      </Card>

      {loading && <Loading text="検索中..." />}

      {error && (
        <Card>
          <CardContent>
            <p className="text-red-600">エラー: {error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && hasSearched && (
        <div>
          <p className="text-sm text-gray-600 mb-4">{results.length}件の結果が見つかりました</p>

          {results.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  「{query}」に一致する用語が見つかりませんでした。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Link href={`/terms/${result.id}`}>
                      <CardTitle className="text-blue-600 hover:underline">{result.name}</CardTitle>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-2">{result.definition}</p>
                    {result.contextName && (
                      <p className="text-sm text-gray-500">コンテキスト: {result.contextName}</p>
                    )}
                    {result.score !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        スコア: {result.score.toFixed(2)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <Card>
          <CardContent>
            <p className="text-gray-500 text-center py-8">検索キーワードを入力してください。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
