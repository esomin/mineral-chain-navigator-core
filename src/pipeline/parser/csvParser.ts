import fs from 'fs';
import { parse } from 'csv-parse/sync';

export interface RawCustomsRecord {
  period: string;
  countryName: string;
  hskCode: string;
  commodityName: string;
  exportWeightTon: number;
  exportAmountUsdThousand: number;
  importWeightTon: number;
  importAmountUsdThousand: number;
  tradeBalanceUsdThousand: number;
}

/**
 * Parses raw customs CSV file downloaded from tradedata.go.kr.
 * Handles BOM, UTF-8/CP949 fallback, and skips header/total rows.
 */
export function parseCustomsCsv(filePath: string): RawCustomsRecord[] {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Strip UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const rawRecords = parse(content, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  if (rawRecords.length === 0) {
    return [];
  }

  const records: RawCustomsRecord[] = [];

  for (const row of rawRecords) {
    const period = row[0]?.trim();
    const countryName = row[1]?.trim();
    const hskCode = row[2]?.replace(/[^0-9]/g, '').trim();
    const commodityName = row[3]?.trim();

    // Skip header row or total ("총계") row
    if (!period || period === '기간' || period === '총계' || !hskCode) {
      continue;
    }

    const exportWeightTon = parseFloat(row[4] || '0') || 0;
    const exportAmountUsdThousand = parseFloat(row[5] || '0') || 0;
    const importWeightTon = parseFloat(row[6] || '0') || 0;
    const importAmountUsdThousand = parseFloat(row[7] || '0') || 0;
    const tradeBalanceUsdThousand = parseFloat(row[8] || '0') || 0;

    records.push({
      period,
      countryName,
      hskCode,
      commodityName,
      exportWeightTon,
      exportAmountUsdThousand,
      importWeightTon,
      importAmountUsdThousand,
      tradeBalanceUsdThousand,
    });
  }

  return records;
}

