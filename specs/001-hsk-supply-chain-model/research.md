# Technical Research & Decisions: HSK-based Supply Chain Domain Model

## 1. Context & Objectives
- **Target**: Pure TypeScript domain module for 5-stage Korean battery mineral supply chain modeling, HSK code conversion, and DAG topology validation.
- **Constraints**: 0 UI dependencies, strict TypeScript mode, no `any`, mandatory `Decimal.js` for floating-point calculations, strict DAG cycle prevention (Kahn's algorithm).

## 2. Technology Stack & Library Selection

### 2.1 Schema Definition & Runtime Validation: `Zod`
- **Current Status**: Already present in `node_modules` (v3.x).
- **Decision**: Use `zod` as the Single Source of Truth (SSOT). All domain types (`Node`, `Edge`, `CommodityId`, `NodeCategory`, `SupplyChainGraph`) are inferred via `z.infer<typeof ...>`.
- **Validation**: Enforce `categories` minimum length 1, `baselineShare` within `(0, 1]`, and strict string ID formats (`NODE_*`, `EDGE_*`).

### 2.2 Numerical Precision: `Decimal.js`
- **Current Status**: Needs to be installed via `npm install decimal.js` and `npm install -D @types/decimal.js`.
- **Decision**: All arithmetic operations on raw commodity volumes, conversion ratios, and baseline shares must instantiate `Decimal`. Native JS operations (`+`, `-`, `*`, `/`) are forbidden in calculation utilities.
- **Strict 1.0 Validation**: When validating incoming shares for a target node, accumulate with `.plus()` and compare using `.equals(new Decimal(1.0))`.

### 2.3 Testing Framework: `Vitest`
- **Current Status**: Needs to be installed via `npm install -D vitest`.
- **Decision**: Vite is already configured in the project (`vite.config.ts`), making `vitest` the native, zero-config choice for unit tests.

## 3. Architecture & Algorithm Design

### 3.1 DAG Topology & Cycle Detection: Kahn's Algorithm
- **Approach**:
  1. Build adjacency list and in-degree table for all nodes in `SupplyChainGraph`.
  2. Enqueue all nodes with in-degree 0 (typically `MINE` nodes or country hubs).
  3. Pop node, increment visited count, reduce in-degree of downstream target nodes.
  4. If visited count == total nodes, graph is a valid DAG. Otherwise, a cycle exists.
- **Complexity**: $O(V + E)$ time and space, suitable for real-time validation in browser and server environments.

### 3.2 Strict 1.0 Share Balancing & Last-Edge Absorption Rule
- When authoring seed data or calculating allocations:
  - Suppose a node draws from 3 sources with proportions 1/3, 1/3, 1/3.
  - In `Decimal.js`: $1/3 \approx 0.3333333333333333$.
  - Absorption Rule: The first $N-1$ edges are assigned fixed decimal shares (e.g. `0.3333`, `0.3333`), and the last edge takes `1.0 - sum(prior)` (e.g. `0.3334`), ensuring `sum.equals(1.0)` is always strictly true.

### 3.3 Module Isolation Strategy
- Directory layout:
  - `src/domain/types/`: Pure interfaces and Zod schemas (`node.ts`, `edge.ts`, `commodity.ts`, `graph.ts`)
  - `src/domain/hsk/`: HSK mapping table and conversion functions (`hskMapping.ts`, `converter.ts`)
  - `src/domain/graph/`: DAG validation, Kahn's algorithm, share integrity checker (`validator.ts`)
  - `src/domain/seed/`: Initial seed data constants (`seedGraph.ts`)
  - `src/domain/index.ts`: Barrel export of public domain APIs
- No imports from React, Vite HTML assets, or DOM are permitted within `src/domain/**`.

