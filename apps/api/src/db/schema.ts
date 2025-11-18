import { pgTable, text, timestamp, uuid, varchar, pgEnum, integer, real, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const termStatusEnum = pgEnum('term_status', ['draft', 'active', 'deprecated']);
export const relationshipTypeEnum = pgEnum('relationship_type', ['synonym', 'antonym', 'related', 'parent', 'child']);
export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'approved', 'rejected', 'on_hold']);
export const threadStatusEnum = pgEnum('thread_status', ['open', 'closed']);
export const reviewStatusEnum = pgEnum('review_status', ['confirmed', 'needs_update', 'needs_discussion']);
export const analysisTypeEnum = pgEnum('analysis_type', ['clarity', 'consistency', 'suggestion', 'qa']);
export const codeElementTypeEnum = pgEnum('code_element_type', ['class', 'method', 'variable']);

// Terms table
export const terms = pgTable('terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: termStatusEnum('status').default('draft').notNull(),
  nextReviewDate: timestamp('next_review_date'),
  reviewInterval: integer('review_interval'), // days between reviews
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
  history: many(termHistory),
  discussionThreads: many(discussionThreads),
  reviews: many(reviews),
  userLearning: many(userLearning),
  aiAnalyses: many(aiAnalyses),
}));

export const contextsRelations = relations(contexts, ({ many }) => ({
  termContexts: many(termContexts),
  termProposals: many(termProposals),
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

// Term History table
export const termHistory = pgTable('term_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  previousDefinition: text('previous_definition').notNull(),
  newDefinition: text('new_definition').notNull(),
  changedFields: jsonb('changed_fields').notNull().$type<string[]>(),
  changedBy: varchar('changed_by', { length: 255 }).notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  changeReason: text('change_reason'),
});

// Term Proposal table
export const termProposals = pgTable('term_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  definition: text('definition').notNull(),
  boundedContextId: uuid('bounded_context_id').notNull().references(() => contexts.id),
  proposedBy: varchar('proposed_by', { length: 255 }).notNull(),
  proposedAt: timestamp('proposed_at').defaultNow().notNull(),
  status: proposalStatusEnum('status').default('pending').notNull(),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
});

// Discussion Thread table
export const discussionThreads = pgTable('discussion_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').references(() => terms.id, { onDelete: 'cascade' }),
  proposalId: uuid('proposal_id').references(() => termProposals.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: threadStatusEnum('status').default('open').notNull(),
});

// Comment table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => discussionThreads.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  postedBy: varchar('posted_by', { length: 255 }).notNull(),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Review table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  reviewedBy: varchar('reviewed_by', { length: 255 }).notNull(),
  reviewedAt: timestamp('reviewed_at').defaultNow().notNull(),
  status: reviewStatusEnum('status').notNull(),
  notes: text('notes'),
});

// User Learning table
export const userLearning = pgTable('user_learning', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  termId: uuid('term_id').notNull().references(() => terms.id, { onDelete: 'cascade' }),
  learnedAt: timestamp('learned_at').defaultNow().notNull(),
});

// Code Analysis table
export const codeAnalyses = pgTable('code_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  extractedElements: jsonb('extracted_elements').notNull(),
  matchRate: real('match_rate').notNull(),
});

// AI Analysis table
export const aiAnalyses = pgTable('ai_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id').references(() => terms.id, { onDelete: 'cascade' }),
  proposalId: uuid('proposal_id').references(() => termProposals.id, { onDelete: 'cascade' }),
  analysisType: analysisTypeEnum('analysis_type').notNull(),
  input: text('input').notNull(),
  output: text('output').notNull(),
  clarityScore: real('clarity_score'),
  suggestions: jsonb('suggestions').notNull().$type<string[]>(),
  similarTerms: jsonb('similar_terms').notNull(),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
});

// Relations for new tables
export const termHistoryRelations = relations(termHistory, ({ one }) => ({
  term: one(terms, {
    fields: [termHistory.termId],
    references: [terms.id],
  }),
}));

export const termProposalsRelations = relations(termProposals, ({ one, many }) => ({
  context: one(contexts, {
    fields: [termProposals.boundedContextId],
    references: [contexts.id],
  }),
  discussionThreads: many(discussionThreads),
  aiAnalyses: many(aiAnalyses),
}));

export const discussionThreadsRelations = relations(discussionThreads, ({ one, many }) => ({
  term: one(terms, {
    fields: [discussionThreads.termId],
    references: [terms.id],
  }),
  proposal: one(termProposals, {
    fields: [discussionThreads.proposalId],
    references: [termProposals.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  thread: one(discussionThreads, {
    fields: [comments.threadId],
    references: [discussionThreads.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  term: one(terms, {
    fields: [reviews.termId],
    references: [terms.id],
  }),
}));

export const userLearningRelations = relations(userLearning, ({ one }) => ({
  term: one(terms, {
    fields: [userLearning.termId],
    references: [terms.id],
  }),
}));

export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  term: one(terms, {
    fields: [aiAnalyses.termId],
    references: [terms.id],
  }),
  proposal: one(termProposals, {
    fields: [aiAnalyses.proposalId],
    references: [termProposals.id],
  }),
}));
