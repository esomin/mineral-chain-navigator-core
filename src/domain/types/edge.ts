import { z } from 'zod';
import { CapacityUnitEnum } from './node';
import { CommodityIdEnum, CommodityStandardUnit } from './commodity';

export const EdgeSchema = z.object({
  id: z.string().regex(/^EDGE_[A-Z0-9_]+$/, 'Edge ID must follow EDGE_<COMMODITY>_<SRC>_TO_<TGT> format'),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  commodityId: CommodityIdEnum,
  baselineShare: z.number().gt(0).lte(1),
  annualVolume: z.number().nonnegative(),
  unit: CapacityUnitEnum,
}).refine((data) => data.unit === CommodityStandardUnit[data.commodityId], {
  message: 'Edge unit must strictly match commodity standard unit',
});

export type SupplyChainEdge = z.infer<typeof EdgeSchema>;

