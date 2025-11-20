import { z } from "zod";
import { TermSchema } from "./term.schema";

/**
 * Bounded Context エンティティのZodスキーマ
 */
export const BoundedContextSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  description: z.string().min(1, "Description is required"),
  createdBy: z.string().uuid("Invalid creator user ID"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Note: Export type is commented out to avoid conflict with existing entity interface
// export type BoundedContext = z.infer<typeof BoundedContextSchema>;

/**
 * 新しい境界付きコンテキストを作成するためのDTOスキーマ
 */
export const CreateContextDtoSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .trim(),
  description: z.string().min(1, "Description is required").trim(),
});

// Note: Export type is commented out to avoid conflict with existing DTO interface
// export type CreateContextDto = z.infer<typeof CreateContextDtoSchema>;

/**
 * 既存の境界付きコンテキストを更新するためのDTOスキーマ
 */
export const UpdateContextDtoSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .trim()
    .optional(),
  description: z.string().min(1, "Description is required").trim().optional(),
});

// Note: Export type is commented out to avoid conflict with existing DTO interface
// export type UpdateContextDto = z.infer<typeof UpdateContextDtoSchema>;

/**
 * コンテキストと関連するすべての用語を含むDTOスキーマ
 */
export const ContextWithTermsSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  terms: z.array(TermSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Note: Export type is commented out to avoid conflict with existing DTO interface
// export type ContextWithTerms = z.infer<typeof ContextWithTermsSchema>;
