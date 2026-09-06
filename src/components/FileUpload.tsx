import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, Sparkles, AlertCircle } from 'lucide-react';
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
        setErrorMessage('File Excel terbaca, namun tidak ditemukan baris data paket yang valid.');
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
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Import Data Excel
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-download-template"
            onClick={downloadTemplateExcel}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-600 text-[10px] font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download template Excel"
          >
            <Download className="w-2.5 h-2.5 text-slate-500" />
            <span>Template</span>
          </button>
          <button
            type="button"
            id="btn-load-sample"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold hover:bg-indigo-100 transition-colors"
            title="Muat data sampel"
          >
            <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
            <span>Sampel</span>
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
        className={`relative border border-dashed rounded-md p-4 text-center cursor-pointer transition-all duration-150 ${
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
            Format didukung: <span className="font-semibold text-slate-700">.xlsx / .xls</span>
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>A: Nama Paket</span>
            <span>•</span>
            <span>B: Masa Aktif</span>
            <span>•</span>
            <span>C: Harga Modal</span>
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
    </div>
  );
};

