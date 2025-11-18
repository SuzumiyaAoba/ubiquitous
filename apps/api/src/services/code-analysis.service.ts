import { codeAnalysisRepository, CreateCodeAnalysisDto } from '../repositories/code-analysis.repository';
import { termRepository } from '../repositories/term.repository';

export interface CodeElement {
  type: 'class' | 'method' | 'variable';
  name: string;
  line: number;
  matched: boolean;
  matchedTerm?: string;
  suggestions?: string[];
}

export interface AnalysisReport {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  totalElements: number;
  matchedElements: number;
  unmatchedElements: number;
  matchRate: number;
  elements: CodeElement[];
  suggestions: {
    element: string;
    currentName: string;
    suggestedNames: string[];
  }[];
}

export class CodeAnalysisService {
  /**
   * Analyze code and generate report
   */
  async analyzeCode(fileName: string, code: string, uploadedBy: string): Promise<string> {
    // Extract code elements
    const elements = this.extractCodeElements(code);

    // Get all terms for matching
    const terms = await termRepository.findAll();
    const termNames = terms.map((t) => t.name.toLowerCase());

    // Match elements with terms
    const matchedElements: CodeElement[] = [];
    for (const element of elements) {
      const normalizedName = this.normalizeIdentifier(element.name);
      const matched = termNames.some((termName) => {
        const normalizedTerm = termName.toLowerCase();
        return (
          normalizedName.includes(normalizedTerm) ||
          normalizedTerm.includes(normalizedName) ||
          this.isCamelCaseMatch(element.name, termName)
        );
      });

      if (matched) {
        const matchedTerm = terms.find((t) =>
          this.isMatch(element.name, t.name)
        );
        matchedElements.push({
          ...element,
          matched: true,
          matchedTerm: matchedTerm?.name,
        });
      } else {
        // Generate suggestions
        const suggestions = this.generateSuggestions(element.name, termNames);
        matchedElements.push({
          ...element,
          matched: false,
          suggestions,
        });
      }
    }

    // Calculate match rate
    const matchRate = elements.length > 0
      ? (matchedElements.filter((e) => e.matched).length / elements.length) * 100
      : 0;

    // Save analysis
    const analysis = await codeAnalysisRepository.create({
      fileName,
      uploadedBy,
      extractedElements: matchedElements,
      matchRate: Math.round(matchRate * 100) / 100,
    });

    return analysis.id;
  }

  /**
   * Get analysis report
   */
  async getReport(analysisId: string): Promise<AnalysisReport | null> {
    const analysis = await codeAnalysisRepository.findById(analysisId);
    if (!analysis) {
      return null;
    }

    const elements = analysis.extractedElements as CodeElement[];
    const matchedElements = elements.filter((e) => e.matched);
    const unmatchedElements = elements.filter((e) => !e.matched);

    // Generate rename suggestions
    const suggestions = unmatchedElements
      .filter((e) => e.suggestions && e.suggestions.length > 0)
      .map((e) => ({
        element: e.type,
        currentName: e.name,
        suggestedNames: e.suggestions || [],
      }));

    return {
      id: analysis.id,
      fileName: analysis.fileName,
      uploadedBy: analysis.uploadedBy,
      uploadedAt: analysis.uploadedAt,
      totalElements: elements.length,
      matchedElements: matchedElements.length,
      unmatchedElements: unmatchedElements.length,
      matchRate: analysis.matchRate,
      elements,
      suggestions,
    };
  }

  /**
   * Extract code elements from source code
   */
  private extractCodeElements(code: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = code.split('\n');

    // Extract classes
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g;
    lines.forEach((line, index) => {
      let match;
      while ((match = classRegex.exec(line)) !== null) {
        elements.push({
          type: 'class',
          name: match[1],
          line: index + 1,
          matched: false,
        });
      }
    });

    // Extract methods/functions
    const methodRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?{/g;
    lines.forEach((line, index) => {
      let match;
      while ((match = methodRegex.exec(line)) !== null) {
        const name = match[1];
        // Skip common keywords
        if (!['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
          elements.push({
            type: 'method',
            name,
            line: index + 1,
            matched: false,
          });
        }
      }
    });

    // Extract variables (const, let, var)
    const varRegex = /(?:const|let|var)\s+(\w+)\s*[=:]/g;
    lines.forEach((line, index) => {
      let match;
      while ((match = varRegex.exec(line)) !== null) {
        elements.push({
          type: 'variable',
          name: match[1],
          line: index + 1,
          matched: false,
        });
      }
    });

    return elements;
  }

  /**
   * Normalize identifier for matching
   */
  private normalizeIdentifier(identifier: string): string {
    // Convert camelCase to space-separated words
    return identifier
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .trim();
  }

  /**
   * Check if two names match (case-insensitive, camelCase aware)
   */
  private isMatch(identifier: string, termName: string): boolean {
    const normalizedId = this.normalizeIdentifier(identifier);
    const normalizedTerm = termName.toLowerCase();

    return (
      normalizedId === normalizedTerm ||
      normalizedId.includes(normalizedTerm) ||
      normalizedTerm.includes(normalizedId) ||
      this.isCamelCaseMatch(identifier, termName)
    );
  }

  /**
   * Check if identifier contains term as camelCase component
   */
  private isCamelCaseMatch(identifier: string, termName: string): boolean {
    const words = identifier.split(/(?=[A-Z])/);
    const termLower = termName.toLowerCase();
    return words.some((word) => word.toLowerCase() === termLower);
  }

  /**
   * Generate rename suggestions
   */
  private generateSuggestions(identifier: string, termNames: string[]): string[] {
    const normalized = this.normalizeIdentifier(identifier);
    const suggestions: Array<{ term: string; score: number }> = [];

    for (const termName of termNames) {
      const normalizedTerm = termName.toLowerCase();
      const score = this.calculateSimilarity(normalized, normalizedTerm);

      if (score > 0.5) {
        // At least 50% similarity
        suggestions.push({ term: termName, score });
      }
    }

    // Sort by score descending and return top 3
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.term);
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

export const codeAnalysisService = new CodeAnalysisService();
