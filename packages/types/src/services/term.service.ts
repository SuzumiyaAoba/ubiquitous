import { Term, TermHistory } from '../entities';
import { CreateTermDto, UpdateTermDto } from '../dtos';

export interface ITermService {
  createTerm(data: CreateTermDto, userId: string): Promise<Term>;
  updateTerm(id: string, data: UpdateTermDto, userId: string): Promise<Term>;
  deleteTerm(id: string, userId: string): Promise<void>;
  getTerm(id: string): Promise<Term>;
  searchTerms(query: string): Promise<Term[]>;
  getTermHistory(termId: string): Promise<TermHistory[]>;
  getTermsByContext(contextId: string): Promise<Term[]>;
  markAsLearned(termId: string, userId: string): Promise<void>;
  incrementViewCount(termId: string): Promise<void>;
}
