import type { HskMappingEntry } from '../types/commodity';

/**
 * Representative 10-digit HSK codes for battery mineral commodities
 */
export const HSK_COMMODITY_MAP: Record<string, HskMappingEntry> = {
  '2825.20-2000': {
    hskCode: '2825.20-2000',
    name: 'Lithium Hydroxide (수산화리튬)',
    commodityId: 'LITHIUM',
    conversionFactor: 0.88,
    stage: 'REFINERY',
    standardUnit: 'LCE_TON',
  },
  '2836.91-0000': {
    hskCode: '2836.91-0000',
    name: 'Lithium Carbonate (탄산리튬)',
    commodityId: 'LITHIUM',
    conversionFactor: 1.00,
    stage: 'REFINERY',
    standardUnit: 'LCE_TON',
  },
  '2825.90-2050': {
    hskCode: '2825.90-2050',
    name: 'NCM Precursor (NCM 전구체)',
    commodityId: 'CATHODE_PRECURSOR',
    conversionFactor: 1.00,
    stage: 'PRECURSOR',
    standardUnit: 'MT',
  },
  '2504.10-1000': {
    hskCode: '2504.10-1000',
    name: 'Natural Flake Graphite (인편상 천연흑연)',
    commodityId: 'GRAPHITE',
    conversionFactor: 1.00,
    stage: 'MINE',
    standardUnit: 'MT',
  },
  '3801.10-0000': {
    hskCode: '3801.10-0000',
    name: 'Synthetic Graphite (인조흑연)',
    commodityId: 'GRAPHITE',
    conversionFactor: 1.00,
    stage: 'REFINERY',
    standardUnit: 'MT',
  },
};
