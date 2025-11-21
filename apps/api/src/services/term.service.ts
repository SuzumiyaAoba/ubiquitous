import {
	ConflictError,
	err,
	NotFoundError,
	ok,
	ResultAsync,
} from "../errors/custom-errors";
import {
	type AddTermToContextDto,
	type CreateTermDto,
	termRepository,
	type UpdateTermDto,
} from "../repositories/term.repository";
import { termHistoryRepository } from "../repositories/term-history.repository";
import type { ISearchService } from "./search-service.interface";

export class TermService {
	private searchService: ISearchService | null = null;

	/**
	 * 検索サービスを設定（循環依存を回避するため）
	 */
	setSearchService(service: ISearchService) {
		this.searchService = service;
	}

	/**
	 * 検索サービスが利用可能な場合、検索インデックスにタームを同期
	 */
	private async syncToSearchIndex(termId: string) {
		if (this.searchService) {
			try {
				await this.searchService.indexTerm(termId);
			} catch (error) {
				console.error(
					"検索インデックスにタームを同期できませんでした：",
					error,
				);
				// スローしない - 検索同期は重要ではありません
			}
		}
	}

	/**
	 * 検索サービスが利用可能な場合、検索インデックスからタームを削除
	 */
	private async removeFromSearchIndex(termId: string) {
		if (this.searchService) {
			try {
				await this.searchService.removeTermFromIndex(termId);
			} catch (error) {
				console.error(
					"検索インデックスからタームを削除できませんでした：",
					error,
				);
				// スローしない - 検索同期は重要ではありません
			}
		}
	}

	/**
	 * 新しいタームを作成
	 */
	createTerm(data: CreateTermDto, _createdBy: string = "system") {
		return ResultAsync.fromPromise(
			termRepository.existsByName(data.name),
			(_error) => new ConflictError("Term", data.name),
		)
			.andThen((exists) => {
				if (exists) {
					return err(new ConflictError("Term", data.name));
				}
				return ResultAsync.fromPromise(
					termRepository.create(data),
					(_error) => new ConflictError("Term", data.name),
				);
			})
			.andThen((term) => {
				// 検索インデックスに同期（エラーは無視）
				this.syncToSearchIndex(term.id);
				return ok(term);
			});
	}

	/**
	 * IDでタームを取得
	 */
	getTermById(id: string) {
		return ResultAsync.fromPromise(
			termRepository.findById(id),
			(_error) => new NotFoundError("Term", id),
		).andThen((term) => {
			if (!term) {
				return err(new NotFoundError("Term", id));
			}
			return ok(term);
		});
	}

	/**
	 * 関連するすべてのコンテキスト付きのタームを取得
	 */
	getTermWithContexts(id: string) {
		return ResultAsync.fromPromise(
			termRepository.getWithContexts(id),
			(_error) => new NotFoundError("Term", id),
		).andThen((term) => {
			if (!term) {
				return err(new NotFoundError("Term", id));
			}
			return ok(term);
		});
	}

	/**
	 * すべてのタームを取得
	 */
	async getAllTerms() {
		return await termRepository.findAll();
	}

	/**
	 * コンテキストIDでタームを取得
	 */
	async getTermsByContext(contextId: string) {
		return await termRepository.findByContextId(contextId);
	}

	/**
	 * 名前でターム検索
	 */
	async searchTerms(query: string) {
		return await termRepository.searchByName(query);
	}

	/**
	 * タームを更新
	 * タームが変更された場合は履歴レコードを作成
	 */
	updateTerm(
		id: string,
		data: UpdateTermDto,
		changedBy: string = "system",
		changeReason?: string,
	) {
		return this.getTermById(id)
			.andThen((currentTerm) => {
				// 名前が変更されており、新しい名前が既に存在するかをチェック
				if (data.name && data.name !== currentTerm.name) {
					return ResultAsync.fromPromise(
						termRepository.existsByName(data.name),
						(_error) => new ConflictError("Term", data.name),
					).andThen((exists) => {
						if (exists) {
							return err(new ConflictError("Term", data.name));
						}
						return ok(currentTerm);
					});
				}
				return ok(currentTerm);
			})
			.andThen((currentTerm) => {
				// 変更されたフィールドを計算
				const changedFields: string[] = [];
				if (data.name && data.name !== currentTerm.name)
					changedFields.push("name");
				if (data.description && data.description !== currentTerm.description)
					changedFields.push("description");
				if (data.status && data.status !== currentTerm.status)
					changedFields.push("status");

				// タームを更新
				return ResultAsync.fromPromise(
					termRepository.update(id, data),
					(_error) => new NotFoundError("Term", id),
				).andThen((updated) => {
					// 変更があった場合は履歴レコードを作成
					if (changedFields.length > 0) {
						return ResultAsync.fromPromise(
							termHistoryRepository.getLatestVersion(id).then((latestVersion) =>
								termHistoryRepository.create({
									termId: id,
									version: latestVersion + 1,
									previousDefinition: currentTerm.description || "",
									newDefinition: updated?.description || "",
									changedFields,
									changedBy,
									changeReason,
								}),
							),
							(_error) => new NotFoundError("Term", id),
						).andThen(() => ok(updated));
					}
					return ok(updated);
				});
			})
			.andThen((updated) => {
				// 検索インデックスに同期
				this.syncToSearchIndex(id);
				return ok(updated);
			});
	}

	/**
	 * タームを削除（デフォルトではソフト削除）
	 */
	deleteTerm(id: string, permanent: boolean = false) {
		return this.getTermById(id).andThen(() => {
			if (permanent) {
				return ResultAsync.fromPromise(
					termRepository.delete(id),
					(_error) => new NotFoundError("Term", id),
				).andThen((result) => {
					// 完全削除時に検索インデックスから削除
					this.removeFromSearchIndex(id);
					return ok(result);
				});
			} else {
				return ResultAsync.fromPromise(
					termRepository.softDelete(id),
					(_error) => new NotFoundError("Term", id),
				).andThen((result) => {
					// 検索インデックスを更新（推奨されない ステータス）
					this.syncToSearchIndex(id);
					return ok(result);
				});
			}
		});
	}

	/**
	 * 定義を持つコンテキストにタームを追加
	 */
	addTermToContext(data: AddTermToContextDto, changedBy: string = "system") {
		return this.getTermById(data.termId).andThen(() => {
			// 既にコンテキストに含まれているかをチェック
			return ResultAsync.fromPromise(
				termRepository.existsInContext(data.termId, data.contextId),
				(_error) => new ConflictError("Term in context"),
			).andThen((existsInContext) => {
				if (existsInContext) {
					return err(new ConflictError("Term in context"));
				}

				// コンテキストに追加
				return ResultAsync.fromPromise(
					termRepository.addToContext(data),
					(_error) => new NotFoundError("Term", data.termId),
				).andThen((termContext) => {
					// 履歴レコードを作成
					return ResultAsync.fromPromise(
						termHistoryRepository
							.getLatestVersion(data.termId)
							.then((latestVersion) =>
								termHistoryRepository.create({
									termId: data.termId,
									version: latestVersion + 1,
									previousDefinition: "",
									newDefinition: data.definition,
									changedFields: ["definition", "context"],
									changedBy,
									changeReason: `Added to context ${data.contextId}`,
								}),
							),
						(_error) => new NotFoundError("Term", data.termId),
					).andThen(() => {
						// 検索インデックスに同期
						this.syncToSearchIndex(data.termId);
						return ok(termContext);
					});
				});
			});
		});
	}

	/**
	 * 特定のコンテキストでターム定義を更新
	 */
	updateTermInContext(
		termId: string,
		contextId: string,
		definition: string,
		examples?: string,
		changedBy: string = "system",
	) {
		return ResultAsync.fromPromise(
			termRepository.existsInContext(termId, contextId),
			(_error) => new NotFoundError("Term in context"),
		).andThen((existsInContext) => {
			if (!existsInContext) {
				return err(new NotFoundError("Term in context"));
			}

			// 現在の定義を取得
			return ResultAsync.fromPromise(
				termRepository.getWithContexts(termId),
				(_error) => new NotFoundError("Term", termId),
			).andThen((term) => {
				const currentContext = term?.contexts.find(
					(c) => c.contextId === contextId,
				);
				const previousDefinition = currentContext?.definition || "";

				// 定義を更新
				return ResultAsync.fromPromise(
					termRepository.updateInContext(
						termId,
						contextId,
						definition,
						examples,
					),
					(_error) => new NotFoundError("Term", termId),
				).andThen((updated) => {
					// 履歴レコードを作成
					return ResultAsync.fromPromise(
						termHistoryRepository
							.getLatestVersion(termId)
							.then((latestVersion) =>
								termHistoryRepository.create({
									termId,
									version: latestVersion + 1,
									previousDefinition,
									newDefinition: definition,
									changedFields: ["definition"],
									changedBy,
									changeReason: `Updated definition in context ${contextId}`,
								}),
							),
						(_error) => new NotFoundError("Term", termId),
					).andThen(() => {
						// 検索インデックスに同期
						this.syncToSearchIndex(termId);
						return ok(updated);
					});
				});
			});
		});
	}

	/**
	 * コンテキストからターム削除
	 */
	removeTermFromContext(termId: string, contextId: string) {
		return ResultAsync.fromPromise(
			termRepository.existsInContext(termId, contextId),
			(_error) => new NotFoundError("Term in context"),
		).andThen((existsInContext) => {
			if (!existsInContext) {
				return err(new NotFoundError("Term in context"));
			}

			return ResultAsync.fromPromise(
				termRepository.removeFromContext(termId, contextId),
				(_error) => new NotFoundError("Term", termId),
			).andThen((result) => {
				// 検索インデックスに同期
				this.syncToSearchIndex(termId);
				return ok(result);
			});
		});
	}

	/**
	 * ターム履歴を取得
	 */
	getTermHistory(id: string) {
		return this.getTermById(id).andThen(() => {
			return ResultAsync.fromPromise(
				termHistoryRepository.findByTermId(id),
				(_error) => new NotFoundError("Term history", id),
			);
		});
	}
}

export const termService = new TermService();
