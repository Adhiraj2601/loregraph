import { Idea, CreateIdeaInput } from '@/types/idea';
import { LoreNode, CreateNodeInput } from '@/types/node';
import { LoreEdge, CreateEdgeInput } from '@/types/edge';
import { InboxItem, CreateInboxItemInput } from '@/types/inbox';
import { DrawingStroke, CreateStrokeInput } from '@/types/drawing';
import { Era, CreateEraInput } from '@/types/era';
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
  getAll(): LoreNode[];
  getAllByIdeaId(ideaId: string): LoreNode[];
  getById(id: string): LoreNode | undefined;
  create(input: CreateNodeInput): LoreNode;
  update(id: string, updates: Partial<LoreNode>): LoreNode | undefined;
  delete(id: string): void;
  deleteByIdeaId(ideaId: string): void;
}

export interface IEdgeRepository {
  getAll(): LoreEdge[];
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

export interface IEraRepository {
  getAll(): Era[];
  getAllByIdeaId(ideaId: string): Era[];
  getById(id: string): Era | undefined;
  create(input: CreateEraInput): Era;
  update(id: string, updates: Partial<Era>): Era | undefined;
  delete(id: string): void;
  deleteByIdeaId(ideaId: string): void;
}

// ─── LocalStorage Keys ────────────────────────────────────────────────────────

const KEYS = {
  IDEAS: 'loregraph:ideas',
  NODES: 'loregraph:nodes',
  EDGES: 'loregraph:edges',
  INBOX: 'loregraph:inbox',
  DRAWINGS: 'loregraph:drawings',
  ERAS: 'loregraph:eras',
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
    const [ideasRes, nodesRes, edgesRes, inboxRes, drawingsRes, erasRes] = await Promise.all([
      supabase.from('ideas').select('*'),
      supabase.from('nodes').select('*'),
      supabase.from('edges').select('*'),
      supabase.from('inbox').select('*'),
      supabase.from('drawings').select('*'),
      supabase.from('eras').select('*'),
    ]);

    const localIdeas = safeGet<Idea[]>(KEYS.IDEAS, []);
    const localNodes = safeGet<LoreNode[]>(KEYS.NODES, []);
    const localEdges = safeGet<LoreEdge[]>(KEYS.EDGES, []);
    const localInbox = safeGet<InboxItem[]>(KEYS.INBOX, []);
    const localDrawings = safeGet<DrawingStroke[]>(KEYS.DRAWINGS, []);
    const localEras = safeGet<Era[]>(KEYS.ERAS, []);

    // 1. Sync Ideas (Union Merge)
    const cloudIdeas: Idea[] = (ideasRes.data || []).map(i => ({
      id: i.id,
      title: i.title,
      description: i.description || '',
      tags: Array.isArray(i.tags) ? i.tags : [],
      coverColor: i.cover_color,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));
    const mergedIdeasMap = new Map<string, Idea>();
    localIdeas.forEach(i => mergedIdeasMap.set(i.id, i));
    cloudIdeas.forEach(i => mergedIdeasMap.set(i.id, i));
    const finalIdeas = Array.from(mergedIdeasMap.values());
    safeSet(KEYS.IDEAS, finalIdeas);
    if (finalIdeas.length > 0) markSeeded();

    const missingCloudIdeas = localIdeas.filter(li => !cloudIdeas.some(ci => ci.id === li.id));
    if (missingCloudIdeas.length > 0) {
      supabase.from('ideas').upsert(
        missingCloudIdeas.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          tags: i.tags,
          cover_color: i.coverColor,
          created_at: i.createdAt,
          updated_at: i.updatedAt,
        }))
      ).then(() => {});
    }

    // 2. Sync Nodes (Union Merge)
    const cloudNodes: LoreNode[] = (nodesRes.data || []).map(n => ({
      id: n.id,
      ideaId: n.idea_id,
      title: n.title,
      description: n.description || '',
      type: n.type,
      tags: Array.isArray(n.tags) ? n.tags : [],
      position: n.position || { x: 300, y: 200 },
      strokes: Array.isArray(n.strokes) ? n.strokes : [],
      year: n.year ?? undefined,
      endYear: n.end_year ?? n.endYear ?? undefined,
      dateLabel: n.date_label ?? n.dateLabel ?? undefined,
      eraId: n.era_id ?? n.eraId ?? undefined,
      isRoot: n.is_root,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));
    const mergedNodesMap = new Map<string, LoreNode>();
    localNodes.forEach(n => mergedNodesMap.set(n.id, n));
    cloudNodes.forEach(n => mergedNodesMap.set(n.id, n));
    const finalNodes = Array.from(mergedNodesMap.values());
    safeSet(KEYS.NODES, finalNodes);

    const missingCloudNodes = localNodes.filter(ln => !cloudNodes.some(cn => cn.id === ln.id));
    if (missingCloudNodes.length > 0) {
      supabase.from('nodes').upsert(
        missingCloudNodes.map(n => ({
          id: n.id,
          idea_id: n.ideaId,
          title: n.title,
          description: n.description,
          type: n.type,
          tags: n.tags,
          position: n.position,
          year: n.year,
          end_year: n.endYear,
          date_label: n.dateLabel,
          era_id: n.eraId,
          is_root: n.isRoot || false,
          created_at: n.createdAt,
          updated_at: n.updatedAt,
        }))
      ).then(() => {});
    }

    // 3. Sync Edges (Union Merge)
    const cloudEdges: LoreEdge[] = (edgesRes.data || []).map(e => ({
      id: e.id,
      ideaId: e.idea_id,
      source: e.source,
      target: e.target,
      sourceHandle: e.source_handle || e.sourceHandle || null,
      targetHandle: e.target_handle || e.targetHandle || null,
      relationship: e.relationship,
    }));
    const mergedEdgesMap = new Map<string, LoreEdge>();
    localEdges.forEach(e => mergedEdgesMap.set(e.id, e));
    cloudEdges.forEach(e => mergedEdgesMap.set(e.id, e));
    const finalEdges = Array.from(mergedEdgesMap.values());
    safeSet(KEYS.EDGES, finalEdges);

    const missingCloudEdges = localEdges.filter(le => !cloudEdges.some(ce => ce.id === le.id));
    if (missingCloudEdges.length > 0) {
      supabase.from('edges').upsert(
        missingCloudEdges.map(e => ({
          id: e.id,
          idea_id: e.ideaId,
          source: e.source,
          target: e.target,
          source_handle: e.sourceHandle,
          target_handle: e.targetHandle,
          relationship: e.relationship || 'connected to',
        }))
      ).then(() => {});
    }

    // 4. Sync Inbox (Union Merge)
    const cloudInbox: InboxItem[] = (inboxRes.data || []).map(i => ({
      id: i.id,
      content: i.content,
      status: i.status || 'pending',
      createdAt: i.created_at,
    }));
    const mergedInboxMap = new Map<string, InboxItem>();
    localInbox.forEach(i => mergedInboxMap.set(i.id, i));
    cloudInbox.forEach(i => mergedInboxMap.set(i.id, i));
    const finalInbox = Array.from(mergedInboxMap.values());
    safeSet(KEYS.INBOX, finalInbox);

    const missingCloudInbox = localInbox.filter(li => !cloudInbox.some(ci => ci.id === li.id));
    if (missingCloudInbox.length > 0) {
      supabase.from('inbox').upsert(
        missingCloudInbox.map(i => ({
          id: i.id,
          content: i.content,
          status: i.status,
          created_at: i.createdAt,
        }))
      ).then(() => {});
    }

    // 5. Sync Drawings (Union Merge)
    const cloudDrawings: DrawingStroke[] = (drawingsRes.data || []).map(d => ({
      id: d.id,
      ideaId: d.idea_id,
      points: d.points || [],
      color: d.color,
      size: d.size,
      tool: d.tool,
      opacity: d.opacity,
      createdAt: d.created_at,
    }));
    const mergedDrawingsMap = new Map<string, DrawingStroke>();
    localDrawings.forEach(d => mergedDrawingsMap.set(d.id, d));
    cloudDrawings.forEach(d => mergedDrawingsMap.set(d.id, d));
    safeSet(KEYS.DRAWINGS, Array.from(mergedDrawingsMap.values()));

    // 6. Sync Eras (Union Merge)
    const cloudEras: Era[] = (erasRes.data || []).map(e => ({
      id: e.id,
      ideaId: e.idea_id,
      name: e.name,
      startYear: e.start_year ?? e.startYear,
      endYear: e.end_year ?? e.endYear,
      color: e.color || '#8A4938',
      description: e.description,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    }));
    const mergedErasMap = new Map<string, Era>();
    localEras.forEach(e => mergedErasMap.set(e.id, e));
    cloudEras.forEach(e => mergedErasMap.set(e.id, e));
    const finalEras = Array.from(mergedErasMap.values());
    safeSet(KEYS.ERAS, finalEras);

    const missingCloudEras = localEras.filter(le => !cloudEras.some(ce => ce.id === le.id));
    if (missingCloudEras.length > 0) {
      supabase.from('eras').upsert(
        missingCloudEras.map(e => ({
          id: e.id,
          idea_id: e.ideaId,
          name: e.name,
          start_year: e.startYear,
          end_year: e.endYear,
          color: e.color,
          description: e.description,
          created_at: e.createdAt,
          updated_at: e.updatedAt,
        }))
      ).then(() => {});
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

    const client = supabase;
    if (client) {
      client.from('ideas').insert({
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

    const client = supabase;
    if (client) {
      client.from('ideas').update({
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
    const client = supabase;
    if (client) {
      client.from('ideas').delete().eq('id', id).then(({ error }) => {
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
      strokes: input.strokes || [],
      year: input.year,
      endYear: input.endYear,
      dateLabel: input.dateLabel,
      eraId: input.eraId,
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAll();
    safeSet(KEYS.NODES, [...all, node]);

    const client = supabase;
    if (client) {
      client.from('nodes').insert({
        id: node.id,
        idea_id: node.ideaId,
        title: node.title,
        description: node.description,
        type: node.type,
        tags: node.tags,
        position: node.position,
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

    const client = supabase;
    if (client) {
      client.from('nodes').update({
        title: updated.title,
        description: updated.description,
        type: updated.type,
        tags: updated.tags,
        position: updated.position,
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud node update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.NODES, this.getAll().filter((n) => n.id !== id));
    const client = supabase;
    if (client) {
      client.from('nodes').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud node delete error:', error);
      });
    }
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.NODES, this.getAll().filter((n) => n.ideaId !== ideaId));
    const client = supabase;
    if (client) {
      client.from('nodes').delete().eq('idea_id', ideaId).then(({ error }) => {
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
      sourceHandle: input.sourceHandle || null,
      targetHandle: input.targetHandle || null,
    };
    const all = this.getAll();
    safeSet(KEYS.EDGES, [...all, edge]);

    const client = supabase;
    if (client) {
      client.from('edges').insert({
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

    const client = supabase;
    if (client) {
      client.from('edges').update({
        relationship: updated.relationship,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud edge update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.EDGES, this.getAll().filter((e) => e.id !== id));
    const client = supabase;
    if (client) {
      client.from('edges').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud edge delete error:', error);
      });
    }
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.EDGES, this.getAll().filter((e) => e.ideaId !== ideaId));
    const client = supabase;
    if (client) {
      client.from('edges').delete().eq('idea_id', ideaId).then(({ error }) => {
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

    const client = supabase;
    if (client) {
      client.from('inbox').insert({
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

    const client = supabase;
    if (client) {
      client.from('inbox').update({
        content: updated.content,
        status: updated.status,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud inbox update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.INBOX, this.getAll().filter((i) => i.id !== id));
    const client = supabase;
    if (client) {
      client.from('inbox').delete().eq('id', id).then(({ error }) => {
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

// ─── Era Repository ───────────────────────────────────────────────────────────

export class LocalEraRepository implements IEraRepository {
  getAll(): Era[] {
    return safeGet<Era[]>(KEYS.ERAS, []);
  }

  getAllByIdeaId(ideaId: string): Era[] {
    return this.getAll()
      .filter((e) => e.ideaId === ideaId)
      .sort((a, b) => a.startYear - b.startYear);
  }

  getById(id: string): Era | undefined {
    return this.getAll().find((e) => e.id === id);
  }

  create(input: CreateEraInput): Era {
    const now = new Date().toISOString();
    const era: Era = {
      id: generateId(),
      ...input,
      color: input.color || '#8A4938',
      createdAt: now,
      updatedAt: now,
    };
    const all = this.getAll();
    safeSet(KEYS.ERAS, [...all, era]);

    const client = supabase;
    if (client) {
      client.from('eras').insert({
        id: era.id,
        idea_id: era.ideaId,
        name: era.name,
        start_year: era.startYear,
        end_year: era.endYear,
        color: era.color,
        description: era.description,
        created_at: era.createdAt,
        updated_at: era.updatedAt,
      }).then(({ error }) => { if (error) console.error('Cloud era insert error:', error); });
    }

    return era;
  }

  update(id: string, updates: Partial<Era>): Era | undefined {
    const all = this.getAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const updated: Era = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    safeSet(KEYS.ERAS, all);

    const client = supabase;
    if (client) {
      client.from('eras').update({
        name: updated.name,
        start_year: updated.startYear,
        end_year: updated.endYear,
        color: updated.color,
        description: updated.description,
        updated_at: updated.updatedAt,
      }).eq('id', id).then(({ error }) => { if (error) console.error('Cloud era update error:', error); });
    }

    return updated;
  }

  delete(id: string): void {
    safeSet(KEYS.ERAS, this.getAll().filter((e) => e.id !== id));
    const client = supabase;
    if (client) {
      client.from('eras').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Cloud era delete error:', error);
      });
    }
  }

  deleteByIdeaId(ideaId: string): void {
    safeSet(KEYS.ERAS, this.getAll().filter((e) => e.ideaId !== ideaId));
    const client = supabase;
    if (client) {
      client.from('eras').delete().eq('idea_id', ideaId).then(({ error }) => {
        if (error) console.error('Cloud era deleteByIdeaId error:', error);
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
export const eraRepo = new LocalEraRepository();

// ─── Seed check ───────────────────────────────────────────────────────────────

export function isSeeded(): boolean {
  return safeGet<boolean>(KEYS.SEEDED, false);
}

export function markSeeded(): void {
  safeSet(KEYS.SEEDED, true);
}
