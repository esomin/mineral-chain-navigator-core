# Feature Specification: PostgreSQL 영속화 및 관세청 HSK 통계 수집 파이프라인

**Feature Branch**: `002-postgres-hsk-pipeline`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "PostgreSQL 영속화 및 관세청 HSK 통계 수집 파이프라인 (최신 1개년 확정 통계 기준 엣지 모델링, 핵심국가 Whitelist & Top-N 비례 재정규화, tradedata.go.kr 우선 연동 및 공공데이터포털 API 단계적 확장)"

## Clarifications

### Session 2026-11-20
- Q: CSV에 기재된 한글 국가명(예: "중국", "칠레", "호주", "모로코")을 노드의 ISO 3166-1 alpha-2 국가 코드(`CN`, `CL`, `AU`, `MA`)로 매핑하는 방식을 어떻게 관리할까요? → A: 정적 한글-ISO2 매핑 사전(`KOREAN_COUNTRY_CODE_MAP`)을 `src/domain/hsk/countryMapping.ts`에 선언하여 무결성을 보장하고 미식별 국가는 스킵/경고 처리
- Q: CSV 파서 및 인코딩 처리를 위해 어떤 라이브러리를 사용할까요? → A: `csv-parse` 라이브러리를 사용하여 따옴표/콤마 및 인코딩을 안전하고 메모리 효율적으로 파싱

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 공급망 그래프 DB 영속화 및 멱등한 Seed 로딩 (Priority: P1) 🎯 MVP

데이터베이스 관리자 및 백엔드 개발자는 Drizzle ORM을 통해 정의된 PostgreSQL 스키마(`nodes`, `edges`, `hsk_import_logs`, `simulation_scenarios`)를 생성하고, `db:seed` 명령을 실행하여 Spec 1의 기본 공급망 그래프(`DEFAULT_SUPPLY_CHAIN_GRAPH`)를 무결하게 DB에 적재할 수 있다.

**Why this priority**: 관세청 통계 수집 데이터의 누적과 실시간 시나리오 저장을 위한 기반 데이터베이스 환경이 반드시 구축되어야 하므로 최고 우선순위(P1)를 갖는다.

**Independent Test**: 빈 DB(또는 PGlite 인메모리 테스트 환경)에 마이그레이션을 적용하고 `db:seed` 스크립트를 2회 연속 실행하여, 예외 없이 14개 노드와 엣지 데이터가 멱등(Idempotent)하게 유지되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 실행 중인 PostgreSQL 인스턴스가 주어졌을 때, **When** 마이그레이션을 실행하면, **Then** 4개 테이블(`nodes`, `edges`, `hsk_import_logs`, `simulation_scenarios`)이 DDL 오류 없이 생성된다.
2. **Given** 초기 DB 상태에서, **When** `db:seed` 스크립트를 실행하면, **Then** 14개 마스터 거점 노드와 기본 공급 엣지가 DB에 적재된다.
3. **Given** 이미 시드 데이터가 적재된 DB에서, **When** `db:seed` 스크립트를 재실행하면, **Then** 중복 키 에러(Unique violation) 없이 기존 레코드가 갱신(Upsert)되어 총 레코드 수가 동일하게 유지된다.

---

### User Story 2 - 관세청 통계 포털(tradedata.go.kr) 자료 ETL 및 국가 필터링·점유율 갱신 (Priority: P2)

데이터 엔지니어는 관세청 수출입무역통계 포털(`tradedata.go.kr`)에서 내려받은 **최신 1개년 확정 통계(Full-Year)** 품목별 국가별 수입 실적(CSV)을 로컬 디렉토리(`data/raw/customs/`)에 배치하고 ETL 파이프라인을 실행하여, `csv-parse`를 통해 안전하게 파싱하고, 한글 국가명을 정적 매핑 사전(`KOREAN_COUNTRY_CODE_MAP`)으로 ISO2 코드로 표준화한 후 핵심 국가(중국, 칠레, 호주 등) 중심 필터링과 미세 잔여국 비례 재정규화를 통해 `Decimal.js` 기준 엄격히 `1.0000`의 점유율로 DB 엣지의 가중치(`baselineShare`, `annualVolume`, `basePeriod`)를 갱신할 수 있다.

**Why this priority**: 부분 누적 기간의 왜곡을 방지하고 완전한 1개년 확정 실적을 기반으로 공급망 엣지 점유율의 현실성과 정확성을 담보하기 위함이다.

**Independent Test**: `tradedata.go.kr` 표준 포맷의 최신 1개년 확정 통계 CSV 파일을 파이프라인에 입력하여 `hsk_import_logs` 적재, 비례 재정규화(Rescaling) 적용, 그리고 해외 허브(`COUNTRY_HUB`) 유입 엣지의 `baselineShare` 합계가 정확히 `1.0000`으로 갱신되는지 단위/통합 테스트로 검증한다.

**Acceptance Scenarios**:

1. **Given** `data/raw/customs/` 경로에 최신 1개년 관세청 포털 규격의 수입 실적 CSV가 주어졌을 때, **When** ETL 파이프라인(`npm run etl:customs`)을 실행하면, **Then** `csv-parse`로 원시 수입 실적이 `hsk_import_logs`에 적재되고 한글 국가명이 ISO 2자리 코드로 변환되며 파일 내 최신 확정 연도가 `basePeriod`로 자동 감지된다.
2. **Given** 특정 HSK 품목(예: 수산화리튬)에서 20여 개 수입국 데이터가 존재할 때, **When** 국가 필터링 및 엣지 갱신 로직이 실행되면, **Then** Whitelist 국가(CN, CL, AU 등 점유율 5% 이상)를 선별하고 미세 잔여 국가를 제외한 후, 상위 국가들 간의 비례 재정규화(Rescaling)를 거쳐 `Decimal` 합계가 정확히 `1.0000`이 되도록 엣지의 `baselineShare`와 `annualVolume`을 트랜잭션 단위로 갱신한다.
3. **Given** 향후 공공데이터포털 OpenAPI 키가 제공되는 경우, **When** API 수집 모드를 활성화하면, **Then** 동일한 정규화 및 점유율 계산 로직을 공유하여 엣지 가중치가 갱신된다.

---

### User Story 3 - 활성 공급망 그래프 조회 및 시나리오 영속 관리 (Priority: P3)

시뮬레이션 엔진 및 애플리케이션 서비스는 DB에 영속화된 노드/엣지 데이터를 조회하여 Spec 1 도메인 모델(`SupplyChainGraph`)로 변환하고, 사용자 정의 시뮬레이션 시나리오를 DB에 저장/조회할 수 있다.

**Why this priority**: DB에 적재된 최신 무역 통계 기반 데이터를 코어 시뮬레이션 엔진에 공급하고, 시뮬레이션 결과 스냅샷을 영속화하기 위함이다.

**Independent Test**: `getActiveSupplyChainGraph()`를 호출하여 반환된 객체가 Spec 1의 `SupplyChainGraphSchema.parse()` 유효성 검사를 통과하는지 확인하고, 시나리오 CRUD 연산의 입출력 무결성을 테스트한다.

**Acceptance Scenarios**:

1. **Given** DB에 최신 노드와 엣지가 적재되어 있을 때, **When** `getActiveSupplyChainGraph()`를 호출하면, **Then** Spec 1의 `SupplyChainGraphSchema`를 통과하는 완전한 그래프 객체가 반환된다.
2. **Given** 사용자가 특정 노드 차단(Shock) 시나리오와 계산 결과를 생성했을 때, **When** 시나리오 저장 함수를 실행하면, **Then** `simulation_scenarios` 테이블에 JSONB 형태로 안전하게 영속화된다.
3. **Given** 저장된 시나리오 ID가 주어졌을 때, **When** 시나리오 상세 조회를 요청하면, **Then** 저장된 충격 조건(`shocks`)과 결과 스냅샷(`resultSnapshot`)이 손실 없이 역직렬화되어 반환된다.

---

### Edge Cases

- **비정형 CSV 인코딩(EUC-KR vs UTF-8)**: 관세청 포털에서 내려받은 CSV가 한글 윈도우 기본(EUC-KR/CP949)인 경우와 UTF-8인 경우를 모두 감지하여 자동 디코딩한다.
- **미식별 한글 국가명 유입**: `KOREAN_COUNTRY_CODE_MAP`에 없는 국가명은 경고 로그를 기록하고, Whitelist/5% 컷오프 규칙에 따라 미세 기타국으로 분류하여 파이프라인 충돌을 방지한다.
- **국가별 점유율 재스케일링 시 잔여 오차 흡수**: 상위 핵심 국가들로 재정규화 후 1/3 분할 등 무한소수 발생 시, Spec 1 Constitution 원칙에 따라 최대 점유율 국가 엣지(또는 마지막 엣지)가 잔여 소수점을 흡수하여 `sum(baselineShare) == 1.0000`을 강제한다.
- **DB Connection 실패 및 트랜잭션 롤백**: 가중치 일괄 갱신 도중 오류 발생 시 트랜잭션을 즉시 롤백하여 일부 엣지만 갱신되어 점유율 총합이 깨지는 불일치를 원천 차단한다.
- **공공데이터포털 API Fallback**: API 모드 실행 시 키 누락이나 네트워크 타임아웃 발생 시 파일 기반 파이프라인으로 안전하게 대체 동작한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 Drizzle ORM을 활용하여 PostgreSQL 기반의 4개 핵심 테이블(`nodes`, `edges`, `hsk_import_logs`, `simulation_scenarios`) 스키마를 정의해야 한다.
- **FR-002**: `nodes` 테이블은 `id`(PK, varchar), `name`, `countryCode`(char 2), `categories`(jsonb: `NodeCategory[]`), `granularity`, `annualCapacity`(numeric), `capacityUnit`, `isFeocRisk`(boolean), `uiPosition`(jsonb, nullable), `updatedAt`(timestamp) 필드를 포함해야 한다.
- **FR-003**: `edges` 테이블은 `id`(PK, varchar), `sourceNodeId`(FK -> `nodes.id`), `targetNodeId`(FK -> `nodes.id`), `commodityId`, `baselineShare`(numeric(6, 4)), `annualVolume`(numeric), `unit`, `basePeriod`(varchar: 수집 파일 기준 최신 1개년 확정 연도 예 `'2024'` 또는 `'2026'`) 필드를 포함해야 한다.
- **FR-004**: `hsk_import_logs` 테이블은 `id`(serial PK), `hskCode`, `partnerCountryCode`(char 2), `period`(varchar: 연도/연월), `rawWeightKg`(numeric), `standardVolume`(numeric), `importAmountUsd`(numeric), `sourceType`(varchar: `'TRADEDATA_FILE' | 'PUBLIC_API'`), `fetchedAt`(timestamp) 필드를 포함해야 한다.
- **FR-005**: `simulation_scenarios` 테이블은 `id`(uuid PK), `title`, `description`(text, nullable), `shocks`(jsonb), `resultSnapshot`(jsonb), `createdAt`(timestamp) 필드를 포함해야 한다.
- **FR-006**: 시스템은 Spec 1의 `DEFAULT_SUPPLY_CHAIN_GRAPH` 데이터를 DB에 멱등하게 삽입/갱신하는 `db:seed` 스크립트를 제공해야 한다.
- **FR-007**: 시스템은 `csv-parse`를 사용하여 관세청 무역통계 포털(`tradedata.go.kr`)의 최신 1개년 확정 실적 파일(CSV)을 읽어 `convertHskToStandardVolume`으로 LCE/MT 환산 후 `hsk_import_logs`에 적재하는 1차 ETL 파이프라인을 구현해야 한다. 한글 국가명은 `KOREAN_COUNTRY_CODE_MAP`을 통해 ISO 2자리 코드로 변환한다.
- **FR-008**: 시스템은 20여 개 이상의 원시 수입국 목록 중 핵심 Whitelist 국가(중국, 칠레, 호주 등) 및 점유율 5% 이상 국가를 필터링하고, 미세 잔여 국가를 제외한 상위 국가들의 비중을 `Decimal.js`로 비례 재정규화(Rescaling)하여 `baselineShare` 총합이 정확히 `1.0000`이 되도록 엣지를 갱신해야 한다.
- **FR-009**: 향후 공공데이터포털 OpenAPI 연동을 위한 어댑터 모듈 인터페이스를 마련하여, 추후 API 키 등록 시 동일한 적재 및 필터링 파이프라인이 구동되도록 확장성을 보장해야 한다.
- **FR-010**: DB의 최신 `nodes`와 `edges`를 조회하여 Spec 1의 `SupplyChainGraph` 형태로 매핑 및 반환하는 `getActiveSupplyChainGraph()` 함수를 제공해야 한다.
- **FR-011**: 시나리오 시뮬레이션의 입력 조건 및 계산 결과 스냅샷을 저장, 단건 조회, 목록 조회하는 리포지토리/서비스 함수를 제공해야 한다.

### Key Entities *(include if feature involves data)*

- **NodeEntity (`nodes`)**: 공급망 마스터 거점. 다중 공정 카테고리(`categories`)를 JSONB 배열로 저장.
- **EdgeEntity (`edges`)**: 거점 간 원자재 공급 관계 및 물동량. 최신 1개년 확정 통계 기준 국가별 필터링/재정규화된 점유율(`baselineShare`) 저장.
- **HskImportLogEntity (`hsk_import_logs`)**: 관세청 통계 포털 및 OpenAPI로부터 수집된 원시 수입 통계 및 LCE 환산 로그.
- **SimulationScenarioEntity (`simulation_scenarios`)**: 충격 전파 시뮬레이션의 시나리오 조건(`shocks`)과 결과(`resultSnapshot`) 캐시.
- **CountryCodeMap (`KOREAN_COUNTRY_CODE_MAP`)**: "중국" -> "CN", "칠레" -> "CL" 등 관세청 통계용 한글-ISO 국가 코드 매핑 사전.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `drizzle-kit generate` 및 마이그레이션 DDL이 PostgreSQL 환경(PGlite 포함)에서 100% 정상 적용된다.
- **SC-002**: `db:seed` 스크립트를 2회 연속 실행해도 Unique 제약 조건 에러 없이 동일한 노드(14개) 및 엣지 수가 유지된다 (멱등성 100%).
- **SC-003**: 20여 개국 원시 CSV 데이터를 `csv-parse`로 파싱한 ETL 파이프라인 실행 시, 한글 국가명의 ISO2 코드 변환과 핵심 국가 선별 및 비례 재정규화 알고리즘을 거쳐 갱신된 국가별 엣지 `baselineShare` 총합이 오차 없이 정확히 `1.0000`을 만족한다.
- **SC-004**: `getActiveSupplyChainGraph()`의 반환값이 Spec 1의 `SupplyChainGraphSchema.safeParse().success === true`를 만족한다.
- **SC-005**: Vitest 기반의 영속성 및 파이프라인 단위/통합 테스트 스위트가 에러 없이 100% 통과한다.

## Assumptions

- MVP의 공급망 그래프 엣지 기준 기간은 **최신 1개년 확정 통계(Full-Year)**로 설정하며, CSV 파일에 수록된 연도를 파이프라인이 자동 인식하여 `basePeriod`에 반영한다.
- 원시 통계 수집 파일은 `data/raw/customs/` 경로에 배치하며, 국가 필터링 시 Whitelist(중국, 칠레, 호주) 외 미세 국가는 비례 재스케일링으로 처리하여 14개 노드 구조를 유지한다.
- 테스트 환경에서는 외부 DB 설치 없이 `@electric-sql/pglite`를 통해 100% 동일한 PostgreSQL 환경에서 검증한다.
