# Data Model: HSK-based Supply Chain Domain Model

## 1. Domain Entities & Type Definitions

### 1.1 Node Category & Granularity Enums
```typescript
export const NodeCategoryEnum = z.enum([
  'MINE',
  'REFINERY',
  'PRECURSOR',
  'ACTIVE_MATERIAL',
  'CELL_PLANT'
]);
export type NodeCategory = z.infer<typeof NodeCategoryEnum>;

export const NodeGranularityEnum = z.enum([
  'COUNTRY_HUB',
  'FACILITY'
]);
export type NodeGranularity = z.infer<typeof NodeGranularityEnum>;

export const CapacityUnitEnum = z.enum([
  'LCE_TON',
  'MT',
  'GWH'
]);
export type CapacityUnit = z.infer<typeof CapacityUnitEnum>;
```

### 1.2 Node Schema
```typescript
export const NodeSchema = z.object({
  id: z.string().regex(/^NODE_[A-Z0-9_]+$/, 'Node ID must follow NODE_<COUNTRY>_<NAME> screaming snake format'),
  name: z.string().min(1),
  countryCode: z.string().length(2), // ISO 3166-1 alpha-2 (e.g. 'KR', 'CN', 'AU', 'CL', 'US')
  categories: z.array(NodeCategoryEnum).min(1),
  granularity: NodeGranularityEnum,
  annualCapacity: z.number().nonnegative(),
  capacityUnit: CapacityUnitEnum,
  isFeocRisk: z.boolean()
});
export type SupplyChainNode = z.infer<typeof NodeSchema>;
```

### 1.3 Commodity & HSK Mapping
```typescript
export const CommodityIdEnum = z.enum([
  'LITHIUM',
  'CATHODE_PRECURSOR',
  'GRAPHITE'
]);
export type CommodityId = z.infer<typeof CommodityIdEnum>;

export const CommodityStandardUnit: Record<CommodityId, CapacityUnit> = {
  LITHIUM: 'LCE_TON',
  CATHODE_PRECURSOR: 'MT',
  GRAPHITE: 'MT'
};

export interface HskMappingEntry {
  hskCode: string;
  name: string;
  commodityId: CommodityId;
  conversionFactor: number; // e.g. 0.88 for hydroxide, 1.00 for carbonate
  stage: NodeCategory;
  standardUnit: CapacityUnit;
}
```

### 1.4 Edge Schema
```typescript
export const EdgeSchema = z.object({
  id: z.string().regex(/^EDGE_[A-Z0-9_]+$/, 'Edge ID must follow EDGE_<COMMODITY>_<SRC>_TO_<TGT> format'),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  commodityId: CommodityIdEnum,
  baselineShare: z.number().gt(0).lte(1), // Decimal within (0, 1]
  annualVolume: z.number().nonnegative(),
  unit: CapacityUnitEnum
}).refine(data => data.unit === CommodityStandardUnit[data.commodityId], {
  message: 'Edge unit must strictly match commodity standard unit'
});
export type SupplyChainEdge = z.infer<typeof EdgeSchema>;
```

### 1.5 SupplyChainGraph Schema
```typescript
export const SupplyChainGraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema)
});
export type SupplyChainGraph = z.infer<typeof SupplyChainGraphSchema>;
```

## 2. Validation & Business Rule Contracts

### 2.1 Baseline Share Sum Invariant
For every target node `T` and commodity `C`:
$$ \sum_{e \in InEdges(T, C)} e.baselineShare = 1.0 $$
Evaluated using `Decimal.js`:
```typescript
let sum = new Decimal(0);
for (const edge of inEdges) {
  sum = sum.plus(new Decimal(edge.baselineShare));
}
if (!sum.equals(new Decimal(1.0))) {
  throw new Error(`Integrity violation: sum of baselineShare for target ${targetId} on ${commodityId} is ${sum.toString()}, expected 1.0`);
}
```

### 2.2 DAG Acyclic Invariant (Kahn's Algorithm)
A graph $G = (V, E)$ is valid if and only if Kahn's topological sort consumes exactly $|V|$ nodes without detecting a cycle.

