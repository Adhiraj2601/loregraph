export interface LoreEdge {
  id: string;
  ideaId: string;
  source: string;
  target: string;
  relationship?: string;
}

export interface CreateEdgeInput {
  ideaId: string;
  source: string;
  target: string;
  relationship?: string;
}
