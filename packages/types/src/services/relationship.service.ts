import { TermRelationship } from '../entities';
import { CreateRelationshipDto, DiagramData } from '../dtos';

export interface IRelationshipService {
  createRelationship(data: CreateRelationshipDto, userId: string): Promise<TermRelationship>;
  deleteRelationship(id: string): Promise<void>;
  getRelationships(termId: string): Promise<TermRelationship[]>;
  validateNoCircularDependency(sourceId: string, targetId: string): Promise<boolean>;
  generateDiagram(contextId?: string): Promise<DiagramData>;
}
