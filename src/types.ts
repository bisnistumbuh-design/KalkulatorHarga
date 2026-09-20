export interface RawPackageRow {
  rawName: any;
  rawActiveDays: any;
  rawCostPrice: any;
  rawCategory?: any;
  rawIsPerdana?: any;
}

export type ProductCategory = 'paket' | 'perdana' | 'microsd' | 'powerbank' | 'aksesoris';

export type MicroSdCapacity = '4gb' | '8gb' | '16gb' | '32gb' | '64gb' | '128gb' | 'other';

export type ProductTier =
  | 'tier1' // Paket Data <= 3hr (+2rb)
  | 'tier2' // Paket Data 4-14hr (+2.5rb)
  | 'tier3' // Paket Data > 14hr (+3rb)
  | 'perdana' // Perdana (+5rb)
  | 'microsd_4gb' // MicroSD 4GB (+10rb)
  | 'microsd_8gb' // MicroSD 8GB (+12rb)
  | 'microsd_16_32gb' // MicroSD 16GB, 32GB (+15rb)
  | 'microsd_64_128gb' // MicroSD 64GB, 128GB (+18rb)
  | 'powerbank' // Powerbank (+15rb)
  | 'aksesoris_tier1' // Aksesoris HP Modal <= 10rb (+3rb)
  | 'aksesoris_tier2' // Aksesoris HP Modal 10.001 - 20rb (+5rb)
  | 'aksesoris_tier3' // Aksesoris HP Modal 20.001 - 75rb (+15rb)
  | 'aksesoris_tier4'; // Aksesoris HP Modal > 75rb (+20rb)

export interface CalculatedPackage {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  storageCapacity?: string; // "4GB", "8GB", "16GB", "32GB", "64GB", "128GB"
  activeDays: number;
  activeDaysFormatted: string; // "X hr" or "-" for hardware
  costPrice: number; // Harga Modal
  costPriceFormatted: string; // "Rp XX.XXX"
  margin: number; // Margin Keuntungan
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
  tier: ProductTier;
  isPerdana: boolean; // Backward-compatibility flag
}

export type ActiveFilterTier =
  | 'all'
  | 'paket'
  | 'tier1'
  | 'tier2'
  | 'tier3'
  | 'perdana'
  | 'penyimpanan'
  | 'microsd'
  | 'powerbank'
  | 'aksesoris';

