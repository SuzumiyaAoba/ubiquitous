export interface TermViewStats {
  termId: string;
  termName: string;
  viewCount: number;
}

export interface TermSearchStats {
  termId: string;
  termName: string;
  searchCount: number;
}

export interface Metrics {
  activeUsersThisWeek: number;
  totalTerms: number;
  coverageRate: number;
  mostViewedTerms: TermViewStats[];
  mostSearchedTerms: TermSearchStats[];
}
