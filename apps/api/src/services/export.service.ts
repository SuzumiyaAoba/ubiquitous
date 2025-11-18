import { termRepository } from '../repositories/term.repository';
import { contextRepository } from '../repositories/context.repository';
import { termRelationshipRepository } from '../repositories/term-relationship.repository';
import { termProposalRepository } from '../repositories/term-proposal.repository';
import { discussionRepository } from '../repositories/discussion.repository';
import { reviewRepository } from '../repositories/review.repository';

export interface ExportData {
  version: string;
  exportedAt: string;
  contexts: any[];
  terms: any[];
  termContexts: any[];
  relationships: any[];
  proposals: any[];
  discussions: any[];
  reviews: any[];
}

export class ExportService {
  /**
   * Export all data as JSON
   */
  async exportAsJSON(): Promise<string> {
    const data = await this.getAllData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export all data as Markdown, organized by context
   */
  async exportAsMarkdown(): Promise<string> {
    const contexts = await contextRepository.findAll();
    const terms = await termRepository.findAll();

    const lines: string[] = [];

    // Header
    lines.push('# Ubiquitous Language Documentation');
    lines.push('');
    lines.push(`Generated on: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Table of Contents
    lines.push('## Table of Contents');
    lines.push('');
    for (const context of contexts) {
      lines.push(`- [${context.name}](#${this.slugify(context.name)})`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // For each context
    for (const context of contexts) {
      lines.push(`## ${context.name}`);
      lines.push('');

      if (context.description) {
        lines.push(context.description);
        lines.push('');
      }

      // Get terms in this context
      const contextTerms = await termRepository.findByContextId(context.id);

      if (contextTerms.length > 0) {
        lines.push('### Terms');
        lines.push('');

        for (const termInContext of contextTerms) {
          lines.push(`#### ${termInContext.name}`);
          lines.push('');

          // Status badge
          lines.push(`**Status:** \`${termInContext.status}\``);
          lines.push('');

          // Definition in this context
          if (termInContext.definition) {
            lines.push('**Definition:**');
            lines.push('');
            lines.push(termInContext.definition);
            lines.push('');
          }

          // Examples
          if (termInContext.examples) {
            lines.push('**Examples:**');
            lines.push('');
            lines.push(termInContext.examples);
            lines.push('');
          }

          // Get relationships
          const relationships = await termRelationshipRepository.findOutgoingByTermId(
            termInContext.id
          );

          if (relationships.length > 0) {
            lines.push('**Relationships:**');
            lines.push('');

            for (const rel of relationships) {
              // Get target term name
              const targetTerm = terms.find((t) => t.id === rel.targetTermId);
              if (targetTerm) {
                lines.push(`- **${rel.relationshipType}:** ${targetTerm.name}`);
                if (rel.description) {
                  lines.push(`  - ${rel.description}`);
                }
              }
            }
            lines.push('');
          }

          // Get reviews
          const termReviews = await reviewRepository.findByTermId(termInContext.id);
          if (termReviews.length > 0) {
            const latestReview = termReviews[0]; // Already sorted by date desc
            lines.push('**Latest Review:**');
            lines.push('');
            lines.push(
              `- Status: \`${latestReview.status}\` (${new Date(latestReview.reviewedAt).toLocaleDateString()})`
            );
            if (latestReview.notes) {
              lines.push(`- Notes: ${latestReview.notes}`);
            }
            lines.push('');
          }

          lines.push('---');
          lines.push('');
        }
      } else {
        lines.push('*No terms defined in this context yet.*');
        lines.push('');
      }

      lines.push('');
    }

    // Unassigned terms (terms not in any context)
    const unassignedTerms: any[] = [];
    for (const term of terms) {
      const termWithContexts = await termRepository.getWithContexts(term.id);
      if (termWithContexts && termWithContexts.contexts.length === 0) {
        unassignedTerms.push(term);
      }
    }

    if (unassignedTerms.length > 0) {
      lines.push('## Unassigned Terms');
      lines.push('');
      lines.push('*Terms that are not yet assigned to any bounded context.*');
      lines.push('');

      for (const term of unassignedTerms) {
        lines.push(`### ${term.name}`);
        lines.push('');
        lines.push(`**Status:** \`${term.status}\``);
        lines.push('');

        if (term.description) {
          lines.push(term.description);
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get all data for export
   */
  private async getAllData(): Promise<ExportData> {
    const [
      contexts,
      terms,
      allProposals,
      allThreads,
    ] = await Promise.all([
      contextRepository.findAll(),
      termRepository.findAll(),
      termProposalRepository.findAll(),
      discussionRepository.findAllThreads(),
    ]);

    // Get all term contexts
    const termContexts: any[] = [];
    for (const term of terms) {
      const withContexts = await termRepository.getWithContexts(term.id);
      if (withContexts) {
        for (const context of withContexts.contexts) {
          termContexts.push({
            termId: term.id,
            termName: term.name,
            ...context,
          });
        }
      }
    }

    // Get all relationships
    const relationships: any[] = [];
    for (const term of terms) {
      const rels = await termRelationshipRepository.findByTermId(term.id);
      relationships.push(...rels);
    }

    // Get all discussions with comments
    const discussions: any[] = [];
    for (const thread of allThreads) {
      const withComments = await discussionRepository.getThreadWithComments(thread.id);
      if (withComments) {
        discussions.push(withComments);
      }
    }

    // Get all reviews
    const reviews: any[] = [];
    for (const term of terms) {
      const termReviews = await reviewRepository.findByTermId(term.id);
      reviews.push(...termReviews);
    }

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      contexts,
      terms,
      termContexts,
      relationships,
      proposals: allProposals,
      discussions,
      reviews,
    };
  }

  /**
   * Convert string to URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const exportService = new ExportService();
