import { CalculatedPackage } from '../types';

/**
 * Ekstraksi angka masa aktif dari format teks fleksibel (FR-02)
 * Contoh: 3, "3", "3hr", "3 hari", "3 Hari", "14 hr", "30hari" -> 3 / 14 / 30
 */
export function extractActiveDays(val: any): number {
  if (val === null || val === undefined || val === '') {
    return 1;
  }
  if (typeof val === 'number') {
    return Math.max(1, Math.round(val));
  }
  const str = String(val).trim();
  const match = str.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }
  return 1;
}

/**
 * Ekstraksi harga modal dari format angka atau teks (contoh: "Rp 50.000", 50000, "50.000")
 */
export function parseCostPrice(val: any): number {
  if (val === null || val === undefined || val === '') {
    return 0;
  }
  if (typeof val === 'number') {
    return Math.max(0, val);
  }
  // Remove non-digit characters
  const cleanStr = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Format mata uang Rupiah Indonesia (FR-05)
 * Contoh: 51000 -> "Rp 51.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Aturan Penambahan Keuntungan (Margin) (FR-03)
 * - Masa Aktif <= 3 Hari: Margin = Rp 2.000
 * - Masa Aktif 4 s.d. 14 Hari: Margin = Rp 2.500
 * - Masa Aktif > 14 Hari / Lainnya: Margin = Rp 3.000
 */
export function calculateMargin(activeDays: number): {
  margin: number;
  tier: 'tier1' | 'tier2' | 'tier3';
} {
  if (activeDays <= 3) {
    return { margin: 2000, tier: 'tier1' };
  } else if (activeDays >= 4 && activeDays <= 14) {
    return { margin: 2500, tier: 'tier2' };
  } else {
    return { margin: 3000, tier: 'tier3' };
  }
}

/**
 * Logika Pembulatan Kustom Kelipatan 1.000 (FR-04)
 * - Sisa Ratusan = Total % 1000
 * - Sisa Ratusan <= 300: Dibulatkan ke bawah ke ribuan terdekat
 * - Sisa Ratusan > 300: Dibulatkan ke atas ke ribuan terdekat
 */
export function calculateCustomRounding(totalBeforeRounding: number): {
  sellingPrice: number;
  remainder: number;
  direction: 'down' | 'up' | 'none';
  diff: number;
} {
  const remainder = totalBeforeRounding % 1000;
  let sellingPrice: number;
  let direction: 'down' | 'up' | 'none' = 'none';

  if (remainder === 0) {
    sellingPrice = totalBeforeRounding;
    direction = 'none';
  } else if (remainder <= 300) {
    // Dibulatkan ke bawah
    sellingPrice = Math.floor(totalBeforeRounding / 1000) * 1000;
    direction = 'down';
  } else {
    // Dibulatkan ke atas
    sellingPrice = Math.ceil(totalBeforeRounding / 1000) * 1000;
    direction = 'up';
  }

  return {
    sellingPrice,
    remainder,
    direction,
    diff: sellingPrice - totalBeforeRounding,
  };
}

/**
 * Menghitung satu paket data secara menyeluruh
 */
export function calculateSinglePackage(
  id: string,
  rawName: any,
  rawActiveDays: any,
  rawCost: any
): CalculatedPackage {
  const name = String(rawName || 'Paket Data Tanpa Nama').trim();
  const activeDays = extractActiveDays(rawActiveDays);
  const costPrice = parseCostPrice(rawCost);
  const { margin, tier } = calculateMargin(activeDays);
  const totalBeforeRounding = costPrice + margin;
  const rounding = calculateCustomRounding(totalBeforeRounding);
  const actualProfit = rounding.sellingPrice - costPrice;

  return {
    id,
    name,
    activeDays,
    activeDaysFormatted: `${activeDays} hr`,
    costPrice,
    costPriceFormatted: formatRupiah(costPrice),
    margin,
    marginFormatted: formatRupiah(margin),
    totalBeforeRounding,
    totalBeforeRoundingFormatted: formatRupiah(totalBeforeRounding),
    sellingPrice: rounding.sellingPrice,
    sellingPriceFormatted: formatRupiah(rounding.sellingPrice),
    remainder: rounding.remainder,
    roundingDirection: rounding.direction,
    roundingDiff: rounding.diff,
    actualProfit,
    actualProfitFormatted: formatRupiah(actualProfit),
    tier,
  };
}

/**
 * Data Sampel Riil Paket Data Indonesia untuk Pengujian Cepat
 */
export const SAMPLE_PACKAGES_RAW = [
  { name: 'Telkomsel InternetMAX 10GB', active: '3 hari', cost: 18500 },
  { name: 'Telkomsel Flash Regular 3GB', active: '3hr', cost: 12200 },
  { name: 'Indosat Freedom Harian 7GB', active: '7 Hari', cost: 23800 },
  { name: 'XL Xtra Combo Flex M 12GB', active: '7hr', cost: 31200 },
  { name: 'Axis Bronet 5GB 24 Jam', active: '14 Hari', cost: 28800 },
  { name: 'Smartfren Kuota Nonstop 18GB', active: '14 hari', cost: 44600 },
  { name: 'Tri AlwaysOn AON 6GB', active: '30 Hari', cost: 38600 },
  { name: 'Telkomsel OMG! Nonton 25GB', active: '30 hari', cost: 74200 },
  { name: 'XL Xtra Combo VIP Plus 35GB', active: '30hr', cost: 89300 },
  { name: 'Indosat Freedom Internet 50GB', active: '30 Hari', cost: 110400 },
  { name: 'By.U Kuota Yang Bikin Kaget 10GB', active: '1 Hari', cost: 9300 },
  { name: 'Tri Happy Jumbo 100GB', active: '30 Hari', cost: 135800 },
];
