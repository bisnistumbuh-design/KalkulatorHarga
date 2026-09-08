import React, { useState } from 'react';
import { Calculator, Plus } from 'lucide-react';
import { calculateSinglePackage } from '../utils/calculator';
import { CalculatedPackage } from '../types';

interface QuickCalculatorProps {
  onAddPackage: (pkg: CalculatedPackage) => void;
}

export const QuickCalculator: React.FC<QuickCalculatorProps> = ({ onAddPackage }) => {
  const [packageName, setPackageName] = useState('');
  const [activeDaysInput, setActiveDaysInput] = useState('3 hari');
  const [costInput, setCostInput] = useState('48800');
  const [isPerdana, setIsPerdana] = useState(false);

  // Auto-detect Perdana when typing in name
  const handleNameChange = (val: string) => {
    setPackageName(val);
    const lower = val.toLowerCase();
    if (lower.includes('perdana') || /\bsp\b/i.test(lower) || lower.includes('starter pack')) {
      setIsPerdana(true);
    }
  };

  // Instant calculation for live preview
  const previewPkg = calculateSinglePackage(
    'preview',
    packageName || (isPerdana ? 'Contoh Kartu Perdana' : 'Contoh Paket Data'),
    activeDaysInput,
    costInput,
    isPerdana
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPkg = calculateSinglePackage(
      `manual-${Date.now()}`,
      packageName || (isPerdana ? 'Kartu Perdana Input Manual' : 'Paket Input Manual'),
      activeDaysInput,
      costInput,
      isPerdana
    );
    onAddPackage(finalPkg);
    setPackageName('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
          Kalkulator Cepat (Cek Manual)
        </h3>
        {/* Toggle Penjualan Perdana */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
          <button
            type="button"
            id="toggle-type-paket"
            onClick={() => setIsPerdana(false)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
              !isPerdana
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Paket Data
          </button>
          <button
            type="button"
            id="toggle-type-perdana"
            onClick={() => setIsPerdana(true)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              isPerdana
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Perdana</span>
            <span className="text-[9px] opacity-90">(+5rb)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
              <span>Nama Paket / Produk</span>
              {isPerdana && (
                <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1 rounded border border-purple-200">
                  Perdana
                </span>
              )}
            </label>
            <input
              type="text"
              id="quick-package-name"
              value={packageName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={isPerdana ? 'misal: Perdana Telkomsel 14GB' : 'misal: Telkomsel 14GB'}
              className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Masa Aktif (B)
            </label>
            <input
              type="text"
              id="quick-package-days"
              value={activeDaysInput}
              onChange={(e) => setActiveDaysInput(e.target.value)}
              placeholder="misal: 3hr / 7 / 30"
              className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Harga Modal (C)
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1 text-[11px] text-slate-400 font-medium">
                Rp
              </span>
              <input
                type="text"
                id="quick-package-cost"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                placeholder="48800"
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Breakdown & Add Button */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/70 p-2 rounded border border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-600">
            <span>Modal: {previewPkg.costPriceFormatted}</span>
            <span className="text-slate-400">+</span>
            <span className={`font-semibold ${isPerdana ? 'text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200' : 'text-indigo-700'}`}>
              Margin: {previewPkg.marginFormatted} {isPerdana && '(Perdana)'}
            </span>
            <span className="text-slate-400">=</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              Jual: {previewPkg.sellingPriceFormatted}
            </span>
            <span className="text-emerald-700 font-medium">
              (+{previewPkg.actualProfitFormatted})
            </span>
          </div>

          <button
            type="submit"
            id="btn-add-quick-package"
            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Tambah ke Tabel</span>
          </button>
        </div>
      </form>
    </div>
  );
};

