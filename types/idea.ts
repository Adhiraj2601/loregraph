export interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  coverColor?: string;
}

export interface CreateIdeaInput {
  title: string;
  description: string;
  tags: string[];
  coverColor?: string;
}
