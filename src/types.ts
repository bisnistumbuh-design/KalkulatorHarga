export interface RawPackageRow {
  rawName: any;
  rawActiveDays: any;
  rawCostPrice: any;
}

export interface CalculatedPackage {
  id: string;
  name: string;
  activeDays: number;
  activeDaysFormatted: string; // "X hr"
  costPrice: number; // Harga Modal
  costPriceFormatted: string; // "Rp XX.XXX"
  margin: number; // Rp 2.000 / 2.500 / 3.000
  marginFormatted: string;
  totalBeforeRounding: number; // Modal + Untung
  totalBeforeRoundingFormatted: string; // "Rp XX.XXX"
  sellingPrice: number; // Harga Jual (Dibulatkan)
  sellingPriceFormatted: string; // "Rp XX.XXX"
  remainder: number; // Total % 1000
  roundingDirection: 'down' | 'up' | 'none'; // down (<=300) or up (>300)
  roundingDiff: number; // sellingPrice - totalBeforeRounding
  actualProfit: number; // sellingPrice - costPrice
  actualProfitFormatted: string;
  tier: 'tier1' | 'tier2' | 'tier3'; // <=3hr, 4-14hr, >14hr
}

export type ActiveFilterTier = 'all' | 'tier1' | 'tier2' | 'tier3';
