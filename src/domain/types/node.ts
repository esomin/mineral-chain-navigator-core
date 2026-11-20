import { z } from 'zod';

export const NodeCategoryEnum = z.enum([
  'MINE',
  'REFINERY',
  'PRECURSOR',
  'ACTIVE_MATERIAL',
  'CELL_PLANT',
]);
export type NodeCategory = z.infer<typeof NodeCategoryEnum>;

export const NodeGranularityEnum = z.enum([
  'COUNTRY_HUB',
  'FACILITY',
]);
export type NodeGranularity = z.infer<typeof NodeGranularityEnum>;

export const CapacityUnitEnum = z.enum([
  'LCE_TON',
  'MT',
  'GWH',
]);
export type CapacityUnit = z.infer<typeof CapacityUnitEnum>;

export const NodeSchema = z.object({
  id: z.string().regex(/^NODE_[A-Z0-9_]+$/, 'Node ID must follow NODE_<COUNTRY>_<NAME> screaming snake format'),
  name: z.string().min(1),
  countryCode: z.string().length(2), // ISO 3166-1 alpha-2
  categories: z.array(NodeCategoryEnum).min(1),
  granularity: NodeGranularityEnum,
  annualCapacity: z.number().nonnegative(),
  capacityUnit: CapacityUnitEnum,
  isFeocRisk: z.boolean(),
});
export type SupplyChainNode = z.infer<typeof NodeSchema>;

