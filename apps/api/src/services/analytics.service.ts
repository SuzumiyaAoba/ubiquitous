import { termRepository } from '../repositories/term.repository';
import { contextRepository } from '../repositories/context.repository';
import { userLearningRepository } from '../repositories/user-learning.repository';
import { reviewRepository } from '../repositories/review.repository';
import { termProposalRepository } from '../repositories/term-proposal.repository';
import { discussionRepository } from '../repositories/discussion.repository';

export interface SystemMetrics {
  totalTerms: number;
  activeTerms: number;
  draftTerms: number;
  deprecatedTerms: number;
  totalContexts: number;
  totalProposals: number;
  pendingProposals: number;
  approvedProposals: number;
  totalDiscussionThreads: number;
  openThreads: number;
  totalReviews: number;
  essentialTerms: number;
  timestamp: string;
}

export interface UserActivityMetrics {
  uniqueReviewers: number;
  uniqueLearners: number;
  uniqueProposers: number;
  uniqueCommenters: number;
  totalActiveUsers: number;
}

export interface CoverageMetrics {
  totalTerms: number;
  termsWithContexts: number;
  termsWithRelationships: number;
  termsWithReviews: number;
  essentialTermsCoverage: number;
  averageContextsPerTerm: number;
}

export type ExportFormat = 'json' | 'csv';

export class AnalyticsService {
  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const allTerms = await termRepository.findAll();
    const allContexts = await contextRepository.findAll();
    const allProposals = await termProposalRepository.findAll();
    const pendingProposals = await termProposalRepository.findByStatus('pending');
    const approvedProposals = await termProposalRepository.findByStatus('approved');
    const allThreads = await discussionRepository.findAllThreads();
    const openThreads = await discussionRepository.findThreadsByStatus('open');
    const essentialTerms = await termRepository.findEssentialTerms();

    // Count terms by status
    const activeTerms = allTerms.filter((t) => t.status === 'active').length;
    const draftTerms = allTerms.filter((t) => t.status === 'draft').length;
    const deprecatedTerms = allTerms.filter((t) => t.status === 'deprecated').length;

    // Count total reviews across all terms
    let totalReviews = 0;
    for (const term of allTerms) {
      totalReviews += await reviewRepository.countReviewsForTerm(term.id);
    }

    return {
      totalTerms: allTerms.length,
      activeTerms,
      draftTerms,
      deprecatedTerms,
      totalContexts: allContexts.length,
      totalProposals: allProposals.length,
      pendingProposals: pendingProposals.length,
      approvedProposals: approvedProposals.length,
      totalDiscussionThreads: allThreads.length,
      openThreads: openThreads.length,
      totalReviews,
      essentialTerms: essentialTerms.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user activity metrics
   */
  async getUserActivityMetrics(): Promise<UserActivityMetrics> {
    const allProposals = await termProposalRepository.findAll();
    const allReviews = await reviewRepository.findByStatus('confirmed')
      .then((confirmed) => reviewRepository.findByStatus('needs_update')
        .then((needsUpdate) => reviewRepository.findByStatus('needs_discussion')
          .then((needsDiscussion) => [...confirmed, ...needsUpdate, ...needsDiscussion])));

    // Get unique users from different activities
    const uniqueProposers = new Set(allProposals.map((p) => p.proposedBy));
    const uniqueReviewers = new Set(allReviews.map((r) => r.reviewedBy));

    // For learners, we need to get all user learning records
    // Since there's no findAll method, we'll use a workaround
    // This is a placeholder - in production, you'd want a proper method
    const uniqueLearners = new Set<string>();

    // Get unique commenters from all threads
    const uniqueCommenters = new Set<string>();
    const allThreads = await discussionRepository.findAllThreads();
    for (const thread of allThreads) {
      const comments = await discussionRepository.findCommentsByThreadId(thread.id);
      comments.forEach((comment) => uniqueCommenters.add(comment.postedBy));
    }

    // Combine all active users
    const allActiveUsers = new Set([
      ...uniqueProposers,
      ...uniqueReviewers,
      ...uniqueLearners,
      ...uniqueCommenters,
    ]);

    return {
      uniqueReviewers: uniqueReviewers.size,
      uniqueLearners: uniqueLearners.size,
      uniqueProposers: uniqueProposers.size,
      uniqueCommenters: uniqueCommenters.size,
      totalActiveUsers: allActiveUsers.size,
    };
  }

  /**
   * Get coverage metrics
   */
  async getCoverageMetrics(): Promise<CoverageMetrics> {
    const allTerms = await termRepository.findAll();
    const essentialTerms = await termRepository.findEssentialTerms();

    let termsWithContexts = 0;
    let termsWithRelationships = 0;
    let termsWithReviews = 0;
    let totalContextCount = 0;

    for (const term of allTerms) {
      const withContexts = await termRepository.getWithContexts(term.id);
      if (withContexts && withContexts.contexts.length > 0) {
        termsWithContexts++;
        totalContextCount += withContexts.contexts.length;
      }

      // Check for relationships (placeholder)
      // In a real implementation, you'd check the relationship repository

      const reviewCount = await reviewRepository.countReviewsForTerm(term.id);
      if (reviewCount > 0) {
        termsWithReviews++;
      }
    }

    const averageContextsPerTerm = allTerms.length > 0 ? totalContextCount / allTerms.length : 0;

    return {
      totalTerms: allTerms.length,
      termsWithContexts,
      termsWithRelationships: 0, // Placeholder
      termsWithReviews,
      essentialTermsCoverage: essentialTerms.length,
      averageContextsPerTerm: Math.round(averageContextsPerTerm * 100) / 100,
    };
  }

  /**
   * Get all metrics combined
   */
  async getAllMetrics() {
    const [systemMetrics, userActivityMetrics, coverageMetrics] = await Promise.all([
      this.getSystemMetrics(),
      this.getUserActivityMetrics(),
      this.getCoverageMetrics(),
    ]);

    return {
      system: systemMetrics,
      userActivity: userActivityMetrics,
      coverage: coverageMetrics,
    };
  }

  /**
   * Export metrics in specified format
   */
  async exportMetrics(format: ExportFormat): Promise<string> {
    const metrics = await this.getAllMetrics();

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    if (format === 'csv') {
      return this.convertMetricsToCSV(metrics);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Convert metrics to CSV format
   */
  private convertMetricsToCSV(metrics: any): string {
    const lines: string[] = [];

    // Header
    lines.push('Category,Metric,Value');

    // System metrics
    lines.push('System,Total Terms,' + metrics.system.totalTerms);
    lines.push('System,Active Terms,' + metrics.system.activeTerms);
    lines.push('System,Draft Terms,' + metrics.system.draftTerms);
    lines.push('System,Deprecated Terms,' + metrics.system.deprecatedTerms);
    lines.push('System,Total Contexts,' + metrics.system.totalContexts);
    lines.push('System,Total Proposals,' + metrics.system.totalProposals);
    lines.push('System,Pending Proposals,' + metrics.system.pendingProposals);
    lines.push('System,Approved Proposals,' + metrics.system.approvedProposals);
    lines.push('System,Total Discussion Threads,' + metrics.system.totalDiscussionThreads);
    lines.push('System,Open Threads,' + metrics.system.openThreads);
    lines.push('System,Total Reviews,' + metrics.system.totalReviews);
    lines.push('System,Essential Terms,' + metrics.system.essentialTerms);

    // User activity metrics
    lines.push('User Activity,Unique Reviewers,' + metrics.userActivity.uniqueReviewers);
    lines.push('User Activity,Unique Learners,' + metrics.userActivity.uniqueLearners);
    lines.push('User Activity,Unique Proposers,' + metrics.userActivity.uniqueProposers);
    lines.push('User Activity,Unique Commenters,' + metrics.userActivity.uniqueCommenters);
    lines.push('User Activity,Total Active Users,' + metrics.userActivity.totalActiveUsers);

    // Coverage metrics
    lines.push('Coverage,Total Terms,' + metrics.coverage.totalTerms);
    lines.push('Coverage,Terms with Contexts,' + metrics.coverage.termsWithContexts);
    lines.push('Coverage,Terms with Relationships,' + metrics.coverage.termsWithRelationships);
    lines.push('Coverage,Terms with Reviews,' + metrics.coverage.termsWithReviews);
    lines.push('Coverage,Essential Terms Coverage,' + metrics.coverage.essentialTermsCoverage);
    lines.push('Coverage,Average Contexts per Term,' + metrics.coverage.averageContextsPerTerm);

    return lines.join('\n');
  }

  /**
   * Get most active proposers (placeholder for future tracking)
   */
  async getMostActiveProposers(limit: number = 10) {
    const allProposals = await termProposalRepository.findAll();

    // Count proposals per proposer
    const proposerCounts = new Map<string, number>();
    allProposals.forEach((proposal) => {
      const count = proposerCounts.get(proposal.proposedBy) || 0;
      proposerCounts.set(proposal.proposedBy, count + 1);
    });

    // Sort by count and take top N
    const sorted = Array.from(proposerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([userId, count]) => ({
      userId,
      proposalCount: count,
    }));
  }

  /**
   * Get most active reviewers (placeholder for future tracking)
   */
  async getMostActiveReviewers(limit: number = 10) {
    const allReviews = await reviewRepository.findByStatus('confirmed')
      .then((confirmed) => reviewRepository.findByStatus('needs_update')
        .then((needsUpdate) => reviewRepository.findByStatus('needs_discussion')
          .then((needsDiscussion) => [...confirmed, ...needsUpdate, ...needsDiscussion])));

    // Count reviews per reviewer
    const reviewerCounts = new Map<string, number>();
    allReviews.forEach((review) => {
      const count = reviewerCounts.get(review.reviewedBy) || 0;
      reviewerCounts.set(review.reviewedBy, count + 1);
    });

    // Sort by count and take top N
    const sorted = Array.from(reviewerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([userId, count]) => ({
      userId,
      reviewCount: count,
    }));
  }
}

export const analyticsService = new AnalyticsService();
