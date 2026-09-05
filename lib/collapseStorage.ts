'use client';

// ─── Collapse State Persistence ───────────────────────────────────────────────
// Persists the Set of collapsed node IDs per idea in localStorage.
// Format: loregraph:collapsed:<ideaId> → JSON array of node IDs

const collapseKey = (ideaId: string) => `loregraph:collapsed:${ideaId}`;

export function loadCollapsed(ideaId: string): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(collapseKey(ideaId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set<string>(parsed);
  } catch {}
  return new Set();
}

export function saveCollapsed(ideaId: string, collapsed: Set<string>): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(collapseKey(ideaId), JSON.stringify(Array.from(collapsed)));
  } catch {}
}

export function clearCollapsed(ideaId: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(collapseKey(ideaId));
  } catch {}
}
