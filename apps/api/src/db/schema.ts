import { pgTable, text, timestamp, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const termStatusEnum = pgEnum('term_status', ['draft', 'active', 'deprecated']);
export const relationshipTypeEnum = pgEnum('relationship_type', ['synonym', 'antonym', 'related', 'parent', 'child']);

// Terms table
export const terms = pgTable('terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: termStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contexts table
export const contexts = pgTable('contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Term-Context relationship table
export const termContexts = pgTable('term_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  contextId: uuid('context_id').notNull().references(() => contexts.id, { onDelete: 'cascade' }),
  definition: text('definition').notNull(),
  examples: text('examples'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Term relationships table
export const termRelationships = pgTable('term_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceTermId: uuid('source_term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  targetTermId: uuid('target_term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const termsRelations = relations(terms, ({ many }) => ({
  termContexts: many(termContexts),
  sourceRelationships: many(termRelationships, { relationName: 'sourceRelationships' }),
  targetRelationships: many(termRelationships, { relationName: 'targetRelationships' }),
}));

export const contextsRelations = relations(contexts, ({ many }) => ({
  termContexts: many(termContexts),
}));

export const termContextsRelations = relations(termContexts, ({ one }) => ({
  term: one(terms, {
    fields: [termContexts.termId],
    references: [terms.id],
  }),
  context: one(contexts, {
    fields: [termContexts.contextId],
    references: [contexts.id],
  }),
}));

export const termRelationshipsRelations = relations(termRelationships, ({ one }) => ({
  sourceTerm: one(terms, {
    fields: [termRelationships.sourceTermId],
    references: [terms.id],
    relationName: 'sourceRelationships',
  }),
  targetTerm: one(terms, {
    fields: [termRelationships.targetTermId],
    references: [terms.id],
    relationName: 'targetRelationships',
  }),
}));
