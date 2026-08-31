export interface LoreEdge {
  id: string;
  ideaId: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  relationship?: string;
}

export interface CreateEdgeInput {
  ideaId: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  relationship?: string;
}
