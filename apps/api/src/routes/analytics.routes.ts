/**
 * @file 分析とメトリクスルート
 * @description システム全体のメトリクス、ユーザーアクティビティ、カバレッジ統計などの分析データを提供するエンドポイントを定義します。
 */

import { Hono } from "hono";
import type { ExportFormat } from "../services/analytics.service";
import { analyticsService } from "../services/analytics.service";

export const analyticsRouter = new Hono();

/**
 * すべてのシステムメトリクスを取得します。
 * @route GET /api/analytics/metrics
 * @returns {object} 200 - メトリクスデータを含むオブジェクト
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/metrics", async (c) => {
	try {
		const metrics = await analyticsService.getAllMetrics();
		return c.json(metrics);
	} catch (error) {
		console.error("Error fetching metrics:", error);
		return c.json({ error: "Failed to fetch metrics" }, 500);
	}
});

/**
 * システムメトリクスのみを取得します。
 * @route GET /api/analytics/metrics/system
 * @returns {object} 200 - システムメトリクスデータ
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/metrics/system", async (c) => {
	try {
		const metrics = await analyticsService.getSystemMetrics();
		return c.json(metrics);
	} catch (error) {
		console.error("Error fetching system metrics:", error);
		return c.json({ error: "Failed to fetch system metrics" }, 500);
	}
});

/**
 * ユーザーアクティビティメトリクスを取得します。
 * @route GET /api/analytics/metrics/user-activity
 * @returns {object} 200 - ユーザーアクティビティメトリクスデータ
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/metrics/user-activity", async (c) => {
	try {
		const metrics = await analyticsService.getUserActivityMetrics();
		return c.json(metrics);
	} catch (error) {
		console.error("Error fetching user activity metrics:", error);
		return c.json({ error: "Failed to fetch user activity metrics" }, 500);
	}
});

/**
 * カバレッジメトリクスを取得します。
 * @route GET /api/analytics/metrics/coverage
 * @returns {object} 200 - カバレッジメトリクスデータ
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/metrics/coverage", async (c) => {
	try {
		const metrics = await analyticsService.getCoverageMetrics();
		return c.json(metrics);
	} catch (error) {
		console.error("Error fetching coverage metrics:", error);
		return c.json({ error: "Failed to fetch coverage metrics" }, 500);
	}
});

/**
 * メトリクスを指定した形式でエクスポートします。
 * @route GET /api/analytics/export
 * @query {string} format - エクスポート形式（json または csv、デフォルト: json）
 * @returns {string} 200 - エクスポートされたメトリクスデータ
 * @returns {object} 400 - 無効な形式が指定された場合
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/export", async (c) => {
	try {
		const format = (c.req.query("format") || "json") as ExportFormat;

		// Validate format
		if (format !== "json" && format !== "csv") {
			return c.json({ error: 'Invalid format. Must be "json" or "csv"' }, 400);
		}

		const exportData = await analyticsService.exportMetrics(format);

		// Set appropriate content type and headers
		if (format === "json") {
			c.header("Content-Type", "application/json");
			c.header("Content-Disposition", 'attachment; filename="metrics.json"');
			return c.text(exportData);
		} else {
			c.header("Content-Type", "text/csv");
			c.header("Content-Disposition", 'attachment; filename="metrics.csv"');
			return c.text(exportData);
		}
	} catch (error) {
		console.error("Error exporting metrics:", error);
		const message =
			error instanceof Error ? error.message : "Failed to export metrics";
		return c.json({ error: message }, 500);
	}
});

/**
 * 最もアクティブな提案者ランキングを取得します。
 * @route GET /api/analytics/top-proposers
 * @query {number} limit - 取得する件数（デフォルト: 10）
 * @returns {object[]} 200 - 提案者ランキング配列
 * @returns {object} 400 - 無効なlimitパラメータ
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/top-proposers", async (c) => {
	try {
		const limitStr = c.req.query("limit");
		const limit = limitStr ? parseInt(limitStr, 10) : 10;

		if (Number.isNaN(limit) || limit < 1) {
			return c.json({ error: "Invalid limit parameter" }, 400);
		}

		const topProposers = await analyticsService.getMostActiveProposers(limit);
		return c.json(topProposers);
	} catch (error) {
		console.error("Error fetching top proposers:", error);
		return c.json({ error: "Failed to fetch top proposers" }, 500);
	}
});

/**
 * 最もアクティブなレビュアーランキングを取得します。
 * @route GET /api/analytics/top-reviewers
 * @query {number} limit - 取得する件数（デフォルト: 10）
 * @returns {object[]} 200 - レビュアーランキング配列
 * @returns {object} 400 - 無効なlimitパラメータ
 * @returns {object} 500 - サーバーエラー
 */
analyticsRouter.get("/top-reviewers", async (c) => {
	try {
		const limitStr = c.req.query("limit");
		const limit = limitStr ? parseInt(limitStr, 10) : 10;

		if (Number.isNaN(limit) || limit < 1) {
			return c.json({ error: "Invalid limit parameter" }, 400);
		}

		const topReviewers = await analyticsService.getMostActiveReviewers(limit);
		return c.json(topReviewers);
	} catch (error) {
		console.error("Error fetching top reviewers:", error);
		return c.json({ error: "Failed to fetch top reviewers" }, 500);
	}
});
