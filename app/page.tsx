'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, Plus, Sparkles, User, Wand2, Compass, RefreshCw } from 'lucide-react';
import { useLoreGraph, LoreGraphProvider } from '@/lib/context';
import { Navigation } from '@/components/ui/Navigation';
import { CreateIdeaModal } from '@/components/modals/CreateIdeaModal';
import { nodeRepo } from '@/lib/storage/repository';
import { formatRelativeTime } from '@/lib/utils';
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypes';

function HomePageContent() {
  const router = useRouter();
  const { ideas, inbox, deleteIdea, restoreDemoData } = useLoreGraph();
  const [createOpen, setCreateOpen] = useState(false);

  // Aggregate characters, magic, lore across all worlds for the index
  const { characters, systems, recentIdeas } = useMemo(() => {
    const allChars: Array<{ id: string; ideaId: string; ideaTitle: string; title: string; desc: string; type: string }> = [];
    const allSystems: Array<{ id: string; ideaId: string; ideaTitle: string; title: string; desc: string; type: string }> = [];

    ideas.forEach(idea => {
      const nodes = nodeRepo.getAllByIdeaId(idea.id);
      nodes.forEach(node => {
        if (node.isRoot) return;
        if (node.type === 'CHARACTER') {
          allChars.push({ id: node.id, ideaId: idea.id, ideaTitle: idea.title, title: node.title, desc: node.description, type: node.type });
        } else if (['MAGIC', 'ABILITY', 'LORE', 'CONCEPT'].includes(node.type)) {
          allSystems.push({ id: node.id, ideaId: idea.id, ideaTitle: idea.title, title: node.title, desc: node.description, type: node.type });
        }
      });
    });

    // Sort recent ideas by update time
    const sorted = [...ideas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return {
      characters: allChars.slice(0, 8),
      systems: allSystems.slice(0, 10),
      recentIdeas: sorted.slice(0, 3),
    };
  }, [ideas]);

  const pendingInbox = inbox.filter(i => i.status === 'pending');

  // Dynamically compute sequential section numbers
  let sectionIndex = 1;
  const nextSectionNum = () => {
    const num = sectionIndex < 10 ? `0${sectionIndex}` : `${sectionIndex}`;
    sectionIndex++;
    return num;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navigation />

      <main className="pt-24 pb-32 px-6 sm:px-12 md:px-20 max-w-5xl mx-auto">
        {/* Editorial Masthead */}
        <section className="mb-20 sm:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight mb-4 leading-[1.1]"
              style={{ color: 'var(--text-primary)' }}
            >
              LoreGraph
            </h1>
            <p
              className="text-lg sm:text-xl font-serif italic max-w-xl leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              A place for ideas that have not finished becoming worlds.
            </p>
          </motion.div>
        </section>

        {/* Recently Touched Section */}
        {recentIdeas.length > 0 && (
          <section className="mb-20">
            <div className="flex items-baseline justify-between border-b pb-3 mb-6" style={{ borderColor: 'var(--border)' }}>
              <h2
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.18em' }}
              >
                Recently Touched
              </h2>
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                Active Threads
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentIdeas.map((idea) => {
                const nodeCount = nodeRepo.getAllByIdeaId(idea.id).length;
                return (
                  <div
                    key={idea.id}
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                    className="group cursor-pointer p-4 rounded transition-all hover:bg-[#ECE8DF]/60"
                    style={{ border: '1px solid var(--border-light)' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="font-serif text-lg font-medium group-hover:text-[#8A4938] transition-colors leading-snug"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {idea.title}
                      </h3>
                      <ArrowUpRight
                        size={15}
                        className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0"
                        style={{ color: 'var(--accent-rust)' }}
                      />
                    </div>
                    <p
                      className="text-xs leading-relaxed line-clamp-2 mb-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {idea.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{nodeCount} {nodeCount === 1 ? 'idea' : 'ideas'}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(idea.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Master Index */}
        <section className="space-y-16">
          <div className="flex items-baseline justify-between border-b pb-3 mb-8" style={{ borderColor: 'var(--border)' }}>
            <h2
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.18em' }}
            >
              Index
            </h2>
            <button
              onClick={() => setCreateOpen(true)}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--accent-rust)', textUnderlineOffset: '3px' }}
            >
              <Plus size={13} />
              <span>New World</span>
            </button>
          </div>

          {/* WORLDS SECTION */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs" style={{ color: 'var(--accent-rust)' }}>{nextSectionNum()}</span>
              <h3 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '0.15em' }}>
                Worlds & Universes
              </h3>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {ideas.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-serif italic text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Your archive has no worlds yet.
                  </p>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="px-5 py-2.5 rounded text-xs font-medium"
                    style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}
                  >
                    + Create First World
                  </button>
                </div>
              ) : (
                ideas.map(idea => {
                  const nodes = nodeRepo.getAllByIdeaId(idea.id);
                  return (
                    <div
                      key={idea.id}
                      onClick={() => router.push(`/ideas/${idea.id}`)}
                      className="group py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 cursor-pointer transition-all hover:pl-2"
                    >
                      <div className="space-y-1 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-xl sm:text-2xl font-normal group-hover:text-[#8A4938] transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {idea.title}
                          </span>
                          <ArrowUpRight
                            size={16}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: 'var(--accent-rust)' }}
                          />
                        </div>
                        <p className="text-xs max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {idea.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono flex-shrink-0 pt-1 sm:pt-0" style={{ color: 'var(--text-tertiary)' }}>
                        {idea.tags.length > 0 && (
                          <span className="hidden md:inline">
                            {idea.tags.slice(0, 2).join(' · ')}
                          </span>
                        )}
                        <span>{nodes.length} ideas</span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete the world "${idea.title}" and all its ideas?`)) {
                              deleteIdea(idea.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-[#9B3D3D] px-2 py-1 rounded text-[11px] font-mono border border-transparent hover:border-red-200"
                          title="Delete world"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CHARACTERS SECTION (if any exist) */}
          {characters.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs" style={{ color: 'var(--accent-rust)' }}>{nextSectionNum()}</span>
                <h3 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '0.15em' }}>
                  Key Figures & Characters
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {characters.map(char => (
                  <Link
                    key={char.id}
                    href={`/ideas/${char.ideaId}?node=${char.id}`}
                    className="group flex items-baseline justify-between py-2 border-b transition-all hover:pl-1.5"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <div className="flex items-baseline gap-2 min-w-0 pr-2">
                      <span className="text-[10px]" style={{ color: NODE_TYPE_CONFIG.CHARACTER.color }}>●</span>
                      <span className="font-serif text-base group-hover:text-[#8A4938] transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                        {char.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      {char.ideaTitle}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SYSTEMS & LORE SECTION (if any exist) */}
          {systems.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs" style={{ color: 'var(--accent-rust)' }}>{nextSectionNum()}</span>
                <h3 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '0.15em' }}>
                  Magic, Lore & Concepts
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {systems.map(sys => {
                  const conf = NODE_TYPE_CONFIG[sys.type as keyof typeof NODE_TYPE_CONFIG] || NODE_TYPE_CONFIG.CONCEPT;
                  return (
                    <Link
                      key={sys.id}
                      href={`/ideas/${sys.ideaId}?node=${sys.id}`}
                      className="group flex items-baseline justify-between py-2 border-b transition-all hover:pl-1.5"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <div className="flex items-baseline gap-2 min-w-0 pr-2">
                        <span className="text-[10px]" style={{ color: conf.color }}>{conf.symbol}</span>
                        <span className="font-serif text-base group-hover:text-[#8A4938] transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                          {sys.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        {sys.ideaTitle}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* FRAGMENTS & SPARKS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs" style={{ color: 'var(--accent-rust)' }}>{nextSectionNum()}</span>
                <h3 className="text-xs font-mono uppercase tracking-widest font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '0.15em' }}>
                  Fragments & Sparks
                </h3>
              </div>
            </div>

            {pendingInbox.length === 0 ? (
              <p className="text-xs font-serif italic py-3" style={{ color: 'var(--text-secondary)' }}>
                No loose fragments right now. Capture fleeting thoughts with Quick Thought.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingInbox.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded transition-colors"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
                  >
                    <p className="text-sm font-serif italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      &ldquo;{item.content}&rdquo;
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px] font-mono" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
                      <span>Captured {formatRelativeTime(item.createdAt)}</span>
                      <span style={{ color: 'var(--accent-rust)' }}>Waiting to become a world</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {createOpen && <CreateIdeaModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <LoreGraphProvider>
      <HomePageContent />
    </LoreGraphProvider>
  );
}
