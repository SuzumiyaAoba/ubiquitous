import { Metrics, TermViewStats, TermSearchStats } from '../dtos';

export interface IAnalyticsService {
  trackUserActivity(userId: string, action: string): Promise<void>;
  getActiveUsers(startDate: Date, endDate: Date): Promise<number>;
  calculateCoverageRate(): Promise<number>;
  getMostViewedTerms(limit: number): Promise<TermViewStats[]>;
  getMostSearchedTerms(limit: number): Promise<TermSearchStats[]>;
  getMetrics(): Promise<Metrics>;
  exportMetrics(format: 'csv' | 'json'): Promise<Buffer>;
}
