import { db, sqlClient } from './client';
import { GraphRepository } from './repository/graphRepository';
import { DEFAULT_SUPPLY_CHAIN_GRAPH } from '../domain/seed/seedGraph';

async function main() {
  console.log('Seeding Supply Chain Master Graph into PostgreSQL...');
  const repo = new GraphRepository(db);

  const result = await repo.seedSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
  console.log(`Successfully seeded ${result.insertedNodes} nodes and ${result.insertedEdges} edges.`);
  await sqlClient.end();
}

main().catch((err) => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});

