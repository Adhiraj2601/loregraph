export interface Era {
  id: string;
  ideaId: string;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEraInput {
  ideaId: string;
  name: string;
  startYear: number;
  endYear: number;
  color?: string;
  description?: string;
}
