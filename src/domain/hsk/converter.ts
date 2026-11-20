import Decimal from 'decimal.js';
import type { CommodityId, CapacityUnit } from '../types';
import { HSK_COMMODITY_MAP } from './hskMapping';

export interface HskConversionResult {
  hskCode: string;
  commodityId: CommodityId;
  rawTon: number;
  standardVolume: number;
  unit: CapacityUnit;
  conversionFactor: number;
}

/**
 * Converts raw metric tons (MT) from HSK trade data into standard battery commodity units.
 * Uses Decimal.js for precise conversion (preventing floating point errors).
 *
 * @param hskCode - 10-digit HSK string (e.g. '2825.20-2000')
 * @param rawTon - Raw import volume in metric tons (number, string, or Decimal)
 * @returns HskConversionResult with calculated standard volume
 * @throws Error if hskCode is unsupported
 */
export function convertHskToStandardVolume(
  hskCode: string,
  rawTon: number | string | Decimal
): HskConversionResult {
  const entry = HSK_COMMODITY_MAP[hskCode];
  if (!entry) {
    throw new Error(`Unsupported HSK Code: ${hskCode}`);
  }

  const raw = new Decimal(rawTon);
  const factor = new Decimal(entry.conversionFactor);
  const volume = raw.times(factor);

  return {
    hskCode,
    commodityId: entry.commodityId,
    rawTon: raw.toNumber(),
    standardVolume: volume.toNumber(),
    unit: entry.standardUnit,
    conversionFactor: entry.conversionFactor,
  };
}
