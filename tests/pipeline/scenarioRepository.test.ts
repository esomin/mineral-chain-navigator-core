import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../helpers/testDb';
import { ScenarioRepository } from '../../src/db/repository/scenarioRepository';

describe('Scenario Repository Tests (US3)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
  });

  it('creates, retrieves, and lists simulation scenarios with JSONB shocks', async () => {
    const repo = new ScenarioRepository(db);

    const created = await repo.create({
      title: 'China Lithium Export Ban Scenario',
      description: 'Simulates 80% export cut on Chinese lithium chemical hub',
      shocks: [
        {
          nodeId: 'NODE_CN_LITHIUM_REFINERY_HUB',
          reductionRate: 0.8,
          reason: 'Geopolitical export restriction',
        },
      ],
      resultSnapshot: { deficitRate: 0.45, affectedFacilities: ['NODE_KR_ECOPRO_BM'] },
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('China Lithium Export Ban Scenario');
    expect(created.shocks).toHaveLength(1);
    expect(created.shocks[0].nodeId).toBe('NODE_CN_LITHIUM_REFINERY_HUB');

    // Retrieve by ID
    const retrieved = await repo.findById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.resultSnapshot).toEqual({ deficitRate: 0.45, affectedFacilities: ['NODE_KR_ECOPRO_BM'] });

    // List all
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
  });
});

