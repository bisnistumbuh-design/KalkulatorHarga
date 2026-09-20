import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RulesExplainer } from './components/RulesExplainer';
import { FileUpload } from './components/FileUpload';
import { QuickCalculator } from './components/QuickCalculator';
import { StatsCards } from './components/StatsCards';
import { ResultsTable } from './components/ResultsTable';
import { CalculatedPackage } from './types';
import { calculateSinglePackage, SAMPLE_PACKAGES_RAW } from './utils/calculator';
import { exportToExcel } from './utils/excel';
import { FileSpreadsheet, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

const STORAGE_PACKAGES_KEY = 'konter_pulsa_packages_v4';
const STORAGE_STATUS_KEY = 'konter_pulsa_status_v4';
const STORAGE_FILENAME_KEY = 'konter_pulsa_filename_v4';

export default function App() {
  const [packages, setPackages] = useState<CalculatedPackage[]>(() => {
    try {
      const status = localStorage.getItem(STORAGE_STATUS_KEY);
      if (status === 'cleared') {
        return [];
      }
      const saved = localStorage.getItem(STORAGE_PACKAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(() => {
    try {
      const status = localStorage.getItem(STORAGE_STATUS_KEY);
      if (status === 'cleared') return undefined;
      return localStorage.getItem(STORAGE_FILENAME_KEY) || undefined;
    } catch {
      return undefined;
    }
  });
  const [notification, setNotification] = useState<string | null>(null);

  const saveToLocalStorage = (
    pkgs: CalculatedPackage[],
    fileName?: string,
    status?: string
  ) => {
    try {
      localStorage.setItem(STORAGE_PACKAGES_KEY, JSON.stringify(pkgs));
      if (fileName) {
        localStorage.setItem(STORAGE_FILENAME_KEY, fileName);
      } else {
        localStorage.removeItem(STORAGE_FILENAME_KEY);
      }
      if (status) {
        localStorage.setItem(STORAGE_STATUS_KEY, status);
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const loadSampleData = (showToast = true) => {
    setIsLoading(true);
    const startTime = performance.now();

    const sampleCalculated = SAMPLE_PACKAGES_RAW.map((pkg, idx) =>
      calculateSinglePackage(
        `sample-${idx + 1}`,
        pkg.name,
        pkg.active,
        pkg.cost,
        pkg.category,
        pkg.capacity
      )
    );

    const time = Math.round(performance.now() - startTime);
    setPackages(sampleCalculated);
    setExecutionTimeMs(time);
    setCurrentFileName('Data_Sampel_Konter_Pulsa.xlsx');
    setIsLoading(false);
    saveToLocalStorage(sampleCalculated, 'Data_Sampel_Konter_Pulsa.xlsx', 'sample');

    if (showToast) {
      showNotification(
        `${sampleCalculated.length} produk contoh (Aksesoris HP, MicroSD, Powerbank, Perdana & Paket) berhasil dimuat!`
      );
    }
  };

  const handleDataLoaded = (
    loadedPackages: CalculatedPackage[],
    fileName: string,
    timeMs: number
  ) => {
    setPackages(loadedPackages);
    setCurrentFileName(fileName);
    setExecutionTimeMs(timeMs);
    saveToLocalStorage(loadedPackages, fileName, 'custom');
    showNotification(`Berhasil memproses ${loadedPackages.length} data dari "${fileName}"`);
  };

  const handleAddManualPackage = (newPackage: CalculatedPackage) => {
    setPackages((prev) => {
      const next = [newPackage, ...prev];
      saveToLocalStorage(next, currentFileName, 'custom');
      return next;
    });
    showNotification(`"${newPackage.name}" ditambahkan ke daftar!`);
  };

  const handleEditItem = (
    id: string,
    name: string,
    activeDays: string | number,
    costPrice: string | number,
    categoryOrIsPerdana?: boolean | string,
    storageCapacity?: string
  ) => {
    setPackages((prev) => {
      const next = prev.map((pkg) => {
        if (pkg.id === id) {
          return calculateSinglePackage(
            id,
            name,
            activeDays,
            costPrice,
            categoryOrIsPerdana,
            storageCapacity
          );
        }
        return pkg;
      });
      saveToLocalStorage(next, currentFileName);
      return next;
    });
    showNotification(`"${name}" berhasil diperbarui!`);
  };

  const handleDeleteItem = (id: string) => {
    setPackages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const isNowEmpty = next.length === 0;
      saveToLocalStorage(
        next,
        isNowEmpty ? undefined : currentFileName,
        isNowEmpty ? 'cleared' : undefined
      );
      if (isNowEmpty) {
        setCurrentFileName(undefined);
      }
      return next;
    });
    showNotification('Produk berhasil dihapus.');
  };

  const handleDeleteMultiple = (ids: string[]) => {
    if (ids.length === 0) return;
    setPackages((prev) => {
      const next = prev.filter((p) => !ids.includes(p.id));
      const isNowEmpty = next.length === 0;
      saveToLocalStorage(
        next,
        isNowEmpty ? undefined : currentFileName,
        isNowEmpty ? 'cleared' : undefined
      );
      if (isNowEmpty) {
        setCurrentFileName(undefined);
      }
      return next;
    });
    showNotification(`${ids.length} produk berhasil dihapus.`);
  };

  const handleClearAll = () => {
    setPackages([]);
    setCurrentFileName(undefined);
    setExecutionTimeMs(undefined);
    saveToLocalStorage([], undefined, 'cleared');
    showNotification('Semua data paket dan produk berhasil dikosongkan.');
  };

  const handleExportAll = () => {
    if (packages.length > 0) {
      exportToExcel(packages, `Daftar_Harga_Jual_Paket_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  const handleTriggerImport = () => {
    const fileInput = document.getElementById('file-input-excel') as HTMLInputElement | null;
    fileInput?.click();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        onImportClick={handleTriggerImport}
        onExportClick={handleExportAll}
        onLoadSample={() => loadSampleData(true)}
        hasData={packages.length > 0}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-12 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-md shadow-lg border border-slate-800 text-xs animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main High Density Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column: Metrics & Controls (col-span-4 / col-span-3) */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
          {/* Processing Metrics (StatsCards) */}
          <StatsCards
            packages={packages}
            executionTimeMs={executionTimeMs}
            fileName={currentFileName}
          />

          {/* Pricing Logic Active (RulesExplainer) */}
          <RulesExplainer />

          {/* Import Data Excel (FileUpload) */}
          <FileUpload
            onDataLoaded={handleDataLoaded}
            onLoadSample={() => loadSampleData(true)}
            isLoading={isLoading}
          />

          {/* Quick Calculator (Manual entry) */}
          <QuickCalculator onAddPackage={handleAddManualPackage} />
        </aside>

        {/* Right Column: Pricing Table (col-span-8 / col-span-9) */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3">
          {packages.length > 0 ? (
            <ResultsTable
              packages={packages}
              onClear={handleClearAll}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleEditItem}
              onDeleteMultiple={handleDeleteMultiple}
              onLoadSample={() => loadSampleData(true)}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-2xs">
              <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                Belum Ada Data Produk yang Dimuat
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Daftar produk saat ini kosong. Anda dapat mengunggah file Excel, memasukkan produk melalui kalkulator manual, atau klik tombol di bawah untuk menampilkan contoh data.
              </p>
              <button
                type="button"
                id="btn-empty-load-sample"
                onClick={() => loadSampleData(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tampilkan Contoh Data</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* High Density Status Footer */}
      <footer className="h-9 bg-white border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
          <span>Privasi lokal terjamin. Tidak ada data yang dikirim ke server eksternal.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block font-mono text-slate-400">
            Engine: SheetJS &bull; Web Worker
          </span>
          <span className="font-mono font-medium text-slate-600 uppercase tracking-wider">
            Status: Ready
          </span>
        </div>
      </footer>
    </div>
  );
}

