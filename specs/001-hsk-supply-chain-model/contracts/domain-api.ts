# Public API Contracts: Domain Models & Utilities

## 1. HSK Conversion Module (`src/domain/hsk/converter.ts`)

```typescript
import Decimal from 'decimal.js';
import { CommodityId, CapacityUnit } from '../types';

export interface HskConversionResult {
  hskCode: string;
  commodityId: CommodityId;
  rawTon: number;
  standardVolume: number;
  unit: CapacityUnit;
  conversionFactor: number;
}

/**
 * Converts raw metric tons (MT) from HSK trade data into standard battery commodity units.
 * Uses Decimal.js for precise conversion.
 * 
 * @param hskCode - 10-digit HSK string (e.g., '2825.20-2000')
 * @param rawTon - Raw import volume in metric tons
 * @returns HskConversionResult with calculated standard volume
 * @throws Error if hskCode is unsupported
 */
export function convertHskToStandardVolume(
  hskCode: string,
  rawTon: number | string | Decimal
): HskConversionResult;
```

## 2. Graph Validator Module (`src/domain/graph/validator.ts`)

```typescript
import { SupplyChainGraph } from '../types';

export interface GraphValidationResult {
  isValid: boolean;
  isDag: boolean;
  hasShareIntegrity: boolean;
  topologicalOrder?: string[];
  errors: string[];
}

/**
 * Verifies DAG topological constraints (acyclic) using Kahn's algorithm
 * and validates that incoming baselineShares strictly sum to 1.0 (Decimal.js)
 * for all target nodes and commodities.
 * 
 * @param graph - The supply chain graph to validate
 * @returns GraphValidationResult
 */
export function validateSupplyChainGraph(
  graph: SupplyChainGraph
): GraphValidationResult;
```

## 3. Seed Graph Export (`src/domain/seed/seedGraph.ts`)

```typescript
import { SupplyChainGraph } from '../types';

/**
 * Default baseline supply chain network containing:
 * - 5 Foreign Country Hubs (AU Lithium Mine, CL Lithium Refinery, CN Lithium Refinery, CN Precursor Hub, CN Graphite Hub)
 * - 9 Domestic Korean Facilities (POSCO Pilbara, Ecopro Materials, POSCO Future M, Ecopro BM, LG Chem, Umicore Cheonan, LG Energy Solution, Samsung SDI, SK On)
 * All edges strictly satisfy DAG ordering and baselineShare sum == 1.0.
 */
export const DEFAULT_SUPPLY_CHAIN_GRAPH: SupplyChainGraph;
```

