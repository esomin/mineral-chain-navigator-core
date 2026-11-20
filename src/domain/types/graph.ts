import { z } from 'zod';
import { NodeSchema } from './node';
import { EdgeSchema } from './edge';

export const SupplyChainGraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export type SupplyChainGraph = z.infer<typeof SupplyChainGraphSchema>;

