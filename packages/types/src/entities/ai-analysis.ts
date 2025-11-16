export interface SimilarTerm {
  termId: string;
  termName: string;
  similarity: number;
  reason: string;
}

export interface AIAnalysis {
  id: string;
  termId?: string;
  proposalId?: string;
  analysisType: 'clarity' | 'consistency' | 'suggestion' | 'qa';
  input: string;
  output: string;
  clarityScore?: number;
  suggestions: string[];
  similarTerms: SimilarTerm[];
  analyzedAt: Date;
}

export interface ClarityIssue {
  type: 'ambiguity' | 'vagueness' | 'complexity' | 'missing_context';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ClarityAnalysis {
  score: number;
  issues: ClarityIssue[];
  suggestions: string[];
}

export interface Conflict {
  conflictingTermId: string;
  conflictingTermName: string;
  reason: string;
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  conflicts: Conflict[];
  recommendations: string[];
}
