import { sql } from "drizzle-orm";
import {
	check,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { termProposals } from "./term-proposals";
import { terms } from "./terms";

export const analysisTypeEnum = [
	"clarity",
	"consistency",
	"suggestion",
	"qa",
] as const;

export const aiAnalysis = pgTable(
	"ai_analysis",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		termId: uuid("term_id").references(() => terms.id, { onDelete: "cascade" }),
		proposalId: uuid("proposal_id").references(() => termProposals.id, {
			onDelete: "cascade",
		}),
		analysisType: varchar("analysis_type", { length: 50 }).notNull(),
		input: text("input").notNull(),
		output: text("output").notNull(),
		clarityScore: integer("clarity_score"),
		suggestions: jsonb("suggestions"),
		similarTerms: jsonb("similar_terms"),
		analyzedAt: timestamp("analyzed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		termIdIdx: index("idx_ai_analysis_term_id").on(table.termId),
		proposalIdIdx: index("idx_ai_analysis_proposal_id").on(table.proposalId),
		typeIdx: index("idx_ai_analysis_type").on(table.analysisType),
		analyzedAtIdx: index("idx_ai_analysis_analyzed_at").on(table.analyzedAt),
		analysisReference: check(
			"analysis_reference",
			sql`
    (${table.termId} IS NOT NULL AND ${table.proposalId} IS NULL) OR
    (${table.termId} IS NULL AND ${table.proposalId} IS NOT NULL) OR
    (${table.termId} IS NULL AND ${table.proposalId} IS NULL)
  `,
		),
	}),
);

export const codeAnalysis = pgTable(
	"code_analysis",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		fileName: varchar("file_name", { length: 500 }).notNull(),
		uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
		uploadedAt: timestamp("uploaded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		extractedElements: jsonb("extracted_elements").notNull(),
		matchRate: decimal("match_rate", { precision: 5, scale: 2 }),
	},
	(table) => ({
		uploadedByIdx: index("idx_code_analysis_uploaded_by").on(table.uploadedBy),
		uploadedAtIdx: index("idx_code_analysis_uploaded_at").on(table.uploadedAt),
	}),
);
