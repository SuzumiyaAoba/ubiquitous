export interface TermRelationship {
  id: string;
  sourceTermId: string;
  targetTermId: string;
  relationshipType: 'aggregation' | 'association' | 'dependency' | 'inheritance';
  description?: string;
  createdBy: string;
  createdAt: Date;
}
