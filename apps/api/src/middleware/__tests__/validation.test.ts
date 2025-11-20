import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateBody, validateParams, validateQuery } from "../validation";

// Mock Hono Context
function createMockContext(overrides = {}): Context {
	const state = new Map();
	return {
		req: {
			json: vi.fn(),
			query: vi.fn(),
			param: vi.fn(),
		},
		json: vi.fn((data, status) => ({ data, status })),
		set: (key: string, value: any) => state.set(key, value),
		get: (key: string) => state.get(key),
		...overrides,
	} as any;
}

describe("validateBody", () => {
	const TestSchema = z.object({
		name: z.string().min(1),
		age: z.number().positive(),
	});

	it("should validate and pass valid request body", async () => {
		const validBody = { name: "John", age: 30 };
		const mockContext = createMockContext();
		mockContext.req.json = vi.fn().mockResolvedValue(validBody);

		const mockNext = vi.fn();
		const middleware = validateBody(TestSchema);

		await middleware(mockContext, mockNext);

		expect(mockContext.get("validatedBody")).toEqual(validBody);
		expect(mockNext).toHaveBeenCalledOnce();
	});

	it("should reject invalid request body", async () => {
		const invalidBody = { name: "", age: -5 };
		const mockContext = createMockContext();
		mockContext.req.json = vi.fn().mockResolvedValue(invalidBody);

		const mockNext = vi.fn();
		const middleware = validateBody(TestSchema);

		const result = await middleware(mockContext, mockNext);

		expect(result.status).toBe(400);
		expect(result.data.error).toBeDefined();
		// Either detailed validation error or generic error is acceptable
		expect(result.data.error).toMatch(/failed|Invalid/i);
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should handle malformed JSON", async () => {
		const mockContext = createMockContext();
		mockContext.req.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

		const mockNext = vi.fn();
		const middleware = validateBody(TestSchema);

		const result = await middleware(mockContext, mockNext);

		expect(result.status).toBe(400);
		expect(result.data.error).toBe("Invalid request body");
		expect(mockNext).not.toHaveBeenCalled();
	});
});

describe("validateQuery", () => {
	const QuerySchema = z.object({
		page: z.string().transform(Number).pipe(z.number().positive()),
		search: z.string().optional(),
	});

	it("should validate and pass valid query parameters", async () => {
		const validQuery = { page: "1", search: "test" };
		const mockContext = createMockContext();
		mockContext.req.query = vi.fn().mockReturnValue(validQuery);

		const mockNext = vi.fn();
		const middleware = validateQuery(QuerySchema);

		await middleware(mockContext, mockNext);

		const validated = mockContext.get("validatedQuery");
		expect(validated.page).toBe(1);
		expect(validated.search).toBe("test");
		expect(mockNext).toHaveBeenCalledOnce();
	});

	it("should reject invalid query parameters", async () => {
		const invalidQuery = { page: "-1" };
		const mockContext = createMockContext();
		mockContext.req.query = vi.fn().mockReturnValue(invalidQuery);

		const mockNext = vi.fn();
		const middleware = validateQuery(QuerySchema);

		const result = await middleware(mockContext, mockNext);

		expect(result.status).toBe(400);
		expect(result.data.error).toBeDefined();
		// Either detailed validation error or generic error is acceptable
		expect(result.data.error).toMatch(/failed|Invalid/i);
		expect(mockNext).not.toHaveBeenCalled();
	});
});

describe("validateParams", () => {
	const ParamsSchema = z.object({
		id: z.string().uuid(),
	});

	it("should validate and pass valid path parameters", async () => {
		const validParams = { id: "123e4567-e89b-12d3-a456-426614174000" };
		const mockContext = createMockContext();
		mockContext.req.param = vi.fn().mockReturnValue(validParams);

		const mockNext = vi.fn();
		const middleware = validateParams(ParamsSchema);

		await middleware(mockContext, mockNext);

		expect(mockContext.get("validatedParams")).toEqual(validParams);
		expect(mockNext).toHaveBeenCalledOnce();
	});

	it("should reject invalid path parameters", async () => {
		const invalidParams = { id: "not-a-uuid" };
		const mockContext = createMockContext();
		mockContext.req.param = vi.fn().mockReturnValue(invalidParams);

		const mockNext = vi.fn();
		const middleware = validateParams(ParamsSchema);

		const result = await middleware(mockContext, mockNext);

		expect(result.status).toBe(400);
		expect(result.data.error).toBeDefined();
		// Either detailed validation error or generic error is acceptable
		expect(result.data.error).toMatch(/failed|Invalid/i);
		expect(mockNext).not.toHaveBeenCalled();
	});
});
