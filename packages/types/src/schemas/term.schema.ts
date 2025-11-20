import { z } from "zod";

/**
 * 用語のステータス
 */
export const TermStatusSchema = z.enum(["draft", "active", "archived"]);
export type TermStatus = z.infer<typeof TermStatusSchema>;

/**
 * 用語エンティティのZodスキーマ
 */
export const TermSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  definition: z.string().min(1, "Definition is required"),
  boundedContextId: z.string().uuid("Invalid bounded context ID"),
  status: TermStatusSchema,
  examples: z.array(z.string()).optional(),
  usageNotes: z.string().optional(),
  qualityScore: z.number().min(0).max(100, "Quality score must be between 0 and 100"),
  essentialForOnboarding: z.boolean(),
  reviewCycleDays: z.number().int().positive().optional(),
  nextReviewDate: z.date().optional(),
  createdBy: z.string().uuid("Invalid creator user ID"),
  createdAt: z.date(),
  updatedBy: z.string().uuid("Invalid updater user ID"),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

// Note: Export type is commented out to avoid conflict with existing entity interface
// export type Term = z.infer<typeof TermSchema>;

/**
 * 新しい用語を作成するためのDTOスキーマ
 */
export const CreateTermDtoSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long")
    .trim(),
  definition: z.string().min(1, "Definition is required").trim(),
  boundedContextId: z.string().uuid("Invalid bounded context ID"),
  examples: z.array(z.string().min(1)).optional(),
  usageNotes: z.string().optional(),
  essentialForOnboarding: z.boolean().default(false),
  reviewCycleDays: z.number().int().positive().optional(),
});

// Note: Export type is commented out to avoid conflict with existing DTO interface
// export type CreateTermDto = z.infer<typeof CreateTermDtoSchema>;

/**
 * 既存の用語を更新するためのDTOスキーマ
 */
export const UpdateTermDtoSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long").trim().optional(),
  definition: z.string().min(1, "Definition is required").trim().optional(),
  examples: z.array(z.string().min(1)).optional(),
  usageNotes: z.string().optional(),
  essentialForOnboarding: z.boolean().optional(),
  reviewCycleDays: z.number().int().positive().optional(),
  changeReason: z.string().optional(),
});

// Note: Export type is commented out to avoid conflict with existing DTO interface
// export type UpdateTermDto = z.infer<typeof UpdateTermDtoSchema>;

/**
 * 用語をコンテキストに追加するためのDTOスキーマ
 */
export const AddTermToContextDtoSchema = z.object({
  termId: z.string().uuid("Invalid term ID"),
  contextId: z.string().uuid("Invalid context ID"),
  definition: z.string().min(1, "Definition is required").trim(),
  examples: z.string().optional(),
});

// Note: Export type is commented out to avoid conflict with existing DTO interface
// export type AddTermToContextDto = z.infer<typeof AddTermToContextDtoSchema>;
