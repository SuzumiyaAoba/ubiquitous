import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { terms } from "./terms";

export const reviewStatusEnum = [
	"confirmed",
	"needs_update",
	"needs_discussion",
] as const;

export const reviews = pgTable(
	"reviews",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		reviewedBy: varchar("reviewed_by", { length: 255 }).notNull(),
		reviewedAt: timestamp("reviewed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		status: varchar("status", { length: 50 }).notNull(),
		notes: text("notes"),
	},
	(table) => ({
		termIdIdx: index("idx_reviews_term_id").on(table.termId, table.reviewedAt),
		reviewedByIdx: index("idx_reviews_reviewed_by").on(table.reviewedBy),
		reviewedAtIdx: index("idx_reviews_reviewed_at").on(table.reviewedAt),
	}),
);
