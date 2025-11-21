/**
 * @file 用語管理ルート
 * @description ユビキタス言語における用語の作成、更新、削除、および
 * コンテキストごとの用語定義管理のエンドポイントを定義します。
 */

import {
	AddTermToContextDtoSchema,
	CreateTermDtoSchema,
} from "@ubiquitous/types";
import { Hono } from "hono";
import { z } from "zod";
import type { AppError } from "../errors/custom-errors";
import { validateBody } from "../middleware/validation";
import type { UpdateTermDto } from "../repositories/term.repository";
import { termService } from "../services/term.service";

export const termsRouter = new Hono();

/**
 * 新しい用語を作成します。
 * @route POST /api/terms
 * @param {object} body - 用語作成データ
 * @param {string} body.name - 用語名（必須）
 * @param {string} body.createdBy - 作成者ID（オプション）
 * @returns {object} 201 - 作成された用語オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 409 - 同名の用語が既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
const CreateTermWithUserSchema = CreateTermDtoSchema.extend({
	createdBy: z.string().uuid().optional(),
});

termsRouter.post("/", validateBody(CreateTermWithUserSchema), async (c) => {
	const body = (c as any).get("validatedBody") as z.infer<
		typeof CreateTermWithUserSchema
	>;
	const { createdBy, ...termData } = body;
	const result = await termService.createTerm(termData, createdBy);

	return result.match(
		(term) => c.json(term, 201),
		(error: AppError) => {
			console.error("Error creating term:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});

/**
 * すべての用語を取得し、コンテキストまたはキーワードで検索できます。
 * @route GET /api/terms
 * @query {string} contextId - コンテキストID でフィルタ（オプション）
 * @query {string} search - 用語名で検索（オプション）
 * @returns {object[]} 200 - 用語の配列
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.get("/", async (c) => {
	try {
		const contextId = c.req.query("contextId");
		const search = c.req.query("search");

		let terms;
		if (contextId) {
			terms = await termService.getTermsByContext(contextId);
		} else if (search) {
			terms = await termService.searchTerms(search);
		} else {
			terms = await termService.getAllTerms();
		}

		return c.json(terms);
	} catch (error) {
		console.error("Error fetching terms:", error);
		return c.json({ error: "Failed to fetch terms" }, 500);
	}
});

/**
 * IDで指定された用語を取得します。
 * @route GET /api/terms/:id
 * @param {string} id - 用語ID
 * @query {boolean} includeContexts - コンテキスト情報を含めるか（true の場合含める、オプション）
 * @returns {object} 200 - 用語オブジェクト（コンテキスト含む場合あり）
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.get("/:id", async (c) => {
	const id = c.req.param("id");
	const includeContexts = c.req.query("includeContexts") === "true";

	const result = includeContexts
		? await termService.getTermWithContexts(id)
		: await termService.getTermById(id);

	return result.match(
		(term) => c.json(term),
		(error: AppError) => {
			console.error("Error fetching term:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});

/**
 * 用語を更新します。
 * @route PUT /api/terms/:id
 * @param {string} id - 用語ID
 * @param {object} body - 更新データ
 * @param {string} body.changedBy - 変更者ID（オプション）
 * @param {string} body.changeReason - 変更理由（オプション）
 * @returns {object} 200 - 更新された用語オブジェクト
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 409 - 同名の用語が既に存在する場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.put("/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json<
		UpdateTermDto & { changedBy?: string; changeReason?: string }
	>();

	const { changedBy, changeReason, ...termData } = body;
	const result = await termService.updateTerm(
		id,
		termData,
		changedBy,
		changeReason,
	);

	return result.match(
		(updated) => c.json(updated),
		(error: AppError) => {
			console.error("Error updating term:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});

/**
 * 用語を削除します。
 * @route DELETE /api/terms/:id
 * @param {string} id - 用語ID
 * @query {boolean} permanent - 完全削除するか（true の場合完全削除、デフォルト: false）
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const permanent = c.req.query("permanent") === "true";

	const result = await termService.deleteTerm(id, permanent);

	return result.match(
		() => c.json({ message: "Term deleted successfully" }),
		(error: AppError) => {
			console.error("Error deleting term:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});

/**
 * 用語の変更履歴を取得します。
 * @route GET /api/terms/:id/history
 * @param {string} id - 用語ID
 * @returns {object[]} 200 - 変更履歴の配列
 * @returns {object} 404 - 用語が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.get("/:id/history", async (c) => {
	const id = c.req.param("id");
	const result = await termService.getTermHistory(id);

	return result.match(
		(history) => c.json(history),
		(error: AppError) => {
			console.error("Error fetching term history:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});

/**
 * 用語をコンテキストに追加します。
 * @route POST /api/terms/:id/contexts
 * @param {string} id - 用語ID
 * @param {object} body - コンテキスト追加データ
 * @param {string} body.contextId - コンテキストID（必須）
 * @param {string} body.definition - 当コンテキストでの定義（必須）
 * @param {string} body.examples - 使用例（オプション）
 * @param {string} body.changedBy - 変更者ID（オプション）
 * @returns {object} 201 - 追加されたコンテキスト関連情報オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 409 - 用語が既にコンテキストに追加されている場合
 * @returns {object} 500 - サーバーエラー
 */
const AddTermToContextWithUserSchema = AddTermToContextDtoSchema.omit({
	termId: true,
}).extend({
	changedBy: z.string().uuid().optional(),
});

termsRouter.post(
	"/:id/contexts",
	validateBody(AddTermToContextWithUserSchema),
	async (c) => {
		const termId = c.req.param("id");
		const body = (c as any).get("validatedBody") as z.infer<
			typeof AddTermToContextWithUserSchema
		>;

		const { changedBy, ...data } = body;
		const result = await termService.addTermToContext(
			{ ...data, termId },
			changedBy,
		);

		return result.match(
			(termContext) => c.json(termContext, 201),
			(error: AppError) => {
				console.error("Error adding term to context:", error);
				return c.json({ error: error.message }, error.statusCode as any);
			},
		);
	},
);

/**
 * 特定のコンテキストにおける用語の定義を更新します。
 * @route PUT /api/terms/:id/contexts/:contextId
 * @param {string} id - 用語ID
 * @param {string} contextId - コンテキストID
 * @param {object} body - 更新データ
 * @param {string} body.definition - 新しい定義（必須）
 * @param {string} body.examples - 新しい使用例（オプション）
 * @param {string} body.changedBy - 変更者ID（オプション）
 * @returns {object} 200 - 更新されたコンテキスト関連情報オブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 404 - 用語またはコンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.put("/:id/contexts/:contextId", async (c) => {
	const termId = c.req.param("id");
	const contextId = c.req.param("contextId");
	const body = await c.req.json<{
		definition: string;
		examples?: string;
		changedBy?: string;
	}>();

	if (!body.definition) {
		return c.json({ error: "Definition is required" }, 400);
	}

	const result = await termService.updateTermInContext(
		termId,
		contextId,
		body.definition,
		body.examples,
		body.changedBy,
	);

	return result.match(
		(updated) => c.json(updated),
		(error: AppError) => {
			console.error("Error updating term in context:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});

/**
 * 用語をコンテキストから削除します。
 * @route DELETE /api/terms/:id/contexts/:contextId
 * @param {string} id - 用語ID
 * @param {string} contextId - コンテキストID
 * @returns {object} 200 - 削除成功メッセージ
 * @returns {object} 404 - 用語またはコンテキストが見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
termsRouter.delete("/:id/contexts/:contextId", async (c) => {
	const termId = c.req.param("id");
	const contextId = c.req.param("contextId");

	const result = await termService.removeTermFromContext(termId, contextId);

	return result.match(
		() => c.json({ message: "Term removed from context successfully" }),
		(error: AppError) => {
			console.error("Error removing term from context:", error);
			return c.json({ error: error.message }, error.statusCode as any);
		},
	);
});
