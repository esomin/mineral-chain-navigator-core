# Data Model: PostgreSQL Persistence & Customs ETL Pipeline

## 1. Drizzle Database Schemas

### 1.1 `nodes` Table
```typescript
export const nodes = pgTable('nodes', {
  id: varchar('id', { length: 100 }).primaryKey(), // e.g. NODE_KR_POSCO_FUTURE_M
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
```

### 1.2 `edges` Table
```typescript
export const edges = pgTable('edges', {
  id: varchar('id', { length: 150 }).primaryKey(),
  sourceNodeId: varchar('source_node_id', { length: 100 }).references(() => nodes.id).notNull(),
  targetNodeId: varchar('target_node_id', { length: 100 }).references(() => nodes.id).notNull(),
  commodityId: varchar('commodity_id', { length: 50 }).$type<CommodityId>().notNull(),
  baselineShare: numeric('baseline_share', { precision: 6, scale: 4 }).notNull(), // 0.0000 ~ 1.0000
  annualVolume: numeric('annual_volume', { precision: 14, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).$type<CapacityUnit>().notNull(),
  basePeriod: varchar('base_period', { length: 20 }).notNull(), // e.g. '2026'
});
```

### 1.3 `hsk_import_logs` Table
```typescript
export const hskImportLogs = pgTable('hsk_import_logs', {
  id: serial('id').primaryKey(),
  hskCode: varchar('hsk_code', { length: 20 }).notNull(),
  partnerCountryCode: char('partner_country_code', { length: 2 }).notNull(),
  period: varchar('period', { length: 10 }).notNull(), // YYYY or YYYYMM
  rawWeightKg: numeric('raw_weight_kg', { precision: 16, scale: 2 }).notNull(),
  standardVolume: numeric('standard_volume', { precision: 16, scale: 2 }).notNull(),
  importAmountUsd: numeric('import_amount_usd', { precision: 16, scale: 2 }).notNull(),
  sourceType: varchar('source_type', { length: 30 }).notNull(), // 'TRADEDATA_FILE' | 'PUBLIC_API'
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});
```

### 1.4 `simulation_scenarios` Table
```typescript
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
```

## 2. Invariants & Transformations

- **Idempotency Invariant**:
  $$ \text{seed}(G) \circ \text{seed}(G) = \text{seed}(G) $$
- **Strict 1.0 Edge Baseline Share**:
  For all target node $T$ and commodity $C$,
  $$ \sum_{e \in InEdges(T, C)} e.baselineShare = 1.0000 \quad (\text{via Decimal.js}) $$
- **Domain Graph Compatibility**:
  The output of `getActiveSupplyChainGraph()` must satisfy `SupplyChainGraphSchema.parse()`.

