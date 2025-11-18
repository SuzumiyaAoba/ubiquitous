import { ExportData, ImportResult, ValidationResult } from '../dtos';

/**
 * データエクスポート・インポートサービスのインターフェース
 *
 * ユビキタス言語ドメインのデータを複数の形式でエクスポートおよびインポート
 * する機能を提供し、異なるシステム間でのデータ交換を可能にするサービスです。
 */
export interface IExportService {
  /**
   * すべてのドメインデータをJSON形式でエクスポートします
   *
   * @returns エクスポートされたデータオブジェクト
   */
  exportToJson(): Promise<ExportData>;

  /**
   * すべてのドメインデータをMarkdown形式でエクスポートします
   *
   * @returns Markdown形式の文字列
   */
  exportToMarkdown(): Promise<string>;

  /**
   * JSON形式のデータをシステムにインポートします
   *
   * @param data - インポートするデータ
   * @returns インポート結果（成功、失敗、スキップ統計など）
   * @throws インポート中に致命的なエラーが発生した場合
   */
  importFromJson(data: ExportData): Promise<ImportResult>;

  /**
   * インポートするデータの検証を行います
   *
   * @param data - 検証するデータ
   * @returns 検証結果（有効、エラーメッセージなど）
   */
  validateImportData(data: any): Promise<ValidationResult>;
}
