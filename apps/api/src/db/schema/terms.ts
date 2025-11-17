import { pgTable, uuid, varchar, text, timestamp, integer, boolean, date, index, unique } from 'drizzle-orm/pg-core';
import { boundedContexts } from './bounded-contexts';

export const termStatusEnum = ['draft', 'active', 'archived'] as const;

export const terms = pgTable('terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  definition: text('definition').notNull(),
  boundedContextId: uuid('bounded_context_id').notNull().references(() => boundedContexts.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  examples: text('examples').array(),
  usageNotes: text('usage_notes'),
  qualityScore: integer('quality_score').default(0),
  essentialForOnboarding: boolean('essential_for_onboarding').default(false),
  reviewCycleDays: integer('review_cycle_days'),
  nextReviewDate: date('next_review_date'),
  viewCount: integer('view_count').default(0),
  searchCount: integer('search_count').default(0),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  nameIdx: index('idx_terms_name').on(table.name),
  boundedContextIdx: index('idx_terms_bounded_context_id').on(table.boundedContextId),
  statusIdx: index('idx_terms_status').on(table.status),
  nextReviewDateIdx: index('idx_terms_next_review_date').on(table.nextReviewDate),
  essentialIdx: index('idx_terms_essential').on(table.essentialForOnboarding),
  deletedAtIdx: index('idx_terms_deleted_at').on(table.deletedAt),
  uniqueTermPerContext: unique('unique_term_per_context').on(table.name, table.boundedContextId),
}));
