export interface TermHistory {
  id: string;
  termId: string;
  version: number;
  previousDefinition: string;
  newDefinition: string;
  changedFields: string[];
  changedBy: string;
  changedAt: Date;
  changeReason?: string;
}
