import { pgTable, uuid, varchar, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { terms } from './terms';
import { termProposals } from './term-proposals';
import { sql } from 'drizzle-orm';

export const threadStatusEnum = ['open', 'closed'] as const;

export const discussionThreads = pgTable('discussion_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').references(() => terms.id, { onDelete: 'cascade' }),
  proposalId: uuid('proposal_id').references(() => termProposals.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 50 }).notNull().default('open'),
}, (table) => ({
  termIdIdx: index('idx_discussion_threads_term_id').on(table.termId),
  proposalIdIdx: index('idx_discussion_threads_proposal_id').on(table.proposalId),
  statusIdx: index('idx_discussion_threads_status').on(table.status),
  createdAtIdx: index('idx_discussion_threads_created_at').on(table.createdAt),
  threadReference: check('thread_reference', sql`
    (${table.termId} IS NOT NULL AND ${table.proposalId} IS NULL) OR
    (${table.termId} IS NULL AND ${table.proposalId} IS NOT NULL)
  `),
}));

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => discussionThreads.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  postedBy: varchar('posted_by', { length: 255 }).notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}, (table) => ({
  threadIdIdx: index('idx_comments_thread_id').on(table.threadId, table.postedAt),
  postedByIdx: index('idx_comments_posted_by').on(table.postedBy),
}));
