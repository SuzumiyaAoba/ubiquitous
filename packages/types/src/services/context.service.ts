import { BoundedContext } from '../entities';
import { CreateContextDto, UpdateContextDto, ContextWithTerms } from '../dtos';

export interface IContextService {
  createContext(data: CreateContextDto, userId: string): Promise<BoundedContext>;
  updateContext(id: string, data: UpdateContextDto): Promise<BoundedContext>;
  getContext(id: string): Promise<BoundedContext>;
  getAllContexts(): Promise<BoundedContext[]>;
  getContextWithTerms(id: string): Promise<ContextWithTerms>;
}
