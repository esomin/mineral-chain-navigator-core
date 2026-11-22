# Tasks: PostgreSQL 영속화 및 관세청 HSK 통계 수집 파이프라인

**Input**: Design documents from `specs/002-postgres-hsk-pipeline/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/service-contracts.ts`, `quickstart.md`)

**Prerequisites**: Drizzle ORM, PostgreSQL (`postgres.js`), `@electric-sql/pglite` (Wasm test runner), `csv-parse`, Spec 1 도메인 모델

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database, ORM, CSV parsing, and PGlite test infrastructure installation

- [ ] T001 Install runtime and dev dependencies: `npm install drizzle-orm postgres csv-parse && npm install -D drizzle-kit @electric-sql/pglite`
- [ ] T002 [P] Create `drizzle.config.ts` for schema management and migration output directory (`drizzle/`)
- [ ] T003 [P] Add DB and ETL scripts in `package.json` (`"db:push"`, `"db:generate"`, `"db:seed"`, `"etl:customs"`)
- [ ] T004 [P] Create directory scaffolding: `src/db/repository/`, `src/pipeline/parser/`, `src/pipeline/normalizer/`, `tests/helpers/`, and `tests/pipeline/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Drizzle schema definitions and PGlite in-memory test database harness

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Implement Drizzle tables (`nodes`, `edges`, `hsk_import_logs`, `simulation_scenarios`) with JSONB custom types in `src/db/schema.ts` (per `data-model.md#1-drizzle-database-schemas`)
- [ ] T006 [P] Implement PostgreSQL production connection client with environment variable handling (`DATABASE_URL`) in `src/db/client.ts`
- [ ] T007 Implement PGlite in-memory test DB helper with automatic schema setup in `tests/helpers/testDb.ts`
- [ ] T008 Implement Korean-to-ISO2 country code mapping dictionary (`KOREAN_COUNTRY_CODE_MAP`) and helper in `src/domain/hsk/countryMapping.ts`

**Checkpoint**: Database schema and test infrastructure ready — User story implementation can now begin.

---

## Phase 3: User Story 1 - 공급망 그래프 DB 영속화 및 멱등한 Seed 로딩 (Priority: P1) 🎯 MVP

**Goal**: Spec 1의 `DEFAULT_SUPPLY_CHAIN_GRAPH`(14개 노드 + 엣지)를 Drizzle ORM을 통해 PostgreSQL에 적재하고 멱등한(Idempotent) Upsert 보장

**Independent Test**: PGlite 인메모리 DB에서 `db:seed`를 2회 연속 실행하여 중복 키 에러 없이 14개 노드 및 엣지 수가 동일하게 유지되는지 확인.

### Tests for User Story 1 ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US1] Integration test for schema tables creation and `seedSupplyChainGraph` idempotency (running seed twice maintains exact row counts without errors) in `tests/pipeline/dbPersistence.test.ts`

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement `GraphRepository.seedSupplyChainGraph(graph)` using `onConflictDoUpdate` for idempotent upsert in `src/db/repository/graphRepository.ts`
- [ ] T011 [US1] Create standalone executable CLI seed script `src/db/seed.ts` that loads `DEFAULT_SUPPLY_CHAIN_GRAPH` and calls `seedSupplyChainGraph`
- [ ] T012 [US1] Export database schema and repository interfaces via `src/db/index.ts`

**Checkpoint**: User Story 1 (MVP) fully testable and operational.

---

## Phase 4: User Story 2 - 관세청 통계 포털(tradedata.go.kr) 자료 ETL 및 국가 필터링·점유율 갱신 (Priority: P2)

**Goal**: 관세청 포털의 2026년 실적 CSV(`customs_trade_2026.csv`)를 `csv-parse`로 읽고, LCE 환산, Whitelist 필터링 및 비례 재정규화(`Decimal.js`)를 거쳐 `edges`의 `baselineShare`(합계 1.0000)를 트랜잭션 단위로 갱신

**Independent Test**: `customs_trade_2026.csv` 실데이터를 ETL 파이프라인에 주입하여 `hsk_import_logs` 적재 확인 및 갱신된 해외 허브 유입 엣지의 `baselineShare` 합계가 정확히 `1.0000`인지 검증.

### Tests for User Story 2 ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US2] Unit test for CSV parser with quote handling, CP949/UTF-8 decoding, and column mapping in `tests/pipeline/csvParser.test.ts`
- [ ] T014 [P] [US2] Unit test for top-N whitelist filtering and Decimal.js proportional rescaling with last-edge absorption rule in `tests/pipeline/shareRescaler.test.ts`
- [ ] T015 [P] [US2] End-to-end integration test for `CustomsEtlService.processCustomsCsv` with PGlite verifying `hsk_import_logs` count and edge baselineShare sum == 1.0000 in `tests/pipeline/customsEtlService.test.ts`

### Implementation for User Story 2

- [ ] T016 [P] [US2] Implement `parseCustomsCsv(filePath)` using `csv-parse` to stream and parse raw customs records in `src/pipeline/parser/csvParser.ts`
- [ ] T017 [P] [US2] Implement `rescaleCommodityShares(rawImports)` with Whitelist (CN, CL, AU), 5% cutoff, and Decimal.js strict 1.0000 absorption in `src/pipeline/normalizer/shareRescaler.ts`
- [ ] T018 [US2] Implement `CustomsEtlService.processCustomsCsv` coordinating CSV parsing, LCE conversion, `hsk_import_logs` bulk insertion, and transaction-based edge updates in `src/pipeline/customsEtlService.ts`
- [ ] T019 [US2] Create standalone CLI script `src/pipeline/runEtl.ts` linked to `npm run etl:customs` that processes `data/raw/customs/customs_trade_2026.csv`

**Checkpoint**: User Stories 1 and 2 work seamlessly together and test cleanly with real trade data.

---

## Phase 5: User Story 3 - 활성 공급망 그래프 조회 및 시나리오 영속 관리 (Priority: P3)

**Goal**: DB의 `nodes`와 `edges`를 조회하여 Spec 1 `SupplyChainGraph`로 매핑하고, 사용자 정의 시뮬레이션 충격 시나리오 CRUD 제공

**Independent Test**: `getActiveSupplyChainGraph()` 반환값이 Spec 1 `SupplyChainGraphSchema.parse()`를 통과하는지 검증하고, 시나리오 생성/조회 단위 테스트 수행.

### Tests for User Story 3 ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T020 [P] [US3] Unit test for `GraphRepository.getActiveSupplyChainGraph()` validating output against `SupplyChainGraphSchema` in `tests/pipeline/dbPersistence.test.ts`
- [ ] T021 [P] [US3] Unit test for `ScenarioRepository` (create, findById, findAll with JSONB shocks) in `tests/pipeline/scenarioRepository.test.ts`

### Implementation for User Story 3

- [ ] T022 [P] [US3] Implement `GraphRepository.getActiveSupplyChainGraph()` mapping SQL numeric and JSONB columns to Spec 1 domain types in `src/db/repository/graphRepository.ts`
- [ ] T023 [P] [US3] Implement `ScenarioRepository` supporting CRUD for `simulation_scenarios` in `src/db/repository/scenarioRepository.ts`
- [ ] T024 [US3] Export pipeline services and repositories via `src/pipeline/index.ts` and update `src/domain/index.ts`

**Checkpoint**: All user stories (US1, US2, US3) are fully functional and pass PGlite integration tests.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification against real CSV data, linter, typecheck, and Constitution compliance

- [ ] T025 [P] Run ETL pipeline against `data/raw/customs/customs_trade_2026.csv` and verify log outputs and edge weight outputs
- [ ] T026 Run full test suite (`npm run test`) and linter (`npm run lint`), fixing any compiler warnings or type inconsistencies
- [ ] T027 Verify Constitution compliance: strict TypeScript (0 `any`), Decimal.js precision for all trade share calculations, PGlite clean shutdown

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (packages installed) - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 Drizzle schema & PGlite helper - delivers MVP persistence.
- **User Story 2 (Phase 4)**: Depends on Phase 2 & US1 (DB tables ready) - processes real CSV trade data.
- **User Story 3 (Phase 5)**: Depends on Phase 2 & US1 - completes graph query & scenario persistence.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### Parallel Opportunities
- T002, T003, and T004 can run in parallel.
- T005, T006, and T008 can be written in parallel.
- All test tasks (T009, T013, T014, T015, T020, T021) can run in parallel before their implementations.
- T016 and T017 can be implemented in parallel.
- T022 and T023 can be implemented in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 & Phase 2 (Drizzle ORM + PGlite test DB).
2. Complete Phase 3 (US1: Idempotent seed script).
3. Verify `seedSupplyChainGraph` passes twice with 14 nodes.

### Incremental Delivery
1. Foundation & US1 -> Working PostgreSQL persistence layer.
2. US2 -> Real customs data ETL pipeline (`customs_trade_2026.csv` -> DB 엣지 갱신).
3. US3 -> Active graph query & scenario snapshot repository.
4. Polish -> 100% Constitution & Vitest test pass.

