'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoreGraphProvider, useLoreGraph } from '@/lib/context';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphToolbar } from '@/components/graph/GraphToolbar';
import { NodeDetailPanel } from '@/components/panels/NodeDetailPanel';
import { CreateNodeModal } from '@/components/modals/CreateNodeModal';
import { Navigation } from '@/components/ui/Navigation';
import { nodeRepo, edgeRepo, ideaRepo } from '@/lib/storage/repository';
import { LoreNode } from '@/types/node';
import { LoreEdge } from '@/types/edge';
import { Idea } from '@/types/idea';

function GraphPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ideaId = params.id as string;

  const { updateNode, deleteNode, deleteIdea } = useLoreGraph();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [nodes, setNodes] = useState<LoreNode[]>([]);
  const [edges, setEdges] = useState<LoreEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load idea + nodes + edges
  const loadData = useCallback(() => {
    const foundIdea = ideaRepo.getById(ideaId);
    if (!foundIdea) { router.push('/'); return; }
    setIdea(foundIdea);
    setNodes(nodeRepo.getAllByIdeaId(ideaId));
    setEdges(edgeRepo.getAllByIdeaId(ideaId));
  }, [ideaId, router]);

  useEffect(() => {
    loadData();
    setMounted(true);
  }, [loadData]);

  // Open node from URL param if given
  useEffect(() => {
    const nodeParam = searchParams.get('node');
    if (nodeParam) setSelectedNodeId(nodeParam);
  }, [searchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') { setSelectedNodeId(null); }
      if (e.key === ' ') { e.preventDefault(); setIsExploreMode(v => !v); }
      if (e.key === 'n' || e.key === 'N') { if (!isExploreMode) setShowCreateNode(true); }
      if (e.key === 'f' || e.key === 'F') { setRefreshKey(k => k + 1); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          handleDeleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExploreMode, selectedNodeId]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = useCallback((id: string, updates: Partial<LoreNode>) => {
    updateNode(id, updates);
    setNodes(nodeRepo.getAllByIdeaId(ideaId));
    setRefreshKey(k => k + 1);
  }, [ideaId, updateNode]);

  const handleDeleteNode = useCallback((id: string) => {
    deleteNode(id);
    const ideaEdges = edgeRepo.getAllByIdeaId(ideaId);
    ideaEdges.filter(e => e.source === id || e.target === id).forEach(e => edgeRepo.delete(e.id));
    setSelectedNodeId(null);
    setNodes(nodeRepo.getAllByIdeaId(ideaId));
    setEdges(edgeRepo.getAllByIdeaId(ideaId));
    setRefreshKey(k => k + 1);
  }, [ideaId, deleteNode]);

  const handleNodeCreated = useCallback((nodeId: string) => {
    setNodes(nodeRepo.getAllByIdeaId(ideaId));
    setEdges(edgeRepo.getAllByIdeaId(ideaId));
    setRefreshKey(k => k + 1);
    setSelectedNodeId(nodeId);
  }, [ideaId]);

  const handleFocusNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  if (!mounted || !idea) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-serif italic text-sm" style={{ color: 'var(--text-secondary)' }}>
          Opening archive...
        </p>
      </div>
    );
  }

  const showPanel = !!selectedNode;
  const panelWidth = showPanel && !isMobile ? 360 : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Navigation />

      <div className="flex-1 relative overflow-hidden" style={{ marginTop: '64px' }}>
        {/* Graph Area */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{ right: panelWidth }}
        >
          <ReactFlowProvider>
            <div className="relative w-full h-full">
              <GraphCanvas
                ideaId={ideaId}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onCanvasClick={handleCanvasClick}
                isExploreMode={isExploreMode}
                refreshKey={refreshKey}
              />

              <GraphToolbar
                ideaTitle={idea.title}
                ideaDescription={idea.description}
                ideaId={ideaId}
                nodeCount={nodes.length}
                edgeCount={edges.length}
                isExploreMode={isExploreMode}
                onToggleExplore={() => setIsExploreMode(v => !v)}
                onCreateNode={() => setShowCreateNode(true)}
                onDeleteIdea={() => {
                  deleteIdea(ideaId);
                  router.push('/');
                }}
                updatedAt={idea.updatedAt}
              />
            </div>
          </ReactFlowProvider>
        </div>

        {/* Node Detail Sheet */}
        <AnimatePresence>
          {selectedNode && (
            isMobile ? (
              <NodeDetailPanel
                key={selectedNode.id}
                node={selectedNode}
                edges={edges}
                allNodes={nodes}
                onClose={() => setSelectedNodeId(null)}
                onDelete={handleDeleteNode}
                onUpdate={handleUpdateNode}
                onFocus={handleFocusNode}
                isMobile={true}
              />
            ) : (
              <div
                className="absolute right-0 top-0 bottom-0 shadow-xl"
                style={{ width: '360px', zIndex: 25 }}
              >
                <NodeDetailPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  edges={edges}
                  allNodes={nodes}
                  onClose={() => setSelectedNodeId(null)}
                  onDelete={handleDeleteNode}
                  onUpdate={handleUpdateNode}
                  onFocus={handleFocusNode}
                  isMobile={false}
                />
              </div>
            )
          )}
        </AnimatePresence>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="font-serif italic text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
                This world is waiting for its first spark.
              </p>
              <button
                className="pointer-events-auto px-4 py-2 rounded text-xs font-medium hover:bg-[#ECE8DF] transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--accent-rust)', background: 'var(--surface)' }}
                onClick={() => setShowCreateNode(true)}
              >
                + Add the first idea
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {showCreateNode && (
        <CreateNodeModal
          ideaId={ideaId}
          onClose={() => setShowCreateNode(false)}
          onCreated={handleNodeCreated}
        />
      )}
    </div>
  );
}

export default function IdeaGraphPage() {
  return (
    <LoreGraphProvider>
      <GraphPageContent />
    </LoreGraphProvider>
  );
}
