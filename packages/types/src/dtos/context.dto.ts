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
  description: string | null;
  terms: any[];  // TODO: Use proper Term type once schema is aligned
  createdAt: Date;
  updatedAt: Date;
}
