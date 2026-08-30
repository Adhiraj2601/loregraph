'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Plus, RefreshCw } from 'lucide-react';
import { LoreGraphProvider, useLoreGraph } from '@/lib/context';
import { Navigation } from '@/components/ui/Navigation';
import { CreateIdeaModal } from '@/components/modals/CreateIdeaModal';
import { nodeRepo } from '@/lib/storage/repository';

function UniverseNode({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string;
  const nodeCount = data.nodeCount as number;
  const ideaId = data.ideaId as string;
  const onDelete = data.onDelete as ((id: string, title: string) => void) | undefined;

  return (
    <div
      className="relative rounded-lg px-5 py-4 cursor-pointer hover:shadow-md transition-all text-center group"
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        width: '240px',
      }}
    >
      {/* Delete button on the top right */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ideaId, title);
          }}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-[#9B3D3D]"
          title={`Delete ${title}`}
          aria-label={`Delete ${title}`}
        >
          <Trash2 size={13} />
        </button>
      )}

      <div className="flex items-center justify-center gap-1 mb-1">
        <span style={{ color: 'var(--accent-rust)', fontSize: '11px' }}>✻</span>
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--accent-rust)' }}>
          WORLD
        </span>
      </div>

      <div
        className="font-serif text-lg font-medium group-hover:text-[#8A4938] transition-colors leading-tight mb-1 truncate px-1"
        style={{ color: 'var(--text-primary)' }}
        title={title}
      >
        {title}
      </div>

      <div className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {nodeCount} {nodeCount === 1 ? 'idea' : 'ideas'}
      </div>
    </div>
  );
}

const universeNodeTypes = { universeNode: UniverseNode };

function UniverseContent() {
  const { ideas, deleteIdea, restoreDemoData } = useLoreGraph();
  const router = useRouter();
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDeleteWorld = useCallback((id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}" and all its ideas?`)) {
      deleteIdea(id);
    }
  }, [deleteIdea]);

  useEffect(() => {
    const cols = 3;
    const cardWidth = 240;
    const gapX = 60; // Clean, uniform 60px gap between every card
    const spacingX = cardWidth + gapX; // 300px per column
    const spacingY = 170; // 170px per row

    const flowNodes: Node[] = ideas.map((idea, i) => ({
      id: `idea-${idea.id}`,
      type: 'universeNode',
      position: {
        x: (i % cols) * spacingX,
        y: Math.floor(i / cols) * spacingY + 40,
      },
      data: {
        title: idea.title,
        nodeCount: nodeRepo.getAllByIdeaId(idea.id).length,
        ideaId: idea.id,
        onDelete: handleDeleteWorld,
      },
    }));

    // Cross-idea edges based on shared tags
    const flowEdges: Edge[] = [];
    const processed = new Set<string>();
    for (let i = 0; i < ideas.length; i++) {
      for (let j = i + 1; j < ideas.length; j++) {
        const a = ideas[i]; const b = ideas[j];
        const shared = a.tags.filter(t => b.tags.includes(t));
        if (shared.length > 0) {
          const eid = `edge-${a.id}-${b.id}`;
          if (!processed.has(eid)) {
            processed.add(eid);
            flowEdges.push({
              id: eid,
              source: `idea-${a.id}`,
              target: `idea-${b.id}`,
              label: shared.slice(0, 2).join(' · '),
              style: { stroke: '#B8B3A8', strokeWidth: 1, strokeDasharray: '3 3' },
              labelStyle: { fill: '#73716B', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' },
            });
          }
        }
      }
    }

    setNodes(flowNodes);
    setEdges(flowEdges);

    if (ideas.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.25, duration: 400 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ideas, handleDeleteWorld, setNodes, setEdges, fitView]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const ideaId = (node.data as { ideaId?: string })?.ideaId;
    if (ideaId) {
      router.push(`/ideas/${ideaId}`);
    }
  }, [router]);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navigation />

      <div className="flex-1 relative" style={{ marginTop: '64px' }}>
        {/* Top Header */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 sm:px-10 py-4"
          style={{
            background: 'linear-gradient(to bottom, rgba(244, 241, 234, 0.95) 70%, rgba(244, 241, 234, 0))',
            pointerEvents: 'none',
          }}
        >
          <div className="pointer-events-auto space-y-0.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:text-black mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={12} />
              <span>Index</span>
            </Link>
            <h1
              className="font-serif text-2xl font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Universe Overview
            </h1>
          </div>

          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={() => setCreateOpen(true)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-[#ECE8DF] flex items-center gap-1.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--accent-rust)',
              }}
            >
              <Plus size={13} />
              <span>New World</span>
            </button>

            {ideas.length > 0 && (
              <span
                className="text-xs font-mono hidden md:inline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {ideas.length} Worlds
              </span>
            )}
          </div>
        </div>

        {ideas.length === 0 ? (
          /* Empty Universe State */
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center mx-auto mb-4 bg-[var(--surface)] text-[var(--accent-rust)] text-lg">
                ✻
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                The universe is quiet.
              </h2>
              <p className="font-serif italic text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                No worlds exist in this archive yet. Begin by charting your first world.
              </p>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-5 py-2.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}
                >
                  <Plus size={13} />
                  <span>Create First World</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, top: '56px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={universeNodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              proOptions={{ hideAttribution: true }}
              style={{ background: 'var(--bg)' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={0.75} color="rgba(162, 158, 149, 0.4)" />
            </ReactFlow>
          </div>
        )}
      </div>

      {createOpen && <CreateIdeaModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

export default function UniversePage() {
  return (
    <LoreGraphProvider>
      <ReactFlowProvider>
        <UniverseContent />
      </ReactFlowProvider>
    </LoreGraphProvider>
  );
}
