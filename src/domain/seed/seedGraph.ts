import type { SupplyChainGraph, SupplyChainNode, SupplyChainEdge } from '../types';

/**
 * 5 Foreign Country Hubs
 */
export const FOREIGN_HUBS: SupplyChainNode[] = [
  {
    id: 'NODE_AU_LITHIUM_MINE_HUB',
    name: 'Australia Lithium Spodumene Mine Hub',
    countryCode: 'AU',
    categories: ['MINE'],
    granularity: 'COUNTRY_HUB',
    annualCapacity: 350000,
    capacityUnit: 'LCE_TON',
    isFeocRisk: false,
  },
  {
    id: 'NODE_CL_LITHIUM_REFINERY_HUB',
    name: 'Chile Lithium Brine Refining Hub',
    countryCode: 'CL',
    categories: ['REFINERY'],
    granularity: 'COUNTRY_HUB',
    annualCapacity: 180000,
    capacityUnit: 'LCE_TON',
    isFeocRisk: false,
  },
  {
    id: 'NODE_CN_LITHIUM_REFINERY_HUB',
    name: 'China Lithium Chemical Refining Hub',
    countryCode: 'CN',
    categories: ['REFINERY'],
    granularity: 'COUNTRY_HUB',
    annualCapacity: 500000,
    capacityUnit: 'LCE_TON',
    isFeocRisk: true,
  },
  {
    id: 'NODE_CN_PRECURSOR_HUB',
    name: 'China NCM Cathode Precursor Hub',
    countryCode: 'CN',
    categories: ['PRECURSOR'],
    granularity: 'COUNTRY_HUB',
    annualCapacity: 600000,
    capacityUnit: 'MT',
    isFeocRisk: true,
  },
  {
    id: 'NODE_CN_GRAPHITE_HUB',
    name: 'China Natural & Synthetic Anode Graphite Hub',
    countryCode: 'CN',
    categories: ['MINE', 'REFINERY'],
    granularity: 'COUNTRY_HUB',
    annualCapacity: 800000,
    capacityUnit: 'MT',
    isFeocRisk: true,
  },
];

/**
 * 9 Domestic Korean Facilities
 */
export const DOMESTIC_FACILITIES: SupplyChainNode[] = [
  {
    id: 'NODE_KR_POSCO_PILBARA_LITHIUM',
    name: 'POSCO Pilbara Lithium Solution (Gwangyang)',
    countryCode: 'KR',
    categories: ['REFINERY'],
    granularity: 'FACILITY',
    annualCapacity: 43000,
    capacityUnit: 'LCE_TON',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_ECOPRO_MATERIALS',
    name: 'Ecopro Materials (Pohang)',
    countryCode: 'KR',
    categories: ['PRECURSOR'],
    granularity: 'FACILITY',
    annualCapacity: 50000,
    capacityUnit: 'MT',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_POSCO_FUTURE_M',
    name: 'POSCO Future M (Gwangyang)',
    countryCode: 'KR',
    categories: ['ACTIVE_MATERIAL'],
    granularity: 'FACILITY',
    annualCapacity: 90000,
    capacityUnit: 'MT',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_ECOPRO_BM',
    name: 'Ecopro BM (Pohang)',
    countryCode: 'KR',
    categories: ['ACTIVE_MATERIAL'],
    granularity: 'FACILITY',
    annualCapacity: 120000,
    capacityUnit: 'MT',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_LG_CHEM_CHEONGJU',
    name: 'LG Chem Cathode Plant (Cheongju)',
    countryCode: 'KR',
    categories: ['ACTIVE_MATERIAL'],
    granularity: 'FACILITY',
    annualCapacity: 80000,
    capacityUnit: 'MT',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_UMICORE_CHEONAN',
    name: 'Umicore Korea (Cheonan)',
    countryCode: 'KR',
    categories: ['REFINERY', 'ACTIVE_MATERIAL'],
    granularity: 'FACILITY',
    annualCapacity: 45000,
    capacityUnit: 'MT',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_LG_ENERGY_SOLUTION_OCHANG',
    name: 'LG Energy Solution (Ochang)',
    countryCode: 'KR',
    categories: ['CELL_PLANT'],
    granularity: 'FACILITY',
    annualCapacity: 35,
    capacityUnit: 'GWH',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_SAMSUNG_SDI_ULSAN',
    name: 'Samsung SDI (Ulsan)',
    countryCode: 'KR',
    categories: ['CELL_PLANT'],
    granularity: 'FACILITY',
    annualCapacity: 25,
    capacityUnit: 'GWH',
    isFeocRisk: false,
  },
  {
    id: 'NODE_KR_SK_ON_SEOSAN',
    name: 'SK On (Seosan)',
    countryCode: 'KR',
    categories: ['CELL_PLANT'],
    granularity: 'FACILITY',
    annualCapacity: 20,
    capacityUnit: 'GWH',
    isFeocRisk: false,
  },
];

/**
 * Baseline Supply Chain Edges
 * Note: Each target node's in-edges for a given commodity strictly sum to 1.0 (Decimal)
 */
export const DEFAULT_EDGES: SupplyChainEdge[] = [
  // 1. AU Spodumene -> POSCO Pilbara Lithium Solution (100% of Pilbara feedstock)
  {
    id: 'EDGE_LITHIUM_AU_MINE_TO_POSCO_PILBARA',
    sourceNodeId: 'NODE_AU_LITHIUM_MINE_HUB',
    targetNodeId: 'NODE_KR_POSCO_PILBARA_LITHIUM',
    commodityId: 'LITHIUM',
    baselineShare: 1.0,
    annualVolume: 43000,
    unit: 'LCE_TON',
  },

  // 2. Lithium to POSCO Future M: POSCO Pilbara (65%), CN Refinery Hub (35%) -> Sum = 1.0
  {
    id: 'EDGE_LITHIUM_POSCO_PILBARA_TO_POSCO_FUTURE_M',
    sourceNodeId: 'NODE_KR_POSCO_PILBARA_LITHIUM',
    targetNodeId: 'NODE_KR_POSCO_FUTURE_M',
    commodityId: 'LITHIUM',
    baselineShare: 0.65,
    annualVolume: 19500,
    unit: 'LCE_TON',
  },
  {
    id: 'EDGE_LITHIUM_CN_REFINERY_TO_POSCO_FUTURE_M',
    sourceNodeId: 'NODE_CN_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_POSCO_FUTURE_M',
    commodityId: 'LITHIUM',
    baselineShare: 0.35,
    annualVolume: 10500,
    unit: 'LCE_TON',
  },

  // 3. Lithium to Ecopro BM: CL Refinery Hub (40%), CN Refinery Hub (60%) -> Sum = 1.0
  {
    id: 'EDGE_LITHIUM_CL_REFINERY_TO_ECOPRO_BM',
    sourceNodeId: 'NODE_CL_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_ECOPRO_BM',
    commodityId: 'LITHIUM',
    baselineShare: 0.4,
    annualVolume: 16000,
    unit: 'LCE_TON',
  },
  {
    id: 'EDGE_LITHIUM_CN_REFINERY_TO_ECOPRO_BM',
    sourceNodeId: 'NODE_CN_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_ECOPRO_BM',
    commodityId: 'LITHIUM',
    baselineShare: 0.6,
    annualVolume: 24000,
    unit: 'LCE_TON',
  },

  // 4. Lithium to LG Chem: CL Refinery Hub (30%), CN Refinery Hub (70%) -> Sum = 1.0
  {
    id: 'EDGE_LITHIUM_CL_REFINERY_TO_LG_CHEM',
    sourceNodeId: 'NODE_CL_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_LG_CHEM_CHEONGJU',
    commodityId: 'LITHIUM',
    baselineShare: 0.3,
    annualVolume: 9000,
    unit: 'LCE_TON',
  },
  {
    id: 'EDGE_LITHIUM_CN_REFINERY_TO_LG_CHEM',
    sourceNodeId: 'NODE_CN_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_LG_CHEM_CHEONGJU',
    commodityId: 'LITHIUM',
    baselineShare: 0.7,
    annualVolume: 21000,
    unit: 'LCE_TON',
  },

  // 5. Lithium to Umicore Cheonan: CL Refinery Hub (50%), CN Refinery Hub (50%) -> Sum = 1.0
  {
    id: 'EDGE_LITHIUM_CL_REFINERY_TO_UMICORE',
    sourceNodeId: 'NODE_CL_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_UMICORE_CHEONAN',
    commodityId: 'LITHIUM',
    baselineShare: 0.5,
    annualVolume: 7500,
    unit: 'LCE_TON',
  },
  {
    id: 'EDGE_LITHIUM_CN_REFINERY_TO_UMICORE',
    sourceNodeId: 'NODE_CN_LITHIUM_REFINERY_HUB',
    targetNodeId: 'NODE_KR_UMICORE_CHEONAN',
    commodityId: 'LITHIUM',
    baselineShare: 0.5,
    annualVolume: 7500,
    unit: 'LCE_TON',
  },

  // 6. Precursor to Ecopro BM: Ecopro Materials (55%), CN Precursor Hub (45%) -> Sum = 1.0
  {
    id: 'EDGE_PRECURSOR_ECOPRO_MAT_TO_ECOPRO_BM',
    sourceNodeId: 'NODE_KR_ECOPRO_MATERIALS',
    targetNodeId: 'NODE_KR_ECOPRO_BM',
    commodityId: 'CATHODE_PRECURSOR',
    baselineShare: 0.55,
    annualVolume: 44000,
    unit: 'MT',
  },
  {
    id: 'EDGE_PRECURSOR_CN_HUB_TO_ECOPRO_BM',
    sourceNodeId: 'NODE_CN_PRECURSOR_HUB',
    targetNodeId: 'NODE_KR_ECOPRO_BM',
    commodityId: 'CATHODE_PRECURSOR',
    baselineShare: 0.45,
    annualVolume: 36000,
    unit: 'MT',
  },

  // 7. Precursor to POSCO Future M: CN Precursor Hub (100%) -> Sum = 1.0
  {
    id: 'EDGE_PRECURSOR_CN_HUB_TO_POSCO_FUTURE_M',
    sourceNodeId: 'NODE_CN_PRECURSOR_HUB',
    targetNodeId: 'NODE_KR_POSCO_FUTURE_M',
    commodityId: 'CATHODE_PRECURSOR',
    baselineShare: 1.0,
    annualVolume: 65000,
    unit: 'MT',
  },

  // 8. Precursor to LG Chem: CN Precursor Hub (100%) -> Sum = 1.0
  {
    id: 'EDGE_PRECURSOR_CN_HUB_TO_LG_CHEM',
    sourceNodeId: 'NODE_CN_PRECURSOR_HUB',
    targetNodeId: 'NODE_KR_LG_CHEM_CHEONGJU',
    commodityId: 'CATHODE_PRECURSOR',
    baselineShare: 1.0,
    annualVolume: 55000,
    unit: 'MT',
  },

  // 9. Precursor to Umicore: CN Precursor Hub (100%) -> Sum = 1.0
  {
    id: 'EDGE_PRECURSOR_CN_HUB_TO_UMICORE',
    sourceNodeId: 'NODE_CN_PRECURSOR_HUB',
    targetNodeId: 'NODE_KR_UMICORE_CHEONAN',
    commodityId: 'CATHODE_PRECURSOR',
    baselineShare: 1.0,
    annualVolume: 35000,
    unit: 'MT',
  },

  // 10. Graphite to Cell Plants: CN Graphite Hub (100%) -> Sum = 1.0 each
  {
    id: 'EDGE_GRAPHITE_CN_HUB_TO_LGES',
    sourceNodeId: 'NODE_CN_GRAPHITE_HUB',
    targetNodeId: 'NODE_KR_LG_ENERGY_SOLUTION_OCHANG',
    commodityId: 'GRAPHITE',
    baselineShare: 1.0,
    annualVolume: 35000,
    unit: 'MT',
  },
  {
    id: 'EDGE_GRAPHITE_CN_HUB_TO_SAMSUNG_SDI',
    sourceNodeId: 'NODE_CN_GRAPHITE_HUB',
    targetNodeId: 'NODE_KR_SAMSUNG_SDI_ULSAN',
    commodityId: 'GRAPHITE',
    baselineShare: 1.0,
    annualVolume: 25000,
    unit: 'MT',
  },
  {
    id: 'EDGE_GRAPHITE_CN_HUB_TO_SK_ON',
    sourceNodeId: 'NODE_CN_GRAPHITE_HUB',
    targetNodeId: 'NODE_KR_SK_ON_SEOSAN',
    commodityId: 'GRAPHITE',
    baselineShare: 1.0,
    annualVolume: 20000,
    unit: 'MT',
  },
];

export const DEFAULT_SUPPLY_CHAIN_GRAPH: SupplyChainGraph = {
  nodes: [...FOREIGN_HUBS, ...DOMESTIC_FACILITIES],
  edges: DEFAULT_EDGES,
};
