import { describe, it, expect } from 'vitest';
import {
  NodeSchema,
  EdgeSchema,
} from '../../src/domain/types';

describe('Node & Edge Schema Validation (US1)', () => {
  it('validates a valid node with single category', () => {
    const validNode = {
      id: 'NODE_KR_POSCO_FUTURE_M',
      name: 'POSCO Future M Gwangyang',
      countryCode: 'KR',
      categories: ['ACTIVE_MATERIAL'],
      granularity: 'FACILITY',
      annualCapacity: 90000,
      capacityUnit: 'MT',
      isFeocRisk: false,
    };
    expect(NodeSchema.safeParse(validNode).success).toBe(true);
  });

  it('validates a node with multiple categories (e.g. Umicore Cheonan)', () => {
    const multiCategoryNode = {
      id: 'NODE_KR_UMICORE_CHEONAN',
      name: 'Umicore Cheonan',
      countryCode: 'KR',
      categories: ['REFINERY', 'ACTIVE_MATERIAL'],
      granularity: 'FACILITY',
      annualCapacity: 45000,
      capacityUnit: 'MT',
      isFeocRisk: false,
    };
    const parsed = NodeSchema.parse(multiCategoryNode);
    expect(parsed.categories).toEqual(['REFINERY', 'ACTIVE_MATERIAL']);
  });

  it('rejects invalid node ID not matching screaming snake pattern', () => {
    const invalidNode = {
      id: 'kr-posco-future-m',
      name: 'POSCO Future M',
      countryCode: 'KR',
      categories: ['ACTIVE_MATERIAL'],
      granularity: 'FACILITY',
      annualCapacity: 1000,
      capacityUnit: 'MT',
      isFeocRisk: false,
    };
    expect(NodeSchema.safeParse(invalidNode).success).toBe(false);
  });

  it('rejects node with empty categories array', () => {
    const invalidNode = {
      id: 'NODE_KR_INVALID',
      name: 'Invalid Node',
      countryCode: 'KR',
      categories: [],
      granularity: 'FACILITY',
      annualCapacity: 1000,
      capacityUnit: 'MT',
      isFeocRisk: false,
    };
    expect(NodeSchema.safeParse(invalidNode).success).toBe(false);
  });

  it('validates a valid edge matching commodity standard unit', () => {
    const validEdge = {
      id: 'EDGE_LITHIUM_POSCO_PILBARA_TO_POSCO_FUTURE_M',
      sourceNodeId: 'NODE_KR_POSCO_PILBARA_LITHIUM',
      targetNodeId: 'NODE_KR_POSCO_FUTURE_M',
      commodityId: 'LITHIUM',
      baselineShare: 0.6,
      annualVolume: 12000,
      unit: 'LCE_TON',
    };
    expect(EdgeSchema.safeParse(validEdge).success).toBe(true);
  });

  it('rejects edge when unit does not match commodity standard unit', () => {
    const invalidUnitEdge = {
      id: 'EDGE_LITHIUM_INVALID_UNIT',
      sourceNodeId: 'NODE_KR_POSCO_PILBARA_LITHIUM',
      targetNodeId: 'NODE_KR_POSCO_FUTURE_M',
      commodityId: 'LITHIUM',
      baselineShare: 0.6,
      annualVolume: 12000,
      unit: 'MT', // LITHIUM standard unit is LCE_TON!
    };
    expect(EdgeSchema.safeParse(invalidUnitEdge).success).toBe(false);
  });

  it('rejects edge with baselineShare <= 0 or > 1', () => {
    const zeroShareEdge = {
      id: 'EDGE_LITHIUM_ZERO_SHARE',
      sourceNodeId: 'NODE_A',
      targetNodeId: 'NODE_B',
      commodityId: 'LITHIUM',
      baselineShare: 0,
      annualVolume: 100,
      unit: 'LCE_TON',
    };
    expect(EdgeSchema.safeParse(zeroShareEdge).success).toBe(false);

    const overShareEdge = {
      ...zeroShareEdge,
      baselineShare: 1.05,
    };
    expect(EdgeSchema.safeParse(overShareEdge).success).toBe(false);
  });
});
