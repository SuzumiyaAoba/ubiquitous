import {
	index,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { terms } from "./terms";

export const userLearning = pgTable(
	"user_learning",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 }).notNull(),
		termId: uuid("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		learnedAt: timestamp("learned_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userIdIdx: index("idx_user_learning_user_id").on(table.userId),
		termIdIdx: index("idx_user_learning_term_id").on(table.termId),
		uniqueUserTermLearning: unique("unique_user_term_learning").on(
			table.userId,
			table.termId,
		),
	}),
);
