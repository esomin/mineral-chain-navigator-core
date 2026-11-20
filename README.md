# Mineral Chain Navigator Core

본 프로젝트는 Spec-Driven Development(SDD) 방식으로 설계되었으며, 각 도메인 코어의 명세와 설계 문서는 [`specs/`](./specs)에서 확인할 수 있습니다.

## Features & Domain Modules

- **5단계 배터리 밸류체인 그래프 모델링**: `MINE` -> `REFINERY` -> `PRECURSOR` -> `ACTIVE_MATERIAL` -> `CELL_PLANT`
- **노드 입도(Granularity) 구분**: 해외 국가/지역 거점 허브(`COUNTRY_HUB`) 및 국내 개별 생산 공장(`FACILITY`)
- **관세청 10자리 HSK 품목 매핑 & 변환**: `Decimal.js` 기반 무오차 표준 단위(`LCE_TON`, `MT`) 변환
- **위상 검증 & 무결성 엔진**: Kahn 알고리즘 기반 DAG 무순환 검증 및 인입 엣지 공급 점유율(`baselineShare`) 엄격한 1.0(Strict 1.0) 무결성 보장
- **현실 기반 기준 데이터**: 해외 5개 핵심 허브 및 국내 9개 선도 기업 거점 Seed 그래프 (`DEFAULT_SUPPLY_CHAIN_GRAPH`)

## Quick Usage

```typescript
import {
  DEFAULT_SUPPLY_CHAIN_GRAPH,
  validateSupplyChainGraph,
  convertHskToStandardVolume,
  SupplyChainGraphSchema
} from './src/domain';

// 1. Zod 스키마 검증
const parsed = SupplyChainGraphSchema.parse(DEFAULT_SUPPLY_CHAIN_GRAPH);

// 2. DAG 무순환 및 엄격한 1.0 점유율 합계 검증
const validation = validateSupplyChainGraph(DEFAULT_SUPPLY_CHAIN_GRAPH);
console.log(validation.isValid); // true

// 3. HSK 수입 중량 표준화 (수산화리튬 1000톤 -> 880 LCE_TON)
const converted = convertHskToStandardVolume('2825.20-2000', 1000);
console.log(converted.standardVolume, converted.unit); // 880 'LCE_TON'
```

## Testing & Quality

```bash
# Vitest 테스트 스위트 실행 (20 tests passed)
npm run test

# ESLint 린트 검사
npm run lint

# TypeScript Strict Typecheck
npx tsc -b
```
