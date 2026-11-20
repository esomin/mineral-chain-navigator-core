# Public API & Service Contracts: Spec 2

## 1. Graph Repository(`src/db/repository/graphRepository.ts`)

  ```typescript
import type { SupplyChainGraph } from '../../domain/types';

export interface IGraphRepository {
  /**
   * Fetches all nodes and edges from PostgreSQL and constructs a valid SupplyChainGraph.
   * Guaranteed to pass SupplyChainGraphSchema.parse().
   */
  getActiveSupplyChainGraph(): Promise<SupplyChainGraph>;

  /**
   * Seeds the default supply chain graph into DB with idempotency (Upsert).
   */
  seedSupplyChainGraph(graph: SupplyChainGraph): Promise<{ insertedNodes: number; insertedEdges: number }>;
}
```

## 2. Scenario Repository(`src/db/repository/scenarioRepository.ts`)

  ```typescript
import type { ShockDefinition } from '../schema';

export interface CreateScenarioDTO {
  title: string;
  description?: string;
  shocks: ShockDefinition[];
  resultSnapshot?: Record<string, unknown>;
}

export interface ScenarioEntity extends CreateScenarioDTO {
  id: string;
  createdAt: Date;
}

export interface IScenarioRepository {
  create(dto: CreateScenarioDTO): Promise<ScenarioEntity>;
  findById(id: string): Promise<ScenarioEntity | null>;
  findAll(): Promise<ScenarioEntity[]>;
}
```

## 3. Customs ETL Service(`src/pipeline/customsEtlService.ts`)

  ```typescript
export interface EtlProcessResult {
  period: string;
  totalRowsParsed: number;
  logsInserted: number;
  edgesUpdated: number;
  rescaledShares: Record<string, Record<string, number>>; // commodity -> country -> share
}

export interface ICustomsEtlService {
  /**
   * Ingests CSV file downloaded from tradedata.go.kr,
   * stores import logs, rescales shares, and updates database edges.
   */
  processCustomsCsv(filePath: string): Promise<EtlProcessResult>;
}
```

