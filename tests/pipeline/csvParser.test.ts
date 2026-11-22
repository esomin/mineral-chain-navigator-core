import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseCustomsCsv } from '../../src/pipeline/parser/csvParser';

describe('Customs CSV Parser Tests (US2)', () => {
  const samplePath = path.resolve(__dirname, '../../data/raw/customs/customs_trade_2026.csv');

  it('parses real customs_trade_2026.csv file without errors', () => {
    const records = parseCustomsCsv(samplePath);
    expect(records.length).toBeGreaterThan(0);

    const first = records[0];
    expect(first.period).toBe('2026');
    expect(first.countryName).toBeDefined();
    expect(first.hskCode).toBeDefined();
    expect(first.importWeightTon).toBeTypeOf('number');
  });

  it('skips header and total summary lines correctly', () => {
    const records = parseCustomsCsv(samplePath);
    const hasTotal = records.some((r) => r.period === '총계' || r.countryName === '총계');
    const hasHeader = records.some((r) => r.period === '기간');
    expect(hasTotal).toBe(false);
    expect(hasHeader).toBe(false);
  });
});

