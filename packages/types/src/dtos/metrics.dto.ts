/**
 * 用語の閲覧統計データ
 *
 * 特定の用語がどれだけ多く閲覧されているかを表示します。
 */
export interface TermViewStats {
  /** 統計対象の用語ID */
  termId: string;
  /** 統計対象の用語名 */
  termName: string;
  /** 閲覧回数 */
  viewCount: number;
}

/**
 * 用語の検索統計データ
 *
 * 特定の用語がどれだけ多く検索されているかを表示します。
 */
export interface TermSearchStats {
  /** 統計対象の用語ID */
  termId: string;
  /** 統計対象の用語名 */
  termName: string;
  /** 検索回数 */
  searchCount: number;
}

/**
 * システム全体のメトリクス情報
 *
 * ユビキタス言語管理システムの利用状況と用語カバレッジを集約したデータです。
 * ダッシュボードや分析画面で使用されます。
 */
export interface Metrics {
  /** 直近1週間のアクティブユーザー数 */
  activeUsersThisWeek: number;
  /** システムに登録されている用語の総数 */
  totalTerms: number;
  /** 用語カバレッジ率（0-1の小数、またはパーセンテージ） */
  coverageRate: number;
  /** 最も閲覧されている用語のトップリスト */
  mostViewedTerms: TermViewStats[];
  /** 最も検索されている用語のトップリスト */
  mostSearchedTerms: TermSearchStats[];
}
