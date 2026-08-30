import { Idea, CreateIdeaInput } from '@/types/idea';
import { LoreNode, CreateNodeInput } from '@/types/node';
import { LoreEdge, CreateEdgeInput } from '@/types/edge';
import { InboxItem, CreateInboxItemInput } from '@/types/inbox';
import { DrawingStroke, CreateStrokeInput } from '@/types/drawing';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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
  getAll_public(): InboxItem[];
  getById(id: string): InboxItem | undefined;
  create(input: CreateInboxItemInput): InboxItem;
  update(id: string, updates: Partial<InboxItem>): InboxItem | undefined;
  delete(id: string): void;
}

export interface IDrawingRepository {
  getAll(): DrawingStroke[];
  getAllByIdeaId(ideaId: string): DrawingStroke[];
  saveAll(ideaId: string, strokes: DrawingStroke[]): void;
  create(input: CreateStrokeInput): DrawingStroke;
  delete(id: string): void;
  deleteAllByIdeaId(ideaId: string): void;
}

// ─── LocalStorage Keys ────────────────────────────────────────────────────────

const KEYS = {
  IDEAS: 'loregraph:ideas',
  NODES: 'loregraph:nodes',
  EDGES: 'loregraph:edges',
  INBOX: 'loregraph:inbox',
  DRAWINGS: 'loregraph:drawings',
  SEEDED: 'loregraph:seeded',
} as const;

// ─── Safe localStorage helpers ────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LoreGraph: Failed to save to localStorage', e);
  }
}

// ─── Cloud Sync Helper ────────────────────────────────────────────────────────

export async function syncFromSupabase(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const [ideasRes, nodesRes, edgesRes, inboxRes, drawingsRes] = await Promise.all([
      supabase.from('ideas').select('*'),
      supabase.from('nodes').select('*'),
      supabase.from('edges').select('*'),
      supabase.from('inbox').select('*'),
      supabase.from('drawings').select('*'),
    ]);

    if (ideasRes.data && ideasRes.data.length > 0) {
      const mappedIdeas: Idea[] = ideasRes.data.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description || '',
        tags: Array.isArray(i.tags) ? i.tags : [],
        coverColor: i.cover_color,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      }));
      safeSet(KEYS.IDEAS, mappedIdeas);
      markSeeded();
    }

    if (nodesRes.data) {
      const mappedNodes: LoreNode[] = nodesRes.data.map(n => ({
        id: n.id,
        ideaId: n.idea_id,
        title: n.title,
        description: n.description || '',
        type: n.type,
        tags: Array.isArray(n.tags) ? n.tags : [],
        position: n.position || { x: 300, y: 200 },
        strokes: n.strokes || [],
        isRoot: n.is_root,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));
      safeSet(KEYS.NODES, mappedNodes);
    }

    if (edgesRes.data) {
      const mappedEdges: LoreEdge[] = edgesRes.data.map(e => ({
        id: e.id,
        ideaId: e.idea_id,
        source: e.source,
        target: e.target,
        relationship: e.relationship,
      }));
      safeSet(KEYS.EDGES, mappedEdges);
    }

    if (inboxRes.data) {
      const mappedInbox: InboxItem[] = inboxRes.data.map(i => ({
        id: i.id,
        content: i.content,
        status: i.status || 'pending',
        createdAt: i.created_at,
      }));
      safeSet(KEYS.INBOX, mappedInbox);
    }

    if (drawingsRes.data) {
      const mappedDrawings: DrawingStroke[] = drawingsRes.data.map(d => ({
        id: d.id,
        ideaId: d.idea_id,
        points: d.points || [],
        color: d.color,
        size: d.size,
        tool: d.tool,
        opacity: d.opacity,
        createdAt: d.created_at,
      }));
      safeSet(KEYS.DRAWINGS, mappedDrawings);
    }

    return true;
  } catch (err) {
    console.error('Supabase sync error:', err);
    return false;
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

    if (supabase) {
      supabase.from('ideas').insert({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        tags: idea.tags,
        cover_color: idea.coverColor,
        created_at: idea.createdAt,
        updated_at: idea.updatedAt,
      }).then(({ error }) => { if (error) console.error('Cloud insert error:', error); });
    }

    return idea;
  }

  update(id: string, updates: Partial<Idea>): Idea | undefined {
    const all = this.getAll();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const updated: Idea = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    safeSet(KEYS.IDEAS, all);

    if (supabase) {
      supabase.from('ideas').update({
        title: updated.title,
        description: updated.description,
        tags: updated.tags,
        cover_color: updated.coverColor,
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.IDEAS, this.getAll().filter((i) => i.id !== id));
    if (supabase) {
      supabase.from('ideas').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud delete error:', error);
      });
    }
  }
}

// ─── Node Repository ──────────────────────────────────────────────────────────

export class LocalNodeRepository implements INodeRepository {
  getAll(): LoreNode[] {
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
      position: input.position || { x: 300, y: 200 },
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAll();
    safeSet(KEYS.NODES, [...all, node]);

    if (supabase) {
      supabase.from('nodes').insert({
        id: node.id,
        idea_id: node.ideaId,
        title: node.title,
        description: node.description,
        type: node.type,
        tags: node.tags,
        position: node.position,
        strokes: node.strokes || [],
        is_root: node.isRoot || false,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
      }).then(({ error }) => { if (error) console.error('Cloud node insert error:', error); });
    }

    return node;
  }

  update(id: string, updates: Partial<LoreNode>): LoreNode | undefined {
    const all = this.getAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    const updated: LoreNode = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    safeSet(KEYS.NODES, all);

    if (supabase) {
      supabase.from('nodes').update({
        title: updated.title,
        description: updated.description,
        type: updated.type,
        tags: updated.tags,
        position: updated.position,
        strokes: updated.strokes || [],
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud node update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.NODES, this.getAll().filter((n) => n.id !== id));
    if (supabase) {
      supabase.from('nodes').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud node delete error:', error);
      });
    }
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.NODES, this.getAll().filter((n) => n.ideaId !== ideaId));
    if (supabase) {
      supabase.from('nodes').delete().eq('idea_id', ideaId).then(({ error }) => {
        if (error) console.error('Cloud deleteByIdeaId error:', error);
      });
    }
  }
}

// ─── Edge Repository ──────────────────────────────────────────────────────────

export class LocalEdgeRepository implements IEdgeRepository {
  getAll(): LoreEdge[] {
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

    if (supabase) {
      supabase.from('edges').insert({
        id: edge.id,
        idea_id: edge.ideaId,
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship || '',
      }).then(({ error }) => { if (error) console.error('Cloud edge insert error:', error); });
    }

    return edge;
  }

  update(id: string, updates: Partial<LoreEdge>): LoreEdge | undefined {
    const all = this.getAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const updated: LoreEdge = { ...all[idx], ...updates };
    all[idx] = updated;
    safeSet(KEYS.EDGES, all);

    if (supabase) {
      supabase.from('edges').update({
        relationship: updated.relationship,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud edge update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.EDGES, this.getAll().filter((e) => e.id !== id));
    if (supabase) {
      supabase.from('edges').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud edge delete error:', error);
      });
    }
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.EDGES, this.getAll().filter((e) => e.ideaId !== ideaId));
    if (supabase) {
      supabase.from('edges').delete().eq('idea_id', ideaId).then(({ error }) => {
        if (error) console.error('Cloud edge delete error:', error);
      });
    }
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
    const now = new Date().toISOString();
    const item: InboxItem = {
      id: generateId(),
      ...input,
      status: 'pending',
      createdAt: now,
    };
    const all = this.getAll();
    safeSet(KEYS.INBOX, [...all, item]);

    if (supabase) {
      supabase.from('inbox').insert({
        id: item.id,
        content: item.content,
        status: item.status,
        created_at: item.createdAt,
      }).then(({ error }) => { if (error) console.error('Cloud inbox insert error:', error); });
    }

    return item;
  }

  update(id: string, updates: Partial<InboxItem>): InboxItem | undefined {
    const all = this.getAll();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    safeSet(KEYS.INBOX, all);

    if (supabase) {
      supabase.from('inbox').update({
        content: updated.content,
        status: updated.status,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud inbox update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.INBOX, this.getAll().filter((i) => i.id !== id));
    if (supabase) {
      supabase.from('inbox').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud inbox delete error:', error);
      });
    }
  }
}

// ─── Drawing Repository ───────────────────────────────────────────────────────

export class LocalDrawingRepository implements IDrawingRepository {
  getAll(): DrawingStroke[] {
    return safeGet<DrawingStroke[]>(KEYS.DRAWINGS, []);
  }

  getAllByIdeaId(ideaId: string): DrawingStroke[] {
    return this.getAll().filter((s) => s.ideaId === ideaId);
  }

  saveAll(ideaId: string, strokes: DrawingStroke[]): void {
    const otherStrokes = this.getAll().filter((s) => s.ideaId !== ideaId);
    safeSet(KEYS.DRAWINGS, [...otherStrokes, ...strokes]);

    const client = supabase;
    if (client) {
      // Background upsert
      client.from('drawings').delete().eq('idea_id', ideaId).then(() => {
        if (strokes.length > 0) {
          client.from('drawings').insert(
            strokes.map(s => ({
              id: s.id,
              idea_id: s.ideaId,
              points: s.points,
              color: s.color,
              size: s.size,
              tool: s.tool,
              opacity: s.opacity ?? 1,
              created_at: s.createdAt || new Date().toISOString(),
            }))
          ).then(({ error }) => { if (error) console.error('Cloud drawings save error:', error); });
        }
      });
    }
  }

  create(input: CreateStrokeInput): DrawingStroke {
    const stroke: DrawingStroke = {
      id: generateId(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    const all = this.getAll();
    safeSet(KEYS.DRAWINGS, [...all, stroke]);

    const client = supabase;
    if (client) {
      client.from('drawings').insert({
        id: stroke.id,
        idea_id: stroke.ideaId,
        points: stroke.points,
        color: stroke.color,
        size: stroke.size,
        tool: stroke.tool,
        opacity: stroke.opacity ?? 1,
        created_at: stroke.createdAt,
      }).then(({ error }) => { if (error) console.error('Cloud drawing insert error:', error); });
    }

    return stroke;
  }

  delete(id: string): void {
    safeSet(KEYS.DRAWINGS, this.getAll().filter((s) => s.id !== id));
    const client = supabase;
    if (client) {
      client.from('drawings').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud drawing delete error:', error);
      });
    }
  }

  deleteAllByIdeaId(ideaId: string): void {
    safeSet(KEYS.DRAWINGS, this.getAll().filter((s) => s.ideaId !== ideaId));
    const client = supabase;
    if (client) {
      client.from('drawings').delete().eq('idea_id', ideaId).then(({ error }) => {
        if (error) console.error('Cloud drawings deleteAll error:', error);
      });
    }
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────

export const ideaRepo = new LocalIdeaRepository();
export const nodeRepo = new LocalNodeRepository();
export const edgeRepo = new LocalEdgeRepository();
export const inboxRepo = new LocalInboxRepository();
export const drawingRepo = new LocalDrawingRepository();

// ─── Seed check ───────────────────────────────────────────────────────────────

export function isSeeded(): boolean {
  return safeGet<boolean>(KEYS.SEEDED, false);
}

export function markSeeded(): void {
  safeSet(KEYS.SEEDED, true);
}
