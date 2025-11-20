import { distance } from "fastest-levenshtein";
import {
  codeAnalysisRepository,
  CreateCodeAnalysisDto,
} from "../repositories/code-analysis.repository";
import { termRepository } from "../repositories/term.repository";

export interface CodeElement {
  type: "class" | "method" | "variable";
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
   * コードを分析してレポートを生成
   */
  async analyzeCode(fileName: string, code: string, uploadedBy: string): Promise<string> {
    // コード要素を抽出
    const elements = this.extractCodeElements(code);

    // マッチング用のすべてのタームを取得
    const terms = await termRepository.findAll();
    const termNames = terms.map((t) => t.name.toLowerCase());

    // 要素をタームでマッチング
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
        const matchedTerm = terms.find((t) => this.isMatch(element.name, t.name));
        matchedElements.push({
          ...element,
          matched: true,
          matchedTerm: matchedTerm?.name,
        });
      } else {
        // 提案を生成
        const suggestions = this.generateSuggestions(element.name, termNames);
        matchedElements.push({
          ...element,
          matched: false,
          suggestions,
        });
      }
    }

    // マッチレートを計算
    const matchRate =
      elements.length > 0
        ? (matchedElements.filter((e) => e.matched).length / elements.length) * 100
        : 0;

    // 分析を保存
    const analysis = await codeAnalysisRepository.create({
      fileName,
      uploadedBy,
      extractedElements: matchedElements,
      matchRate: Math.round(matchRate * 100) / 100,
    });

    return analysis.id;
  }

  /**
   * 分析レポートを取得
   */
  async getReport(analysisId: string): Promise<AnalysisReport | null> {
    const analysis = await codeAnalysisRepository.findById(analysisId);
    if (!analysis) {
      return null;
    }

    const elements = analysis.extractedElements as CodeElement[];
    const matchedElements = elements.filter((e) => e.matched);
    const unmatchedElements = elements.filter((e) => !e.matched);

    // リネーム提案を生成
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
   * ソースコードからコード要素を抽出
   */
  private extractCodeElements(code: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = code.split("\n");

    // クラスを抽出
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g;
    lines.forEach((line, index) => {
      let match;
      while ((match = classRegex.exec(line)) !== null) {
        elements.push({
          type: "class",
          name: match[1],
          line: index + 1,
          matched: false,
        });
      }
    });

    // メソッド/関数を抽出
    const methodRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?{/g;
    lines.forEach((line, index) => {
      let match;
      while ((match = methodRegex.exec(line)) !== null) {
        const name = match[1];
        // 一般的なキーワードをスキップ
        if (!["if", "for", "while", "switch", "catch"].includes(name)) {
          elements.push({
            type: "method",
            name,
            line: index + 1,
            matched: false,
          });
        }
      }
    });

    // 変数を抽出（const、let、var）
    const varRegex = /(?:const|let|var)\s+(\w+)\s*[=:]/g;
    lines.forEach((line, index) => {
      let match;
      while ((match = varRegex.exec(line)) !== null) {
        elements.push({
          type: "variable",
          name: match[1],
          line: index + 1,
          matched: false,
        });
      }
    });

    return elements;
  }

  /**
   * マッチング用に識別子を正規化
   */
  private normalizeIdentifier(identifier: string): string {
    // camelCaseをスペース区切りの単語に変換
    return identifier
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .trim();
  }

  /**
   * 2つの名前が一致するかをチェック（大文字小文字を区別せず、camelCase対応）
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
   * 識別子がcamelCaseコンポーネントとしてターム含むかをチェック
   */
  private isCamelCaseMatch(identifier: string, termName: string): boolean {
    const words = identifier.split(/(?=[A-Z])/);
    const termLower = termName.toLowerCase();
    return words.some((word) => word.toLowerCase() === termLower);
  }

  /**
   * リネーム提案を生成
   */
  private generateSuggestions(identifier: string, termNames: string[]): string[] {
    const normalized = this.normalizeIdentifier(identifier);
    const suggestions: Array<{ term: string; score: number }> = [];

    for (const termName of termNames) {
      const normalizedTerm = termName.toLowerCase();
      const score = this.calculateSimilarity(normalized, normalizedTerm);

      if (score > 0.5) {
        // 最低50％の類似性
        suggestions.push({ term: termName, score });
      }
    }

    // スコアで降順にソートして上位3つを返す
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.term);
  }

  /**
   * 2つの文字列間の類似度を計算（シンプルなレーベンシュタイン距離ベース）
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
   * レーベンシュタイン距離を計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    return distance(str1, str2);
  }
}

export const codeAnalysisService = new CodeAnalysisService();
