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

/**
 * Memeriksa apakah baris pertama adalah header tabel
 */
function isHeaderRow(row: any[]): boolean {
  if (!row || row.length === 0) return false;
  const colA = String(row[0] || '').toLowerCase();
  const colB = String(row[1] || '').toLowerCase();
  const colC = String(row[2] || '').toLowerCase();

  return (
    colA.includes('nama') ||
    colA.includes('paket') ||
    colA.includes('produk') ||
    colB.includes('aktif') ||
    colB.includes('masa') ||
    colB.includes('hari') ||
    colC.includes('modal') ||
    colC.includes('harga') ||
    colC.includes('beli')
  );
}

/**
 * Parsing file Excel (.xlsx / .xls) langsung di browser (FR-01)
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const startTime = performance.now();

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  // PRD FR-01: Membaca sheet pertama
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Mengubah sheet ke array 2 dimensi (header: 1)
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (!rows || rows.length === 0) {
    throw new Error('Sheet pertama kosong atau tidak memiliki data.');
  }

  let startIndex = 0;
  if (isHeaderRow(rows[0])) {
    startIndex = 1;
  }

  const packages: CalculatedPackage[] = [];
  let skippedRows = 0;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) {
      skippedRows++;
      continue;
    }

    const colA = row[0]; // Kolom A: Nama Paket
    const colB = row[1]; // Kolom B: Masa Aktif
    const colC = row[2]; // Kolom C: Harga Modal
    const colD = row[3]; // Kolom D (Opsional): Jenis / Tipe (misal: "Perdana" atau "Paket")

    // Lewati jika seluruh kolom kosong
    if (
      (colA === undefined || colA === null || String(colA).trim() === '') &&
      (colB === undefined || colB === null || String(colB).trim() === '') &&
      (colC === undefined || colC === null || String(colC).trim() === '')
    ) {
      skippedRows++;
      continue;
    }

    // Nama paket jika tidak ada nama
    const packageName =
      colA !== undefined && colA !== null && String(colA).trim() !== ''
        ? String(colA).trim()
        : `Paket Baris #${i + 1}`;

    const calculated = calculateSinglePackage(
      `row-${i + 1}-${Date.now()}`,
      packageName,
      colB,
      colC,
      colD
    );

    packages.push(calculated);
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    packages,
    totalRows: rows.length,
    skippedRows,
    sheetName,
    executionTimeMs,
  };
}

/**
 * Ekspor data hasil kalkulasi ke format Excel (.xlsx)
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
        : pkg.category === 'perdana'
        ? 'Kartu Perdana'
        : 'Paket Data',
    'Masa Aktif / Kapasitas': pkg.activeDaysFormatted,
    'Harga Modal (Rp)': pkg.costPrice,
    'Margin Keuntungan (Rp)': pkg.margin,
    'Modal + Untung (Rp)': pkg.totalBeforeRounding,
    'Sisa Ratusan (%1000)': pkg.remainder,
    'Arah Pembulatan': pkg.roundingDirection === 'down' ? 'Bawah (<=300)' : pkg.roundingDirection === 'up' ? 'Atas (>300)' : 'Pas (0)',
    'Harga Jual Resmi (Rp)': pkg.sellingPrice,
    'Untung Bersih Riil (Rp)': pkg.actualProfit,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Atur lebar kolom agar rapi
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 38 }, // Nama Produk
    { wch: 26 }, // Jenis / Kategori
    { wch: 18 }, // Masa Aktif / Kapasitas
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
 * Download Template Excel Kosong beserta contoh pengisian
 */
export function downloadTemplateExcel(): void {
  const templateData = [
    ['Nama Produk', 'Masa Aktif / Kapasitas', 'Harga Modal', 'Jenis / Kategori (Opsional)'],
    ['MicroSD Sandisk Ultra 4GB Class 10', '4GB', 28200, 'MicroSD'],
    ['MicroSD V-Gen Turbo 8GB', '8GB', 33400, 'MicroSD'],
    ['MicroSD Sandisk Ultra 16GB 80MB/s', '16GB', 41200, 'MicroSD'],
    ['MicroSD Kingston Canvas 32GB', '32GB', 48600, 'MicroSD'],
    ['MicroSD Sandisk Ultra 64GB 100MB/s', '64GB', 67300, 'MicroSD'],
    ['MicroSD Samsung Evo Plus 128GB', '128GB', 124800, 'MicroSD'],
    ['Powerbank Robot RT180 10000mAh', 'Aksesoris', 84200, 'Powerbank'],
    ['Powerbank Vivan VPB-W10 10000mAh', 'Aksesoris', 138500, 'Powerbank'],
    ['Perdana Telkomsel Kuota 14GB Segel', '30 hari', 35000, 'Perdana'],
    ['Perdana Indosat Freedom 20GB', '30hr', 42000, 'Perdana'],
    ['Telkomsel InternetMAX 10GB', '3 hari', 18500, 'Paket Data'],
    ['Indosat Freedom Harian 7GB', '7hr', 23800, 'Paket Data'],
    ['XL Xtra Combo Flex M 12GB', '14 Hari', 31200, 'Paket Data'],
    ['Tri AlwaysOn AON 6GB', '30 hari', 38600, 'Paket Data'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 38 }, // Kolom A: Nama Produk
    { wch: 22 }, // Kolom B: Masa Aktif / Kapasitas
    { wch: 16 }, // Kolom C: Harga Modal
    { wch: 26 }, // Kolom D: Jenis / Kategori (Opsional)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Produk');
  XLSX.writeFile(workbook, 'Template_Modal_Produk_Konter.xlsx');
}
