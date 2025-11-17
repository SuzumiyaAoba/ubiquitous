import { pgTable, uuid, integer, text, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { terms } from './terms';

export const termHistory = pgTable('term_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  previousDefinition: text('previous_definition'),
  newDefinition: text('new_definition').notNull(),
  changedFields: text('changed_fields').array(),
  changeReason: text('change_reason'),
  changedBy: varchar('changed_by', { length: 255 }).notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  termIdIdx: index('idx_term_history_term_id').on(table.termId, table.version),
  changedAtIdx: index('idx_term_history_changed_at').on(table.changedAt),
  uniqueTermVersion: unique('unique_term_version').on(table.termId, table.version),
}));
