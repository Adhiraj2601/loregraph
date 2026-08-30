'use client';

import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe } from 'lucide-react';
import { LoreGraphProvider, useLoreGraph } from '@/lib/context';
import { Navigation } from '@/components/ui/Navigation';
import { nodeRepo } from '@/lib/storage/repository';

function UniverseNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div
      className="rounded-lg px-4 py-3 cursor-pointer hover:shadow-md transition-all text-center group"
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        minWidth: '150px',
      }}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span style={{ color: 'var(--accent-rust)', fontSize: '11px' }}>✻</span>
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--accent-rust)' }}>
          WORLD
        </span>
      </div>

      <div
        className="font-serif text-base font-medium group-hover:text-[#8A4938] transition-colors leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {data.title as string}
      </div>

      <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
        {data.nodeCount as number} ideas
      </div>
    </div>
  );
}

const universeNodeTypes = { universeNode: UniverseNode };

function UniverseContent() {
  const { ideas } = useLoreGraph();
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const cols = 3;
    const spacingX = 260;
    const spacingY = 220;

    const flowNodes: Node[] = ideas.map((idea, i) => ({
      id: `idea-${idea.id}`,
      type: 'universeNode',
      position: {
        x: (i % cols) * spacingX + (Math.floor(i / cols) % 2 === 0 ? 0 : spacingX / 2),
        y: Math.floor(i / cols) * spacingY + 40,
      },
      data: {
        title: idea.title,
        nodeCount: nodeRepo.getAllByIdeaId(idea.id).length,
        ideaId: idea.id,
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
  }, [ideas, setNodes, setEdges]);

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

          <span
            className="pointer-events-auto text-xs font-mono hidden sm:inline"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {ideas.length} Worlds · Connected by shared themes
          </span>
        </div>

        <div style={{ position: 'absolute', inset: 0, top: '56px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={universeNodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'var(--bg)' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={0.75} color="rgba(162, 158, 149, 0.4)" />
          </ReactFlow>
        </div>
      </div>
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
