'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Idea, CreateIdeaInput } from '@/types/idea';
import { LoreNode, CreateNodeInput } from '@/types/node';
import { LoreEdge, CreateEdgeInput } from '@/types/edge';
import { InboxItem, CreateInboxItemInput } from '@/types/inbox';
import { ideaRepo, nodeRepo, edgeRepo, inboxRepo } from '@/lib/storage/repository';
import { seedDemoData } from '@/data/demo-data';

interface LoreGraphContextValue {
  // Ideas
  ideas: Idea[];
  createIdea: (input: CreateIdeaInput) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  // Nodes
  getNodes: (ideaId: string) => LoreNode[];
  createNode: (input: CreateNodeInput) => LoreNode;
  updateNode: (id: string, updates: Partial<LoreNode>) => void;
  deleteNode: (id: string) => void;
  // Edges
  getEdges: (ideaId: string) => LoreEdge[];
  createEdge: (input: CreateEdgeInput) => LoreEdge;
  deleteEdge: (id: string) => void;
  // Inbox
  inbox: InboxItem[];
  createInboxItem: (input: CreateInboxItemInput) => InboxItem;
  updateInboxItem: (id: string, updates: Partial<InboxItem>) => void;
  deleteInboxItem: (id: string) => void;
  // UI state
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isInboxOpen: boolean;
  setIsInboxOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isQuickIdeaOpen: boolean;
  setIsQuickIdeaOpen: (open: boolean) => void;
}

const LoreGraphContext = createContext<LoreGraphContextValue | null>(null);

export function LoreGraphProvider({ children }: { children: React.ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickIdeaOpen, setIsQuickIdeaOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    seedDemoData();
    setIdeas(ideaRepo.getAll());
    setInbox(inboxRepo.getAll_public());
  }, []);

  const refreshIdeas = useCallback(() => setIdeas(ideaRepo.getAll()), []);
  const refreshInbox = useCallback(() => setInbox(inboxRepo.getAll_public()), []);

  // Ideas
  const createIdea = useCallback((input: CreateIdeaInput): Idea => {
    const idea = ideaRepo.create(input);
    refreshIdeas();
    return idea;
  }, [refreshIdeas]);

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    ideaRepo.update(id, updates);
    refreshIdeas();
  }, [refreshIdeas]);

  const deleteIdea = useCallback((id: string) => {
    ideaRepo.delete(id);
    nodeRepo.deleteByIdeaId(id);
    edgeRepo.deleteByIdeaId(id);
    refreshIdeas();
  }, [refreshIdeas]);

  // Nodes
  const getNodes = useCallback((ideaId: string) => nodeRepo.getAllByIdeaId(ideaId), []);
  const createNode = useCallback((input: CreateNodeInput): LoreNode => nodeRepo.create(input), []);
  const updateNode = useCallback((id: string, updates: Partial<LoreNode>) => { nodeRepo.update(id, updates); }, []);
  const deleteNode = useCallback((id: string) => { nodeRepo.delete(id); }, []);

  // Edges
  const getEdges = useCallback((ideaId: string) => edgeRepo.getAllByIdeaId(ideaId), []);
  const createEdge = useCallback((input: CreateEdgeInput): LoreEdge => edgeRepo.create(input), []);
  const deleteEdge = useCallback((id: string) => { edgeRepo.delete(id); }, []);

  // Inbox
  const createInboxItem = useCallback((input: CreateInboxItemInput): InboxItem => {
    const item = inboxRepo.create(input);
    refreshInbox();
    return item;
  }, [refreshInbox]);

  const updateInboxItem = useCallback((id: string, updates: Partial<InboxItem>) => {
    inboxRepo.update(id, updates);
    refreshInbox();
  }, [refreshInbox]);

  const deleteInboxItem = useCallback((id: string) => {
    inboxRepo.delete(id);
    refreshInbox();
  }, [refreshInbox]);

  return (
    <LoreGraphContext.Provider value={{
      ideas, createIdea, updateIdea, deleteIdea,
      getNodes, createNode, updateNode, deleteNode,
      getEdges, createEdge, deleteEdge,
      inbox, createInboxItem, updateInboxItem, deleteInboxItem,
      searchQuery, setSearchQuery,
      isInboxOpen, setIsInboxOpen,
      isSearchOpen, setIsSearchOpen,
      isQuickIdeaOpen, setIsQuickIdeaOpen,
    }}>
      {children}
    </LoreGraphContext.Provider>
  );
}

export function useLoreGraph() {
  const ctx = useContext(LoreGraphContext);
  if (!ctx) throw new Error('useLoreGraph must be used within LoreGraphProvider');
  return ctx;
}
