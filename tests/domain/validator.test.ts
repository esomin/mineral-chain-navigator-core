import { describe, it, expect } from 'vitest';
import { validateSupplyChainGraph } from '../../src/domain/graph/validator';
import { DEFAULT_SUPPLY_CHAIN_GRAPH } from '../../src/domain/seed/seedGraph';
import { SupplyChainGraph } from '../../src/domain/types';

describe('Graph Validator Tests (US3)', () => {
  it('validates that DEFAULT_SUPPLY_CHAIN_GRAPH is a valid DAG with 100% share integrity', () => {
    const result = validateSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
    expect(result.isValid).toBe(true);
    expect(result.isDag).toBe(true);
    expect(result.hasShareIntegrity).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.topologicalOrder).toBeDefined();
    expect(result.topologicalOrder?.length).toBe(DEFAULT_SUPPLY_CHAIN_GRAPH.nodes.length);
  });

  it('detects violation when baselineShare sum is not strictly 1.0 (Decimal precision)', () => {
    const invalidGraph: SupplyChainGraph = {
      nodes: [
        {
          id: 'NODE_A',
          name: 'A',
          countryCode: 'AU',
          categories: ['MINE'],
          granularity: 'COUNTRY_HUB',
          annualCapacity: 100,
          capacityUnit: 'LCE_TON',
          isFeocRisk: false,
        },
        {
          id: 'NODE_B',
          name: 'B',
          countryCode: 'CL',
          categories: ['MINE'],
          granularity: 'COUNTRY_HUB',
          annualCapacity: 100,
          capacityUnit: 'LCE_TON',
          isFeocRisk: false,
        },
        {
          id: 'NODE_C',
          name: 'C',
          countryCode: 'KR',
          categories: ['REFINERY'],
          granularity: 'FACILITY',
          annualCapacity: 200,
          capacityUnit: 'LCE_TON',
          isFeocRisk: false,
        },
      ],
      edges: [
        {
          id: 'EDGE_LITHIUM_A_TO_C',
          sourceNodeId: 'NODE_A',
          targetNodeId: 'NODE_C',
          commodityId: 'LITHIUM',
          baselineShare: 0.5,
          annualVolume: 50,
          unit: 'LCE_TON',
        },
        {
          id: 'EDGE_LITHIUM_B_TO_C',
          sourceNodeId: 'NODE_B',
          targetNodeId: 'NODE_C',
          commodityId: 'LITHIUM',
          baselineShare: 0.49, // Sum = 0.99 != 1.0
          annualVolume: 49,
          unit: 'LCE_TON',
        },
      ],
    };

    const result = validateSupplyChainGraph(invalidGraph);
    expect(result.isValid).toBe(false);
    expect(result.hasShareIntegrity).toBe(false);
    expect(result.errors.some((e) => e.includes('Share integrity violation'))).toBe(true);
  });

  it('detects direct cycle (A -> B -> A) via Kahn algorithm', () => {
    const cycleGraph: SupplyChainGraph = {
      nodes: [
        {
          id: 'NODE_A',
          name: 'A',
          countryCode: 'AU',
          categories: ['MINE'],
          granularity: 'COUNTRY_HUB',
          annualCapacity: 100,
          capacityUnit: 'LCE_TON',
          isFeocRisk: false,
        },
        {
          id: 'NODE_B',
          name: 'B',
          countryCode: 'KR',
          categories: ['REFINERY'],
          granularity: 'FACILITY',
          annualCapacity: 100,
          capacityUnit: 'LCE_TON',
          isFeocRisk: false,
        },
      ],
      edges: [
        {
          id: 'EDGE_LITHIUM_A_TO_B',
          sourceNodeId: 'NODE_A',
          targetNodeId: 'NODE_B',
          commodityId: 'LITHIUM',
          baselineShare: 1.0,
          annualVolume: 100,
          unit: 'LCE_TON',
        },
        {
          id: 'EDGE_LITHIUM_B_TO_A',
          sourceNodeId: 'NODE_B',
          targetNodeId: 'NODE_A',
          commodityId: 'LITHIUM',
          baselineShare: 1.0,
          annualVolume: 100,
          unit: 'LCE_TON',
        },
      ],
    };

    const result = validateSupplyChainGraph(cycleGraph);
    expect(result.isValid).toBe(false);
    expect(result.isDag).toBe(false);
    expect(result.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });
});

