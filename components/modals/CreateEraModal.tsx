'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { Era } from '@/types/era';
import { eraRepo } from '@/lib/storage/repository';

interface CreateEraModalProps {
  ideaId: string;
  existingEra?: Era;
  onClose: () => void;
  onSaved: (era: Era) => void;
}

const ERA_COLORS = [
  '#8A4938', // rust
  '#596A72', // slate
  '#9E6B47', // ochre
  '#657560', // olive
  '#7D5A68', // plum
  '#857865', // clay
  '#5B6E68', // forest slate
  '#3D3A37', // dark graphite
];

export function CreateEraModal({ ideaId, existingEra, onClose, onSaved }: CreateEraModalProps) {
  const [name, setName] = useState(existingEra?.name || '');
  const [startYear, setStartYear] = useState<number>(existingEra?.startYear ?? 0);
  const [endYear, setEndYear] = useState<number>(existingEra?.endYear ?? 100);
  const [color, setColor] = useState(existingEra?.color || ERA_COLORS[0]);
  const [description, setDescription] = useState(existingEra?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Era name is required');
      return;
    }
    if (startYear > endYear) {
      setError('Start year cannot be greater than end year');
      return;
    }

    if (existingEra) {
      const updated = eraRepo.update(existingEra.id, {
        name: name.trim(),
        startYear,
        endYear,
        color,
        description: description.trim(),
      });
      if (updated) onSaved(updated);
    } else {
      const created = eraRepo.create({
        ideaId,
        name: name.trim(),
        startYear,
        endYear,
        color,
        description: description.trim(),
      });
      onSaved(created);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(23, 23, 23, 0.4)', backdropFilter: 'blur(4px)' }} />

        <motion.div
          className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden z-10"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <Calendar size={15} style={{ color }} />
              <h2 className="font-serif text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                {existingEra ? 'Edit Historical Epoch' : 'New Historical Epoch'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#ECE8DF] transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-2.5 rounded text-xs font-mono text-[#9B3D3D] bg-red-50 border border-red-200">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                Epoch / Era Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Age of Ash, The First Dynasty, Era of Dawn"
                className="w-full px-3 py-2 text-sm font-serif rounded border bg-[var(--surface)] focus:outline-none focus:border-[#8A4938]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>

            {/* Year Span */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Start Year
                </label>
                <input
                  type="number"
                  value={startYear}
                  onChange={e => setStartYear(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded border bg-[var(--surface)] focus:outline-none focus:border-[#8A4938]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                  End Year
                </label>
                <input
                  type="number"
                  value={endYear}
                  onChange={e => setEndYear(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded border bg-[var(--surface)] focus:outline-none focus:border-[#8A4938]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Timeline Color Banner
              </label>
              <div className="flex items-center gap-2">
                {ERA_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border transition-transform"
                    style={{
                      background: c,
                      borderColor: color === c ? 'var(--text-primary)' : 'transparent',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: color === c ? '0 0 0 2px var(--surface), 0 0 0 3.5px ' + c : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                Epoch Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Key themes, events, or cultural shifts of this era..."
                rows={3}
                className="w-full p-2.5 text-xs font-serif rounded border bg-[var(--surface)] focus:outline-none focus:border-[#8A4938] resize-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded border hover:bg-[#ECE8DF] transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded text-white transition-colors"
                style={{ background: 'var(--accent-rust)' }}
              >
                {existingEra ? 'Save Epoch' : 'Create Epoch'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
