import type {
	ContextWithTerms,
	CreateContextDto,
	UpdateContextDto,
} from "../dtos";
import type { BoundedContext } from "../entities";

/**
 * 限定コンテキスト管理サービスのインターフェース
 *
 * DDD（ドメイン駆動設計）における限定コンテキスト（BoundedContext）を管理し、
 * ドメイン内の異なるサブドメインを分離・管理するサービスです。
 */
export interface IContextService {
	/**
	 * 新しい限定コンテキストを作成します
	 *
	 * @param data - コンテキスト作成データ（名前、説明、スコープなど）
	 * @param userId - コンテキストを作成するユーザーのID
	 * @returns 作成された限定コンテキストオブジェクト
	 * @throws 無効なデータが提供された場合、または権限がない場合
	 */
	createContext(
		data: CreateContextDto,
		userId: string,
	): Promise<BoundedContext>;

	/**
	 * 指定された限定コンテキストを更新します
	 *
	 * @param id - 更新するコンテキストのID
	 * @param data - 更新するデータ（名前、説明など）
	 * @returns 更新された限定コンテキストオブジェクト
	 * @throws コンテキストが見つからない場合、または権限がない場合
	 */
	updateContext(id: string, data: UpdateContextDto): Promise<BoundedContext>;

	/**
	 * 指定されたIDの限定コンテキストを取得します
	 *
	 * @param id - 取得するコンテキストのID
	 * @returns 限定コンテキストオブジェクト
	 * @throws コンテキストが見つからない場合
	 */
	getContext(id: string): Promise<BoundedContext>;

	/**
	 * すべての限定コンテキストを取得します
	 *
	 * @returns すべての限定コンテキストのリスト
	 */
	getAllContexts(): Promise<BoundedContext[]>;

	/**
	 * 指定されたコンテキストとそれに属するすべての用語を取得します
	 *
	 * @param id - 取得するコンテキストのID
	 * @returns コンテキストと関連する用語を含むオブジェクト
	 * @throws コンテキストが見つからない場合
	 */
	getContextWithTerms(id: string): Promise<ContextWithTerms>;
}
