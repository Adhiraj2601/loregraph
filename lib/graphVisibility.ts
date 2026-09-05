// ─── Graph Visibility Helpers ─────────────────────────────────────────────────
// Pure functions for computing which nodes/edges are visible given a set of
// collapsed node IDs.
//
// Handles arbitrary graph topologies and edge drawing directions (user may draw
// handles parent→child or child→parent) by establishing a hierarchy rooted at
// ROOT nodes (or primary in-degree/depth nodes).

import type { LoreNode } from '@/types/node';
import type { LoreEdge } from '@/types/edge';

// ─── Build directed parent → child adjacency based on graph depth ────────────

export interface GraphHierarchy {
  childrenMap: Map<string, Set<string>>; // parentId -> set of childIds
  parentsMap: Map<string, Set<string>>;  // childId -> set of parentIds
}

export function buildGraphHierarchy(
  allNodes: LoreNode[],
  allEdges: LoreEdge[],
): GraphHierarchy {
  const childrenMap = new Map<string, Set<string>>();
  const parentsMap = new Map<string, Set<string>>();

  for (const node of allNodes) {
    childrenMap.set(node.id, new Set<string>());
    parentsMap.set(node.id, new Set<string>());
  }

  // 1. Find roots
  const rootIds = allNodes.filter(n => n.isRoot).map(n => n.id);
  const startRoots = rootIds.length > 0
    ? rootIds
    : (allNodes.length > 0 ? [allNodes[0].id] : []);

  // 2. Compute depths from roots using undirected BFS
  const nodeDepths = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [];

  for (const rId of startRoots) {
    nodeDepths.set(rId, 0);
    visited.add(rId);
    queue.push({ id: rId, depth: 0 });
  }

  // Undirected adjacency
  const undirectedAdj = new Map<string, Set<string>>();
  for (const node of allNodes) {
    undirectedAdj.set(node.id, new Set());
  }
  for (const edge of allEdges) {
    if (undirectedAdj.has(edge.source) && undirectedAdj.has(edge.target)) {
      undirectedAdj.get(edge.source)!.add(edge.target);
      undirectedAdj.get(edge.target)!.add(edge.source);
    }
  }

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const neighbors = undirectedAdj.get(id);
    if (!neighbors) continue;

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        nodeDepths.set(neighborId, depth + 1);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    }
  }

  // Handle any disconnected components that weren't reached
  for (const node of allNodes) {
    if (!visited.has(node.id)) {
      nodeDepths.set(node.id, 0);
      visited.add(node.id);
      queue.push({ id: node.id, depth: 0 });

      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        const neighbors = undirectedAdj.get(id);
        if (!neighbors) continue;
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            nodeDepths.set(neighborId, depth + 1);
            queue.push({ id: neighborId, depth: depth + 1 });
          }
        }
      }
    }
  }

  // 3. Assign parent -> child on each edge
  for (const edge of allEdges) {
    const depthSource = nodeDepths.get(edge.source) ?? 0;
    const depthTarget = nodeDepths.get(edge.target) ?? 0;

    let parent: string;
    let child: string;

    if (depthSource < depthTarget) {
      parent = edge.source;
      child = edge.target;
    } else if (depthTarget < depthSource) {
      parent = edge.target;
      child = edge.source;
    } else {
      // Same depth: fallback to edge source -> target
      parent = edge.source;
      child = edge.target;
    }

    if (childrenMap.has(parent) && parentsMap.has(child) && parent !== child) {
      childrenMap.get(parent)!.add(child);
      parentsMap.get(child)!.add(parent);
    }
  }

  return { childrenMap, parentsMap };
}

// ─── Get all descendants of a node ───────────────────────────────────────────

export function getDescendants(
  nodeId: string,
  childrenMap: Map<string, Set<string>>,
): Set<string> {
  const descendants = new Set<string>();
  const queue: string[] = [nodeId];
  const visited = new Set<string>([nodeId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current);
    if (!children) continue;

    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        descendants.add(childId);
        queue.push(childId);
      }
    }
  }

  return descendants;
}

// ─── Compute child counts ───────────────────────────────────────────────────

export function getChildCounts(childrenMap: Map<string, Set<string>>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const [id, children] of childrenMap.entries()) {
    counts.set(id, children.size);
  }
  return counts;
}

// ─── Compute hidden node IDs ─────────────────────────────────────────────────

export function computeHiddenNodeIds(
  collapsedIds: Set<string>,
  allNodes: LoreNode[],
  allEdges: LoreEdge[],
): Set<string> {
  if (collapsedIds.size === 0) return new Set();

  const { childrenMap, parentsMap } = buildGraphHierarchy(allNodes, allEdges);
  const allNodeIds = new Set(allNodes.map(n => n.id));

  // Step 1: collect all potential hidden candidates (descendants of collapsed nodes)
  const candidateHidden = new Set<string>();
  for (const collapsedId of collapsedIds) {
    const descendants = getDescendants(collapsedId, childrenMap);
    for (const d of descendants) {
      candidateHidden.add(d);
    }
  }

  // Step 2: find all nodes reachable from visible roots without passing through collapsed nodes
  const visibleReachable = new Set<string>();
  for (const nodeId of allNodeIds) {
    if (!candidateHidden.has(nodeId)) {
      visibleReachable.add(nodeId);
    }
  }

  const propagateQueue = Array.from(visibleReachable);
  const propagateVisited = new Set<string>(visibleReachable);

  while (propagateQueue.length > 0) {
    const current = propagateQueue.shift()!;
    // If this node is collapsed, stop propagation downstream
    if (collapsedIds.has(current)) continue;

    const children = childrenMap.get(current);
    if (!children) continue;

    for (const childId of children) {
      if (!propagateVisited.has(childId)) {
        propagateVisited.add(childId);
        visibleReachable.add(childId);
        propagateQueue.push(childId);
      }
    }
  }

  // Step 3: hidden set = candidates not reachable from visible nodes
  const hidden = new Set<string>();
  for (const candidateId of candidateHidden) {
    if (!visibleReachable.has(candidateId)) {
      hidden.add(candidateId);
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
  childrenMap: Map<string, Set<string>>,
  hiddenNodeIds: Set<string>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const collapsedId of collapsedIds) {
    const descendants = getDescendants(collapsedId, childrenMap);
    let count = 0;
    for (const d of descendants) {
      if (hiddenNodeIds.has(d)) count++;
    }
    counts.set(collapsedId, count);
  }
  return counts;
}
