import React from 'react';
import { Calculator, Upload, Download, Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onImportClick?: () => void;
  onExportClick?: () => void;
  onLoadSample?: () => void;
  hasData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onImportClick,
  onExportClick,
  onLoadSample,
  hasData = false,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white shadow-xs">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
              Kalkulator Harga Jual Paket Data
            </h1>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
            <span>Client-Side Engine</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 inline" />
              100% Privasi Lokal
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onLoadSample && (
          <button
            type="button"
            id="header-btn-sample"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md transition-colors shadow-2xs cursor-pointer"
            title="Tampilkan contoh data pada list web"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Contoh Data</span>
          </button>
        )}

        {hasData && onExportClick && (
          <button
            type="button"
            id="header-btn-export"
            onClick={onExportClick}
            className="hidden sm:inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor Excel</span>
          </button>
        )}

        {onImportClick && (
          <button
            type="button"
            id="header-btn-import"
            onClick={onImportClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>
        )}
      </div>
    </header>
  );
};

