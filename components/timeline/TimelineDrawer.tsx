'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, ChevronDown, ChevronUp, Clock, X, Edit3, Trash2, MapPin, Eye,
} from 'lucide-react';
import { Era } from '@/types/era';
import { LoreNode } from '@/types/node';
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypes';
import { CreateEraModal } from '@/components/modals/CreateEraModal';
import { eraRepo, nodeRepo } from '@/lib/storage/repository';

interface TimelineDrawerProps {
  ideaId: string;
  nodes: LoreNode[];
  eras: Era[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onFocusNode: (nodeId: string) => void;
  onErasChange: (eras: Era[]) => void;
  onNodeUpdated: (nodeId: string, updates: Partial<LoreNode>) => void;
}

export function TimelineDrawer({
  ideaId,
  nodes,
  eras,
  isOpen,
  onClose,
  onSelectNode,
  onFocusNode,
  onErasChange,
  onNodeUpdated,
}: TimelineDrawerProps) {
  const [showCreateEra, setShowCreateEra] = useState(false);
  const [editingEra, setEditingEra] = useState<Era | undefined>(undefined);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [quickDateNodeId, setQuickDateNodeId] = useState<string | null>(null);
  const [quickYearInput, setQuickYearInput] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Nodes with and without dates
  const scheduledNodes = useMemo(() => {
    return nodes
      .filter(n => n.year !== undefined && n.year !== null)
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  }, [nodes]);

  const unscheduledNodes = useMemo(() => {
    return nodes.filter(n => (n.year === undefined || n.year === null) && !n.isRoot);
  }, [nodes]);

  // Overall timeline bounds
  const { minYear, maxYear, yearSpan } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    eras.forEach(e => {
      if (e.startYear < min) min = e.startYear;
      if (e.endYear > max) max = e.endYear;
    });

    scheduledNodes.forEach(n => {
      const y = n.year ?? 0;
      const ey = n.endYear ?? y;
      if (y < min) min = y;
      if (ey > max) max = ey;
    });

    if (!isFinite(min) || !isFinite(max)) {
      return { minYear: 0, maxYear: 1000, yearSpan: 1000 };
    }

    // Add 10% breathing room
    const padding = Math.max(Math.round((max - min) * 0.08), 20);
    const calculatedMin = min - padding;
    const calculatedMax = max + padding;
    return {
      minYear: calculatedMin,
      maxYear: calculatedMax,
      yearSpan: Math.max(calculatedMax - calculatedMin, 100),
    };
  }, [eras, scheduledNodes]);

  // Timeline track pixel width (dynamic based on span)
  const trackWidth = Math.max(yearSpan * 1.8, 900);

  const getXPercent = (year: number) => {
    return ((year - minYear) / yearSpan) * 100;
  };

  const handleSaveEra = () => {
    onErasChange(eraRepo.getAllByIdeaId(ideaId));
  };

  const handleDeleteEra = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this historical epoch?')) {
      eraRepo.delete(id);
      onErasChange(eraRepo.getAllByIdeaId(ideaId));
    }
  };

  const handleQuickAssignYear = (nodeId: string) => {
    const yr = parseInt(quickYearInput);
    if (!isNaN(yr)) {
      nodeRepo.update(nodeId, { year: yr });
      onNodeUpdated(nodeId, { year: yr });
      setQuickDateNodeId(null);
      setQuickYearInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30 shadow-2xl flex flex-col"
        style={{
          background: 'var(--surface)',
          borderTop: '1.5px solid var(--border)',
          height: showUnscheduled ? '320px' : '230px',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Timeline Header Bar */}
        <div
          className="px-6 py-2.5 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: 'var(--border-light)', background: '#FAF8F4' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock size={14} style={{ color: 'var(--accent-rust)' }} />
              <span className="font-mono text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-primary)' }}>
                Chronology & Epochs
              </span>
            </div>

            <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              ({minYear} → {maxYear})
            </span>

            {/* Unscheduled Count Badge */}
            {unscheduledNodes.length > 0 && (
              <button
                onClick={() => setShowUnscheduled(v => !v)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border hover:bg-[#ECE8DF] transition-colors"
                style={{
                  borderColor: showUnscheduled ? 'var(--accent-rust)' : 'var(--border)',
                  color: showUnscheduled ? 'var(--accent-rust)' : 'var(--text-secondary)',
                }}
              >
                <span>{unscheduledNodes.length} undated</span>
                {showUnscheduled ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingEra(undefined); setShowCreateEra(true); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors hover:bg-[#ECE8DF]"
              style={{ color: 'var(--accent-rust)', border: '1px solid var(--border)' }}
            >
              <Plus size={12} />
              <span>Add Epoch</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#ECE8DF] transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              title="Close Timeline (T)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Unscheduled Shelf Drawer (if open) */}
        {showUnscheduled && (
          <div
            className="px-6 py-2 border-b flex-shrink-0 flex items-center gap-2 overflow-x-auto"
            style={{ borderColor: 'var(--border-light)', background: '#F4F1EA' }}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              Undated Ideas:
            </span>

            <div className="flex items-center gap-2 flex-nowrap">
              {unscheduledNodes.map(node => {
                const conf = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG.CONCEPT;
                const isQuick = quickDateNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    className="flex items-center gap-1 px-2 py-1 rounded border bg-[var(--surface)] shadow-sm flex-shrink-0 text-xs"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span style={{ color: conf.color }}>{conf.symbol}</span>
                    <span className="font-serif truncate max-w-[110px]" style={{ color: 'var(--text-primary)' }}>
                      {node.title}
                    </span>

                    {isQuick ? (
                      <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="number"
                          placeholder="Year"
                          value={quickYearInput}
                          onChange={e => setQuickYearInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleQuickAssignYear(node.id); }}
                          className="w-16 px-1 py-0.5 text-xs font-mono rounded border bg-transparent focus:outline-none focus:border-[#8A4938]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleQuickAssignYear(node.id)}
                          className="px-1 py-0.5 rounded text-[10px] bg-[#8A4938] text-white"
                        >
                          Set
                        </button>
                        <button
                          onClick={() => setQuickDateNodeId(null)}
                          className="px-1 py-0.5 text-[10px] text-gray-500 hover:text-black"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setQuickDateNodeId(node.id); setQuickYearInput(''); }}
                        className="ml-1 px-1 py-0.2 rounded text-[10px] font-mono hover:bg-[#ECE8DF] text-[#8A4938]"
                        title="Set Year"
                      >
                        + Year
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Timeline Canvas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative select-none"
          style={{ background: 'var(--surface)' }}
        >
          <div className="relative h-full" style={{ width: `${trackWidth}px`, minWidth: '100%' }}>
            {/* 1. ERA BANDS (Top Track) */}
            <div className="h-9 relative mb-4">
              {eras.length > 0 ? (
                eras.map(era => {
                  const leftPercent = Math.max(0, getXPercent(era.startYear));
                  const rightPercent = Math.min(100, getXPercent(era.endYear));
                  const widthPercent = Math.max(rightPercent - leftPercent, 2);

                  return (
                    <div
                      key={era.id}
                      onClick={() => { setEditingEra(era); setShowCreateEra(true); }}
                      className="absolute top-0 h-8 rounded-md px-2.5 flex items-center justify-between cursor-pointer border group transition-all hover:brightness-95 shadow-sm"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        background: `${era.color}15`,
                        borderColor: era.color,
                      }}
                      title={`${era.name} (${era.startYear} – ${era.endYear})\n${era.description || 'Click to edit epoch'}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: era.color }} />
                        <span className="font-serif text-xs font-medium truncate" style={{ color: era.color }}>
                          {era.name}
                        </span>
                        <span className="text-[10px] font-mono opacity-60 hidden sm:inline" style={{ color: era.color }}>
                          ({era.startYear}–{era.endYear})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => handleDeleteEra(era.id, e)}
                          className="p-0.5 rounded hover:bg-red-100 text-red-600"
                          title="Delete epoch"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-8 border border-dashed rounded-md flex items-center justify-center gap-2 text-xs font-serif italic text-[#73716B]">
                  <span>No epochs defined yet.</span>
                  <button
                    onClick={() => { setEditingEra(undefined); setShowCreateEra(true); }}
                    className="font-mono not-italic text-[11px] underline text-[#8A4938]"
                  >
                    + Define an Epoch
                  </button>
                </div>
              )}
            </div>

            {/* 2. RULER AXIS & TICKS */}
            <div className="relative h-4 border-t border-b flex items-center" style={{ borderColor: 'var(--border)' }}>
              {/* Generate 8 to 12 milestone tick marks */}
              {Array.from({ length: 9 }).map((_, i) => {
                const fraction = i / 8;
                const year = Math.round(minYear + yearSpan * fraction);
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ left: `${fraction * 100}%` }}
                  >
                    <div className="w-px h-2 bg-gray-400" />
                    <span className="text-[9px] font-mono mt-3" style={{ color: 'var(--text-tertiary)' }}>
                      {year}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 3. PLOTTED NODE PINS & CARDS (Bottom Track) */}
            <div className="relative h-16 mt-4">
              {scheduledNodes.length > 0 ? (
                scheduledNodes.map(node => {
                  const conf = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG.CONCEPT;
                  const xPercent = getXPercent(node.year ?? minYear);

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node.id)}
                      className="absolute top-0 -translate-x-1/2 group cursor-pointer"
                      style={{ left: `${xPercent}%` }}
                    >
                      {/* Vertical connector tick */}
                      <div className="w-px h-3 bg-[#8A4938] mx-auto opacity-40 group-hover:opacity-100 transition-opacity" />

                      {/* Plotted Node Card */}
                      <div
                        className="px-2.5 py-1 rounded border shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 hover:shadow-md"
                        style={{
                          background: 'var(--surface)',
                          borderColor: conf.color,
                        }}
                      >
                        <span className="text-xs" style={{ color: conf.color }}>{conf.symbol}</span>
                        <div className="flex flex-col min-w-0 max-w-[120px]">
                          <span className="font-serif text-xs font-medium leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                            {node.title}
                          </span>
                          <span className="font-mono text-[9px] leading-tight" style={{ color: 'var(--accent-rust)' }}>
                            {node.dateLabel || `${node.year}`}
                          </span>
                        </div>

                        {/* Quick Camera Focus Button */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onFocusNode(node.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#ECE8DF] rounded text-gray-500 hover:text-black transition-opacity"
                          title="Focus on canvas"
                        >
                          <Eye size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center pt-2 text-xs font-serif italic text-[#73716B]">
                  No ideas have been scheduled along the timeline yet. Set dates on ideas to plot them chronologically.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create / Edit Era Modal */}
      {showCreateEra && (
        <CreateEraModal
          ideaId={ideaId}
          existingEra={editingEra}
          onClose={() => { setShowCreateEra(false); setEditingEra(undefined); }}
          onSaved={handleSaveEra}
        />
      )}
    </>
  );
}
