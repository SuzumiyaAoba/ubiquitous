import { ExportData, ImportResult, ValidationResult } from '../dtos';

export interface IExportService {
  exportToJson(): Promise<ExportData>;
  exportToMarkdown(): Promise<string>;
  importFromJson(data: ExportData): Promise<ImportResult>;
  validateImportData(data: any): Promise<ValidationResult>;
}
