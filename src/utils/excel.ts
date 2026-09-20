import * as XLSX from 'xlsx';
import { CalculatedPackage } from '../types';
import { calculateSinglePackage } from './calculator';

export interface ParseResult {
  packages: CalculatedPackage[];
  totalRows: number;
  skippedRows: number;
  sheetName: string;
  executionTimeMs: number;
}

interface ColumnMapping {
  headerRowIndex: number;
  nameCol: number;
  activeCol: number;
  costCol: number;
  categoryCol: number;
}

/**
 * Mendeteksi posisi kolom berdasarkan baris header pada lembar kerja Excel
 */
function detectColumnMapping(rows: any[][]): ColumnMapping | null {
  for (let r = 0; r < Math.min(rows.length, 6); r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    let noCol = -1;
    let nameCol = -1;
    let activeCol = -1;
    let costCol = -1;
    let categoryCol = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();
      if (!cell) continue;

      if (cell === 'no' || cell === 'no.' || cell === 'nomor' || cell === '#') {
        noCol = c;
      } else if (
        nameCol === -1 &&
        (cell.includes('nama') ||
          cell.includes('produk') ||
          cell.includes('paket') ||
          cell.includes('barang') ||
          cell.includes('item') ||
          cell.includes('deskripsi'))
      ) {
        nameCol = c;
      } else if (
        activeCol === -1 &&
        (cell.includes('masa') ||
          cell.includes('aktif') ||
          cell.includes('kapasitas') ||
          cell.includes('hari') ||
          cell.includes('durasi') ||
          cell.includes('capacity') ||
          cell.includes('ukuran') ||
          cell.includes('storage') ||
          cell.includes('validity'))
      ) {
        activeCol = c;
      } else if (
        costCol === -1 &&
        (cell.includes('modal') ||
          cell.includes('hpp') ||
          cell.includes('beli') ||
          cell.includes('harga modal') ||
          cell.includes('harga beli') ||
          cell.includes('harga_modal') ||
          cell.includes('cost') ||
          (cell.includes('harga') && !cell.includes('jual')))
      ) {
        costCol = c;
      } else if (
        categoryCol === -1 &&
        (cell.includes('kategori') ||
          cell.includes('jenis') ||
          cell.includes('tipe') ||
          cell.includes('category') ||
          cell.includes('type'))
      ) {
        categoryCol = c;
      }
    }

    // Jika menemukan nama atau modal di baris ini
    if (nameCol !== -1 && costCol !== -1) {
      return {
        headerRowIndex: r,
        nameCol,
        activeCol: activeCol !== -1 ? activeCol : (noCol === 0 ? 2 : 1),
        costCol,
        categoryCol: categoryCol !== -1 ? categoryCol : (noCol === 0 ? 4 : 3),
      };
    }

    if (nameCol !== -1 || costCol !== -1) {
      return {
        headerRowIndex: r,
        nameCol: nameCol !== -1 ? nameCol : (noCol === 0 ? 1 : 0),
        activeCol: activeCol !== -1 ? activeCol : (noCol === 0 ? 2 : 1),
        costCol: costCol !== -1 ? costCol : (noCol === 0 ? 3 : 2),
        categoryCol: categoryCol !== -1 ? categoryCol : (noCol === 0 ? 4 : 3),
      };
    }
  }

  return null;
}

/**
 * Parsing file Excel (.xlsx / .xls) langsung di browser (FR-01)
 * Mendukung berbagai variasi kolom (dengan/tanpa kolom No, template kustom, dan multi-sheet).
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const startTime = performance.now();

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  // Pilih sheet yang tepat: prioritaskan sheet data/template dibanding sheet petunjuk/panduan
  let selectedSheetName = workbook.SheetNames[0];

  for (const name of workbook.SheetNames) {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes('template') ||
      lowerName.includes('data') ||
      lowerName.includes('produk') ||
      lowerName.includes('paket') ||
      lowerName.includes('input') ||
      lowerName.includes('sheet1')
    ) {
      selectedSheetName = name;
      break;
    }
  }

  // Jika sheet pertama bernama petunjuk/panduan dan ada sheet lain, pilih sheet lain
  if (
    workbook.SheetNames.length > 1 &&
    (selectedSheetName.toLowerCase().includes('panduan') ||
      selectedSheetName.toLowerCase().includes('petunjuk') ||
      selectedSheetName.toLowerCase().includes('aturan'))
  ) {
    const alternative = workbook.SheetNames.find(
      (n) =>
        !n.toLowerCase().includes('panduan') &&
        !n.toLowerCase().includes('petunjuk') &&
        !n.toLowerCase().includes('aturan')
    );
    if (alternative) {
      selectedSheetName = alternative;
    }
  }

  const worksheet = workbook.Sheets[selectedSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (!rows || rows.length === 0) {
    throw new Error(`Sheet "${selectedSheetName}" kosong atau tidak memiliki data.`);
  }

  const mapping = detectColumnMapping(rows);

  let startIndex = 0;
  let nameIndex = 0;
  let activeIndex = 1;
  let costIndex = 2;
  let categoryIndex = 3;

  if (mapping) {
    startIndex = mapping.headerRowIndex + 1;
    nameIndex = mapping.nameCol;
    activeIndex = mapping.activeCol;
    costIndex = mapping.costCol;
    categoryIndex = mapping.categoryCol;
  } else {
    // Fallback: periksa apakah baris pertama memiliki angka urut di kolom 0 (Format: No, Nama, Masa, Modal)
    const firstRow = rows[0];
    if (
      firstRow &&
      (typeof firstRow[0] === 'number' || String(firstRow[0]).trim() === '1') &&
      typeof firstRow[1] === 'string'
    ) {
      nameIndex = 1;
      activeIndex = 2;
      costIndex = 3;
      categoryIndex = 4;
    }
  }

  const packages: CalculatedPackage[] = [];
  let skippedRows = 0;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) {
      skippedRows++;
      continue;
    }

    const rawName = row[nameIndex];
    const rawActive = activeIndex !== -1 ? row[activeIndex] : undefined;
    const rawCost = costIndex !== -1 ? row[costIndex] : undefined;
    const rawCategory = categoryIndex !== -1 ? row[categoryIndex] : undefined;

    // Lewati baris jika nama dan modal kosong (misalnya baris kosong atau baris catatan)
    const isNameEmpty = rawName === undefined || rawName === null || String(rawName).trim() === '';
    const isCostEmpty = rawCost === undefined || rawCost === null || String(rawCost).trim() === '';

    if (isNameEmpty && isCostEmpty) {
      skippedRows++;
      continue;
    }

    const nameStr = String(rawName || '').trim();

    // Lewati jika ini pengulangan header atau baris instruksi
    const lowerName = nameStr.toLowerCase();
    if (
      lowerName === 'nama produk' ||
      lowerName === 'nama paket' ||
      lowerName === 'contoh:' ||
      lowerName.startsWith('catatan:') ||
      lowerName.startsWith('panduan:')
    ) {
      skippedRows++;
      continue;
    }

    const calculated = calculateSinglePackage(
      `row-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nameStr || `Produk Baris #${i + 1}`,
      rawActive,
      rawCost,
      rawCategory
    );

    packages.push(calculated);
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    packages,
    totalRows: rows.length,
    skippedRows,
    sheetName: selectedSheetName,
    executionTimeMs,
  };
}

/**
 * Ekspor data hasil kalkulasi ke format Excel (.xlsx) yang lengkap dan rapi
 */
export function exportToExcel(packages: CalculatedPackage[], filename = 'Daftar_Harga_Jual_Produk.xlsx'): void {
  const exportData = packages.map((pkg, idx) => ({
    'No': idx + 1,
    'Nama Produk / Paket': pkg.name,
    'Jenis / Kategori':
      pkg.category === 'microsd'
        ? `MicroSD ${pkg.storageCapacity || ''} (Penyimpanan)`
        : pkg.category === 'powerbank'
        ? 'Powerbank (Aksesoris)'
        : pkg.category === 'aksesoris'
        ? 'Aksesoris Handphone'
        : pkg.category === 'perdana'
        ? 'Kartu Perdana'
        : 'Paket Data',
    'Masa Aktif / Kapasitas': pkg.activeDaysFormatted,
    'Harga Modal (Rp)': pkg.costPrice,
    'Margin Keuntungan (Rp)': pkg.margin,
    'Modal + Untung (Rp)': pkg.totalBeforeRounding,
    'Sisa Ratusan (%1000)': pkg.remainder,
    'Arah Pembulatan':
      pkg.roundingDirection === 'down'
        ? 'Bawah (<=300)'
        : pkg.roundingDirection === 'up'
        ? 'Atas (>300)'
        : 'Pas (0)',
    'Harga Jual Resmi (Rp)': pkg.sellingPrice,
    'Untung Bersih Riil (Rp)': pkg.actualProfit,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Atur lebar kolom agar proporsional dan mudah dibaca
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 38 }, // Nama Produk
    { wch: 26 }, // Jenis / Kategori
    { wch: 20 }, // Masa Aktif / Kapasitas
    { wch: 18 }, // Harga Modal
    { wch: 22 }, // Margin Keuntungan
    { wch: 20 }, // Modal + Untung
    { wch: 18 }, // Sisa Ratusan
    { wch: 22 }, // Arah Pembulatan
    { wch: 22 }, // Harga Jual Resmi
    { wch: 20 }, // Untung Bersih
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Harga Jual');
  XLSX.writeFile(workbook, filename);
}

/**
 * Download Template Excel Resmi yang Disesuaikan Penuh dengan Kebutuhan Aplikasi:
 * - Sheet 1 (Template_Input_Produk): Template tabel siap isi + contoh nyata untuk 4 kategori produk
 * - Sheet 2 (Panduan_Aturan_Margin): Penjelasan aturan margin, pembulatan, dan panduan kolom
 */
export function downloadTemplateExcel(): void {
  // Sheet 1: Template Pengisian Data Produk
  const templateData = [
    [
      'No',
      'Nama Produk',
      'Masa Aktif / Kapasitas',
      'Harga Modal (Rp)',
      'Kategori (Opsional)',
      'Keterangan Margin Sistem',
    ],
    // Contoh 1: MicroSD 4GB (+10rb)
    [
      1,
      'MicroSD Sandisk Ultra 4GB Class 10',
      '4GB',
      28200,
      'MicroSD',
      'Otomatis margin +Rp 10.000 (MicroSD 4GB)',
    ],
    // Contoh 2: MicroSD 8GB (+12rb)
    [
      2,
      'MicroSD V-Gen Turbo 8GB Original',
      '8GB',
      33400,
      'MicroSD',
      'Otomatis margin +Rp 12.000 (MicroSD 8GB)',
    ],
    // Contoh 3: MicroSD 16GB (+15rb)
    [
      3,
      'MicroSD Sandisk Ultra 16GB 80MB/s',
      '16GB',
      41200,
      'MicroSD',
      'Otomatis margin +Rp 15.000 (MicroSD 16GB & 32GB)',
    ],
    // Contoh 4: MicroSD 32GB (+15rb)
    [
      4,
      'MicroSD Kingston Canvas Select 32GB',
      '32GB',
      48600,
      'MicroSD',
      'Otomatis margin +Rp 15.000 (MicroSD 16GB & 32GB)',
    ],
    // Contoh 5: MicroSD 64GB (+18rb)
    [
      5,
      'MicroSD Sandisk Ultra 64GB 100MB/s',
      '64GB',
      67300,
      'MicroSD',
      'Otomatis margin +Rp 18.000 (MicroSD 64GB & 128GB)',
    ],
    // Contoh 6: MicroSD 128GB (+18rb)
    [
      6,
      'MicroSD Samsung Evo Plus 128GB',
      '128GB',
      124800,
      'MicroSD',
      'Otomatis margin +Rp 18.000 (MicroSD 64GB & 128GB)',
    ],
    // Contoh 7: Powerbank (+15rb)
    [
      7,
      'Powerbank Robot RT180 10000mAh Dual Input',
      'Aksesoris',
      84200,
      'Powerbank',
      'Otomatis margin +Rp 15.000 (Powerbank)',
    ],
    // Contoh 8: Powerbank (+15rb)
    [
      8,
      'Powerbank Vivan VPB-W10 10000mAh Fast Charge',
      'Aksesoris',
      138500,
      'Powerbank',
      'Otomatis margin +Rp 15.000 (Powerbank)',
    ],
    // Contoh 9: Perdana (+5rb)
    [
      9,
      'Perdana Telkomsel Kuota 14GB Segel',
      '30 hari',
      35000,
      'Perdana',
      'Otomatis margin +Rp 5.000 (Kartu Perdana)',
    ],
    // Contoh 10: Perdana (+5rb)
    [
      10,
      'Perdana Indosat Freedom 20GB',
      '30 hari',
      42000,
      'Perdana',
      'Otomatis margin +Rp 5.000 (Kartu Perdana)',
    ],
    // Contoh 11: Paket Data <= 3 hari (+2rb)
    [
      11,
      'Telkomsel InternetMAX 10GB',
      '3 hari',
      18500,
      'Paket Data',
      'Otomatis margin +Rp 2.000 (Paket <= 3 hari)',
    ],
    // Contoh 12: Paket Data 4-14 hari (+2.5rb)
    [
      12,
      'Indosat Freedom Harian 7GB',
      '7 hari',
      23800,
      'Paket Data',
      'Otomatis margin +Rp 2.500 (Paket 4 - 14 hari)',
    ],
    // Contoh 13: Paket Data 4-14 hari (+2.5rb)
    [
      13,
      'XL Xtra Combo Flex M 12GB',
      '14 hari',
      31200,
      'Paket Data',
      'Otomatis margin +Rp 2.500 (Paket 4 - 14 hari)',
    ],
    // Contoh 14: Paket Data > 14 hari (+3rb)
    [
      14,
      'Tri AlwaysOn AON 6GB',
      '30 hari',
      38600,
      'Paket Data',
      'Otomatis margin +Rp 3.000 (Paket > 14 hari)',
    ],
    // Contoh 15: Aksesoris HP Tier 1 - Modal <= 10.000 (+3rb)
    [
      15,
      'Kabel Data Micro USB 1 Meter Fast Sync',
      'Aksesoris',
      7500,
      'Aksesoris HP',
      'Otomatis margin +Rp 3.000 (Aksesoris Modal <= 10.000)',
    ],
    // Contoh 16: Aksesoris HP Tier 2 - Modal 10.001 - 20.000 (+5rb)
    [
      16,
      'Kabel Data Type-C Fast Charging 2A',
      'Aksesoris',
      14800,
      'Aksesoris HP',
      'Otomatis margin +Rp 5.000 (Aksesoris Modal 10.001 - 20.000)',
    ],
    // Contoh 17: Aksesoris HP Tier 3 - Modal 20.001 - 75.000 (+15rb)
    [
      17,
      'Kepala Charger Adaptor Fast 20W QuickCharge',
      'Aksesoris',
      38500,
      'Aksesoris HP',
      'Otomatis margin +Rp 15.000 (Aksesoris Modal 20.001 - 75.000)',
    ],
    // Contoh 18: Aksesoris HP Tier 4 - Modal > 75.001 (+20rb)
    [
      18,
      'Earphone TWS Bluetooth Wireless V5.3 Stereo',
      'Aksesoris',
      89200,
      'Aksesoris HP',
      'Otomatis margin +Rp 20.000 (Aksesoris Modal > 75.001)',
    ],
    // Baris kosong siap pakai untuk input pengguna
    [19, '', '', '', '', ''],
    [20, '', '', '', '', ''],
    [21, '', '', '', '', ''],
    [22, '', '', '', '', ''],
    [23, '', '', '', '', ''],
    [24, '', '', '', '', ''],
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
  wsTemplate['!cols'] = [
    { wch: 6 },  // Kolom A: No
    { wch: 46 }, // Kolom B: Nama Produk
    { wch: 24 }, // Kolom C: Masa Aktif / Kapasitas
    { wch: 18 }, // Kolom D: Harga Modal (Rp)
    { wch: 22 }, // Kolom E: Kategori (Opsional)
    { wch: 52 }, // Kolom F: Keterangan Margin Sistem
  ];

  // Sheet 2: Panduan & Aturan Perhitungan Margin Resmi
  const guideData = [
    ['PANDUAN PENGISIAN TEMPLATE & ATURAN MARGIN HARGA JUAL KONTER'],
    ['Gunakan file template ini untuk mengisi daftar modal produk supplier Anda lalu upload ke web sistem.'],
    [''],
    ['1. PENJELASAN KOLOM DI SHEET "Template_Input_Produk":'],
    ['Kolom', 'Nama Kolom', 'Ketentuan', 'Contoh Pengisian'],
    ['A', 'No', 'Nomor urut (opsional, boleh dikosongkan)', '1, 2, 3...'],
    ['B', 'Nama Produk', 'WAJIB. Nama lengkap produk atau paket data', 'MicroSD Sandisk 32GB / Kabel Type-C / Telkomsel 14GB'],
    ['C', 'Masa Aktif / Kapasitas', 'Kapasitas MicroSD (4GB-128GB), Hari Paket Data (3 hari, 30 hari), atau "Aksesoris"', '16GB / Aksesoris / 30 hari'],
    ['D', 'Harga Modal (Rp)', 'WAJIB. Harga modal beli supplier (angka murni tanpa titik atau dengan titik)', '28200 atau 28.200'],
    ['E', 'Kategori (Opsional)', 'Pilihan: Aksesoris HP, MicroSD, Powerbank, Perdana, atau Paket Data (otomatis jika kosong)', 'Aksesoris HP / MicroSD / Powerbank / Perdana / Paket Data'],
    ['F', 'Keterangan', 'Kolom catatan tambahan Anda (bebas diisi / dikosongkan)', 'Catatan supplier / garansi'],
    [''],
    ['2. ATURAN MARGIN KEUNTUNGAN RESMI SISTEM:'],
    ['Kategori', 'Kriteria / Spesifikasi', 'Margin Keuntungan', 'Formula Harga Jual'],
    ['Aksesoris Handphone', 'Harga Modal <= 10.000', '+Rp 3.000', 'Modal + Rp 3.000 (dibulatkan)'],
    ['Aksesoris Handphone', 'Harga Modal 10.001 - 20.000', '+Rp 5.000', 'Modal + Rp 5.000 (dibulatkan)'],
    ['Aksesoris Handphone', 'Harga Modal 20.001 - 75.000', '+Rp 15.000', 'Modal + Rp 15.000 (dibulatkan)'],
    ['Aksesoris Handphone', 'Harga Modal > 75.001', '+Rp 20.000', 'Modal + Rp 20.000 (dibulatkan)'],
    ['MicroSD (Penyimpanan)', 'Kapasitas 4GB', '+Rp 10.000', 'Modal + Rp 10.000 (dibulatkan)'],
    ['MicroSD (Penyimpanan)', 'Kapasitas 8GB', '+Rp 12.000', 'Modal + Rp 12.000 (dibulatkan)'],
    ['MicroSD (Penyimpanan)', 'Kapasitas 16GB & 32GB', '+Rp 15.000', 'Modal + Rp 15.000 (dibulatkan)'],
    ['MicroSD (Penyimpanan)', 'Kapasitas 64GB & 128GB (ke atas)', '+Rp 18.000', 'Modal + Rp 18.000 (dibulatkan)'],
    ['Powerbank (Aksesoris)', 'Semua kapasitas Powerbank', '+Rp 15.000', 'Modal + Rp 15.000 (dibulatkan)'],
    ['Kartu Perdana', 'Semua jenis kartu perdana kuota/segel', '+Rp 5.000', 'Modal + Rp 5.000 (dibulatkan)'],
    ['Paket Data', 'Masa aktif <= 3 hari', '+Rp 2.000', 'Modal + Rp 2.000 (dibulatkan)'],
    ['Paket Data', 'Masa aktif 4 - 14 hari', '+Rp 2.500', 'Modal + Rp 2.500 (dibulatkan)'],
    ['Paket Data', 'Masa aktif > 14 hari', '+Rp 3.000', 'Modal + Rp 3.000 (dibulatkan)'],
    [''],
    ['3. ATURAN PEMBULATAN KELIPATAN RP 1.000:'],
    ['Jenis Pembulatan', 'Syarat Sisa Ratusan (% 1.000)', 'Arah Pembulatan', 'Contoh Perhitungan'],
    ['Pembulatan Ke Bawah', 'Sisa ratusan <= 300', 'Dibulatkan ke bawah ke ribuan terdekat', 'Modal 48.200 + Margin 2.000 = 50.200 -> Harga Jual Rp 50.000'],
    ['Pembulatan Ke Atas', 'Sisa ratusan > 300', 'Dibulatkan ke atas ke ribuan berikutnya', 'Modal 48.350 + Margin 2.000 = 50.350 -> Harga Jual Rp 51.000'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 24 }, // Kolom A
    { wch: 34 }, // Kolom B
    { wch: 44 }, // Kolom C
    { wch: 54 }, // Kolom D
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsTemplate, 'Template_Input_Produk');
  XLSX.utils.book_append_sheet(workbook, wsGuide, 'Panduan_Aturan_Margin');

  XLSX.writeFile(workbook, 'Template_Modal_Produk_Konter.xlsx');
}
