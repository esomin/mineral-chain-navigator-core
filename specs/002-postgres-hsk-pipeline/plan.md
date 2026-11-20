# Implementation Plan: PostgreSQL 영속화 및 관세청 HSK 통계 수집 파이프라인

**Branch**: `002-postgres-hsk-pipeline` | **Date**: 2026-11-20 | **Spec**: [specs/002-postgres-hsk-pipeline/spec.md](spec.md)

**Input**: Feature specification from `specs/002-postgres-hsk-pipeline/spec.md`

## Summary

Spec 1에서 구현한 배터리 공급망 도메인 모델(`SupplyChainGraph`)을 PostgreSQL(Drizzle ORM)에 영속화하고, 관세청 무역통계 포털(`tradedata.go.kr`)의 2026년 실적 데이터(`data/raw/customs/customs_trade_2026.csv`)를 파싱하여 `Decimal.js` 기반 LCE 환산, 핵심국가 Whitelist 선별 및 비례 재정규화(`sum == 1.0000`)를 거쳐 엣지 가중치를 갱신하는 완전한 데이터 파이프라인을 구축한다. 테스트는 `@electric-sql/pglite`를 사용하여 외부 DB 의존성 없이 100% 인메모리로 검증한다.

## Technical Context

**Language/Version**: TypeScript 5.x+ (Strict Mode)

**Primary Dependencies**: `drizzle-orm`, `postgres` (porsager/postgres.js), `csv-parse`, `decimal.js`, `zod`

**Storage**: PostgreSQL (개발/운영: PostgreSQL 16+, 테스트: `@electric-sql/pglite` 인메모리)

**Testing**: `vitest` + `@electric-sql/pglite` (Zero-Docker 인메모리 PostgreSQL 테스트)

**Target Platform**: Node.js 20+ & Serverless compatible

**Project Type**: Backend Data & Persistence Pipeline

**Performance Goals**: CSV 1,000행 파싱 및 가중치 갱신 < 200ms, 그래프 DB 조회 < 20ms

**Constraints**:
- Spec 1 도메인 모델(`SupplyChainGraphSchema`)과의 100% 호환성 유지
- `Decimal.js`를 사용한 무오차 점유율 합계 1.0000 강제 (Absorption Rule 적용)
- DB 시딩은 멱등성(Idempotency) 보장
- 외부 DB 서버 설치 없이 `npm run test` 통과 가능

## Constitution Check

| 원칙 | 준수 여부 | 확인 내용 |
|---|---|---|
| I. Separation of Concerns & Deterministic Purity | **PASS** | 도메인 로직과 분리된 `src/db/`, `src/pipeline/` 계층 구축 |
| II. Strict TypeScript & SSOT | **PASS** | Drizzle ORM의 strict 타입 추론 및 `Zod` 스키마 검증 연동 |
| III. Numerical Precision (Decimal.js) | **PASS** | 국가별 수입 중량 환산 및 비례 재정규화 점유율 계산 전체에 `Decimal.js` 적용 |
| IV. Test-Driven Verification (Vitest) | **PASS** | PGlite 기반의 마이그레이션, 시딩 멱등성, ETL 점유율 1.0000 단위/통합 테스트 작성 |
| V. Value Chain Taxonomy & DAG Invariants | **PASS** | DB에서 조회된 그래프가 Spec 1의 5단계 공정 및 DAG 불변식을 만족함을 보장 |

## Project Structure

### Documentation (this feature)

```text
specs/002-postgres-hsk-pipeline/
├── plan.md              # 본 구현 계획 문서
├── research.md          # PGlite, Drizzle ORM, 재정규화 알고리즘 연구
├── data-model.md        # Drizzle 테이블 스키마 및 불변식 정의
├── quickstart.md        # 의존성 설치, 마이그레이션, ETL 실행 가이드
├── contracts/
│   └── service-contracts.ts # Repository 및 ETL 서비스 인터페이스 계약
└── tasks.md             # 추후 /speckit-tasks 단계에서 생성될 작업 목록
```

### Source Code (repository root)

```text
data/
└── raw/
    └── customs/
        ├── README.md
        └── customs_trade_2026.csv   # 관세청 원시 실적 데이터

src/
├── db/
│   ├── schema.ts                    # Drizzle 4개 테이블 선언 (nodes, edges, logs, scenarios)
│   ├── client.ts                    # PostgreSQL 연결 클라이언트 (postgres.js)
│   ├── seed.ts                      # Idempotent db:seed 스크립트
│   └── repository/
│       ├── graphRepository.ts       # getActiveSupplyChainGraph, seedSupplyChainGraph
│       └── scenarioRepository.ts    # 시뮬레이션 시나리오 CRUD
├── domain/
│   └── hsk/
│       └── countryMapping.ts        # KOREAN_COUNTRY_CODE_MAP (한글 -> ISO2)
└── pipeline/
    ├── parser/
    │   └── csvParser.ts             # csv-parse 기반 관세청 CSV 파서
    ├── normalizer/
    │   └── shareRescaler.ts         # Whitelist 필터링 & Decimal.js 비례 재정규화
    └── customsEtlService.ts         # ETL 오케스트레이션 서비스

tests/
├── helpers/
│   └── testDb.ts                    # PGlite 인메모리 테스트 DB 팩토리
└── pipeline/
    ├── csvParser.test.ts            # CSV 파서 단위 테스트
    ├── shareRescaler.test.ts        # 비례 재정규화 및 1.0000 합산 테스트
    ├── dbPersistence.test.ts        # Drizzle 스키마, 마이그레이션 및 시딩 멱등성 테스트
    └── customsEtlService.test.ts    # 전체 ETL 파이프라인 통합 테스트
```

## Phase 0: Research & Clarification
- [x] PGlite Wasm 인메모리 구동 검증
- [x] Top-N 및 Whitelist 비례 재정규화 알고리즘 수립
- [x] `csv-parse` 및 한글 국가명 ISO2 매핑 전략 확정
- [x] `research.md` 작성 완료

## Phase 1: Architecture & Interface Contracts
- [x] `data-model.md`: Drizzle 4개 테이블 스키마 선언 완료
- [x] `contracts/service-contracts.ts`: Repository & Service API 시그니처 정의 완료
- [x] `quickstart.md`: 환경 설정 및 실행 가이드 작성 완료
- [x] Constitution 재검증: 전 항목 PASS 확인
