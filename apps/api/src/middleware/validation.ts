/**
 * Zodバリデーションミドルウェア
 *
 * HonoミドルウェアでZodスキーマを使用してリクエストボディをバリデーションします。
 */

import type { Context, Next } from "hono";
import { z } from "zod";

/**
 * リクエストボディをZodスキーマでバリデーションします
 *
 * @param schema - 検証に使用するZodスキーマ
 * @returns Honoミドルウェア関数
 *
 * @example
 * ```typescript
 * router.post('/', validateBody(CreateTermDtoSchema), async (c) => {
 *   const body = c.get('validatedBody');
 *   // 型安全なbodyを使用
 * });
 * ```
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set("validatedBody", validated);
      await next();
    } catch (error) {
      // Check if error has errors property (duck typing for ZodError)
      if (error && typeof error === "object" && "errors" in error && Array.isArray((error as any).errors)) {
        return c.json(
          {
            error: "Validation failed",
            details: (error as any).errors.map((err: any) => ({
              path: err.path?.join?.(".") || String(err.path || ""),
              message: err.message,
            })),
          },
          400
        );
      }
      return c.json({ error: "Invalid request body" }, 400);
    }
  };
}

/**
 * クエリパラメータをZodスキーマでバリデーションします
 *
 * @param schema - 検証に使用するZodスキーマ
 * @returns Honoミドルウェア関数
 *
 * @example
 * ```typescript
 * const QuerySchema = z.object({
 *   page: z.string().transform(Number).pipe(z.number().int().positive()),
 * });
 *
 * router.get('/', validateQuery(QuerySchema), async (c) => {
 *   const query = c.get('validatedQuery');
 *   // 型安全なqueryを使用
 * });
 * ```
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validated = schema.parse(query);
      c.set("validatedQuery", validated);
      await next();
    } catch (error) {
      // Check if error has errors property (duck typing for ZodError)
      if (error && typeof error === "object" && "errors" in error && Array.isArray((error as any).errors)) {
        return c.json(
          {
            error: "Query validation failed",
            details: (error as any).errors.map((err: any) => ({
              path: err.path?.join?.(".") || String(err.path || ""),
              message: err.message,
            })),
          },
          400
        );
      }
      return c.json({ error: "Invalid query parameters" }, 400);
    }
  };
}

/**
 * パスパラメータをZodスキーマでバリデーションします
 *
 * @param schema - 検証に使用するZodスキーマ
 * @returns Honoミドルウェア関数
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);
      c.set("validatedParams", validated);
      await next();
    } catch (error) {
      // Check if error has errors property (duck typing for ZodError)
      if (error && typeof error === "object" && "errors" in error && Array.isArray((error as any).errors)) {
        return c.json(
          {
            error: "Parameter validation failed",
            details: (error as any).errors.map((err: any) => ({
              path: err.path?.join?.(".") || String(err.path || ""),
              message: err.message,
            })),
          },
          400
        );
      }
      return c.json({ error: "Invalid parameters" }, 400);
    }
  };
}
