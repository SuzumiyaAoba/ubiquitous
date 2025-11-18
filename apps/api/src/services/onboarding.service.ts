import { userLearningRepository, MarkLearnedDto } from '../repositories/user-learning.repository';
import { termRepository } from '../repositories/term.repository';
import { termRelationshipRepository } from '../repositories/term-relationship.repository';

export interface LearningProgress {
  userId: string;
  totalEssentialTerms: number;
  learnedEssentialTerms: number;
  percentComplete: number;
  remainingTerms: string[];
  learnedTermIds: string[];
}

export interface LearningPath {
  termId: string;
  termName: string;
  order: number;
  dependencies: string[];
  isLearned: boolean;
}

export class OnboardingService {
  /**
   * Get all essential terms
   */
  async getEssentialTerms() {
    return await termRepository.findEssentialTerms();
  }

  /**
   * Mark a term as essential
   */
  async markTermAsEssential(termId: string) {
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    return await termRepository.update(termId, { isEssential: true });
  }

  /**
   * Unmark a term as essential
   */
  async unmarkTermAsEssential(termId: string) {
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    return await termRepository.update(termId, { isEssential: false });
  }

  /**
   * Mark a term as learned for a user
   */
  async markTermAsLearned(data: MarkLearnedDto) {
    // Validate term exists
    const term = await termRepository.findById(data.termId);
    if (!term) {
      throw new Error(`Term with ID "${data.termId}" not found`);
    }

    return await userLearningRepository.markAsLearned(data);
  }

  /**
   * Unmark a term as learned for a user
   */
  async unmarkTermAsLearned(userId: string, termId: string) {
    return await userLearningRepository.unmarkAsLearned(userId, termId);
  }

  /**
   * Get learning progress for a user
   */
  async getLearningProgress(userId: string): Promise<LearningProgress> {
    // Get essential terms
    const essentialTermIds = await termRepository.getEssentialTermIds();
    const essentialTerms = await termRepository.findEssentialTerms();

    // Get learned terms
    const learnedTermIds = await userLearningRepository.getLearnedTermIds(userId);

    // Calculate learned essential terms
    const learnedEssentialIds = learnedTermIds.filter((id) =>
      essentialTermIds.includes(id)
    );

    // Calculate remaining terms
    const remainingTermIds = essentialTermIds.filter(
      (id) => !learnedEssentialIds.includes(id)
    );

    return {
      userId,
      totalEssentialTerms: essentialTermIds.length,
      learnedEssentialTerms: learnedEssentialIds.length,
      percentComplete:
        essentialTermIds.length > 0
          ? Math.round((learnedEssentialIds.length / essentialTermIds.length) * 100)
          : 0,
      remainingTerms: remainingTermIds,
      learnedTermIds: learnedEssentialIds,
    };
  }

  /**
   * Get recommended learning order based on dependencies
   */
  async getRecommendedLearningPath(userId: string): Promise<LearningPath[]> {
    // Get essential terms
    const essentialTerms = await termRepository.findEssentialTerms();
    const essentialTermIds = essentialTerms.map((t) => t.id);

    // Get learned terms
    const learnedTermIds = await userLearningRepository.getLearnedTermIds(userId);

    // Build dependency graph from relationships
    const dependencyMap = new Map<string, string[]>();

    for (const term of essentialTerms) {
      const relationships = await termRelationshipRepository.findOutgoingByTermId(term.id);

      // Parent relationships indicate dependencies (must learn parent first)
      const dependencies = relationships
        .filter((rel: any) => rel.relationshipType === 'parent')
        .map((rel: any) => rel.targetTermId)
        .filter((id: string) => essentialTermIds.includes(id)); // Only essential terms

      dependencyMap.set(term.id, dependencies);
    }

    // Topological sort to determine learning order
    const learningPath: LearningPath[] = [];
    const visited = new Set<string>();
    const tempMark = new Set<string>();

    const visit = (termId: string, depth: number = 0) => {
      if (tempMark.has(termId)) {
        // Circular dependency detected, continue anyway
        return;
      }

      if (visited.has(termId)) {
        return;
      }

      tempMark.add(termId);

      const dependencies = dependencyMap.get(termId) || [];

      // Visit dependencies first
      for (const depId of dependencies) {
        visit(depId, depth + 1);
      }

      tempMark.delete(termId);
      visited.add(termId);

      const term = essentialTerms.find((t) => t.id === termId);
      if (term) {
        learningPath.push({
          termId: term.id,
          termName: term.name,
          order: learningPath.length + 1,
          dependencies,
          isLearned: learnedTermIds.includes(term.id),
        });
      }
    };

    // Visit all essential terms
    for (const term of essentialTerms) {
      visit(term.id);
    }

    return learningPath;
  }

  /**
   * Get next recommended terms to learn
   */
  async getNextRecommendedTerms(userId: string, limit: number = 5) {
    const learningPath = await this.getRecommendedLearningPath(userId);

    // Filter to unlearned terms where all dependencies are learned
    const recommendations = learningPath
      .filter((item) => !item.isLearned)
      .filter((item) => {
        // Check if all dependencies are learned
        return item.dependencies.every((depId) => {
          const dep = learningPath.find((p) => p.termId === depId);
          return dep?.isLearned || false;
        });
      })
      .slice(0, limit);

    // Enrich with full term details
    const enriched = await Promise.all(
      recommendations.map(async (rec) => {
        const term = await termRepository.findById(rec.termId);
        return {
          ...rec,
          term,
        };
      })
    );

    return enriched;
  }

  /**
   * Check if a user can learn a term (all dependencies met)
   */
  async canLearnTerm(userId: string, termId: string): Promise<boolean> {
    const term = await termRepository.findById(termId);
    if (!term) {
      throw new Error(`Term with ID "${termId}" not found`);
    }

    // Get term dependencies (parent relationships)
    const relationships = await termRelationshipRepository.findOutgoingByTermId(termId);
    const parentIds = relationships
      .filter((rel: any) => rel.relationshipType === 'parent')
      .map((rel: any) => rel.targetTermId);

    if (parentIds.length === 0) {
      // No dependencies, can learn
      return true;
    }

    // Check if all parents are learned
    const learnedTermIds = await userLearningRepository.getLearnedTermIds(userId);
    return parentIds.every((parentId: string) => learnedTermIds.includes(parentId));
  }
}

export const onboardingService = new OnboardingService();
