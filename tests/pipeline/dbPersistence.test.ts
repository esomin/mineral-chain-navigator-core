import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../helpers/testDb';
import { GraphRepository } from '../../src/db/repository/graphRepository';
import { DEFAULT_SUPPLY_CHAIN_GRAPH } from '../../src/domain/seed/seedGraph';
import { nodes, edges } from '../../src/db/schema';

describe('Database Persistence & Idempotent Seeding (US1)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
  });

  it('seeds default supply chain graph idempotently (running twice causes no duplicates or errors)', async () => {
    const repo = new GraphRepository(db);

    // 1st run
    const result1 = await repo.seedSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
    expect(result1.insertedNodes).toBe(14);
    expect(result1.insertedEdges).toBe(DEFAULT_SUPPLY_CHAIN_GRAPH.edges.length);

    const nodesCount1 = await db.select().from(nodes);
    const edgesCount1 = await db.select().from(edges);
    expect(nodesCount1).toHaveLength(14);
    expect(edgesCount1).toHaveLength(DEFAULT_SUPPLY_CHAIN_GRAPH.edges.length);

    // 2nd run (idempotency check)
    const result2 = await repo.seedSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
    expect(result2.insertedNodes).toBe(14);

    const nodesCount2 = await db.select().from(nodes);
    const edgesCount2 = await db.select().from(edges);
    expect(nodesCount2).toHaveLength(14);
    expect(edgesCount2).toHaveLength(DEFAULT_SUPPLY_CHAIN_GRAPH.edges.length);
  });

  it('loads active supply chain graph matching Spec 1 SupplyChainGraphSchema', async () => {
    const repo = new GraphRepository(db);
    await repo.seedSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);

    const loadedGraph = await repo.getActiveSupplyChainGraph();
    expect(loadedGraph.nodes).toHaveLength(14);
    expect(loadedGraph.edges).toHaveLength(DEFAULT_SUPPLY_CHAIN_GRAPH.edges.length);

    // Check specific node details
    const posco = loadedGraph.nodes.find((n) => n.id === 'NODE_KR_POSCO_FUTURE_M');
    expect(posco).toBeDefined();
    expect(posco?.categories).toEqual(['ACTIVE_MATERIAL']);
    expect(posco?.granularity).toBe('FACILITY');
  });
});

