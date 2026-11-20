# Technical Research & Decisions: PostgreSQL Persistence & Customs ETL Pipeline

## 1. Context & Objectives
- **Target**: Drizzle ORM based persistence layer for supply chain nodes, edges, customs import logs, and simulation scenarios.
- **Data Source**: Official Customs Trade statistics (`data/raw/customs/customs_trade_2026.csv`) from `tradedata.go.kr` with pluggable OpenAPI adapter architecture.
- **Core Invariant**: Strict 1.0 baseline share sum maintenance using `Decimal.js` and top-N rescaling.

## 2. Technology Stack & Driver Selection

### 2.1 ORM & Migration Tooling: `Drizzle ORM` & `drizzle-kit`
- **Choice**: `drizzle-orm` + `drizzle-kit`
- **Rationale**:
  - Full TypeScript strict type inference (`InferSelectModel`, `InferInsertModel`).
  - Native support for PostgreSQL `jsonb` with custom TypeScript types (`NodeCategory[]`, shock objects, etc.).
  - Generates transparent, human-readable SQL migration files.

### 2.2 PostgreSQL Drivers
- **Production/Development Client**: `postgres` (porsager/postgres.js)
  - Fastest, lightweight pure JavaScript/Node PostgreSQL driver without native compilation dependencies.
- **Testing In-Memory Database**: `@electric-sql/pglite` + `drizzle-orm/pglite`
  - Wasm-compiled full PostgreSQL engine running in-memory without Docker or network dependencies.
  - Ensures 100% SQL compatibility (JSONB, unique constraints, transactions) during `vitest run`.

### 2.3 CSV Parsing & Encoding
- **Choice**: `csv-parse`
- **Rationale**:
  - Node.js standard streaming CSV parser capable of handling quoted strings, commas within fields, and varying newlines.
  - Accommodates character encoding (UTF-8 / CP949 fallback).

## 3. Architecture & Rescaling Algorithm Design

### 3.1 Top-N & Whitelist Rescaling Algorithm
Given raw imports $\{ (C_i, W_i) \}$ for commodity $M$:
1. Map Korean country names $C_i$ to ISO2 codes using `KOREAN_COUNTRY_CODE_MAP`.
2. Filter target countries:
   - Whitelist: `CN`, `CL`, `AU` (mandatory hubs)
   - Threshold: Any country with $\text{rawShare} \ge 0.05$ (5%)
3. Exclude minor residual countries and compute the sum of kept weights:
   $$ W_{\text{kept}} = \sum_{j \in \text{Kept}} W_j $$
4. Rescale shares using `Decimal.js`:
   $$ S_j = \frac{W_j}{W_{\text{kept}}} $$
5. **Absorption Rule**:
   The first $K-1$ countries take rounded/truncated decimals, and the final country absorbs the remainder:
   $$ S_K = 1.0 - \sum_{j=1}^{K-1} S_j $$
   guaranteeing $\sum_{j=1}^{K} S_j = 1.0000$ strictly.

### 3.2 Idempotent Seeding Strategy
- Uses Drizzle's `onConflictDoUpdate` (Postgres `ON CONFLICT (id) DO UPDATE ...`) on both `nodes` and `edges` tables.
- Running `npm run db:seed` multiple times updates timestamps and properties without duplicate key violations.

