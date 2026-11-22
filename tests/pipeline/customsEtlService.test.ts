import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { createTestDb } from '../helpers/testDb';
import { GraphRepository } from '../../src/db/repository/graphRepository';
import { CustomsEtlService } from '../../src/pipeline/customsEtlService';
import { DEFAULT_SUPPLY_CHAIN_GRAPH } from '../../src/domain/seed/seedGraph';
import { hskImportLogs, edges } from '../../src/db/schema';

describe('Customs ETL Service Integration Test (US2)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  const samplePath = path.resolve(__dirname, '../../data/raw/customs/customs_trade_2026.csv');

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;

    // Seed master graph first so edges exist to update
    const repo = new GraphRepository(db);
    await repo.seedSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
  });

  it('ingests customs CSV, converts LCE, and updates edges with rescaled shares', async () => {
    const etlService = new CustomsEtlService(db);
    const result = await etlService.processCustomsCsv(samplePath);

    expect(result.period).toBe('2026');
    expect(result.totalRowsParsed).toBeGreaterThan(0);
    expect(result.logsInserted).toBeGreaterThan(0);
    expect(result.edgesUpdated).toBeGreaterThan(0);

    // Verify hsk_import_logs table has rows
    const logs = await db.select().from(hskImportLogs);
    expect(logs.length).toBe(result.logsInserted);

    // Verify updated edges baselineShare sums
    const currentEdges = await db.select().from(edges);
    expect(currentEdges.length).toBe(DEFAULT_SUPPLY_CHAIN_GRAPH.edges.length);
  });
});
