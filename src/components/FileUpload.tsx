import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  AlertCircle,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import { parseExcelFile, downloadTemplateExcel } from '../utils/excel';
import { CalculatedPackage } from '../types';

interface FileUploadProps {
  onDataLoaded: (packages: CalculatedPackage[], filename: string, executionTimeMs: number) => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onDataLoaded,
  onLoadSample,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // FR-01: Hanya menerima format .xlsx dan .xls
    const validExtensions = ['.xlsx', '.xls'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Format file tidak didukung! Mohon unggah file Excel berekstensi .xlsx atau .xls.');
      return;
    }

    try {
      const result = await parseExcelFile(file);
      if (result.packages.length === 0) {
        setErrorMessage('File Excel terbaca, namun tidak ditemukan baris data produk yang valid.');
        return;
      }
      onDataLoaded(result.packages, file.name, result.executionTimeMs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membaca file Excel. Pastikan format file tidak rusak.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Import Data Excel
          </h2>
          <button
            type="button"
            onClick={() => setShowFormatModal(true)}
            className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Lihat Format Kolom Template Excel"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-download-template"
            onClick={downloadTemplateExcel}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-slate-300 bg-white text-slate-700 text-[10px] font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Download Template Excel (.xlsx) dengan 2 Sheet Lengkap"
          >
            <Download className="w-2.5 h-2.5 text-slate-500" />
            <span>Template</span>
          </button>
          <button
            type="button"
            id="btn-load-sample"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            title="Tampilkan contoh data pada list web"
          >
            <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
            <span>Contoh Data</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        id="dropzone-excel"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-md p-3.5 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-input-excel"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center mb-1.5 transition-colors ${
              isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <p className="text-xs font-semibold text-slate-800">
            {isDragging ? 'Lepaskan file Excel di sini' : 'Klik atau seret file Excel ke sini'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Format: <span className="font-semibold text-slate-700">.xlsx / .xls</span> (Mendukung Multi-Sheet)
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[9.5px] text-slate-500 font-mono">
            <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">Nama Produk</span>
            <span>•</span>
            <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">Masa Aktif / Kapasitas</span>
            <span>•</span>
            <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">Harga Modal</span>
            <span>•</span>
            <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">Kategori</span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center rounded-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Memproses Excel...</span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Kesalahan File</p>
            <p className="text-rose-600">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Modal Format & Panduan Template */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Format Template Excel & Aturan Sistem
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormatModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs text-slate-600">
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5">
                  1. Format Kolom Sheet "Template_Input_Produk"
                </h4>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-2 py-1 text-left">Kolom</th>
                        <th className="px-2 py-1 text-left">Nama Header</th>
                        <th className="px-2 py-1 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-2 py-1 font-mono text-slate-500">A</td>
                        <td className="px-2 py-1 font-semibold text-slate-800">No</td>
                        <td className="px-2 py-1 text-slate-500">Nomor urut (opsional)</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="px-2 py-1 font-mono text-slate-500">B</td>
                        <td className="px-2 py-1 font-semibold text-slate-800">Nama Produk</td>
                        <td className="px-2 py-1 text-slate-700 font-medium">Wajib diisi (Aksesoris HP, MicroSD, Powerbank, Perdana, Paket)</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 font-mono text-slate-500">C</td>
                        <td className="px-2 py-1 font-semibold text-slate-800">Masa Aktif / Kapasitas</td>
                        <td className="px-2 py-1 text-slate-600">Contoh: Aksesoris, 4GB, 16GB, 3 hari, 30 hari</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="px-2 py-1 font-mono text-slate-500">D</td>
                        <td className="px-2 py-1 font-semibold text-slate-800">Harga Modal (Rp)</td>
                        <td className="px-2 py-1 text-slate-700 font-medium">Wajib diisi angka modal (misal: 28200)</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 font-mono text-slate-500">E</td>
                        <td className="px-2 py-1 font-semibold text-slate-800">Kategori (Opsional)</td>
                        <td className="px-2 py-1 text-slate-500">Aksesoris, MicroSD, Powerbank, Perdana, atau Paket Data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1.5">
                  2. Aturan Margin Keuntungan Otomatis
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="p-2 rounded bg-orange-50/60 border border-orange-200 col-span-2">
                    <p className="font-semibold text-orange-900">Aksesoris Handphone (Kabel, Charger, TWS, dll.)</p>
                    <p className="text-[10px] text-orange-800 mt-0.5">
                      Modal &le;10rb: +3.000 | 10.001-20rb: +5.000 | 20.001-75rb: +15.000 | &gt;75.001: +20.000
                    </p>
                  </div>
                  <div className="p-2 rounded bg-amber-50/60 border border-amber-200">
                    <p className="font-semibold text-amber-900">MicroSD (Penyimpanan)</p>
                    <p className="text-[10px] text-amber-800 mt-0.5">
                      4GB: +10rb | 8GB: +12rb | 16/32GB: +15rb | 64/128GB+: +18rb
                    </p>
                  </div>
                  <div className="p-2 rounded bg-indigo-50/60 border border-indigo-200">
                    <p className="font-semibold text-indigo-900">Powerbank (Aksesoris)</p>
                    <p className="text-[10px] text-indigo-800 mt-0.5">Margin tetap: +Rp 15.000</p>
                  </div>
                  <div className="p-2 rounded bg-purple-50/60 border border-purple-200">
                    <p className="font-semibold text-purple-900">Kartu Perdana</p>
                    <p className="text-[10px] text-purple-800 mt-0.5">Margin tetap: +Rp 5.000</p>
                  </div>
                  <div className="p-2 rounded bg-emerald-50/60 border border-emerald-200">
                    <p className="font-semibold text-emerald-900">Paket Data Internet</p>
                    <p className="text-[10px] text-emerald-800 mt-0.5">
                      &le;3 hr: +2rb | 4-14 hr: +2.5rb | &gt;14 hr: +3rb
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 text-[11px]">
                  3. Aturan Pembulatan Kelipatan Rp 1.000
                </p>
                <p className="text-[10.5px] text-slate-600 mt-1">
                  Sisa ratusan &le; 300 dibulatkan ke bawah (misal Rp 50.200 &rarr; Rp 50.000). Sisa ratusan &gt; 300 dibulatkan ke atas ke ribuan berikutnya (misal Rp 50.350 &rarr; Rp 51.000).
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  downloadTemplateExcel();
                  setShowFormatModal(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Template .xlsx</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFormatModal(false)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
