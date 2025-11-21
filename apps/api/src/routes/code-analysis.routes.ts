/**
 * @file コード分析ルート
 * @description コードのアップロード、分析、レポート生成などのエンドポイントを定義します。
 */

import { Hono } from "hono";
import { codeAnalysisService } from "../services/code-analysis.service";

export const codeAnalysisRouter = new Hono();

/**
 * コードをアップロードして分析を実行します。
 * @route POST /api/code-analysis/upload
 * @param {object} body - リクエストボディ
 * @param {string} body.fileName - ファイル名（必須）
 * @param {string} body.code - コード内容（必須）
 * @param {string} body.uploadedBy - アップロードユーザーID（必須）
 * @returns {object} 201 - 分析IDを含むオブジェクト
 * @returns {object} 400 - 必須フィールドが不足している場合
 * @returns {object} 500 - サーバーエラー
 */
codeAnalysisRouter.post("/upload", async (c) => {
	try {
		const body = await c.req.json<{
			fileName: string;
			code: string;
			uploadedBy: string;
		}>();

		// Validate required fields
		if (!body.fileName || !body.code || !body.uploadedBy) {
			return c.json(
				{ error: "fileName, code, and uploadedBy are required" },
				400,
			);
		}

		const analysisId = await codeAnalysisService.analyzeCode(
			body.fileName,
			body.code,
			body.uploadedBy,
		);

		return c.json({ analysisId }, 201);
	} catch (error) {
		console.error("Error analyzing code:", error);
		const message =
			error instanceof Error ? error.message : "Failed to analyze code";
		return c.json({ error: message }, 500);
	}
});

/**
 * 分析レポートを取得します。
 * @route GET /api/code-analysis/:id/report
 * @param {string} id - 分析ID
 * @returns {object} 200 - 分析レポートオブジェクト
 * @returns {object} 404 - 分析が見つからない場合
 * @returns {object} 500 - サーバーエラー
 */
codeAnalysisRouter.get("/:id/report", async (c) => {
	try {
		const id = c.req.param("id");

		const report = await codeAnalysisService.getReport(id);

		if (!report) {
			return c.json({ error: "Analysis not found" }, 404);
		}

		return c.json(report);
	} catch (error) {
		console.error("Error fetching analysis report:", error);
		const message =
			error instanceof Error
				? error.message
				: "Failed to fetch analysis report";
		return c.json({ error: message }, 500);
	}
});
