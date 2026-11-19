<!--
Sync Impact Report:
- Version change: Unversioned template -> 1.0.0
- Ratified: 2026-11-20
- Modified principles: Initialized project constitution from user specification
  - Principle 1: I. Separation of Concerns & Deterministic Purity
  - Principle 2: II. Strict TypeScript & Single Source of Truth
  - Principle 3: III. Numerical Precision (Decimal.js Mandatory)
  - Principle 4: IV. Test-Driven Verification (Vitest Mandatory)
  - Principle 5: V. Value Chain Taxonomy & DAG Topology Invariants
- Added sections:
  - Domain Constraints & Data Architecture
  - UI & Design System Standards
- Removed sections: None (template placeholders replaced)
- Deferred items: None
-->

# Mineral Chain Navigator Constitution

## Core Principles

### I. Separation of Concerns & Deterministic Purity
- **관심사의 분리**: 도메인 모델(`Spec 1`), 데이터 영속성/ETL(`Spec 2`), 시뮬레이션 연산 엔진(`Spec 3`)은 UI 레이어(React, DOM, 브라우저 API)와 완전히 분리된 순수 TypeScript 모듈로 구현해야 한다.
- **결정론적 연산**: 모든 시뮬레이션 연산은 동일한 입력에 대해 항상 동일한 결과를 반환하는 결정론적(Deterministic) 순수 함수로 설계해야 한다.

### II. Strict TypeScript & Single Source of Truth
- **Strict Mode 강제**: `any` 타입 사용을 전면 금지하며, 컴파일러 strict 모드를 준수해야 한다.
- **도메인 열거형**: 모든 도메인 열거형은 TypeScript Union Type 또는 Zod Enum으로 엄격히 제한한다.
- **런타임-정적 단일 진실 공급원(SSOT)**: 런타임 데이터 유효성 검증과 정적 타입 추론의 단일 진실 공급원으로 `Zod`를 반드시 사용해야 한다.

### III. Numerical Precision (Decimal.js Mandatory)
- **부동소수점 직접 연산 금지**: 물동량 환산(LCE 계수 적용), 수입 점유율(`baselineShare`), 충격 전파 감산 연산 시 JavaScript 기본 부동소수점(`+`, `-`, `*`, `/`) 연산을 절대 금지한다.
- **정밀도 보장**: 모든 금융/물동량 정밀 수치 연산에는 반드시 `Decimal.js`를 사용해야 한다.

### IV. Test-Driven Verification (Vitest Mandatory)
- **TDD 및 테스트 동반**: 모든 핵심 도메인 유틸리티와 시뮬레이션 알고리즘은 `Vitest` 기반의 단위 테스트가 통과되어야 구현 완료로 간주한다.
- **필수 검증 케이스**: 정상 케이스, 경계값(Boundary values), 순환 참조(Cycle) 예외 케이스를 반드시 포함해야 한다.

### V. Value Chain Taxonomy & DAG Topology Invariants
- **5단계 밸류체인 카테고리**:
  1. `MINE` (광산)
  2. `REFINERY` (정·제련소)
  3. `PRECURSOR` (전구체 공장)
  4. `ACTIVE_MATERIAL` (핵심소재 공장)
  5. `CELL_PLANT` (배터리 셀 공장)
  - 단일 거점의 복수 공정 지원을 위해 노드의 `categories` 속성은 반드시 배열(`NodeCategory[]`)로 정의한다.
- **노드 입도(Granularity)**: 해외 1~3단계 거점은 국가·지역 병목 허브(`COUNTRY_HUB`), 국내 3~5단계 거점은 개별 생산 공장(`FACILITY`)으로 구분한다.
- **표준 단위**:
  - 리튬 계열: 탄산리튬환산기준(`LCE_TON`)
  - 전구체·핵심소재·흑연: 순수 중량(`MT`)
  - 배터리 셀: 전력 용량(`GWH`)
- **DAG 위상 제약**: 공급망 네트워크는 순환 참조가 없는 방향성 비순환 그래프(DAG)여야 하며, 충격 전파 연산은 위상 정렬(Kahn's Algorithm) 순서를 엄격히 따른다.
- **가중치 무결성**: 동일 광물(`commodityId`) 기준 특정 하류 노드로 유입되는 엣지들의 `baselineShare` 총합은 항상 `1.0`을 유지해야 한다.

## Domain Constraints & Data Architecture

### Data Persistence & ETL
- 영속 계층 구축 시(Spec 2) PostgreSQL 및 Drizzle ORM을 기본 데이터 스택으로 사용한다.
- 복합 배열, 비정형 메타데이터, 시나리오별 그래프 스냅샷 저장은 `JSONB` 컬럼을 적극 활용한다.
- 원천 데이터(관세청 HSK 통계 등) ETL 처리 시 Zod 파이프라인을 통한 스키마 검증을 거친 후 적재한다.

## UI & Design System Standards (Front-end Integration)

### Visual System & Interactions
- **시각적 톤앤매너**: 다크 테크(Dark-tech) 기반의 Swiss Modernist 그리드 레이아웃을 유지한다.
- **컬러 팔레트**: Primary Accent 컬러는 Vivid Cyan(`HEX: #0EA5E9`)을 사용하며, 리스크 상태 표기는 4단계(`NORMAL`, `CAUTION`, `WARNING`, `CRITICAL`)로 명확히 시각화한다.
- **인터랙션 원칙**: 시뮬레이션 실행 및 주요 데이터 제어에는 단일 메인 CTA(Call-to-Action) 원칙을 준수한다.

## Governance

- **우선순위 및 구속력**: 본 Constitution은 Mineral Chain Navigator 프로젝트의 모든 설계, 아키텍처 의사결정, 코드 구현보다 상위의 구속력을 갖는다.
- **개정 절차(Amendments)**:
  - 코어 원칙 수정 시 문서화, 팀 리뷰 및 마이그레이션 계획이 수반되어야 한다.
  - 변경 사항은 시맨틱 버저닝(Semantic Versioning) 규칙에 따라 버전을 갱신한다.
- **규정 준수(Compliance)**: 모든 PR 및 코드 리뷰 단계에서 본 헌법의 원칙 준수 여부를 검증하며, 특히 Decimal.js 연산 누락 및 DAG 순환 참조 허용 여부를 집중 점검한다.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
