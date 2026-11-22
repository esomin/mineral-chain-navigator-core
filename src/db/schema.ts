import { pgTable, varchar, char, numeric, boolean, timestamp, serial, uuid, jsonb } from 'drizzle-orm/pg-core';
import type { NodeCategory, NodeGranularity, CapacityUnit, CommodityId } from '../domain/types';

/**
 * 1. Supply Chain Nodes Table
 */
export const nodes = pgTable('nodes', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  countryCode: char('country_code', { length: 2 }).notNull(),
  categories: jsonb('categories').$type<NodeCategory[]>().notNull(),
  granularity: varchar('granularity', { length: 50 }).$type<NodeGranularity>().notNull(),
  annualCapacity: numeric('annual_capacity', { precision: 14, scale: 2 }).notNull(),
  capacityUnit: varchar('capacity_unit', { length: 20 }).$type<CapacityUnit>().notNull(),
  isFeocRisk: boolean('is_feoc_risk').default(false).notNull(),
  uiPosition: jsonb('ui_position').$type<{ x: number; y: number } | null>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type NodeSelect = typeof nodes.$inferSelect;
export type NodeInsert = typeof nodes.$inferInsert;

/**
 * 2. Supply Chain Edges Table
 */
export const edges = pgTable('edges', {
  id: varchar('id', { length: 150 }).primaryKey(),
  sourceNodeId: varchar('source_node_id', { length: 100 }).references(() => nodes.id).notNull(),
  targetNodeId: varchar('target_node_id', { length: 100 }).references(() => nodes.id).notNull(),
  commodityId: varchar('commodity_id', { length: 50 }).$type<CommodityId>().notNull(),
  baselineShare: numeric('baseline_share', { precision: 6, scale: 4 }).notNull(), // 0.0000 ~ 1.0000
  annualVolume: numeric('annual_volume', { precision: 14, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).$type<CapacityUnit>().notNull(),
  basePeriod: varchar('base_period', { length: 20 }).notNull(),
});

export type EdgeSelect = typeof edges.$inferSelect;
export type EdgeInsert = typeof edges.$inferInsert;

/**
 * 3. Customs Raw Import Trade Logs Table
 */
export const hskImportLogs = pgTable('hsk_import_logs', {
  id: serial('id').primaryKey(),
  hskCode: varchar('hsk_code', { length: 20 }).notNull(),
  partnerCountryCode: char('partner_country_code', { length: 2 }).notNull(),
  period: varchar('period', { length: 10 }).notNull(),
  rawWeightKg: numeric('raw_weight_kg', { precision: 16, scale: 2 }).notNull(),
  standardVolume: numeric('standard_volume', { precision: 16, scale: 2 }).notNull(),
  importAmountUsd: numeric('import_amount_usd', { precision: 16, scale: 2 }).notNull(),
  sourceType: varchar('source_type', { length: 30 }).notNull(), // 'TRADEDATA_FILE' | 'PUBLIC_API'
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});

export type HskImportLogSelect = typeof hskImportLogs.$inferSelect;
export type HskImportLogInsert = typeof hskImportLogs.$inferInsert;

/**
 * 4. Simulation Scenarios & Snapshot Table
 */
export interface ShockDefinition {
  nodeId: string;
  reductionRate: number; // 0.0 ~ 1.0
  reason?: string;
}

export const simulationScenarios = pgTable('simulation_scenarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  shocks: jsonb('shocks').$type<ShockDefinition[]>().notNull(),
  resultSnapshot: jsonb('result_snapshot').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SimulationScenarioSelect = typeof simulationScenarios.$inferSelect;
export type SimulationScenarioInsert = typeof simulationScenarios.$inferInsert;

