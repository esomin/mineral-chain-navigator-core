import { nodes, edges } from '../schema';
import type { NodeSelect, EdgeSelect } from '../schema';
import type { SupplyChainGraph, SupplyChainNode, SupplyChainEdge } from '../../domain/types';
import { SupplyChainGraphSchema } from '../../domain/types';

export class GraphRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly db: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(db: any) {
    this.db = db;
  }

  /**
   * Seeds the default supply chain graph into DB with idempotency (Upsert on ID).
   */
  async seedSupplyChainGraph(graph: SupplyChainGraph): Promise<{ insertedNodes: number; insertedEdges: number }> {
    // 1. Upsert Nodes
    for (const node of graph.nodes) {
      await this.db
        .insert(nodes)
        .values({
          id: node.id,
          name: node.name,
          countryCode: node.countryCode,
          categories: node.categories,
          granularity: node.granularity,
          annualCapacity: node.annualCapacity.toString(),
          capacityUnit: node.capacityUnit,
          isFeocRisk: node.isFeocRisk,
          uiPosition: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: nodes.id,
          set: {
            name: node.name,
            countryCode: node.countryCode,
            categories: node.categories,
            granularity: node.granularity,
            annualCapacity: node.annualCapacity.toString(),
            capacityUnit: node.capacityUnit,
            isFeocRisk: node.isFeocRisk,
            updatedAt: new Date(),
          },
        });
    }

    // 2. Upsert Edges
    for (const edge of graph.edges) {
      await this.db
        .insert(edges)
        .values({
          id: edge.id,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          commodityId: edge.commodityId,
          baselineShare: edge.baselineShare.toFixed(4),
          annualVolume: edge.annualVolume.toString(),
          unit: edge.unit,
          basePeriod: '2026',
        })
        .onConflictDoUpdate({
          target: edges.id,
          set: {
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            commodityId: edge.commodityId,
            baselineShare: edge.baselineShare.toFixed(4),
            annualVolume: edge.annualVolume.toString(),
            unit: edge.unit,
            basePeriod: '2026',
          },
        });
    }

    return {
      insertedNodes: graph.nodes.length,
      insertedEdges: graph.edges.length,
    };
  }

  /**
   * Retrieves active nodes and edges and constructs a validated SupplyChainGraph.
   */
  async getActiveSupplyChainGraph(): Promise<SupplyChainGraph> {
    const rawNodes = await this.db.select().from(nodes);
    const rawEdges = await this.db.select().from(edges);

    const mappedNodes: SupplyChainNode[] = rawNodes.map((n: NodeSelect) => ({
      id: n.id,
      name: n.name,
      countryCode: n.countryCode.trim(),
      categories: n.categories,
      granularity: n.granularity,
      annualCapacity: Number(n.annualCapacity),
      capacityUnit: n.capacityUnit,
      isFeocRisk: n.isFeocRisk,
    }));

    const mappedEdges: SupplyChainEdge[] = rawEdges.map((e: EdgeSelect) => ({
      id: e.id,
      sourceNodeId: e.sourceNodeId,
      targetNodeId: e.targetNodeId,
      commodityId: e.commodityId,
      baselineShare: Number(e.baselineShare),
      annualVolume: Number(e.annualVolume),
      unit: e.unit,
    }));

    return SupplyChainGraphSchema.parse({
      nodes: mappedNodes,
      edges: mappedEdges,
    });
  }
}
