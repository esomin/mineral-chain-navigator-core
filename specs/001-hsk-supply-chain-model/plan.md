# Implementation Plan: HSK 기반 공급망 그래프 도메인 모델 및 Seed 데이터 구축

**Branch**: `001-hsk-supply-chain-model` | **Date**: 2026-11-20 | **Spec**: [specs/001-hsk-supply-chain-model/spec.md](spec.md)

**Input**: Feature specification from `specs/001-hsk-supply-chain-model/spec.md`

## Summary

배터리 핵심광물(리튬, 전구체, 흑연) 공급망의 5단계 제조 공정(`MINE -> REFINERY -> PRECURSOR -> ACTIVE_MATERIAL -> CELL_PLANT`)을 모델링하는 순수 TypeScript 도메인 모듈을 구현한다.
관세청 10자리 HSK 수입 중량을 표준 단위(`LCE_TON`, `MT`)로 오차 없이 환산하는 `Decimal.js` 유틸리티와, Zod 기반 노드/엣지 스키마, 엄격한 1.0 공급 점유율 검증, Kahn 알고리즘 기반 DAG 무순환 검증기 및 현실 기반 기본 Seed 데이터(`DEFAULT_SUPPLY_CHAIN_GRAPH`)를 제공한다.

## Technical Context

**Language/Version**: TypeScript 5.x+ (Strict Mode)

**Primary Dependencies**: `zod` (런타임 스키마 및 SSOT 타입 추론), `decimal.js` (부동소수점 오차 없는 물동량/점유율 연산)

**Storage**: N/A (순수 인메모리 도메인 모델 및 Seed 상수)

**Testing**: `vitest` (단위 테스트, 정밀도 테스트, 순환 참조 검증)

**Target Platform**: Node.js 20+ & Universal ESM (브라우저/서버 호환 순수 도메인 모듈)

**Project Type**: Core Domain Library (0 UI/DOM dependencies)

**Performance Goals**: Seed 그래프 유효성 검증 및 위상 정렬 < 10ms

**Constraints**:
- UI(React, DOM) 종속성 일절 배제
- `any` 타입 사용 금지
- 부동소수점 연산 시 JS 기본 연산자 사용 금지, `Decimal.js` 필수 사용
- `baselineShare` 총합 검증 시 엄격한 1.0(Strict 1.0) 일치 강제

**Scale/Scope**: 14개 핵심 노드(해외 허브 5 + 국내 9) 및 약 20여 개 공급 엣지로 구성된 대표 기준 모델

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 준수 여부 | 확인 내용 |
|---|---|---|
| I. Separation of Concerns & Deterministic Purity | **PASS** | `src/domain/` 하위에 UI/React 의존성이 전혀 없는 순수 함수 및 데이터 모델로 격리 |
| II. Strict TypeScript & SSOT | **PASS** | `zod` 기반 스키마 정의 및 타입 추론(`z.infer`), `any` 미사용 |
| III. Numerical Precision (Decimal.js) | **PASS** | `convertHskToStandardVolume` 및 `baselineShare` 합산 로직 전체에 `Decimal.js` 적용 |
| IV. Test-Driven Verification (Vitest) | **PASS** | HSK 단위 환산, 엄격한 1.0 점유율 검증, Kahn DAG 무순환 검증 테스트 스위트 구축 계획 수립 |
| V. Value Chain Taxonomy & DAG Invariants | **PASS** | 5단계 `NodeCategory[]`, 입도(`COUNTRY_HUB`/`FACILITY`), 표준 단위(`LCE_TON`/`MT`/`GWH`), Kahn 알고리즘 위상 정렬 적용 |

## Project Structure

### Documentation (this feature)

```text
specs/001-hsk-supply-chain-model/
├── plan.md              # 본 구현 계획 문서
├── research.md          # 기술 조사 및 설계 결정 (Zod, Decimal.js, Kahn 알고리즘)
├── data-model.md        # 도메인 엔티티 스키마 및 비즈니스 불변식 명세
├── quickstart.md        # 라이브러리 설치, 사용 예시 및 테스트 가이드
├── contracts/
│   └── domain-api.ts    # 퍼블릭 인터페이스 및 함수 시그니처 계약
└── tasks.md             # 추후 /speckit-tasks 단계에서 생성될 작업 목록
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── types/
│   │   ├── node.ts          # NodeCategory, NodeGranularity, NodeSchema
│   │   ├── edge.ts          # EdgeSchema, BaselineShare invariant
│   │   ├── commodity.ts     # CommodityId, CapacityUnit, HskMapping types
│   │   ├── graph.ts         # SupplyChainGraphSchema
│   │   └── index.ts         # Types barrel export
│   ├── hsk/
│   │   ├── hskMapping.ts    # HSK_COMMODITY_MAP 상수 정의
│   │   └── converter.ts     # convertHskToStandardVolume (Decimal.js)
│   ├── graph/
│   │   └── validator.ts     # validateSupplyChainGraph (Kahn DAG & 1.0 share sum)
│   ├── seed/
│   │   └── seedGraph.ts     # DEFAULT_SUPPLY_CHAIN_GRAPH 상수 (5 해외 + 9 국내)
│   └── index.ts             # Domain core barrel export
└── tests/
    └── domain/
        ├── hskConverter.test.ts # HSK 환산 정밀도 및 예외 테스트
        ├── validator.test.ts    # Kahn DAG 검출, 1.0 점유율 무결성 테스트
        └── seedGraph.test.ts    # DEFAULT_SUPPLY_CHAIN_GRAPH 스키마 및 위상 테스트
```

## Phase 0: Research & Clarification
- [x] Zod 스키마 및 SSOT 타입 모델링 확정
- [x] Decimal.js 정밀 연산 및 Last-Edge 잔여 오차 흡수 규칙 수립
- [x] Kahn 알고리즘 기반 DAG 무순환 검증 로직 수립
- [x] `research.md` 작성 완료

## Phase 1: Architecture & Interface Contracts
- [x] `data-model.md`: `NodeSchema`, `EdgeSchema`, `SupplyChainGraphSchema` 정의 완료
- [x] `contracts/domain-api.ts`: API 시그니처 및 인터페이스 정의 완료
- [x] `quickstart.md`: 시작 가이드 및 테스트 실행 예시 작성 완료
- [x] Constitution 재검증: 전 항목 PASS 확인
