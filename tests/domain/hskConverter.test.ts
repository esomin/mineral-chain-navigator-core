import { describe, it, expect } from 'vitest';
import { convertHskToStandardVolume } from '../../src/domain/hsk/converter';
import { HSK_COMMODITY_MAP } from '../../src/domain/hsk/hskMapping';

describe('HSK Conversion Precision Tests (US2)', () => {
  it('converts Lithium Hydroxide (2825.20-2000) 1000 MT to exactly 880 LCE_TON', () => {
    const result = convertHskToStandardVolume('2825.20-2000', 1000);
    expect(result.standardVolume).toBe(880);
    expect(result.unit).toBe('LCE_TON');
    expect(result.commodityId).toBe('LITHIUM');
    expect(result.conversionFactor).toBe(0.88);
  });

  it('converts Lithium Carbonate (2836.91-0000) 500 MT to exactly 500 LCE_TON', () => {
    const result = convertHskToStandardVolume('2836.91-0000', 500);
    expect(result.standardVolume).toBe(500);
    expect(result.unit).toBe('LCE_TON');
  });

  it('converts NCM Precursor (2825.90-2050) 1:1 MT', () => {
    const result = convertHskToStandardVolume('2825.90-2050', 1250);
    expect(result.standardVolume).toBe(1250);
    expect(result.unit).toBe('MT');
    expect(result.commodityId).toBe('CATHODE_PRECURSOR');
  });

  it('converts Natural and Synthetic Graphite 1:1 MT', () => {
    const naturalResult = convertHskToStandardVolume('2504.10-1000', 300);
    expect(naturalResult.standardVolume).toBe(300);
    expect(naturalResult.unit).toBe('MT');
    expect(naturalResult.commodityId).toBe('GRAPHITE');

    const syntheticResult = convertHskToStandardVolume('3801.10-0000', 450);
    expect(syntheticResult.standardVolume).toBe(450);
    expect(syntheticResult.unit).toBe('MT');
    expect(syntheticResult.commodityId).toBe('GRAPHITE');
  });

  it('throws clear error on unsupported HSK code', () => {
    expect(() => convertHskToStandardVolume('9999.99-9999', 100)).toThrow(
      'Unsupported HSK Code: 9999.99-9999'
    );
  });

  it('verifies all map entries have correct standard units', () => {
    expect(HSK_COMMODITY_MAP['2825.20-2000'].standardUnit).toBe('LCE_TON');
    expect(HSK_COMMODITY_MAP['2836.91-0000'].standardUnit).toBe('LCE_TON');
    expect(HSK_COMMODITY_MAP['2825.90-2050'].standardUnit).toBe('MT');
    expect(HSK_COMMODITY_MAP['2504.10-1000'].standardUnit).toBe('MT');
    expect(HSK_COMMODITY_MAP['3801.10-0000'].standardUnit).toBe('MT');
  });
});

