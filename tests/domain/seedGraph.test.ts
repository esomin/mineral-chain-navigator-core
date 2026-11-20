import { describe, it, expect } from 'vitest';
import { SupplyChainGraphSchema } from '../../src/domain/types';
import { DEFAULT_SUPPLY_CHAIN_GRAPH } from '../../src/domain/seed/seedGraph';

describe('Seed Graph Validation (US1 & US3)', () => {
  it('DEFAULT_SUPPLY_CHAIN_GRAPH parses successfully through SupplyChainGraphSchema', () => {
    const result = SupplyChainGraphSchema.safeParse(DEFAULT_SUPPLY_CHAIN_GRAPH);
    expect(result.success).toBe(true);
  });

  it('contains exactly 14 nodes (5 foreign hubs and 9 domestic facilities)', () => {
    expect(DEFAULT_SUPPLY_CHAIN_GRAPH.nodes).toHaveLength(14);

    const foreignHubs = DEFAULT_SUPPLY_CHAIN_GRAPH.nodes.filter(
      (n) => n.granularity === 'COUNTRY_HUB'
    );
    const domesticFacilities = DEFAULT_SUPPLY_CHAIN_GRAPH.nodes.filter(
      (n) => n.granularity === 'FACILITY' && n.countryCode === 'KR'
    );

    expect(foreignHubs).toHaveLength(5);
    expect(domesticFacilities).toHaveLength(9);
  });

  it('verifies FEOC risk flags on Chinese hubs', () => {
    const chineseHubs = DEFAULT_SUPPLY_CHAIN_GRAPH.nodes.filter(
      (n) => n.countryCode === 'CN'
    );
    expect(chineseHubs.length).toBeGreaterThan(0);
    chineseHubs.forEach((hub) => {
      expect(hub.isFeocRisk).toBe(true);
    });

    const aussieHub = DEFAULT_SUPPLY_CHAIN_GRAPH.nodes.find(
      (n) => n.countryCode === 'AU'
    );
    expect(aussieHub?.isFeocRisk).toBe(false);
  });

  it('verifies Umicore Cheonan has both REFINERY and ACTIVE_MATERIAL categories', () => {
    const umicore = DEFAULT_SUPPLY_CHAIN_GRAPH.nodes.find(
      (n) => n.id === 'NODE_KR_UMICORE_CHEONAN'
    );
    expect(umicore).toBeDefined();
    expect(umicore?.categories).toContain('REFINERY');
    expect(umicore?.categories).toContain('ACTIVE_MATERIAL');
  });
});

