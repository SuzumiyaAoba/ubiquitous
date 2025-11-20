import {
	index,
	jsonb,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const userActivity = pgTable(
	"user_activity",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 }).notNull(),
		action: varchar("action", { length: 100 }).notNull(),
		resourceType: varchar("resource_type", { length: 50 }),
		resourceId: uuid("resource_id"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userIdIdx: index("idx_user_activity_user_id").on(
			table.userId,
			table.createdAt,
		),
		actionIdx: index("idx_user_activity_action").on(table.action),
		createdAtIdx: index("idx_user_activity_created_at").on(table.createdAt),
	}),
);
