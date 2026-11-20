# Quickstart: HSK-based Supply Chain Domain Model

## 1. Installation & Setup

Ensure core dependencies are installed:
```bash
npm install decimal.js zod
npm install -D vitest @types/decimal.js
```

## 2. Using Domain Models & Seed Data

```typescript
import {
  DEFAULT_SUPPLY_CHAIN_GRAPH,
  validateSupplyChainGraph,
  convertHskToStandardVolume,
  SupplyChainGraphSchema
} from './src/domain';

// 1. Validate the default seed graph with Zod
const parsed = SupplyChainGraphSchema.parse(DEFAULT_SUPPLY_CHAIN_GRAPH);
console.log(`Loaded ${parsed.nodes.length} nodes and ${parsed.edges.length} edges.`);

// 2. Validate DAG topology and Share Integrity (Decimal.js)
const validation = validateSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
if (!validation.isValid) {
  console.error('Graph validation errors:', validation.errors);
} else {
  console.log('Graph is a valid DAG with strict 1.0 baseline shares!');
}

// 3. Convert raw HSK imports to standard LCE / MT units
const converted = convertHskToStandardVolume('2825.20-2000', 1000);
console.log(`${converted.rawTon} MT raw import -> ${converted.standardVolume} ${converted.unit}`);
// Output: 1000 MT raw import -> 880 LCE_TON
```

## 3. Running Tests

```bash
npx vitest run
```

