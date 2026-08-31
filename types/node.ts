import { DrawingStroke } from './drawing';

export type NodeType =
  | 'CREATURE'
  | 'CHARACTER'
  | 'LOCATION'
  | 'ABILITY'
  | 'MAGIC'
  | 'EVENT'
  | 'FACTION'
  | 'OBJECT'
  | 'LORE'
  | 'CONCEPT'
  | 'QUESTION'
  | 'SKETCH'
  | 'ROOT';

export interface LoreNode {
  id: string;
  ideaId: string;
  title: string;
  description: string;
  type: NodeType;
  tags: string[];
  position: { x: number; y: number };
  strokes?: DrawingStroke[];
  year?: number;
  endYear?: number;
  dateLabel?: string;
  eraId?: string;
  createdAt: string;
  updatedAt: string;
  isRoot?: boolean;
}

export interface CreateNodeInput {
  ideaId: string;
  title: string;
  description: string;
  type: NodeType;
  tags: string[];
  position?: { x: number; y: number };
  strokes?: DrawingStroke[];
  year?: number;
  endYear?: number;
  dateLabel?: string;
  eraId?: string;
  isRoot?: boolean;
}
