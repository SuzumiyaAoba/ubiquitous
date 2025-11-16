export interface CreateTermDto {
  name: string;
  definition: string;
  boundedContextId: string;
  examples?: string[];
  usageNotes?: string;
  essentialForOnboarding?: boolean;
  reviewCycleDays?: number;
}

export interface UpdateTermDto {
  name?: string;
  definition?: string;
  examples?: string[];
  usageNotes?: string;
  essentialForOnboarding?: boolean;
  reviewCycleDays?: number;
  changeReason?: string;
}
