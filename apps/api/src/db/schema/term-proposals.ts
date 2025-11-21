import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { boundedContexts } from "./bounded-contexts";

export const proposalStatusEnum = [
	"pending",
	"approved",
	"rejected",
	"on_hold",
] as const;

export const termProposals = pgTable(
	"term_proposals",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		definition: text("definition").notNull(),
		boundedContextId: uuid("bounded_context_id")
			.notNull()
			.references(() => boundedContexts.id, { onDelete: "cascade" }),
		proposedBy: varchar("proposed_by", { length: 255 }).notNull(),
		proposedAt: timestamp("proposed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		status: varchar("status", { length: 50 }).notNull().default("pending"),
		approvedBy: varchar("approved_by", { length: 255 }),
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		rejectionReason: text("rejection_reason"),
	},
	(table) => ({
		statusIdx: index("idx_term_proposals_status").on(table.status),
		boundedContextIdx: index("idx_term_proposals_bounded_context").on(
			table.boundedContextId,
		),
		proposedAtIdx: index("idx_term_proposals_proposed_at").on(table.proposedAt),
	}),
);
