import { CodeAnalysis, CodeElement, AnalysisReport } from '../entities';

export interface ICodeAnalysisService {
  analyzeCode(code: string, fileName: string, userId: string): Promise<CodeAnalysis>;
  extractElements(code: string): Promise<CodeElement[]>;
  matchWithTerms(elements: CodeElement[]): Promise<CodeElement[]>;
  generateReport(analysisId: string): Promise<AnalysisReport>;
}
