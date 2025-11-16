export interface CodeElement {
  name: string;
  type: 'class' | 'method' | 'variable';
  matchedTermId?: string;
  suggestion?: string;
}

export interface CodeAnalysis {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  extractedElements: CodeElement[];
  matchRate: number;
}

export interface AnalysisReport {
  analysisId: string;
  fileName: string;
  matchRate: number;
  matchedElements: CodeElement[];
  unmatchedElements: CodeElement[];
  suggestions: string[];
}
