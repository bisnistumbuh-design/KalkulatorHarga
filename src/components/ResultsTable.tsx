import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Copy,
  Check,
  Trash2,
  Printer,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CalculatedPackage, ActiveFilterTier, ProductCategory } from '../types';
import { exportToExcel } from '../utils/excel';
import { calculateSinglePackage } from '../utils/calculator';
import { exportToPdf, printTableToPrinter, PrintMode } from '../utils/pdf';

interface ResultsTableProps {
  packages: CalculatedPackage[];
  onClear: () => void;
  onDeleteItem: (id: string) => void;
  onEditItem?: (
    id: string,
    name: string,
    activeDays: string | number,
    costPrice: string | number,
    categoryOrIsPerdana?: boolean | string,
    storageCapacity?: string
  ) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onLoadSample?: () => void;
}

type SortField = 'original' | 'name' | 'activeDays' | 'costPrice' | 'sellingPrice' | 'actualProfit';
type SortOrder = 'asc' | 'desc';

export const ResultsTable: React.FC<ResultsTableProps> = ({
  packages,
  onClear,
  onDeleteItem,
  onEditItem,
  onDeleteMultiple,
  onLoadSample,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<ActiveFilterTier>('all');
  const [sortField, setSortField] = useState<SortField>('original');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedWA, setCopiedWA] = useState(false);

  // Selection state for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmation dialog states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CalculatedPackage | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Print & PDF Modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>('full');
  const [printDataScope, setPrintDataScope] = useState<'all' | 'filtered'>('all');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Edit Modal state
  const [editingPackage, setEditingPackage] = useState<CalculatedPackage | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('paket');
  const [editCapacity, setEditCapacity] = useState<string>('16GB');
  const [editActiveDays, setEditActiveDays] = useState('30');
  const [editCost, setEditCost] = useState('');

  // Filter & Search
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Search
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filter category & tier
      if (filterTier === 'microsd' || filterTier === 'penyimpanan') {
        return pkg.category === 'microsd';
      }
      if (filterTier === 'powerbank') {
        return pkg.category === 'powerbank';
      }
      if (filterTier === 'aksesoris') {
        return pkg.category === 'aksesoris';
      }
      if (filterTier === 'perdana') {
        return pkg.category === 'perdana' || pkg.isPerdana;
      }
      if (filterTier === 'paket') {
        return pkg.category === 'paket';
      }
      if (filterTier === 'tier1' && (pkg.tier !== 'tier1' || pkg.category !== 'paket')) return false;
      if (filterTier === 'tier2' && (pkg.tier !== 'tier2' || pkg.category !== 'paket')) return false;
      if (filterTier === 'tier3' && (pkg.tier !== 'tier3' || pkg.category !== 'paket')) return false;

      return true;
    });
  }, [packages, searchTerm, filterTier]);

  // Sort
  const sortedPackages = useMemo(() => {
    if (sortField === 'original') return filteredPackages;

    return [...filteredPackages].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'id');
      } else if (sortField === 'activeDays') {
        comparison = a.activeDays - b.activeDays;
      } else if (sortField === 'costPrice') {
        comparison = a.costPrice - b.costPrice;
      } else if (sortField === 'sellingPrice') {
        comparison = a.sellingPrice - b.sellingPrice;
      } else if (sortField === 'actualProfit') {
        comparison = a.actualProfit - b.actualProfit;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredPackages, sortField, sortOrder]);

  // Selection helpers
  const isAllSelected =
    sortedPackages.length > 0 && sortedPackages.every((p) => selectedIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedPackages.map((p) => p.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Confirmation handlers
  const handleConfirmClear = () => {
    onClear();
    setSelectedIds(new Set());
    setShowClearConfirm(false);
  };

  const handleConfirmDeleteSingle = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemToDelete.id);
        return next;
      });
      setItemToDelete(null);
    }
  };

  const handleConfirmDeleteMultiple = () => {
    if (onDeleteMultiple && selectedIds.size > 0) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    }
  };

  // Edit helpers
  const handleOpenEdit = (pkg: CalculatedPackage) => {
    setEditingPackage(pkg);
    setEditName(pkg.name);
    setEditCategory(pkg.category || (pkg.isPerdana ? 'perdana' : 'paket'));
    setEditCapacity(pkg.storageCapacity || '16GB');
    setEditActiveDays(String(pkg.activeDays || 30));
    setEditCost(String(pkg.costPrice));
  };

  const previewEditedPackage = useMemo(() => {
    if (!editingPackage || !editName.trim() || !editCost) {
      return null;
    }
    return calculateSinglePackage(
      editingPackage.id,
      editName.trim(),
      editCategory === 'paket'
        ? editActiveDays
        : editCategory === 'microsd'
        ? editCapacity
        : editCategory === 'powerbank'
        ? 'Powerbank'
        : 'Aksesoris HP',
      editCost,
      editCategory,
      editCategory === 'microsd' ? editCapacity : undefined
    );
  }, [editingPackage, editName, editCategory, editCapacity, editActiveDays, editCost]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage || !onEditItem) return;
    if (!editName.trim() || !editCost) return;

    onEditItem(
      editingPackage.id,
      editName.trim(),
      editCategory === 'paket'
        ? editActiveDays
        : editCategory === 'microsd'
        ? editCapacity
        : editCategory === 'powerbank'
        ? 'Powerbank'
        : 'Aksesoris HP',
      editCost,
      editCategory,
      editCategory === 'microsd' ? editCapacity : undefined
    );
    setEditingPackage(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField('original');
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    exportToExcel(packages, `Daftar_Harga_Jual_Paket_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleCopyWhatsApp = () => {
    const lines = [
      '*DAFTAR HARGA JUAL PRODUK & PAKET DATA*',
      `Update: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
      '=========================',
    ];

    sortedPackages.forEach((pkg, i) => {
      let tag = '';
      if (pkg.category === 'microsd') tag = '💾 [MICROSD] ';
      else if (pkg.category === 'powerbank') tag = '🔋 [POWERBANK] ';
      else if (pkg.category === 'aksesoris') tag = '🎧 [AKSESORIS HP] ';
      else if (pkg.isPerdana || pkg.category === 'perdana') tag = '⭐ [PERDANA] ';
      lines.push(`${i + 1}. ${tag}*${pkg.name}* (${pkg.activeDaysFormatted}) -> *${pkg.sellingPriceFormatted}*`);
    });

    lines.push('=========================');
    lines.push('Silakan order via Kasir / Admin. Terima kasih!');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const getPackagesForPrint = () => {
    return printDataScope === 'filtered' && filteredPackages.length > 0
      ? sortedPackages
      : packages;
  };

  const handleTriggerPrinter = () => {
    const dataToPrint = getPackagesForPrint();
    printTableToPrinter(dataToPrint, printMode);
    setShowPrintModal(false);
  };

  const handleTriggerPdf = () => {
    setIsPdfGenerating(true);
    try {
      const dataToPrint = getPackagesForPrint();
      exportToPdf(dataToPrint, printMode);
      setTimeout(() => {
        setIsPdfGenerating(false);
        setShowPrintModal(false);
      }, 400);
    } catch (err) {
      console.error('Error generating PDF', err);
      setIsPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col overflow-hidden">
      {/* Table Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[190px]">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              id="search-table"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari paket data..."
              className="w-full pl-7 pr-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Filter Tiers */}
          <div className="flex flex-wrap items-center gap-0.5 bg-slate-200/70 p-0.5 rounded text-[11px]">
            <button
              type="button"
              id="filter-all"
              onClick={() => setFilterTier('all')}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                filterTier === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({packages.length})
            </button>
            <button
              type="button"
              id="filter-microsd"
              onClick={() => setFilterTier('microsd')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'microsd'
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100'
              }`}
              title="Kategori Penyimpanan MicroSD (Margin +10rb ~ +18rb)"
            >
              MicroSD ({packages.filter((p) => p.category === 'microsd').length})
            </button>
            <button
              type="button"
              id="filter-powerbank"
              onClick={() => setFilterTier('powerbank')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'powerbank'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100'
              }`}
              title="Kategori Aksesoris Powerbank (Margin +Rp 15.000)"
            >
              Powerbank ({packages.filter((p) => p.category === 'powerbank').length})
            </button>
            <button
              type="button"
              id="filter-aksesoris"
              onClick={() => setFilterTier('aksesoris')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'aksesoris'
                  ? 'bg-orange-600 text-white shadow-2xs font-bold'
                  : 'text-orange-800 hover:text-orange-900 bg-orange-50 hover:bg-orange-100'
              }`}
              title="Kategori Aksesoris HP (Margin Berdasarkan Modal: +3rb, +5rb, +15rb, +20rb)"
            >
              Aksesoris HP ({packages.filter((p) => p.category === 'aksesoris').length})
            </button>
            <button
              type="button"
              id="filter-perdana"
              onClick={() => setFilterTier('perdana')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'perdana'
                  ? 'bg-purple-600 text-white shadow-2xs font-bold'
                  : 'text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100'
              }`}
              title="Penjualan Perdana (Margin Rp 5.000 dari modal)"
            >
              Perdana ({packages.filter((p) => p.isPerdana || p.category === 'perdana').length})
            </button>
            <button
              type="button"
              id="filter-tier1"
              onClick={() => setFilterTier('tier1')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'tier1'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
              title="Masa aktif <= 3 Hari (Margin Rp 2.000)"
            >
              ≤3hr
            </button>
            <button
              type="button"
              id="filter-tier2"
              onClick={() => setFilterTier('tier2')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'tier2'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
              title="Masa aktif 4 - 14 Hari (Margin Rp 2.500)"
            >
              4-14hr
            </button>
            <button
              type="button"
              id="filter-tier3"
              onClick={() => setFilterTier('tier3')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${
                filterTier === 'tier3'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
              title="Masa aktif > 14 Hari (Margin Rp 3.000)"
            >
              &gt;14hr
            </button>
          </div>

          {/* Bulk delete action when items are selected */}
          {selectedIds.size > 0 && onDeleteMultiple && (
            <button
              type="button"
              id="btn-delete-selected"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
              title={`Hapus ${selectedIds.size} paket yang dipilih`}
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>Hapus ({selectedIds.size})</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {onLoadSample && (
            <button
              type="button"
              id="table-btn-load-sample"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
              title="Tampilkan contoh data pada list web"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Contoh Data</span>
            </button>
          )}

          <button
            type="button"
            id="btn-copy-wa"
            onClick={handleCopyWhatsApp}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
            title="Salin daftar harga terformat untuk broadcast WhatsApp"
          >
            {copiedWA ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-emerald-600" />
                <span>Salin WA</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-export-excel"
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 shadow-2xs transition-colors"
            title="Unduh hasil penentuan harga ke file Excel"
          >
            <Download className="w-3 h-3" />
            <span>Ekspor (.xlsx)</span>
          </button>

          <button
            type="button"
            id="btn-print-table"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Cetak ke Printer atau Convert ke PDF"
          >
            <Printer className="w-3 h-3 text-indigo-600" />
            <span>Cetak / PDF</span>
          </button>

          <button
            type="button"
            id="btn-clear-table"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-medium hover:bg-rose-100 transition-colors cursor-pointer"
            title="Kosongkan semua data tabel"
          >
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span className="hidden sm:inline">Kosongkan</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-2xs z-10">
            <tr>
              {/* Checkbox All */}
              <th className="py-2 px-2 w-7 text-center border-b border-slate-100">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-slate-400 hover:text-indigo-600 flex items-center justify-center mx-auto"
                  title={isAllSelected ? 'Batalkan pilih semua' : 'Pilih semua'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </button>
              </th>
              <th className="py-2 px-2 w-8 text-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                No
              </th>
              <th
                className="py-2 px-3 cursor-pointer hover:bg-slate-50 transition-colors text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 tracking-wider"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  <span>Nama Paket (Kolom A)</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-indigo-600" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40" />
                  )}
                </div>
              </th>
              <th
                className="py-2 px-2.5 text-center cursor-pointer hover:bg-slate-50 transition-colors text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 tracking-wider"
                onClick={() => handleSort('activeDays')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Masa Aktif (B)</span>
                  {sortField === 'activeDays' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                  )}
                </div>
              </th>
              <th
                className="py-2 px-3 text-right cursor-pointer hover:bg-slate-50 transition-colors text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 tracking-wider"
                onClick={() => handleSort('costPrice')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Modal (C)</span>
                  {sortField === 'costPrice' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                  )}
                </div>
              </th>
              <th className="py-2 px-3 text-right text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 tracking-wider">
                <span title="Harga Modal + Margin Sesuai Masa Aktif">
                  Modal + Untung
                </span>
              </th>
              <th
                className="py-2 px-3 text-right bg-indigo-50/60 text-indigo-950 font-bold border-b border-l border-indigo-100 cursor-pointer hover:bg-indigo-100/60 transition-colors text-[10px] uppercase tracking-wider"
                onClick={() => handleSort('sellingPrice')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-indigo-900">Harga Jual (Akhir)</span>
                  {sortField === 'sellingPrice' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-700" /> : <ArrowDown className="w-3 h-3 text-indigo-700" />
                  )}
                </div>
              </th>
              <th className="py-2 px-2.5 text-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 tracking-wider">
                Pembulatan
              </th>
              <th className="py-2 px-2.5 w-16 text-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {sortedPackages.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-6 h-6 text-slate-300 mb-1.5" />
                    <p className="font-semibold text-slate-600 text-xs">Tidak ada paket yang sesuai</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ganti kata kunci pencarian atau sesuaikan filter
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedPackages.map((pkg, idx) => {
                const isSelected = selectedIds.has(pkg.id);
                const tierColor =
                  pkg.category === 'microsd'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : pkg.category === 'powerbank'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : pkg.category === 'aksesoris'
                    ? 'bg-orange-50 text-orange-800 border-orange-200'
                    : pkg.category === 'perdana' || pkg.isPerdana
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : pkg.tier === 'tier1'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : pkg.tier === 'tier2'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <tr
                    key={pkg.id}
                    className={`transition-colors group ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-indigo-50/40'
                    }`}
                  >
                    {/* Checkbox row */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectOne(pkg.id)}
                        className="text-slate-400 hover:text-indigo-600 flex items-center justify-center mx-auto"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* No */}
                    <td className="py-1.5 px-2 text-center font-mono text-slate-400 text-[10px]">
                      {idx + 1}
                    </td>

                    {/* Nama Paket */}
                    <td className="py-1.5 px-3 text-xs text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-900">{pkg.name}</span>
                        {pkg.category === 'microsd' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            MicroSD {pkg.storageCapacity || ''}
                          </span>
                        )}
                        {pkg.category === 'powerbank' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Powerbank (+15rb)
                          </span>
                        )}
                        {pkg.category === 'aksesoris' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            Aksesoris HP
                          </span>
                        )}
                        {(pkg.category === 'perdana' || pkg.isPerdana) && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            Perdana (+5rb)
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono ${
                            pkg.category === 'microsd'
                              ? 'text-teal-700 font-semibold'
                              : pkg.category === 'powerbank'
                              ? 'text-amber-700 font-semibold'
                              : pkg.category === 'aksesoris'
                              ? 'text-orange-700 font-semibold'
                              : pkg.category === 'perdana' || pkg.isPerdana
                              ? 'text-purple-700 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          (+{pkg.marginFormatted})
                        </span>
                      </div>
                    </td>

                    {/* Masa Aktif / Kapasitas */}
                    <td className="py-1.5 px-2.5 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold border ${tierColor}`}
                      >
                        {pkg.activeDaysFormatted}
                      </span>
                    </td>

                    {/* Harga Modal */}
                    <td className="py-1.5 px-3 text-right font-mono text-slate-600 text-xs">
                      {pkg.costPriceFormatted}
                    </td>

                    {/* Modal + Untung */}
                    <td className="py-1.5 px-3 text-right font-mono text-slate-500 text-xs">
                      <span>{pkg.totalBeforeRoundingFormatted}</span>
                    </td>

                    {/* Harga Jual (Dibulatkan) - High Density Highlight */}
                    <td className="py-1.5 px-3 text-right bg-indigo-50/50 group-hover:bg-indigo-100/60 border-l border-indigo-100 font-mono text-xs sm:text-sm font-bold text-indigo-700">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{pkg.sellingPriceFormatted}</span>
                        <span className="text-[10px] font-medium text-emerald-600 font-sans">
                          (+{pkg.actualProfitFormatted})
                        </span>
                      </div>
                    </td>

                    {/* Info Pembulatan */}
                    <td className="py-1.5 px-2.5 text-center">
                      {pkg.roundingDirection === 'none' ? (
                        <span className="inline-block px-1 py-0.2 rounded text-[10px] font-mono text-slate-500 bg-slate-100">
                          Pas
                        </span>
                      ) : pkg.roundingDirection === 'down' ? (
                        <span
                          className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200"
                          title={`Sisa ${pkg.remainder} <= 300: Turun (${pkg.roundingDiff})`}
                        >
                          ↓ {pkg.roundingDiff}
                        </span>
                      ) : (
                        <span
                          className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200"
                          title={`Sisa ${pkg.remainder} > 300: Naik (+${pkg.roundingDiff})`}
                        >
                          ↑ +{pkg.roundingDiff}
                        </span>
                      )}
                    </td>

                    {/* Aksi: Edit & Delete */}
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pkg)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit baris paket ini"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(pkg)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus baris paket ini"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary (High Density style) */}
      <div className="h-9 bg-slate-50 border-t border-slate-200 px-3.5 flex items-center justify-between flex-shrink-0 text-[10px] text-slate-500">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{sortedPackages.length}</span> dari{' '}
          <span className="font-bold text-slate-800">{packages.length}</span> item
          {selectedIds.size > 0 && (
            <span className="ml-2 text-indigo-600 font-semibold">
              ({selectedIds.size} dipilih)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Pembulatan kelipatan 1.000 otomatis aktif
          </span>
          <span className="hidden sm:inline-block font-mono text-slate-400">
            Status: Synchronized
          </span>
        </div>
      </div>

      {/* Edit Package Modal Dialog */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    Edit Data Paket
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Nilai margin dan harga jual akan dihitung ulang secara otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
              {/* Kategori Produk */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Kategori Produk
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditCategory('paket')}
                    className={`text-[10px] font-semibold py-1.5 px-1 rounded border transition-colors ${
                      editCategory === 'paket'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Paket Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategory('perdana')}
                    className={`text-[10px] font-semibold py-1.5 px-1 rounded border transition-colors ${
                      editCategory === 'perdana'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    Perdana (+5rb)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategory('microsd')}
                    className={`text-[10px] font-semibold py-1.5 px-1 rounded border transition-colors ${
                      editCategory === 'microsd'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                        : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                    }`}
                  >
                    MicroSD
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategory('powerbank')}
                    className={`text-[10px] font-semibold py-1.5 px-1 rounded border transition-colors ${
                      editCategory === 'powerbank'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    Powerbank (+15rb)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategory('aksesoris')}
                    className={`text-[10px] font-semibold py-1.5 px-1 rounded border transition-colors ${
                      editCategory === 'aksesoris'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                    }`}
                  >
                    Aksesoris HP
                  </button>
                </div>
              </div>

              {/* Pilihan Khusus Aksesoris HP */}
              {editCategory === 'aksesoris' && (
                <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-xs">
                  <div className="font-bold text-orange-900 text-[11px] mb-1">
                    Aturan Margin Aksesoris Handphone (Sesuai Modal):
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-orange-800">
                    <div>Modal &le; 10.000: <span className="font-bold">+Rp 3.000</span></div>
                    <div>10.001 - 20.000: <span className="font-bold">+Rp 5.000</span></div>
                    <div>20.001 - 75.000: <span className="font-bold">+Rp 15.000</span></div>
                    <div>&gt; 75.001: <span className="font-bold">+Rp 20.000</span></div>
                  </div>
                </div>
              )}

              {/* Nama Produk / Paket */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nama Produk / Paket (Kolom A)
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: MicroSD Sandisk 32GB atau Freedom Combo 10GB"
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Pilihan Khusus MicroSD: Kapasitas Penyimpanan */}
              {editCategory === 'microsd' && (
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-teal-900 uppercase">
                      Kapasitas MicroSD (Aturan Margin)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                      {editCapacity === '4GB'
                        ? '+Rp 10.000'
                        : editCapacity === '8GB'
                        ? '+Rp 12.000'
                        : editCapacity === '16GB' || editCapacity === '32GB'
                        ? '+Rp 15.000'
                        : '+Rp 18.000'}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setEditCapacity(cap)}
                        className={`text-[10px] font-mono font-semibold py-1 rounded border transition-colors ${
                          editCapacity === cap
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-white text-teal-800 border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Masa Aktif (Hanya jika Paket Data atau Perdana) */}
              {editCategory === 'paket' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Masa Aktif (Hari - Kolom B)
                    </label>
                    <span className="text-[10px] text-slate-400">Pilihan cepat:</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {[1, 3, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditActiveDays(String(d))}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                          String(editActiveDays) === String(d)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d} hr
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editActiveDays}
                    onChange={(e) => setEditActiveDays(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              )}

              {/* Harga Modal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Harga Modal Supplier (Rp - Kolom C)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1.5 text-xs text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Live Calculation Preview */}
              {previewEditedPackage && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 font-sans">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Pratinjau Hasil Perhitungan Baru</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>
                      Margin ({previewEditedPackage.categoryLabel}):
                    </span>
                    <span
                      className={`font-mono font-semibold ${
                        previewEditedPackage.category === 'microsd'
                          ? 'text-teal-700'
                          : previewEditedPackage.category === 'powerbank'
                          ? 'text-amber-700'
                          : previewEditedPackage.category === 'aksesoris'
                          ? 'text-orange-700'
                          : previewEditedPackage.category === 'perdana'
                          ? 'text-purple-700'
                          : 'text-indigo-700'
                      }`}
                    >
                      +{previewEditedPackage.marginFormatted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Modal + Untung:</span>
                    <span className="font-mono text-slate-700">
                      {previewEditedPackage.totalBeforeRoundingFormatted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Pembulatan (Sisa {previewEditedPackage.remainder}):</span>
                    <span className="font-mono text-slate-700">
                      {previewEditedPackage.roundingDirection === 'none'
                        ? 'Pas (0)'
                        : previewEditedPackage.roundingDirection === 'down'
                        ? `Turun (-${previewEditedPackage.roundingDiff})`
                        : `Naik (+${previewEditedPackage.roundingDiff})`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-xs">Harga Jual Baru:</span>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-indigo-700">
                        {previewEditedPackage.sellingPriceFormatted}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">
                        Untung riil: +{previewEditedPackage.actualProfitFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi: Kosongkan Semua Data (Ya atau Tidak) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Kosongkan Semua Data?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Apakah Anda yakin ingin menghapus seluruh data tabel? Sebanyak{' '}
                    <span className="font-bold text-rose-600 font-mono">
                      {packages.length} data paket
                    </span>{' '}
                    akan dihapus sekaligus.
                  </p>
                </div>
              </div>

              {/* Pilihan Ya atau Tidak */}
              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-clear"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Tidak, Batalkan
                </button>
                <button
                  type="button"
                  id="btn-confirm-clear"
                  onClick={handleConfirmClear}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Kosongkan Semua</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi: Hapus 1 Baris Paket (Ya atau Tidak) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Hapus Paket Ini?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Apakah Anda yakin ingin menghapus paket{' '}
                    <span className="font-semibold text-slate-900">
                      &quot;{itemToDelete.name}&quot;
                    </span>{' '}
                    dari tabel kalkulasi?
                  </p>
                </div>
              </div>

              {/* Pilihan Ya atau Tidak */}
              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Tidak, Batalkan
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi: Hapus Beberapa Paket Sekaligus (Ya atau Tidak) */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Hapus {selectedIds.size} Paket Terpilih?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Apakah Anda yakin ingin menghapus{' '}
                    <span className="font-bold text-rose-600 font-mono">
                      {selectedIds.size} paket
                    </span>{' '}
                    yang telah Anda centang dari tabel?
                  </p>
                </div>
              </div>

              {/* Pilihan Ya atau Tidak */}
              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Tidak, Batalkan
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteMultiple}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Terpilih</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak ke Printer atau Convert ke PDF */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    Cetak &amp; Konversi PDF
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Koneksi langsung ke printer fisik atau simpan format PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5">
              {/* Pilihan 1: Tipe Format Dokumen */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Format / Tipe Dokumen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintMode('full')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      printMode === 'full'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        Laporan Lengkap
                      </span>
                      {printMode === 'full' && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Internal Kasir: Modal, Margin, Pembulatan, Harga Jual &amp; Keuntungan
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintMode('customer')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      printMode === 'customer'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        Katalog Pelanggan
                      </span>
                      {printMode === 'customer' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Display Toko: Nama Paket, Masa Aktif, &amp; Harga Jual (tanpa modal)
                    </p>
                  </button>
                </div>
              </div>

              {/* Pilihan 2: Cakupan Data */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Cakupan Data Paket
                </label>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="print-scope"
                      checked={printDataScope === 'all'}
                      onChange={() => setPrintDataScope('all')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Semua Paket ({packages.length})</span>
                  </label>
                  {filteredPackages.length !== packages.length && (
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="print-scope"
                        checked={printDataScope === 'filtered'}
                        onChange={() => setPrintDataScope('filtered')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Hasil Filter ({sortedPackages.length})</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>
                  Target:{' '}
                  <strong className="text-slate-800">
                    {getPackagesForPrint().length} paket
                  </strong>{' '}
                  ({printMode === 'customer' ? 'Daftar Pelanggan' : 'Lengkap Internal'})
                </span>
                <span className="text-[10px] text-slate-400">Ukuran: A4 Portrait</span>
              </div>

              {/* Action Buttons: Printer vs PDF */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                {/* Tombol Cetak ke Printer */}
                <button
                  type="button"
                  id="btn-confirm-print"
                  onClick={handleTriggerPrinter}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Cetak langsung ke mesin printer yang terhubung"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cetak ke Printer</span>
                </button>

                {/* Tombol Convert ke PDF */}
                <button
                  type="button"
                  id="btn-confirm-pdf"
                  onClick={handleTriggerPdf}
                  disabled={isPdfGenerating}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Unduh dokumen dalam bentuk file PDF (.pdf)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isPdfGenerating ? 'Membuat PDF...' : 'Convert ke PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
