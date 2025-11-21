/**
 * 検索サービスのインターフェース
 * 循環依存を回避するための抽象化レイヤー
 */
export interface ISearchService {
	/**
	 * タームを検索インデックスに追加または更新
	 * @param termId - タームID
	 */
	indexTerm(termId: string): Promise<void>;

	/**
	 * タームを検索インデックスから削除
	 * @param termId - タームID
	 */
	removeTermFromIndex(termId: string): Promise<void>;
}
