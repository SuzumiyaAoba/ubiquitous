import { ClarityAnalysis, ConsistencyCheck, SimilarTerm } from '../entities';

export interface IAIService {
  analyzeDefinitionClarity(definition: string): Promise<ClarityAnalysis>;
  checkConsistency(termName: string, definition: string, contextId: string): Promise<ConsistencyCheck>;
  suggestImprovements(definition: string): Promise<string[]>;
  findSimilarTerms(termName: string, definition: string): Promise<SimilarTerm[]>;
  answerQuestion(question: string, contextId?: string): Promise<string>;
  buildKnowledgeContext(): Promise<string>;
}
