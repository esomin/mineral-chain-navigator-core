# Feature Specification: HSK 기반 공급망 그래프 도메인 모델 및 Seed 데이터 구축

**Feature Branch**: `001-hsk-supply-chain-model`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "HSK 기반 공급망 그래프 도메인 모델 및 Seed 데이터 구축"

## Clarifications

### Session 2026-11-20
- Q: `DEFAULT_SUPPLY_CHAIN_GRAPH`의 노드 및 엣지 식별자(`id`) 네이밍 포맷을 어떻게 정의할까요? → A: Screaming Snake / Semantic Key 방식 (`NODE_KR_POSCO_FUTURE_M`, `EDGE_LITHIUM_POSCO_PILBARA_TO_POSCO_FUTURE_M`)
- Q: 엣지 공급 비율(`baselineShare`) 검증 시 허용할 수 있는 수치 오차 한계(Tolerance) 기준을 어떻게 정의할까요? → A: 엄격한 1.0 일치 (Strict `1.0`), 데이터 정의 시 잔여 오차는 마지막 엣지가 흡수하여 합계가 정확히 `1.0`이 되도록 강제
- Q: 엣지에서 수량(`annualVolume`)과 단위(`unit`)가 취급되는 기준을 어떻게 정의할까요? → A: 광물 기준 표준 단위 일치, 엣지의 `unit`은 반드시 해당 `commodityId`의 표준 단위(`LITHIUM` -> `LCE_TON`, 전구체/흑연 -> `MT`)와 동일하게 강제

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 공급망 도메인 스키마 검증 및 Seed 그래프 생성 (Priority: P1)

시스템 아키텍트 및 도메인 개발자는 UI나 외부 DB 없이도 핵심 5단계 밸류체인(`MINE -> REFINERY -> PRECURSOR -> ACTIVE_MATERIAL -> CELL_PLANT`) 노드와 엣지로 구성된 방향성 비순환 그래프(DAG)를 코드로 로드하고 Zod 스키마로 검증할 수 있다.

**Why this priority**: 모든 시뮬레이션 및 데이터 시각화의 근간이 되는 핵심 도메인 스키마와 기준 Seed 데이터가 선행되어야 후속 기능(충격 시뮬레이션, 영속성 적재)이 가능하므로 최고 우선순위(P1)를 갖는다.

**Independent Test**: `DEFAULT_SUPPLY_CHAIN_GRAPH` 객체를 `SupplyChainGraphSchema.parse()`로 유효성 검사하고, 노드/엣지 연결성 및 기본 속성 무결성을 단독 테스트로 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 정의된 노드 및 엣지 정의가 있을 때, **When** Zod 기반 `SupplyChainGraphSchema`로 검증을 수행하면, **Then** 타입 에러나 유효성 위반 없이 파싱에 성공한다.
2. **Given** 단일 거점이 복수 공정(`REFINERY`, `ACTIVE_MATERIAL`)을 수행하는 경우(예: 유미코아 천안), **When** 노드 인스턴스를 생성하면, **Then** `categories` 배열에 지정된 공정이 모두 유효하게 등록된다.
3. **Given** 유효한 그래프 데이터가 주어졌을 때, **When** 그래프의 위상 구조를 검사하면, **Then** 방향성 비순환 그래프(DAG) 구조를 만족하고 순환 참조(Cycle)가 검출되지 않는다.
4. **Given** 노드와 엣지 인스턴스가 생성될 때, **Then** 모든 `id`는 Screaming Snake Semantic Key 형식(예: `NODE_...`, `EDGE_...`)을 준수한다.

---

### User Story 2 - HSK 관세청 통계 품목의 표준 단위 환산 (Priority: P2)

데이터 엔지니어 및 분석가는 관세청 HSK 10자리 수입 중량(MT)을 입력하여 배터리 산업 표준 단위(`LCE_TON`, `MT`)로 오차 없이 변환된 물동량을 산출할 수 있다.

**Why this priority**: 서로 다른 수입 통계 단위(수산화리튬, 탄산리튬, 전구체 등)를 표준화해야 동일 광물 기준의 정확한 공급 비율 및 병목 분석이 가능하다.

**Independent Test**: `convertHskToStandardVolume(hskCode, rawTon)` 함수에 특정 HSK 코드와 중량을 전달하여 `Decimal.js` 정밀 연산 결과가 정확히 기대값과 일치하는지 단독 단위 테스트로 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** HSK 코드 `2825.20-2000`(수산화리튬, 계수 0.88)과 수입 중량 `1000`톤이 주어졌을 때, **When** `convertHskToStandardVolume`을 호출하면, **Then** 정확히 `880` LCE 톤이 반환된다.
2. **Given** HSK 코드 `2836.91-0000`(탄산리튬, 계수 1.00)과 수입 중량 `500`톤이 주어졌을 때, **When** `convertHskToStandardVolume`을 호출하면, **Then** `500` LCE 톤이 반환된다.
3. **Given** 매핑 테이블에 존재하지 않는 HSK 코드가 입력되었을 때, **When** 환산 함수를 호출하면, **Then** 명확한 에러(`Unsupported HSK Code`)를 발생시킨다.

---

### User Story 3 - 공급망 엣지 공급 비율(baselineShare) 정밀 무결성 검증 (Priority: P3)

시스템은 특정 타겟 노드로 유입되는 원자재 공급 엣지들의 공급 비율(`baselineShare`) 총합이 정확히 100%(1.0)를 만족하는지 검증한다.

**Why this priority**: 공급 비율의 총합이 1.0을 벗어나면 충격 시뮬레이션(Cascading Deficit Calculation) 수행 시 왜곡이나 누수가 발생하므로 수학적 엄밀성이 필수적이다.

**Independent Test**: 그래프 내 각 타겟 노드별로 동일 광물(`commodityId`)에 대한 유입 엣지의 `baselineShare` 합계를 `Decimal.js`로 누적 합산하여 정확히 `1.0`인지 검증한다.

**Acceptance Scenarios**:

1. **Given** 에코프로비엠 포항 공장으로 유입되는 `CATHODE_PRECURSOR` 엣지들이 존재할 때, **When** 각 공급원(에코프로머티리얼즈, 중국 전구체 허브 등)의 `baselineShare`를 합산하면, **Then** `Decimal` 합이 허용 오차 없이 정확히 `1.0`이 된다.
2. **Given** 엣지의 `baselineShare` 합이 1.0이 되지 않는 잘못된 그래프 데이터가 입력되었을 때, **When** 무결성 검증 함수를 실행하면, **Then** 오차 노드와 실제 합계를 포함한 검증 오류를 반환한다.
3. **Given** 엣지의 `unit`이 지정될 때, **Then** 해당 엣지의 `commodityId`에 해당하는 표준 단위(`LITHIUM` -> `LCE_TON`, `CATHODE_PRECURSOR`/`GRAPHITE` -> `MT`)와 엄격히 일치한다.

---

### Edge Cases

- **순환 참조(Cycle) 시도**: 공급망 엣지 연결 중 상류 공정으로 역류하거나 노드 간 순환(A -> B -> A)이 발생하는 경우 그래프 유효성 검사에서 차단된다.
- **부동소수점 누적 오차 방지 및 잔여 오차 흡수**: `Decimal.js`를 사용하며, 1/3 등 무한소수 분할 시 데이터 정의 단계에서 마지막 엣지가 잔여량을 흡수하여 합계가 엄격하게 `1.0`이 되도록 강제한다.
- **복수 노드 카테고리 입도**: 유미코아 천안 공장처럼 제련(`REFINERY`)과 양극재(`ACTIVE_MATERIAL`)를 동시 수행하는 노드가 올바르게 연결되는지 검증한다.
- **미국 IRA 해외우려기관(FEOC) 리스크 플래그**: 중국 거점 노드의 경우 `isFeocRisk: true`가 명시되고 스키마에서 불리언 값으로 엄격히 강제되는지 확인한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 순수 TypeScript 환경(UI 의존성 0)에서 동작하는 5단계 밸류체인 공정 카테고리(`NodeCategory`: `MINE`, `REFINERY`, `PRECURSOR`, `ACTIVE_MATERIAL`, `CELL_PLANT`)를 정의해야 한다.
- **FR-002**: 노드의 `categories` 속성은 단일 거점의 복합 공정을 지원하기 위해 1개 이상의 요소를 갖는 `NodeCategory[]` 배열이어야 한다.
- **FR-003**: 노드의 입도(`granularity`)는 해외 거점용 `COUNTRY_HUB`와 국내 거점용 `FACILITY`로 엄격히 구분되어야 한다.
- **FR-004**: 노드는 `id`, `name`, `countryCode`(ISO 3166-1 alpha-2), `categories`, `granularity`, `annualCapacity`, `capacityUnit`(`LCE_TON` | `MT` | `GWH`), `isFeocRisk`(boolean) 속성을 필수로 가져야 한다. 노드의 `id`는 Screaming Snake Semantic Key(`NODE_<COUNTRY>_<NAME>`) 형식을 준수해야 한다.
- **FR-005**: 표준 광물 그룹(`CommodityId`)으로 `LITHIUM`, `CATHODE_PRECURSOR`, `GRAPHITE`를 지원해야 한다.
- **FR-006**: 대표 HSK 10자리 품목 매핑 테이블(`HSK_COMMODITY_MAP`)을 제공해야 한다:
  - `2825.20-2000` (수산화리튬) -> `LITHIUM`, 계수 `0.88`, 공정 `REFINERY`
  - `2836.91-0000` (탄산리튬) -> `LITHIUM`, 계수 `1.00`, 공정 `REFINERY`
  - `2825.90-2050` (NCM 전구체) -> `CATHODE_PRECURSOR`, 계수 `1.00`, 공정 `PRECURSOR`
  - `2504.10-1000` (인편상 천연흑연) -> `GRAPHITE`, 계수 `1.00`, 공정 `MINE`
  - `3801.10-0000` (인조흑연) -> `GRAPHITE`, 계수 `1.00`, 공정 `REFINERY`
- **FR-007**: 시스템은 `Decimal.js`를 활용하여 원시 수입량(MT)을 표준 단위로 변환하는 `convertHskToStandardVolume(hskCode, rawTon)` 함수를 제공해야 한다.
- **FR-008**: 엣지는 `id`, `sourceNodeId`, `targetNodeId`, `commodityId`, `baselineShare`(0 초과 1 이하), `annualVolume`, `unit` 속성을 필수로 가져야 한다. 엣지 `id`는 `EDGE_<COMMODITY>_<SRC>_TO_<TGT>` 형식을 준수해야 한다.
- **FR-008a**: 엣지의 `unit`은 반드시 해당 `commodityId`의 표준 단위(`LITHIUM` -> `LCE_TON`, `CATHODE_PRECURSOR` | `GRAPHITE` -> `MT`)와 정확히 일치해야 한다.
- **FR-009**: 동일 `commodityId` 기준으로 특정 하류 노드로 향하는 인입 엣지들의 `baselineShare` 총합은 `Decimal.js` 연산 기준 오차 없이 정확히 `1.0`이어야 한다. 분할에 따른 잔여 오차는 데이터 셋 정의 시 마지막 엣지가 흡수하도록 한다.
- **FR-010**: 공급망 네트워크는 방향성 비순환 그래프(DAG)이어야 하며, 순환 참조 여부를 검증하는 유틸리티를 제공해야 한다.
- **FR-011**: 시스템은 해외 허브 5개소(호주 리튬 광산, 칠레 리튬 정제, 중국 리튬 정제, 중국 전구체, 중국 흑연)와 국내 9개 핵심 시설(포스코필바라리튬솔루션, 에코프로머티리얼즈, 포스코퓨처엠, 에코프로비엠, LG화학, 유미코아, LG에너지솔루션, 삼성SDI, SK온)을 포함하는 기본 Seed 그래프(`DEFAULT_SUPPLY_CHAIN_GRAPH`)를 제공해야 한다.

### Key Entities *(include if feature involves data)*

- **Node (거점/시설)**: 공급망의 물리적 또는 통계적 거점. 국가, 처리 용량, 수행 공정 목록, FEOC 위험 여부 등의 메타데이터를 포함. (예: `NODE_KR_POSCO_FUTURE_M`)
- **Edge (공급 경로)**: 상류 노드에서 하류 노드로 이동하는 원자재 물동량 흐름. 광물 종류, 연간 물동량, 조달 점유율(`baselineShare`)을 포함하며 단위(`unit`)는 광물 표준 단위와 일치. (예: `EDGE_LITHIUM_POSCO_PILBARA_TO_POSCO_FUTURE_M`)
- **HSK Mapping**: 관세청 HSK 코드와 광물 그룹, 변환 계수(Conversion Factor), 공정 단계의 매핑 정의.
- **SupplyChainGraph**: 유효성이 검증된 노드 셋과 엣지 셋의 집합체로, DAG 불변식 및 가중치 합산 엄격한 1.0 불변식을 만족하는 엔티티.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `SupplyChainGraphSchema.safeParse(DEFAULT_SUPPLY_CHAIN_GRAPH).success`가 `true`를 반환하며 스키마 검증 통과율 100%를 달성한다.
- **SC-002**: `convertHskToStandardVolume('2825.20-2000', 1000)` 연산 시 부동소수점 오차 없이 정확히 `880` LCE 톤을 반환하는 단위 테스트가 통과한다.
- **SC-003**: 기본 Seed 그래프 내 모든 타겟 노드별 유입 `baselineShare` 합계 검증에서 엄격한 1.0과의 오차(Delta)가 정확히 `0`임을 입증한다.
- **SC-004**: 위상 정렬(Kahn's Algorithm 또는 DFS cycle detection)을 통한 DAG 순환 참조 검증 테스트가 100% 통과한다.
- **SC-005**: Vitest 테스트 스위트 실행 시 0개의 실패로 모든 도메인 테스트가 정상 통과한다.

## Assumptions

- 본 피처는 순수 TypeScript 도메인 레이어 구축에 집중하며 UI 렌더링 컴포넌트는 추후 단계에서 이 도메인 모듈을 임포트하여 사용한다.
- 연간 물동량(`annualVolume`)과 캐파(`annualCapacity`)의 기초 수치는 실제 관세청 통계 및 기업 공시 기반의 대표 현실치(Realistic Mock/Seed)를 채택한다.
- 리스크 전파 시뮬레이션 알고리즘 본체는 후속 피처(`002` 또는 `003`)에서 구현되며, 본 피처는 그 기초가 되는 그래프 구조와 무결성 검증기능을 완성한다.
