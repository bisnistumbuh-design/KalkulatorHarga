import { CalculatedPackage, ProductCategory, ProductTier, MicroSdCapacity } from '../types';

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
 * Deteksi apakah suatu produk adalah Penjualan Perdana
 * Mendeteksi flag eksplisit atau kata kunci dalam nama produk (perdana, kartu perdana, sp)
 */
export function isPerdanaProduct(name: any, explicitFlag?: boolean | string): boolean {
  if (explicitFlag !== undefined && explicitFlag !== null) {
    if (typeof explicitFlag === 'boolean') return explicitFlag;
    const s = String(explicitFlag).toLowerCase().trim();
    if (s === 'true' || s === '1' || s === 'ya' || s === 'yes' || s === 'perdana') return true;
    if (s === 'false' || s === '0' || s === 'tidak' || s === 'no' || s === 'paket') return false;
  }
  if (!name) return false;
  const lower = String(name).toLowerCase();
  return (
    lower.includes('perdana') ||
    /\bsp\b/i.test(lower) ||
    lower.includes('starter pack') ||
    lower.includes('kartu perdana')
  );
}

/**
 * Ekstraksi kapasitas memori MicroSD dari teks nama (misal: "4GB", "32 GB")
 */
export function extractMicroSdCapacity(name: any, explicitCapacity?: string): string | undefined {
  if (explicitCapacity && explicitCapacity.trim()) {
    const cleaned = explicitCapacity.trim().toUpperCase();
    if (cleaned.includes('4GB') || cleaned === '4') return '4GB';
    if (cleaned.includes('8GB') || cleaned === '8') return '8GB';
    if (cleaned.includes('16GB') || cleaned === '16') return '16GB';
    if (cleaned.includes('32GB') || cleaned === '32') return '32GB';
    if (cleaned.includes('64GB') || cleaned === '64') return '64GB';
    if (cleaned.includes('128GB') || cleaned === '128') return '128GB';
    return cleaned;
  }
  if (!name) return undefined;
  const str = String(name);
  if (/\b4\s*gb\b/i.test(str)) return '4GB';
  if (/\b8\s*gb\b/i.test(str)) return '8GB';
  if (/\b16\s*gb\b/i.test(str)) return '16GB';
  if (/\b32\s*gb\b/i.test(str)) return '32GB';
  if (/\b64\s*gb\b/i.test(str)) return '64GB';
  if (/\b128\s*gb\b/i.test(str)) return '128GB';
  if (/\b256\s*gb\b/i.test(str)) return '256GB';
  if (/\b512\s*gb\b/i.test(str)) return '512GB';
  return undefined;
}

/**
 * Mendeteksi kategori produk secara akurat
 */
export function detectProductCategory(
  name: any,
  explicitCategory?: any,
  isPerdanaFlag?: boolean | string
): {
  category: ProductCategory;
  categoryLabel: string;
  storageCapacity?: string;
} {
  const nameStr = String(name || '');
  const lower = nameStr.toLowerCase();

  // 1. Periksa kategori eksplisit jika ada
  if (explicitCategory) {
    const exp = String(explicitCategory).toLowerCase().trim();
    if (exp === 'microsd' || exp.includes('microsd') || exp.includes('micro sd') || exp.includes('penyimpanan') || exp.includes('memory') || exp.includes('memori')) {
      const cap = extractMicroSdCapacity(nameStr);
      return {
        category: 'microsd',
        categoryLabel: cap ? `MicroSD ${cap}` : 'MicroSD (Penyimpanan)',
        storageCapacity: cap,
      };
    }
    if (exp === 'powerbank' || exp.includes('powerbank') || exp.includes('power bank') || exp === 'pb') {
      return {
        category: 'powerbank',
        categoryLabel: 'Powerbank',
      };
    }
    if (exp === 'perdana' || exp.includes('perdana')) {
      return {
        category: 'perdana',
        categoryLabel: 'Kartu Perdana',
      };
    }
    if (exp === 'paket' || exp.includes('paket') || exp.includes('data')) {
      return {
        category: 'paket',
        categoryLabel: 'Paket Data',
      };
    }
  }

  // 2. Periksa flag isPerdana
  if (isPerdanaProduct(nameStr, isPerdanaFlag)) {
    return {
      category: 'perdana',
      categoryLabel: 'Kartu Perdana',
    };
  }

  // 3. Deteksi otomatis dari nama produk
  // Cek MicroSD
  if (
    lower.includes('microsd') ||
    lower.includes('micro sd') ||
    lower.includes('micro-sd') ||
    lower.includes('sd card') ||
    lower.includes('memory card') ||
    lower.includes('memori card') ||
    lower.includes('kartu memori') ||
    lower.includes('tf card')
  ) {
    const cap = extractMicroSdCapacity(nameStr);
    return {
      category: 'microsd',
      categoryLabel: cap ? `MicroSD ${cap}` : 'MicroSD (Penyimpanan)',
      storageCapacity: cap,
    };
  }

  // Cek Powerbank
  if (
    lower.includes('powerbank') ||
    lower.includes('power bank') ||
    /\bpower\s*bank\b/i.test(lower) ||
    /\bpb\b/i.test(lower)
  ) {
    return {
      category: 'powerbank',
      categoryLabel: 'Powerbank',
    };
  }

  // Default: Paket Data
  return {
    category: 'paket',
    categoryLabel: 'Paket Data',
  };
}

/**
 * Aturan Penambahan Keuntungan (Margin) Lengkap:
 * - Kategori Penyimpanan (MicroSD):
 *   - 4GB: Modal + Rp 10.000
 *   - 8GB: Modal + Rp 12.000
 *   - 16GB, 32GB: Modal + Rp 15.000
 *   - 64GB, 128GB (dan ke atas): Modal + Rp 18.000
 *   - Kapasitas umum/lainnya: Modal + Rp 15.000
 * - Powerbank: Modal + Rp 15.000 (15rb)
 * - Penjualan Perdana: Modal + Rp 5.000
 * - Paket Data Biasa:
 *   - Masa Aktif <= 3 Hari: Margin = Rp 2.000
 *   - Masa Aktif 4 s.d. 14 Hari: Margin = Rp 2.500
 *   - Masa Aktif > 14 Hari / Lainnya: Margin = Rp 3.000
 */
export function calculateMargin(
  activeDays: number,
  category: ProductCategory = 'paket',
  storageCapacity?: string
): {
  margin: number;
  tier: ProductTier;
} {
  if (category === 'microsd') {
    const cap = (storageCapacity || '').toUpperCase().trim();
    if (cap === '4GB') {
      return { margin: 10000, tier: 'microsd_4gb' };
    }
    if (cap === '8GB') {
      return { margin: 12000, tier: 'microsd_8gb' };
    }
    if (cap === '16GB' || cap === '32GB') {
      return { margin: 15000, tier: 'microsd_16_32gb' };
    }
    if (cap === '64GB' || cap === '128GB' || cap === '256GB' || cap === '512GB') {
      return { margin: 18000, tier: 'microsd_64_128gb' };
    }
    // Default jika kapasitas MicroSD tidak terdeteksi
    return { margin: 15000, tier: 'microsd_16_32gb' };
  }

  if (category === 'powerbank') {
    return { margin: 15000, tier: 'powerbank' };
  }

  if (category === 'perdana') {
    return { margin: 5000, tier: 'perdana' };
  }

  // Kategori Paket Data
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
 * Menghitung satu produk (paket data, kartu perdana, MicroSD, atau Powerbank) secara menyeluruh
 */
export function calculateSinglePackage(
  id: string,
  rawName: any,
  rawActiveDays: any,
  rawCost: any,
  rawCategoryOrIsPerdana?: boolean | string | ProductCategory,
  rawCapacity?: string
): CalculatedPackage {
  const name = String(rawName || 'Produk Tanpa Nama').trim();
  const explicitCategory =
    typeof rawCategoryOrIsPerdana === 'string' ? rawCategoryOrIsPerdana : undefined;
  const isPerdanaFlag =
    typeof rawCategoryOrIsPerdana === 'boolean' ? rawCategoryOrIsPerdana : undefined;

  const { category, categoryLabel, storageCapacity: detectedCapacity } = detectProductCategory(
    name,
    explicitCategory,
    isPerdanaFlag
  );

  const finalCapacity = rawCapacity || detectedCapacity;
  const activeDays = extractActiveDays(rawActiveDays);
  const costPrice = parseCostPrice(rawCost);
  const { margin, tier } = calculateMargin(activeDays, category, finalCapacity);
  const totalBeforeRounding = costPrice + margin;
  const rounding = calculateCustomRounding(totalBeforeRounding);
  const actualProfit = rounding.sellingPrice - costPrice;

  let activeDaysFormatted = `${activeDays} hr`;
  if (category === 'microsd') {
    activeDaysFormatted = finalCapacity || 'Penyimpanan';
  } else if (category === 'powerbank') {
    activeDaysFormatted = 'Aksesoris';
  }

  return {
    id,
    name,
    category,
    categoryLabel,
    storageCapacity: finalCapacity,
    activeDays,
    activeDaysFormatted,
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
    isPerdana: category === 'perdana',
  };
}

/**
 * Data Sampel Riil Paket Data, Kartu Perdana, MicroSD & Powerbank untuk Pengujian Cepat
 */
export const SAMPLE_PACKAGES_RAW = [
  // Kategori Penyimpanan: MicroSD (4GB, 8GB, 16GB, 32GB, 64GB, 128GB)
  { name: 'MicroSD Sandisk Ultra 4GB Class 10', active: '4GB', cost: 28200, category: 'microsd', capacity: '4GB' },
  { name: 'MicroSD V-Gen Turbo 8GB Original', active: '8GB', cost: 33400, category: 'microsd', capacity: '8GB' },
  { name: 'MicroSD Sandisk Ultra 16GB 80MB/s', active: '16GB', cost: 41200, category: 'microsd', capacity: '16GB' },
  { name: 'MicroSD Kingston Canvas 32GB Class 10', active: '32GB', cost: 48600, category: 'microsd', capacity: '32GB' },
  { name: 'MicroSD Sandisk Ultra 64GB 100MB/s', active: '64GB', cost: 67300, category: 'microsd', capacity: '64GB' },
  { name: 'MicroSD Samsung Evo Plus 128GB 130MB/s', active: '128GB', cost: 124800, category: 'microsd', capacity: '128GB' },

  // Kategori Aksesoris: Powerbank (+15rb)
  { name: 'Powerbank Robot RT180 10000mAh Dual Input', active: 'Aksesoris', cost: 84200, category: 'powerbank' },
  { name: 'Powerbank Vivan VPB-W10 10000mAh Fast Charge', active: 'Aksesoris', cost: 138500, category: 'powerbank' },

  // Kategori Kartu Perdana (+5rb)
  { name: 'Perdana Telkomsel Kuota 14GB Segel', active: '30 hari', cost: 35000, category: 'perdana' },
  { name: 'Perdana Indosat Freedom 20GB', active: '30 Hari', cost: 42000, category: 'perdana' },
  { name: 'Perdana Smartfren Kuota 15GB', active: '14 hari', cost: 27500, category: 'perdana' },

  // Kategori Paket Data (≤3hr, 4-14hr, >14hr)
  { name: 'Telkomsel InternetMAX 10GB', active: '3 hari', cost: 18500, category: 'paket' },
  { name: 'Telkomsel Flash Regular 3GB', active: '3hr', cost: 12200, category: 'paket' },
  { name: 'Indosat Freedom Harian 7GB', active: '7 Hari', cost: 23800, category: 'paket' },
  { name: 'XL Xtra Combo Flex M 12GB', active: '7hr', cost: 31200, category: 'paket' },
  { name: 'Axis Bronet 5GB 24 Jam', active: '14 Hari', cost: 28800, category: 'paket' },
  { name: 'Tri AlwaysOn AON 6GB', active: '30 Hari', cost: 38600, category: 'paket' },
  { name: 'Telkomsel OMG! Nonton 25GB', active: '30 hari', cost: 74200, category: 'paket' },
];

