import Decimal from 'decimal.js';
import type { SupplyChainGraph } from '../types';

export interface GraphValidationResult {
  isValid: boolean;
  isDag: boolean;
  hasShareIntegrity: boolean;
  topologicalOrder?: string[];
  errors: string[];
}

/**
 * Validates DAG topological constraints (acyclic) using Kahn's algorithm
 * and validates that incoming baselineShares strictly sum to 1.0 (using Decimal.js)
 * for all target nodes and commodities.
 *
 * @param graph - The supply chain graph to validate
 * @returns GraphValidationResult
 */
export function validateSupplyChainGraph(
  graph: SupplyChainGraph
): GraphValidationResult {
  const errors: string[] = [];

  // 1. Strict Baseline Share Sum Invariant (Decimal.js)
  let hasShareIntegrity = true;
  // Group in-edges by targetNodeId -> commodityId
  const inEdgesMap = new Map<string, Map<string, typeof graph.edges>>();

  for (const edge of graph.edges) {
    if (!inEdgesMap.has(edge.targetNodeId)) {
      inEdgesMap.set(edge.targetNodeId, new Map());
    }
    const commodityMap = inEdgesMap.get(edge.targetNodeId)!;
    if (!commodityMap.has(edge.commodityId)) {
      commodityMap.set(edge.commodityId, []);
    }
    commodityMap.get(edge.commodityId)!.push(edge);
  }

  for (const [targetId, commodityMap] of inEdgesMap.entries()) {
    for (const [commodityId, edges] of commodityMap.entries()) {
      let sum = new Decimal(0);
      for (const edge of edges) {
        sum = sum.plus(new Decimal(edge.baselineShare));
      }

      if (!sum.equals(new Decimal(1.0))) {
        hasShareIntegrity = false;
        errors.push(
          `Share integrity violation: Target node '${targetId}' for commodity '${commodityId}' has baselineShare sum of ${sum.toString()} (expected strictly 1.0)`
        );
      }
    }
  }

  // 2. Kahn's Algorithm for DAG Cycle Detection & Topological Sort
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.sourceNodeId)) {
      errors.push(`Edge '${edge.id}' references unknown source node '${edge.sourceNodeId}'`);
      continue;
    }
    if (!nodeIds.has(edge.targetNodeId)) {
      errors.push(`Edge '${edge.id}' references unknown target node '${edge.targetNodeId}'`);
      continue;
    }

    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    adjacency.get(edge.sourceNodeId)!.push(edge.targetNodeId);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      const nextDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, nextDeg);
      if (nextDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  const isDag = topologicalOrder.length === graph.nodes.length;
  if (!isDag) {
    errors.push(
      `Cycle detected: Topological sort visited ${topologicalOrder.length} of ${graph.nodes.length} nodes. Graph contains circular dependencies.`
    );
  }

  const isValid = hasShareIntegrity && isDag && errors.length === 0;

  return {
    isValid,
    isDag,
    hasShareIntegrity,
    topologicalOrder: isDag ? topologicalOrder : undefined,
    errors,
  };
}
