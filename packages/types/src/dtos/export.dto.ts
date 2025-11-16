import { Term, BoundedContext, TermRelationship } from '../entities';

export interface ExportData {
  version: string;
  exportedAt: Date;
  contexts: BoundedContext[];
  terms: Term[];
  relationships: TermRelationship[];
}

export interface ImportResult {
  success: boolean;
  importedContexts: number;
  importedTerms: number;
  importedRelationships: number;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
