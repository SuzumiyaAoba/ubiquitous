export interface CreateRelationshipDto {
  sourceTermId: string;
  targetTermId: string;
  relationshipType: 'aggregation' | 'association' | 'dependency' | 'inheritance';
  description?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface DiagramNode {
  id: string;
  label: string;
  type: string;
}

export interface DiagramEdge {
  source: string;
  target: string;
  label: string;
  type: string;
}
