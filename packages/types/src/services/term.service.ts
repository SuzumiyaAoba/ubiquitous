import { Term, TermHistory } from '../entities';
import { CreateTermDto, UpdateTermDto } from '../dtos';

/**
 * 用語管理サービスのインターフェース
 *
 * ドメイン駆動設計における用語（ユビキタス言語）の作成、更新、削除、検索、
 * および学習進捗の管理を担当するサービスです。
 */
export interface ITermService {
  /**
   * 新しい用語を作成します
   *
   * @param data - 用語作成データ（名前、定義、コンテキストなど）
   * @param userId - 用語を作成するユーザーのID
   * @returns 作成された用語オブジェクト
   * @throws 無効なデータが提供された場合、または権限がない場合
   */
  createTerm(data: CreateTermDto, userId: string): Promise<Term>;

  /**
   * 既存の用語を更新します
   *
   * @param id - 更新する用語のID
   * @param data - 更新するデータ（名前、定義など）
   * @param userId - 更新するユーザーのID
   * @returns 更新された用語オブジェクト
   * @throws 用語が見つからない場合、または権限がない場合
   */
  updateTerm(id: string, data: UpdateTermDto, userId: string): Promise<Term>;

  /**
   * 用語を削除します
   *
   * @param id - 削除する用語のID
   * @param userId - 削除するユーザーのID
   * @returns なし
   * @throws 用語が見つからない場合、または権限がない場合
   */
  deleteTerm(id: string, userId: string): Promise<void>;

  /**
   * 指定されたIDの用語を取得します
   *
   * @param id - 取得する用語のID
   * @returns 用語オブジェクト
   * @throws 用語が見つからない場合
   */
  getTerm(id: string): Promise<Term>;

  /**
   * キーワードで用語を検索します
   *
   * @param query - 検索クエリ（用語名または定義に含まれるキーワード）
   * @returns マッチした用語のリスト
   */
  searchTerms(query: string): Promise<Term[]>;

  /**
   * 指定された用語の変更履歴を取得します
   *
   * @param termId - 対象用語のID
   * @returns 用語の変更履歴のリスト（時系列で並び替え）
   */
  getTermHistory(termId: string): Promise<TermHistory[]>;

  /**
   * 指定されたコンテキスト内のすべての用語を取得します
   *
   * @param contextId - コンテキスト（ドメイン）のID
   * @returns そのコンテキストに属する用語のリスト
   */
  getTermsByContext(contextId: string): Promise<Term[]>;

  /**
   * 用語を学習済みとしてマークします
   *
   * @param termId - マークする用語のID
   * @param userId - マークするユーザーのID
   * @returns なし
   */
  markAsLearned(termId: string, userId: string): Promise<void>;

  /**
   * 用語の閲覧回数をインクリメントします
   *
   * @param termId - インクリメント対象の用語のID
   * @returns なし
   */
  incrementViewCount(termId: string): Promise<void>;
}
