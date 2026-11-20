# Tasks: HSK 기반 공급망 그래프 도메인 모델 및 Seed 데이터 구축

**Input**: Design documents from `specs/001-hsk-supply-chain-model/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/domain-api.ts`, `quickstart.md`)

**Prerequisites**: TypeScript Strict Mode, Zod SSOT, Decimal.js 정밀 연산, Kahn 알고리즘 DAG 무순환 검증, Vitest

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, core mathematical & test dependencies installation

- [x] T001 Install runtime and dev dependencies: `npm install decimal.js zod && npm install -D vitest @types/decimal.js`
- [x] T002 [P] Configure Vitest test runner in `vite.config.ts` (or `vitest.config.ts`) and add `"test": "vitest run"` script in `package.json`
- [x] T003 [P] Setup directory scaffolding for pure domain layer: `src/domain/types/`, `src/domain/hsk/`, `src/domain/graph/`, `src/domain/seed/`, and `tests/domain/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema models, Zod enums, and base domain types required by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Implement core enum schemas (`NodeCategoryEnum`, `NodeGranularityEnum`, `CapacityUnitEnum`) and types with `categories` array support in `src/domain/types/node.ts` (per `data-model.md#NodeCategoryEnum`)
- [x] T005 [P] Implement commodity enum schemas (`CommodityIdEnum`), `CommodityStandardUnit` map, and `HskMappingEntry` interface in `src/domain/types/commodity.ts` (per `data-model.md#CommodityIdEnum`)
- [x] T006 [P] Implement `NodeSchema` with Screaming Snake ID pattern (`NODE_[A-Z0-9_]+`), ISO countryCode, and `isFeocRisk` in `src/domain/types/node.ts` (per `data-model.md#NodeSchema`)
- [x] T007 Implement `EdgeSchema` with Screaming Snake ID (`EDGE_[A-Z0-9_]+`), `baselineShare` range `(0, 1]`, and standard unit refinement in `src/domain/types/edge.ts` (per `data-model.md#EdgeSchema`)
- [x] T008 Implement `SupplyChainGraphSchema` combining `NodeSchema` and `EdgeSchema` in `src/domain/types/graph.ts` (per `data-model.md#SupplyChainGraphSchema`)
- [x] T009 Export all types and schemas from `src/domain/types/index.ts`

**Checkpoint**: Core domain schema foundations ready — User story implementation can now proceed.

---

## Phase 3: User Story 1 - 공급망 도메인 스키마 검증 및 Seed 그래프 생성 (Priority: P1) 🎯 MVP

**Goal**: UI/DB 의존성 없이 핵심 5단계 밸류체인(해외 허브 5 + 국내 거점 9)을 표현하는 DAG Seed 그래프 생성 및 Zod 스키마 검증

**Independent Test**: `DEFAULT_SUPPLY_CHAIN_GRAPH` 객체를 `SupplyChainGraphSchema.parse()`로 유효성 검사하고, 유미코아 등 복합 공정 및 Screaming Snake ID 유효성을 단독 테스트로 검증.

### Tests for User Story 1 ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Unit test for Node & Edge schema validation (valid screaming snake IDs, multi-category nodes, capacity units, invalid schemas) in `tests/domain/nodeEdgeSchema.test.ts`
- [x] T011 [P] [US1] Unit test for `DEFAULT_SUPPLY_CHAIN_GRAPH` schema parsing and basic entity structure in `tests/domain/seedGraph.test.ts`

### Implementation for User Story 1

- [x] T012 [P] [US1] Define 5 foreign country hub nodes (AU lithium mine, CL lithium refinery, CN lithium refinery, CN precursor hub, CN graphite hub) with `isFeocRisk` flags in `src/domain/seed/seedGraph.ts`
- [x] T013 [P] [US1] Define 9 domestic facility nodes (POSCO Pilbara, Ecopro Materials, POSCO Future M, Ecopro BM, LG Chem, Umicore Cheonan with `['REFINERY', 'ACTIVE_MATERIAL']`, LG Energy Solution, Samsung SDI, SK On) in `src/domain/seed/seedGraph.ts`
- [x] T014 [US1] Define connecting edges between overseas hubs and domestic facilities reflecting realistic baseline supply shares and standard commodity units in `src/domain/seed/seedGraph.ts`
- [x] T015 [US1] Assemble and export `DEFAULT_SUPPLY_CHAIN_GRAPH` validated by `SupplyChainGraphSchema` in `src/domain/seed/seedGraph.ts`
- [x] T016 [US1] Export seed entities via `src/domain/index.ts`

**Checkpoint**: User Story 1 (MVP) fully testable and operational.

---

## Phase 4: User Story 2 - HSK 관세청 통계 품목의 표준 단위 환산 (Priority: P2)

**Goal**: 관세청 10자리 HSK 수입 중량(MT)을 `Decimal.js`를 통해 배터리 산업 표준 단위(`LCE_TON`, `MT`)로 오차 없이 정밀 변환

**Independent Test**: `convertHskToStandardVolume(hskCode, rawTon)`에 수산화리튬(2825.20-2000, 1000 MT)을 입력하여 정확히 `880` LCE 톤 반환 검증.

### Tests for User Story 2 ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US2] Unit test for HSK conversion precision (880 LCE_TON for 1000 MT LiOH, 500 LCE_TON for 500 MT Li2CO3, 1:1 MT for NCM/Graphite, unsupported code exception) in `tests/domain/hskConverter.test.ts`

### Implementation for User Story 2

- [x] T018 [P] [US2] Create `HSK_COMMODITY_MAP` mapping table for the 5 target commodities (2825.20-2000, 2836.91-0000, 2825.90-2050, 2504.10-1000, 3801.10-0000) in `src/domain/hsk/hskMapping.ts`
- [x] T019 [US2] Implement `convertHskToStandardVolume` using `Decimal.js` for precise multiplication and standard unit resolution in `src/domain/hsk/converter.ts`
- [x] T020 [US2] Export HSK mapping and conversion functions via `src/domain/index.ts`

**Checkpoint**: User Stories 1 and 2 both work independently and test cleanly.

---

## Phase 5: User Story 3 - 공급망 엣지 공급 비율(baselineShare) 정밀 무결성 검증 (Priority: P3)

**Goal**: 각 타겟 노드로 유입되는 원자재 엣지들의 `baselineShare` 총합이 `Decimal.js` 기준 엄격히 1.0(Strict 1.0)인지 검증하고, Kahn 알고리즘으로 DAG 순환 참조를 검출하는 검증기 구현

**Independent Test**: 기본 Seed 그래프 내 모든 타겟 노드의 유입 점유율 합계 오차 0 검증 및 의도적 순환/오차 그래프에 대한 에러 검출 단위 테스트.

### Tests for User Story 3 ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T021 [P] [US3] Unit test for `baselineShare` strict 1.0 sum validation (valid sum, sum < 1.0 error, sum > 1.0 error, last-edge absorption verification) using `Decimal.js` in `tests/domain/validator.test.ts`
- [x] T022 [P] [US3] Unit test for Kahn's algorithm DAG cycle detection (acyclic graph topological sort output, direct cycle detection, indirect cycle detection) in `tests/domain/validator.test.ts`
- [x] T023 [P] [US3] Comprehensive integrity test asserting `validateSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH).isValid === true` in `tests/domain/seedGraph.test.ts`

### Implementation for User Story 3

- [x] T024 [P] [US3] Implement Kahn's Algorithm for topological sorting and cycle detection in `src/domain/graph/validator.ts`
- [x] T025 [P] [US3] Implement incoming `baselineShare` sum check per target node and commodity using `Decimal.js` strict equality (`.equals(new Decimal(1.0))`) in `src/domain/graph/validator.ts`
- [x] T026 [US3] Implement unified `validateSupplyChainGraph(graph)` returning `GraphValidationResult` in `src/domain/graph/validator.ts`
- [x] T027 [US3] Audit `DEFAULT_SUPPLY_CHAIN_GRAPH` edges in `src/domain/seed/seedGraph.ts` to ensure all target nodes satisfy strict 1.0 baselineShare sum via last-edge absorption rule
- [x] T028 [US3] Export validator utilities and contracts via `src/domain/index.ts`

**Checkpoint**: All user stories (US1, US2, US3) are fully functional, verified by Vitest tests.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation validation, code cleanliness, and boundary checks

- [x] T029 [P] Verify `README.md` and `specs/001-hsk-supply-chain-model/quickstart.md` code examples against actual exported modules
- [x] T030 Run full test suite (`npm run test`) and linter (`npm run lint`), fixing any compiler warnings or type inconsistencies
- [x] T031 Verify Constitution compliance: 0 React/DOM imports in `src/domain/`, strict mode passes with 0 `any`, all calculations use `Decimal.js`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (dependencies installed) - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 base schemas - delivers MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2 base schemas - can execute in parallel with or after US1.
- **User Story 3 (Phase 5)**: Depends on US1 (for seed graph) and Phase 2 - completes full graph validation and DAG invariants.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### Parallel Opportunities
- T002 and T003 can run in parallel.
- T004, T005, and T006 can be authored in parallel.
- Test files (T010, T011, T017, T021, T022, T023) can run in parallel before their respective implementation tasks.
- US1 Seed nodes (T012, T013) can be written in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Dependencies: `decimal.js`, `vitest`).
2. Complete Phase 2 (Foundational types & Zod schemas).
3. Complete Phase 3 (User Story 1: Seed graph with 14 nodes and 5-stage taxonomy).
4. Run tests and validate MVP.

### Incremental Delivery
1. Foundation & US1 -> Working supply chain graph structure (MVP).
2. US2 -> HSK trade import volume converter (LCE / MT).
3. US3 -> Rigorous mathematical validation (Decimal.js strict 1.0 + Kahn DAG).
4. Polish -> 100% Constitution compliance & test pass.
