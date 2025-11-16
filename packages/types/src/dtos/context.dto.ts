import { Term } from '../entities';

export interface CreateContextDto {
  name: string;
  description: string;
}

export interface UpdateContextDto {
  name?: string;
  description?: string;
}

export interface ContextWithTerms {
  id: string;
  name: string;
  description: string;
  terms: Term[];
  createdAt: Date;
  updatedAt: Date;
}
