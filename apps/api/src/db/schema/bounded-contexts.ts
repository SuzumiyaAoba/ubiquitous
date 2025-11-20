import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const boundedContexts = pgTable("bounded_contexts", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	description: text("description"),
	createdBy: varchar("created_by", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
