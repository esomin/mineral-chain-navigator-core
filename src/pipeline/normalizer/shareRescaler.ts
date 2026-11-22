import Decimal from 'decimal.js';
import { getCountryCodeFromKorean } from '../../domain/hsk/countryMapping';

export interface CountryImportWeight {
  countryName: string;
  countryCode: string;
  weightTon: number;
}

export interface RescaledShareResult {
  countryCode: string;
  countryName: string;
  weightTon: number;
  rescaledShare: number; // Decimal formatted to 4 decimals, strictly sum to 1.0000
}

const WHITELIST_COUNTRIES = new Set(['CN', 'CL', 'AU']);
const SIGNIFICANT_SHARE_CUTOFF = 0.05; // 5%

/**
 * Filters raw country import weights and proportionally rescales their shares
 * so that the sum of baselineShare equals strictly 1.0000 using Decimal.js.
 */
export function rescaleCommodityShares(
  rawImports: { countryName: string; weightTon: number }[]
): RescaledShareResult[] {
  // 1. Resolve country codes and filter non-zero imports
  const validImports: CountryImportWeight[] = [];
  for (const item of rawImports) {
    if (item.weightTon <= 0) continue;
    const code = getCountryCodeFromKorean(item.countryName);
    if (code) {
      validImports.push({
        countryName: item.countryName,
        countryCode: code,
        weightTon: item.weightTon,
      });
    }
  }

  if (validImports.length === 0) {
    return [];
  }

  // 2. Calculate raw total weight to find proportions
  let rawTotal = new Decimal(0);
  for (const item of validImports) {
    rawTotal = rawTotal.plus(new Decimal(item.weightTon));
  }

  // 3. Filter by Whitelist OR >= 5% share
  const kept = validImports.filter((item) => {
    const rawShare = new Decimal(item.weightTon).dividedBy(rawTotal).toNumber();
    return WHITELIST_COUNTRIES.has(item.countryCode) || rawShare >= SIGNIFICANT_SHARE_CUTOFF;
  });

  if (kept.length === 0) {
    return [];
  }

  // 4. Sum kept weights
  let keptTotal = new Decimal(0);
  for (const item of kept) {
    keptTotal = keptTotal.plus(new Decimal(item.weightTon));
  }

  // 5. Proportional Rescaling with Last-Edge Absorption Rule
  const results: RescaledShareResult[] = [];
  let accumulatedShare = new Decimal(0);

  for (let i = 0; i < kept.length; i++) {
    const item = kept[i];
    const isLast = i === kept.length - 1;

    let share: Decimal;
    if (isLast) {
      // Last edge absorbs remainder to ensure strict 1.0000 sum
      share = new Decimal(1.0).minus(accumulatedShare);
    } else {
      share = new Decimal(item.weightTon)
        .dividedBy(keptTotal)
        .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
      accumulatedShare = accumulatedShare.plus(share);
    }

    results.push({
      countryCode: item.countryCode,
      countryName: item.countryName,
      weightTon: item.weightTon,
      rescaledShare: share.toNumber(),
    });
  }

  return results;
}
