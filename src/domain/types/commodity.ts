import { z } from 'zod';
import type { CapacityUnit, NodeCategory } from './node';

export const CommodityIdEnum = z.enum([
  'LITHIUM',
  'CATHODE_PRECURSOR',
  'GRAPHITE',
]);
export type CommodityId = z.infer<typeof CommodityIdEnum>;

export const CommodityStandardUnit: Record<CommodityId, CapacityUnit> = {
  LITHIUM: 'LCE_TON',
  CATHODE_PRECURSOR: 'MT',
  GRAPHITE: 'MT',
};

export interface HskMappingEntry {
  hskCode: string;
  name: string;
  commodityId: CommodityId;
  conversionFactor: number;
  stage: NodeCategory;
  standardUnit: CapacityUnit;
}
