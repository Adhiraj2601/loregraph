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
import { loadWorldMap, uploadWorldMap, removeWorldMap, loadMapSettings, saveMapSettings } from '@/lib/mapStorage';
import { uploadEntityImage } from '@/lib/imageStorage';
import { loadCollapsed, saveCollapsed } from '@/lib/collapseStorage';
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
  const [mapScale, setMapScale] = useState<number>(1);
  const [mapPosition, setMapPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapFixed, setMapFixed] = useState<boolean>(true);
  const [isMapAdjusting, setIsMapAdjusting] = useState<boolean>(false);
  const [isMapUploading, setIsMapUploading] = useState<boolean>(false);

  // Timeline / Epochs state
  const [eras, setEras] = useState<Era[]>([]);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const imageFileInputRef = React.useRef<HTMLInputElement>(null);

  // Collapse state
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

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

    const currentNodes = nodeRepo.getAllByIdeaId(ideaId);
    if (currentNodes.length > 0 && !currentNodes.some(n => n.isRoot)) {
      const rootNode = nodeRepo.create({
        ideaId: foundIdea.id,
        title: foundIdea.title,
        description: foundIdea.description,
        type: 'ROOT',
        tags: foundIdea.tags,
        position: { x: 380, y: 260 },
        isRoot: true,
      });
      setNodes([...currentNodes, rootNode]);
    } else {
      setNodes(currentNodes);
    }

    setEdges(edgeRepo.getAllByIdeaId(ideaId));
    setStrokes(drawingRepo.getAllByIdeaId(ideaId));
    setEras(eraRepo.getAllByIdeaId(ideaId));

    const mapSettings = loadMapSettings(ideaId);
    setMapOpacity(mapSettings.opacity);
    setMapScale(mapSettings.scale);
    setMapPosition(mapSettings.position);
    setMapFixed(mapSettings.isFixed);

    loadWorldMap(ideaId).then(url => {
      if (url) setMapUrl(url);
    });

    // Load collapse state
    setCollapsedNodeIds(loadCollapsed(ideaId));
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

  const handleMapOpacityChange = useCallback((opacity: number) => {
    setMapOpacity(opacity);
    saveMapSettings(ideaId, { opacity });
  }, [ideaId]);

  const handleMapScaleChange = useCallback((scale: number) => {
    setMapScale(scale);
    saveMapSettings(ideaId, { scale });
  }, [ideaId]);

  const handleMapPositionChange = useCallback((position: { x: number; y: number }) => {
    setMapPosition(position);
    saveMapSettings(ideaId, { position });
  }, [ideaId]);

  const handleToggleMapFixed = useCallback(() => {
    setMapFixed(prev => {
      const next = !prev;
      saveMapSettings(ideaId, { isFixed: next });
      return next;
    });
  }, [ideaId]);

  const handleResetMap = useCallback(() => {
    setMapScale(1);
    setMapPosition({ x: 0, y: 0 });
    setMapFixed(true);
    setIsMapAdjusting(false);
    saveMapSettings(ideaId, { scale: 1, position: { x: 0, y: 0 }, isFixed: true });
  }, [ideaId]);

  // Collapse/Expand a node branch
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      saveCollapsed(ideaId, next);
      return next;
    });
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
      } else if (e.key === 'i' || e.key === 'I') {
        if (!isExploreMode && !isDrawingMode) imageFileInputRef.current?.click();
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

  const handleUploadImageNode = useCallback(async (file: File, position?: { x: number; y: number }) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const url = await uploadEntityImage(ideaId, file);
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);

      const newNode = nodeRepo.create({
        ideaId,
        title: cleanTitle || 'Image Entity',
        description: '',
        type: 'IMAGE',
        imageUrl: url,
        tags: ['image'],
        position: position ?? {
          x: 350 + (Math.random() * 120 - 60),
          y: 220 + (Math.random() * 120 - 60),
        },
      });

      setNodes(nodeRepo.getAllByIdeaId(ideaId));
      setRefreshKey(k => k + 1);
      setSelectedNodeId(newNode.id);
    } catch (err) {
      console.error('Failed to upload entity image node:', err);
    }
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
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadImageNode(file);
                    e.target.value = '';
                  }
                }}
              />

              <GraphCanvas
                ideaId={ideaId}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
                onCanvasClick={handleCanvasClick}
                onDropImage={handleUploadImageNode}
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
                mapScale={mapScale}
                mapPosition={mapPosition}
                mapFixed={mapFixed}
                isMapAdjusting={isMapAdjusting}
                onMapPositionChange={handleMapPositionChange}
                collapsedNodeIds={collapsedNodeIds}
                onToggleCollapse={handleToggleCollapse}
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
                onUploadImage={handleUploadImageNode}
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
                  scale={mapScale}
                  isFixed={mapFixed}
                  isAdjusting={isMapAdjusting}
                  isUploading={isMapUploading}
                  onUpload={handleMapUpload}
                  onOpacityChange={handleMapOpacityChange}
                  onScaleChange={handleMapScaleChange}
                  onToggleFixed={handleToggleMapFixed}
                  onToggleAdjusting={() => setIsMapAdjusting(v => !v)}
                  onReset={handleResetMap}
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
