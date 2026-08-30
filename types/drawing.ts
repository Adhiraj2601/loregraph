export type DrawingTool = 'pen' | 'highlighter' | 'eraser';

export interface DrawingStroke {
  id: string;
  ideaId: string;
  points: number[][]; // [x, y, pressure?]
  color: string;
  size: number;
  tool: 'pen' | 'highlighter';
  opacity?: number;
  createdAt?: string;
}

export interface CreateStrokeInput {
  ideaId: string;
  points: number[][];
  color: string;
  size: number;
  tool: 'pen' | 'highlighter';
  opacity?: number;
}
