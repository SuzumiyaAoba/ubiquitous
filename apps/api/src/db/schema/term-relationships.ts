import { pgTable, uuid, varchar, text, timestamp, index, unique, check } from 'drizzle-orm/pg-core';
import { terms } from './terms';
import { sql } from 'drizzle-orm';

export const relationshipTypeEnum = ['aggregation', 'association', 'dependency', 'inheritance'] as const;

export const termRelationships = pgTable('term_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceTermId: uuid('source_term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  targetTermId: uuid('target_term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  description: text('description'),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('idx_term_relationships_source').on(table.sourceTermId),
  targetIdx: index('idx_term_relationships_target').on(table.targetTermId),
  typeIdx: index('idx_term_relationships_type').on(table.relationshipType),
  uniqueRelationship: unique('unique_relationship').on(table.sourceTermId, table.targetTermId, table.relationshipType),
  noSelfReference: check('no_self_reference', sql`${table.sourceTermId} != ${table.targetTermId}`),
}));
