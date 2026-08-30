import { Idea, CreateIdeaInput } from '@/types/idea';
import { LoreNode, CreateNodeInput } from '@/types/node';
import { LoreEdge, CreateEdgeInput } from '@/types/edge';
import { InboxItem, CreateInboxItemInput } from '@/types/inbox';
import { generateId } from '@/lib/utils';

// ─── Repository Interfaces ───────────────────────────────────────────────────

export interface IIdeaRepository {
  getAll(): Idea[];
  getById(id: string): Idea | undefined;
  create(input: CreateIdeaInput): Idea;
  update(id: string, updates: Partial<Idea>): Idea | undefined;
  delete(id: string): void;
}

export interface INodeRepository {
  getAllByIdeaId(ideaId: string): LoreNode[];
  getById(id: string): LoreNode | undefined;
  create(input: CreateNodeInput): LoreNode;
  update(id: string, updates: Partial<LoreNode>): LoreNode | undefined;
  delete(id: string): void;
  deleteByIdeaId(ideaId: string): void;
}

export interface IEdgeRepository {
  getAllByIdeaId(ideaId: string): LoreEdge[];
  getById(id: string): LoreEdge | undefined;
  create(input: CreateEdgeInput): LoreEdge;
  update(id: string, updates: Partial<LoreEdge>): LoreEdge | undefined;
  delete(id: string): void;
  deleteByIdeaId(ideaId: string): void;
}

export interface IInboxRepository {
  getAll(): InboxItem[];
  getById(id: string): InboxItem | undefined;
  create(input: CreateInboxItemInput): InboxItem;
  update(id: string, updates: Partial<InboxItem>): InboxItem | undefined;
  delete(id: string): void;
}

// ─── LocalStorage Keys ────────────────────────────────────────────────────────

const KEYS = {
  IDEAS: 'loregraph:ideas',
  NODES: 'loregraph:nodes',
  EDGES: 'loregraph:edges',
  INBOX: 'loregraph:inbox',
  SEEDED: 'loregraph:seeded',
} as const;

// ─── Safe localStorage helpers ────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LoreGraph: Failed to save to localStorage', e);
  }
}

// ─── Idea Repository ──────────────────────────────────────────────────────────

export class LocalIdeaRepository implements IIdeaRepository {
  getAll(): Idea[] {
    return safeGet<Idea[]>(KEYS.IDEAS, []);
  }

  getById(id: string): Idea | undefined {
    return this.getAll().find((i) => i.id === id);
  }

  create(input: CreateIdeaInput): Idea {
    const now = new Date().toISOString();
    const idea: Idea = {
      id: generateId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAll();
    safeSet(KEYS.IDEAS, [...all, idea]);
    return idea;
  }

  update(id: string, updates: Partial<Idea>): Idea | undefined {
    const all = this.getAll();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    safeSet(KEYS.IDEAS, all);
    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.IDEAS, this.getAll().filter((i) => i.id !== id));
  }
}

// ─── Node Repository ──────────────────────────────────────────────────────────

export class LocalNodeRepository implements INodeRepository {
  private getAll(): LoreNode[] {
    return safeGet<LoreNode[]>(KEYS.NODES, []);
  }

  getAllByIdeaId(ideaId: string): LoreNode[] {
    return this.getAll().filter((n) => n.ideaId === ideaId);
  }

  getById(id: string): LoreNode | undefined {
    return this.getAll().find((n) => n.id === id);
  }

  create(input: CreateNodeInput): LoreNode {
    const now = new Date().toISOString();
    const node: LoreNode = {
      id: generateId(),
      ...input,
      position: input.position ?? { x: 0, y: 0 },
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAll();
    safeSet(KEYS.NODES, [...all, node]);
    return node;
  }

  update(id: string, updates: Partial<LoreNode>): LoreNode | undefined {
    const all = this.getAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    safeSet(KEYS.NODES, all);
    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.NODES, this.getAll().filter((n) => n.id !== id));
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.NODES, this.getAll().filter((n) => n.ideaId !== ideaId));
  }
}

// ─── Edge Repository ──────────────────────────────────────────────────────────

export class LocalEdgeRepository implements IEdgeRepository {
  private getAll(): LoreEdge[] {
    return safeGet<LoreEdge[]>(KEYS.EDGES, []);
  }

  getAllByIdeaId(ideaId: string): LoreEdge[] {
    return this.getAll().filter((e) => e.ideaId === ideaId);
  }

  getById(id: string): LoreEdge | undefined {
    return this.getAll().find((e) => e.id === id);
  }

  create(input: CreateEdgeInput): LoreEdge {
    const edge: LoreEdge = {
      id: generateId(),
      ...input,
    };
    const all = this.getAll();
    safeSet(KEYS.EDGES, [...all, edge]);
    return edge;
  }

  update(id: string, updates: Partial<LoreEdge>): LoreEdge | undefined {
    const all = this.getAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    safeSet(KEYS.EDGES, all);
    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.EDGES, this.getAll().filter((e) => e.id !== id));
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.EDGES, this.getAll().filter((e) => e.ideaId !== ideaId));
  }
}

// ─── Inbox Repository ─────────────────────────────────────────────────────────

export class LocalInboxRepository implements IInboxRepository {
  getAll(): InboxItem[] {
    return safeGet<InboxItem[]>(KEYS.INBOX, []);
  }

  getAll_public(): InboxItem[] {
    return this.getAll();
  }

  getById(id: string): InboxItem | undefined {
    return this.getAll().find((i) => i.id === id);
  }

  create(input: CreateInboxItemInput): InboxItem {
    const item: InboxItem = {
      id: generateId(),
      content: input.content,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const all = this.getAll();
    safeSet(KEYS.INBOX, [item, ...all]);
    return item;
  }

  update(id: string, updates: Partial<InboxItem>): InboxItem | undefined {
    const all = this.getAll();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    safeSet(KEYS.INBOX, all);
    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.INBOX, this.getAll().filter((i) => i.id !== id));
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────

export const ideaRepo = new LocalIdeaRepository();
export const nodeRepo = new LocalNodeRepository();
export const edgeRepo = new LocalEdgeRepository();
export const inboxRepo = new LocalInboxRepository();

// ─── Seed check ───────────────────────────────────────────────────────────────

export function isSeeded(): boolean {
  return safeGet<boolean>(KEYS.SEEDED, false);
}

export function markSeeded(): void {
  safeSet(KEYS.SEEDED, true);
}
