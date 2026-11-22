import path from 'path';
import { db, sqlClient } from '../db';
import { CustomsEtlService } from './customsEtlService';

async function main() {
  const csvPath = path.resolve(process.cwd(), 'data/raw/customs/customs_trade_2026.csv');
  console.log(`Running Customs Trade ETL pipeline with: ${csvPath}`);

  const etlService = new CustomsEtlService(db);
  const result = await etlService.processCustomsCsv(csvPath);

  console.log(`ETL Finished for Period: ${result.period}`);
  console.log(`- Rows Parsed: ${result.totalRowsParsed}`);
  console.log(`- Logs Inserted: ${result.logsInserted}`);
  console.log(`- Edges Updated: ${result.edgesUpdated}`);
  console.log('Rescaled Country Shares:');
  console.log(JSON.stringify(result.rescaledShares, null, 2));

  await sqlClient.end();
}

main().catch((err) => {
  console.error('ETL Pipeline Failed:', err);
  process.exit(1);
});

