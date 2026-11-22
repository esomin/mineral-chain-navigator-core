import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../../src/db/schema';

/**
 * Creates an isolated in-memory PostgreSQL instance using PGlite and sets up DDL tables.
 */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // Initialize schema DDL
  await client.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country_code CHAR(2) NOT NULL,
      categories JSONB NOT NULL,
      granularity VARCHAR(50) NOT NULL,
      annual_capacity NUMERIC(14, 2) NOT NULL,
      capacity_unit VARCHAR(20) NOT NULL,
      is_feoc_risk BOOLEAN DEFAULT false NOT NULL,
      ui_position JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS edges (
      id VARCHAR(150) PRIMARY KEY,
      source_node_id VARCHAR(100) NOT NULL REFERENCES nodes(id),
      target_node_id VARCHAR(100) NOT NULL REFERENCES nodes(id),
      commodity_id VARCHAR(50) NOT NULL,
      baseline_share NUMERIC(6, 4) NOT NULL,
      annual_volume NUMERIC(14, 2) NOT NULL,
      unit VARCHAR(20) NOT NULL,
      base_period VARCHAR(20) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hsk_import_logs (
      id SERIAL PRIMARY KEY,
      hsk_code VARCHAR(20) NOT NULL,
      partner_country_code CHAR(2) NOT NULL,
      period VARCHAR(10) NOT NULL,
      raw_weight_kg NUMERIC(16, 2) NOT NULL,
      standard_volume NUMERIC(16, 2) NOT NULL,
      import_amount_usd NUMERIC(16, 2) NOT NULL,
      source_type VARCHAR(30) NOT NULL,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS simulation_scenarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description VARCHAR(1000),
      shocks JSONB NOT NULL,
      result_snapshot JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  return { client, db };
}

