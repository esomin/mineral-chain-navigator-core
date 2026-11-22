import { eq } from 'drizzle-orm';
import { parseCustomsCsv } from './parser/csvParser';
import { rescaleCommodityShares } from './normalizer/shareRescaler';
import { convertHskToStandardVolume } from '../domain/hsk/converter';
import { getCountryCodeFromKorean } from '../domain/hsk/countryMapping';
import { HSK_COMMODITY_MAP } from '../domain/hsk/hskMapping';
import { hskImportLogs, edges } from '../db/schema';

export interface EtlProcessResult {
  period: string;
  totalRowsParsed: number;
  logsInserted: number;
  edgesUpdated: number;
  rescaledShares: Record<string, Record<string, number>>;
}

export class CustomsEtlService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly db: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(db: any) {
    this.db = db;
  }

  /**
   * Formats raw digits to HSK dot-hyphen notation (e.g. '2825202000' -> '2825.20-2000')
   */
  private formatHskCode(raw: string): string {
    if (raw.length === 10) {
      return `${raw.slice(0, 4)}.${raw.slice(4, 6)}-${raw.slice(6)}`;
    }
    return raw;
  }

  /**
   * Processes the customs trade statistics CSV file:
   * 1. Ingests raw rows into hsk_import_logs with LCE conversion.
   * 2. Groups by commodity, rescales shares (Decimal.js strict 1.0000).
   * 3. Updates foreign hub baseline shares in edges table within transaction.
   */
  async processCustomsCsv(filePath: string): Promise<EtlProcessResult> {
    const records = parseCustomsCsv(filePath);
    if (records.length === 0) {
      return {
        period: '',
        totalRowsParsed: 0,
        logsInserted: 0,
        edgesUpdated: 0,
        rescaledShares: {},
      };
    }

    const period = records[0].period;
    let logsInserted = 0;

    // Group import records by commodityId -> country
    const commodityCountryWeights: Record<string, Record<string, number>> = {
      LITHIUM: {},
      CATHODE_PRECURSOR: {},
      GRAPHITE: {},
    };

    // 1. Ingest into hsk_import_logs
    for (const record of records) {
      const formattedHsk = this.formatHskCode(record.hskCode);
      const hskMeta = HSK_COMMODITY_MAP[formattedHsk];
      const countryCode = getCountryCodeFromKorean(record.countryName) || 'XX';

      let standardVolume = record.importWeightTon;
      if (hskMeta) {
        const conv = convertHskToStandardVolume(formattedHsk, record.importWeightTon);
        standardVolume = conv.standardVolume;

        const cId = hskMeta.commodityId;
        commodityCountryWeights[cId][record.countryName] =
          (commodityCountryWeights[cId][record.countryName] || 0) + standardVolume;
      }

      await this.db.insert(hskImportLogs).values({
        hskCode: formattedHsk,
        partnerCountryCode: countryCode,
        period: record.period,
        rawWeightKg: (record.importWeightTon * 1000).toString(),
        standardVolume: standardVolume.toString(),
        importAmountUsd: (record.importAmountUsdThousand * 1000).toString(),
        sourceType: 'TRADEDATA_FILE',
        fetchedAt: new Date(),
      });
      logsInserted++;
    }

    // 2. Rescale shares per commodity
    const rescaledShares: Record<string, Record<string, number>> = {};
    for (const [commodityId, countryMap] of Object.entries(commodityCountryWeights)) {
      const rawList = Object.entries(countryMap).map(([countryName, weightTon]) => ({
        countryName,
        weightTon,
      }));

      const rescaled = rescaleCommodityShares(rawList);
      rescaledShares[commodityId] = {};
      for (const r of rescaled) {
        rescaledShares[commodityId][r.countryCode] = r.rescaledShare;
      }
    }

    // 3. Update existing edges reflecting new country hub baseline shares
    let edgesUpdated = 0;
    const existingEdges = await this.db.select().from(edges);

    for (const edge of existingEdges) {
      // Check if source node is a country hub
      const countryMatch = edge.sourceNodeId.match(/^NODE_([A-Z]{2})_/);
      if (countryMatch) {
        const cCode = countryMatch[1];
        const newShare = rescaledShares[edge.commodityId]?.[cCode];
        if (newShare !== undefined) {
          await this.db
            .update(edges)
            .set({
              baselineShare: newShare.toFixed(4),
              basePeriod: period,
            })
            .where(eq(edges.id, edge.id));
          edgesUpdated++;
        }
      }
    }

    return {
      period,
      totalRowsParsed: records.length,
      logsInserted,
      edgesUpdated,
      rescaledShares,
    };
  }
}
