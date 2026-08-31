'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoreGraphProvider, useLoreGraph } from '@/lib/context';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphToolbar } from '@/components/graph/GraphToolbar';
import { DrawingToolbar } from '@/components/graph/DrawingToolbar';
import { NodeDetailPanel } from '@/components/panels/NodeDetailPanel';
import { CreateNodeModal } from '@/components/modals/CreateNodeModal';
import { MapToolbar } from '@/components/graph/MapToolbar';
import { TimelineDrawer } from '@/components/timeline/TimelineDrawer';
import { Navigation } from '@/components/ui/Navigation';
import { nodeRepo, edgeRepo, ideaRepo, drawingRepo, eraRepo } from '@/lib/storage/repository';
import { loadWorldMap, uploadWorldMap, removeWorldMap } from '@/lib/mapStorage';
import { LoreNode } from '@/types/node';
import { LoreEdge } from '@/types/edge';
import { Idea } from '@/types/idea';
import { Era } from '@/types/era';
import { DrawingStroke, DrawingTool } from '@/types/drawing';

function GraphPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ideaId = params.id as string;

  const { updateNode, deleteNode, deleteIdea } = useLoreGraph();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [nodes, setNodes] = useState<LoreNode[]>([]);
  const [edges, setEdges] = useState<LoreEdge[]>([]);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [activeColor, setActiveColor] = useState('#8A4938');
  const [activeSize, setActiveSize] = useState(4);
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // World Map Backdrop state
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapOpacity, setMapOpacity] = useState<number>(0.5);
  const [isMapUploading, setIsMapUploading] = useState<boolean>(false);

  // Timeline / Epochs state
  const [eras, setEras] = useState<Era[]>([]);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load idea + nodes + edges + drawings + map + eras
  const loadData = useCallback(() => {
    const foundIdea = ideaRepo.getById(ideaId);
    if (!foundIdea) { router.push('/'); return; }
    setIdea(foundIdea);
    setNodes(nodeRepo.getAllByIdeaId(ideaId));
    setEdges(edgeRepo.getAllByIdeaId(ideaId));
    setStrokes(drawingRepo.getAllByIdeaId(ideaId));
    setEras(eraRepo.getAllByIdeaId(ideaId));

    loadWorldMap(ideaId).then(url => {
      if (url) setMapUrl(url);
    });
  }, [ideaId, router]);

  useEffect(() => {
    loadData();
    setMounted(true);
  }, [loadData]);

  const handleMapUpload = useCallback(async (file: File) => {
    setIsMapUploading(true);
    const url = await uploadWorldMap(ideaId, file);
    if (url) setMapUrl(url);
    setIsMapUploading(false);
  }, [ideaId]);

  const handleMapRemove = useCallback(async () => {
    if (window.confirm('Remove world map backdrop?')) {
      await removeWorldMap(ideaId);
      setMapUrl(null);
    }
  }, [ideaId]);

  // Open node from URL param if given
  useEffect(() => {
    const nodeParam = searchParams.get('node');
    if (nodeParam) setSelectedNodeId(nodeParam);
  }, [searchParams]);

  const handleStrokesChange = useCallback((newStrokes: DrawingStroke[]) => {
    setStrokes(newStrokes);
    drawingRepo.saveAll(ideaId, newStrokes);
  }, [ideaId]);

  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    drawingRepo.saveAll(ideaId, updated);
  }, [strokes, ideaId]);

  const handleClearDrawings = useCallback(() => {
    setStrokes([]);
    drawingRepo.deleteAllByIdeaId(ideaId);
  }, [ideaId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === 'Escape') {
        if (isDrawingMode) {
          setIsDrawingMode(false);
        } else {
          setSelectedNodeId(null);
        }
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDrawingMode(true);
        setActiveTool('pen');
      } else if (e.key === 'v' || e.key === 'V') {
        setIsDrawingMode(false);
      } else if (e.key === 'e' || e.key === 'E') {
        setIsDrawingMode(true);
        setActiveTool('eraser');
      } else if (e.key === 'h' || e.key === 'H') {
        setIsDrawingMode(true);
        setActiveTool('highlighter');
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsExploreMode(v => !v);
      } else if (e.key === 'n' || e.key === 'N') {
        if (!isExploreMode && !isDrawingMode) setShowCreateNode(true);
      } else if (e.key === 't' || e.key === 'T') {
        if (!isDrawingMode) setIsTimelineOpen(v => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        setRefreshKey(k => k + 1);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && !isDrawingMode) {
          handleDeleteNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExploreMode, isDrawingMode, selectedNodeId, handleUndo]);

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
    const targetNode = nodes.find(n => n.id === id);
    if (targetNode?.isRoot) {
      deleteIdea(ideaId);
      router.push('/');
      return;
    }
    deleteNode(id);
    const ideaEdges = edgeRepo.getAllByIdeaId(ideaId);
    ideaEdges.filter(e => e.source === id || e.target === id).forEach(e => edgeRepo.delete(e.id));
    setSelectedNodeId(null);
    setNodes(nodeRepo.getAllByIdeaId(ideaId));
    setEdges(edgeRepo.getAllByIdeaId(ideaId));
    setRefreshKey(k => k + 1);
  }, [ideaId, deleteNode, deleteIdea, nodes, router]);

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
    <div className="h-screen flex flex-col overflow-hidden select-none" style={{ background: 'var(--bg)' }}>
      <Navigation />

      <div className="flex-1 relative overflow-hidden" style={{ marginTop: '64px' }}>
        {/* Graph & Drawing Area */}
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
                isDrawingMode={isDrawingMode}
                activeTool={activeTool}
                activeColor={activeColor}
                activeSize={activeSize}
                strokes={strokes}
                onStrokesChange={handleStrokesChange}
                refreshKey={refreshKey}
                mapUrl={mapUrl}
                mapOpacity={mapOpacity}
              />

              <GraphToolbar
                ideaTitle={idea.title}
                ideaDescription={idea.description}
                ideaId={ideaId}
                nodeCount={nodes.length}
                edgeCount={edges.length}
                isExploreMode={isExploreMode}
                isTimelineOpen={isTimelineOpen}
                onToggleExplore={() => {
                  setIsExploreMode(v => !v);
                  if (!isExploreMode) setIsDrawingMode(false);
                }}
                onToggleTimeline={() => {
                  setIsTimelineOpen(v => !v);
                  if (!isTimelineOpen) setIsDrawingMode(false);
                }}
                onCreateNode={() => setShowCreateNode(true)}
                onDeleteIdea={() => {
                  deleteIdea(ideaId);
                  router.push('/');
                }}
                updatedAt={idea.updatedAt}
              />

              {/* Floating Sketch Toolbar */}
              <DrawingToolbar
                isDrawingMode={isDrawingMode}
                onToggleDrawingMode={() => {
                  setIsDrawingMode(v => !v);
                  if (!isDrawingMode) setSelectedNodeId(null);
                }}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                activeColor={activeColor}
                onSelectColor={setActiveColor}
                activeSize={activeSize}
                onSelectSize={setActiveSize}
                onUndo={handleUndo}
                onClear={handleClearDrawings}
                canUndo={strokes.length > 0}
              />

              {/* World Map Backdrop Toolbar */}
              {!isDrawingMode && (
                <MapToolbar
                  mapUrl={mapUrl}
                  opacity={mapOpacity}
                  isUploading={isMapUploading}
                  onUpload={handleMapUpload}
                  onOpacityChange={setMapOpacity}
                  onRemove={handleMapRemove}
                />
              )}
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

      {/* Interactive Bottom Timeline & Epochs Drawer */}
      <AnimatePresence>
        {isTimelineOpen && (
          <TimelineDrawer
            ideaId={ideaId}
            nodes={nodes}
            eras={eras}
            isOpen={isTimelineOpen}
            onClose={() => setIsTimelineOpen(false)}
            onSelectNode={handleNodeClick}
            onFocusNode={handleFocusNode}
            onErasChange={updatedEras => setEras(updatedEras)}
            onNodeUpdated={handleUpdateNode}
          />
        )}
      </AnimatePresence>

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
  return <GraphPageContent />;
}
