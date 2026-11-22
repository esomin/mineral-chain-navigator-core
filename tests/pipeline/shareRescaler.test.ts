import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { rescaleCommodityShares } from '../../src/pipeline/normalizer/shareRescaler';

describe('Share Rescaler & Absorption Rule Tests (US2)', () => {
  it('rescales top whitelist countries and enforces exact 1.0000 sum via Decimal.js', () => {
    const rawImports = [
      { countryName: '중국', weightTon: 8450 },
      { countryName: '칠레', weightTon: 1200 },
      { countryName: '호주', weightTon: 250 },
      { countryName: '일본', weightTon: 80 }, // < 5%, excluded from hub
      { countryName: '독일', weightTon: 20 }, // < 5%, excluded
    ];

    const results = rescaleCommodityShares(rawImports);

    expect(results).toHaveLength(3); // CN, CL, AU kept
    expect(results.map((r) => r.countryCode)).toEqual(['CN', 'CL', 'AU']);

    // Check sum of rescaled shares strictly equals 1.0000
    let sum = new Decimal(0);
    for (const r of results) {
      sum = sum.plus(new Decimal(r.rescaledShare));
    }

    expect(sum.equals(new Decimal(1.0))).toBe(true);
  });

  it('preserves significant non-whitelist country if share >= 5%', () => {
    const rawImports = [
      { countryName: '중국', weightTon: 6000 },
      { countryName: '모로코', weightTon: 3000 }, // Significant non-whitelist country (30%)
      { countryName: '일본', weightTon: 100 },
    ];

    const results = rescaleCommodityShares(rawImports);
    expect(results.some((r) => r.countryCode === 'MA')).toBe(true);

    let sum = new Decimal(0);
    for (const r of results) {
      sum = sum.plus(new Decimal(r.rescaledShare));
    }
    expect(sum.equals(new Decimal(1.0))).toBe(true);
  });
});

