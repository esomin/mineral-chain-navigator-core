import { eq } from 'drizzle-orm';
import { simulationScenarios } from '../schema';
import type { ShockDefinition } from '../schema';

export interface CreateScenarioDTO {
  title: string;
  description?: string;
  shocks: ShockDefinition[];
  resultSnapshot?: Record<string, unknown>;
}

export interface ScenarioEntity {
  id: string;
  title: string;
  description: string | null;
  shocks: ShockDefinition[];
  resultSnapshot: Record<string, unknown> | null;
  createdAt: Date;
}

export class ScenarioRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly db: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(db: any) {
    this.db = db;
  }

  async create(dto: CreateScenarioDTO): Promise<ScenarioEntity> {
    const [inserted] = await this.db
      .insert(simulationScenarios)
      .values({
        title: dto.title,
        description: dto.description || null,
        shocks: dto.shocks,
        resultSnapshot: dto.resultSnapshot || null,
        createdAt: new Date(),
      })
      .returning();

    return inserted;
  }

  async findById(id: string): Promise<ScenarioEntity | null> {
    const [found] = await this.db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.id, id));

    return found || null;
  }

  async findAll(): Promise<ScenarioEntity[]> {
    return this.db.select().from(simulationScenarios);
  }
}
