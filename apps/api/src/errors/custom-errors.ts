/**
 * カスタムエラークラス
 * アプリケーション全体で一貫したエラーハンドリングを提供します
 */

import { err, ok, Result, ResultAsync } from "neverthrow";

/**
 * Result型のエクスポート
 */
export { Result, ResultAsync, ok, err };

/**
 * ベースエラークラス
 */
export abstract class AppError extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode: number,
		public readonly isOperational: boolean = true,
	) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		Error.captureStackTrace(this);
	}
}

/**
 * リソースが見つからない場合のエラー
 */
export class NotFoundError extends AppError {
	constructor(resource: string, identifier?: string) {
		const message = identifier
			? `${resource} with ID "${identifier}" not found`
			: `${resource} not found`;
		super(message, 404);
	}
}

/**
 * リソースが既に存在する場合のエラー
 */
export class ConflictError extends AppError {
	constructor(resource: string, identifier?: string) {
		const message = identifier
			? `${resource} with "${identifier}" already exists`
			: `${resource} already exists`;
		super(message, 409);
	}
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

/**
 * 認証エラー
 */
export class UnauthorizedError extends AppError {
	constructor(message: string = "Unauthorized") {
		super(message, 401);
	}
}

/**
 * 権限エラー
 */
export class ForbiddenError extends AppError {
	constructor(message: string = "Forbidden") {
		super(message, 403);
	}
}

/**
 * 内部サーバーエラー
 */
export class InternalServerError extends AppError {
	constructor(message: string = "Internal server error") {
		super(message, 500);
	}
}
