// ─── Graph Visibility Helpers ─────────────────────────────────────────────────
// Pure functions for computing which nodes/edges are visible given a set of
// collapsed node IDs. Designed for correctness on non-tree graphs (shared nodes).
//
// Convention: edges run source → target meaning "parent → child".
// Collapsing a node hides all nodes reachable *only* through that collapsed node.

import type { LoreNode } from '@/types/node';
import type { LoreEdge } from '@/types/edge';

// ─── BFS: collect all descendants of a node ──────────────────────────────────

export function getDescendants(
  nodeId: string,
  allEdges: LoreEdge[],
): Set<string> {
  const descendants = new Set<string>();
  const queue: string[] = [nodeId];
  const visited = new Set<string>([nodeId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of allEdges) {
      if (edge.source === current && !visited.has(edge.target)) {
        visited.add(edge.target);
        descendants.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return descendants;
}

// ─── Compute child count per node (for chevron visibility) ───────────────────

export function getChildCounts(allEdges: LoreEdge[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of allEdges) {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
  }
  return counts;
}

// ─── Compute hidden node IDs ─────────────────────────────────────────────────
// A node is hidden if it is a descendant of at least one collapsed ancestor
// AND it has no path from a visible (non-collapsed) ancestor.
//
// Algorithm:
// 1. Collect all descendants of every collapsed node.
// 2. Remove from that set any nodes that are also reachable from a visible root
//    (i.e. a non-collapsed, non-hidden parent).
// 3. The collapsed nodes themselves remain visible (they just show the count badge).

export function computeHiddenNodeIds(
  collapsedIds: Set<string>,
  allNodes: LoreNode[],
  allEdges: LoreEdge[],
): Set<string> {
  if (collapsedIds.size === 0) return new Set();

  const allNodeIds = new Set(allNodes.map(n => n.id));

  // Step 1: collect candidates — all descendants of all collapsed nodes
  const candidateHidden = new Set<string>();
  for (const collapsedId of collapsedIds) {
    const descendants = getDescendants(collapsedId, allEdges);
    for (const d of descendants) {
      candidateHidden.add(d);
    }
  }

  // Step 2: find nodes that are reachable from visible (non-hidden) ancestors
  // We do a forward BFS/DFS starting from all nodes that are NOT in candidateHidden
  // and NOT collapsed, following edges, stopping at collapsed nodes.
  const visibleReachable = new Set<string>();

  // Seed: all nodes not in candidates
  for (const nodeId of allNodeIds) {
    if (!candidateHidden.has(nodeId)) {
      visibleReachable.add(nodeId);
    }
  }

  // Now propagate: from any visible node, follow edges — but STOP at collapsed nodes
  // (collapsed nodes themselves are visible but their children are blocked)
  const propagateQueue = Array.from(visibleReachable);
  const propagateVisited = new Set<string>(visibleReachable);

  while (propagateQueue.length > 0) {
    const current = propagateQueue.shift()!;
    // If this node is collapsed, its children are blocked — don't traverse through
    if (collapsedIds.has(current)) continue;
    for (const edge of allEdges) {
      if (edge.source === current && !propagateVisited.has(edge.target)) {
        propagateVisited.add(edge.target);
        visibleReachable.add(edge.target);
        propagateQueue.push(edge.target);
      }
    }
  }

  // Step 3: final hidden set = candidates that are NOT in visibleReachable
  const hidden = new Set<string>();
  for (const nodeId of candidateHidden) {
    if (!visibleReachable.has(nodeId)) {
      hidden.add(nodeId);
    }
  }

  return hidden;
}

// ─── Derive visible nodes / edges ─────────────────────────────────────────────

export function getVisibleNodes(
  allNodes: LoreNode[],
  hiddenNodeIds: Set<string>,
): LoreNode[] {
  if (hiddenNodeIds.size === 0) return allNodes;
  return allNodes.filter(n => !hiddenNodeIds.has(n.id));
}

export function getVisibleEdges(
  allEdges: LoreEdge[],
  hiddenNodeIds: Set<string>,
): LoreEdge[] {
  if (hiddenNodeIds.size === 0) return allEdges;
  return allEdges.filter(
    e => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target),
  );
}

// ─── Count hidden descendants per collapsed node (for badge) ─────────────────

export function getHiddenDescendantCounts(
  collapsedIds: Set<string>,
  hiddenNodeIds: Set<string>,
  allEdges: LoreEdge[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const collapsedId of collapsedIds) {
    const descendants = getDescendants(collapsedId, allEdges);
    let count = 0;
    for (const d of descendants) {
      if (hiddenNodeIds.has(d)) count++;
    }
    counts.set(collapsedId, count);
  }
  return counts;
}
