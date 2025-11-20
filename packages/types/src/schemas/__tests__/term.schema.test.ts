import { describe, it, expect } from "vitest";
import {
  TermSchema,
  TermStatusSchema,
  CreateTermDtoSchema,
  UpdateTermDtoSchema,
  AddTermToContextDtoSchema,
} from "../term.schema";

describe("TermStatusSchema", () => {
  it("should accept valid status values", () => {
    expect(TermStatusSchema.parse("draft")).toBe("draft");
    expect(TermStatusSchema.parse("active")).toBe("active");
    expect(TermStatusSchema.parse("archived")).toBe("archived");
  });

  it("should reject invalid status values", () => {
    expect(() => TermStatusSchema.parse("invalid")).toThrow();
  });
});

describe("TermSchema", () => {
  const validTerm = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Aggregate Root",
    definition: "An entity that serves as the root of an aggregate",
    boundedContextId: "123e4567-e89b-12d3-a456-426614174001",
    status: "active" as const,
    qualityScore: 85,
    essentialForOnboarding: true,
    createdBy: "123e4567-e89b-12d3-a456-426614174002",
    createdAt: new Date(),
    updatedBy: "123e4567-e89b-12d3-a456-426614174002",
    updatedAt: new Date(),
  };

  it("should validate a valid term", () => {
    const result = TermSchema.parse(validTerm);
    expect(result).toEqual(validTerm);
  });

  it("should reject term with invalid UUID", () => {
    const invalidTerm = { ...validTerm, id: "invalid-uuid" };
    expect(() => TermSchema.parse(invalidTerm)).toThrow();
  });

  it("should reject term with empty name", () => {
    const invalidTerm = { ...validTerm, name: "" };
    expect(() => TermSchema.parse(invalidTerm)).toThrow();
  });

  it("should reject term with name too long", () => {
    const invalidTerm = { ...validTerm, name: "a".repeat(201) };
    expect(() => TermSchema.parse(invalidTerm)).toThrow();
  });

  it("should reject term with quality score out of range", () => {
    const invalidTerm = { ...validTerm, qualityScore: 101 };
    expect(() => TermSchema.parse(invalidTerm)).toThrow();
  });

  it("should accept term with optional fields", () => {
    const termWithOptionals = {
      ...validTerm,
      examples: ["example1", "example2"],
      usageNotes: "Use carefully",
      reviewCycleDays: 30,
      nextReviewDate: new Date(),
    };
    const result = TermSchema.parse(termWithOptionals);
    expect(result).toEqual(termWithOptionals);
  });
});

describe("CreateTermDtoSchema", () => {
  const validDto = {
    name: "Value Object",
    definition: "An object defined by its attributes",
    boundedContextId: "123e4567-e89b-12d3-a456-426614174001",
  };

  it("should validate a valid create term DTO", () => {
    const result = CreateTermDtoSchema.parse(validDto);
    expect(result.name).toBe(validDto.name);
    expect(result.definition).toBe(validDto.definition);
    expect(result.essentialForOnboarding).toBe(false); // default value
  });

  it("should trim whitespace from name and definition", () => {
    const dtoWithWhitespace = {
      ...validDto,
      name: "  Value Object  ",
      definition: "  An object defined by its attributes  ",
    };
    const result = CreateTermDtoSchema.parse(dtoWithWhitespace);
    expect(result.name).toBe("Value Object");
    expect(result.definition).toBe("An object defined by its attributes");
  });

  it("should reject DTO with missing required fields", () => {
    expect(() => CreateTermDtoSchema.parse({ name: "Test" })).toThrow();
    expect(() => CreateTermDtoSchema.parse({ definition: "Test" })).toThrow();
  });

  it("should reject DTO with invalid UUID", () => {
    const invalidDto = { ...validDto, boundedContextId: "invalid-uuid" };
    expect(() => CreateTermDtoSchema.parse(invalidDto)).toThrow();
  });

  it("should accept DTO with optional fields", () => {
    const dtoWithOptionals = {
      ...validDto,
      examples: ["example1"],
      usageNotes: "Important notes",
      essentialForOnboarding: true,
      reviewCycleDays: 60,
    };
    const result = CreateTermDtoSchema.parse(dtoWithOptionals);
    expect(result.examples).toEqual(["example1"]);
    expect(result.essentialForOnboarding).toBe(true);
  });
});

describe("UpdateTermDtoSchema", () => {
  it("should validate a valid update term DTO", () => {
    const validDto = {
      name: "Updated Name",
      definition: "Updated definition",
    };
    const result = UpdateTermDtoSchema.parse(validDto);
    expect(result).toEqual(validDto);
  });

  it("should accept DTO with only some fields", () => {
    const partialDto = { name: "Only Name" };
    const result = UpdateTermDtoSchema.parse(partialDto);
    expect(result.name).toBe("Only Name");
    expect(result.definition).toBeUndefined();
  });

  it("should accept empty DTO", () => {
    const emptyDto = {};
    const result = UpdateTermDtoSchema.parse(emptyDto);
    expect(result).toEqual({});
  });

  it("should trim whitespace", () => {
    const dtoWithWhitespace = {
      name: "  Trimmed  ",
      definition: "  Also trimmed  ",
    };
    const result = UpdateTermDtoSchema.parse(dtoWithWhitespace);
    expect(result.name).toBe("Trimmed");
    expect(result.definition).toBe("Also trimmed");
  });
});

describe("AddTermToContextDtoSchema", () => {
  const validDto = {
    termId: "123e4567-e89b-12d3-a456-426614174000",
    contextId: "123e4567-e89b-12d3-a456-426614174001",
    definition: "Context-specific definition",
  };

  it("should validate a valid add term to context DTO", () => {
    const result = AddTermToContextDtoSchema.parse(validDto);
    expect(result).toEqual(validDto);
  });

  it("should reject DTO with invalid UUIDs", () => {
    const invalidDto = { ...validDto, termId: "invalid" };
    expect(() => AddTermToContextDtoSchema.parse(invalidDto)).toThrow();
  });

  it("should reject DTO with empty definition", () => {
    const invalidDto = { ...validDto, definition: "" };
    expect(() => AddTermToContextDtoSchema.parse(invalidDto)).toThrow();
  });

  it("should accept DTO with optional examples", () => {
    const dtoWithExamples = { ...validDto, examples: "Example usage" };
    const result = AddTermToContextDtoSchema.parse(dtoWithExamples);
    expect(result.examples).toBe("Example usage");
  });
});
