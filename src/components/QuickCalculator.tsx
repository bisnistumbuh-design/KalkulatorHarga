import React, { useState } from 'react';
import { Calculator, Plus, HardDrive, BatteryCharging, Radio, Smartphone } from 'lucide-react';
import { calculateSinglePackage, extractMicroSdCapacity } from '../utils/calculator';
import { CalculatedPackage, ProductCategory, MicroSdCapacity } from '../types';

interface QuickCalculatorProps {
  onAddPackage: (pkg: CalculatedPackage) => void;
}

export const QuickCalculator: React.FC<QuickCalculatorProps> = ({ onAddPackage }) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('paket');
  const [microSdCapacity, setMicroSdCapacity] = useState<string>('32GB');
  const [activeDaysInput, setActiveDaysInput] = useState('3 hari');
  const [costInput, setCostInput] = useState('48800');

  // Auto-detect Category & Capacity when typing in name
  const handleNameChange = (val: string) => {
    setProductName(val);
    const lower = val.toLowerCase();

    // MicroSD detection
    if (
      lower.includes('microsd') ||
      lower.includes('micro sd') ||
      lower.includes('micro-sd') ||
      lower.includes('sd card') ||
      lower.includes('memory card') ||
      lower.includes('tf card')
    ) {
      setCategory('microsd');
      const cap = extractMicroSdCapacity(val);
      if (cap) setMicroSdCapacity(cap);
      return;
    }

    // Powerbank detection
    if (
      lower.includes('powerbank') ||
      lower.includes('power bank') ||
      /\bpb\b/i.test(lower)
    ) {
      setCategory('powerbank');
      return;
    }

    // Perdana detection
    if (
      lower.includes('perdana') ||
      /\bsp\b/i.test(lower) ||
      lower.includes('starter pack') ||
      lower.includes('kartu perdana')
    ) {
      setCategory('perdana');
      return;
    }
  };

  // Instant calculation for live preview
  const previewPkg = calculateSinglePackage(
    'preview',
    productName ||
      (category === 'microsd'
        ? `MicroSD Sandisk ${microSdCapacity}`
        : category === 'powerbank'
        ? 'Powerbank Robot 10000mAh'
        : category === 'perdana'
        ? 'Kartu Perdana Telkomsel 14GB'
        : 'Paket Data Telkomsel 10GB'),
    category === 'microsd' ? microSdCapacity : category === 'powerbank' ? 'Aksesoris' : activeDaysInput,
    costInput,
    category,
    category === 'microsd' ? microSdCapacity : undefined
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPkg = calculateSinglePackage(
      `manual-${Date.now()}`,
      productName ||
        (category === 'microsd'
          ? `MicroSD ${microSdCapacity}`
          : category === 'powerbank'
          ? 'Powerbank Aksesoris'
          : category === 'perdana'
          ? 'Kartu Perdana'
          : 'Paket Data'),
      category === 'microsd' ? microSdCapacity : category === 'powerbank' ? 'Aksesoris' : activeDaysInput,
      costInput,
      category,
      category === 'microsd' ? microSdCapacity : undefined
    );
    onAddPackage(finalPkg);
    setProductName('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
          Kalkulator Cepat (Cek Manual)
        </h3>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 overflow-x-auto">
          <button
            type="button"
            id="toggle-cat-paket"
            onClick={() => setCategory('paket')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              category === 'paket'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-2.5 h-2.5" />
            <span>Paket Data</span>
          </button>
          <button
            type="button"
            id="toggle-cat-perdana"
            onClick={() => setCategory('perdana')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              category === 'perdana'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Radio className="w-2.5 h-2.5" />
            <span>Perdana (+5rb)</span>
          </button>
          <button
            type="button"
            id="toggle-cat-microsd"
            onClick={() => setCategory('microsd')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              category === 'microsd'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HardDrive className="w-2.5 h-2.5" />
            <span>MicroSD</span>
          </button>
          <button
            type="button"
            id="toggle-cat-powerbank"
            onClick={() => setCategory('powerbank')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              category === 'powerbank'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BatteryCharging className="w-2.5 h-2.5" />
            <span>Powerbank (+15rb)</span>
          </button>
        </div>
      </div>

      {/* Sub-selector for MicroSD Capacities */}
      {category === 'microsd' && (
        <div className="mb-2.5 p-2 bg-teal-50/80 border border-teal-200 rounded flex flex-wrap items-center justify-between gap-1.5">
          <div className="text-[10px] font-bold text-teal-900 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-teal-600" />
            <span>Pilih Kapasitas MicroSD:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {(['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'] as const).map((cap) => {
              const isSelected = microSdCapacity === cap;
              const marginTag =
                cap === '4GB'
                  ? '+10rb'
                  : cap === '8GB'
                  ? '+12rb'
                  : cap === '16GB' || cap === '32GB'
                  ? '+15rb'
                  : '+18rb';

              return (
                <button
                  key={cap}
                  type="button"
                  id={`cap-select-${cap.toLowerCase()}`}
                  onClick={() => setMicroSdCapacity(cap)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white text-teal-800 border border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  {cap} <span className="text-[9px] opacity-85 font-normal">({marginTag})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
              <span>Nama Produk</span>
              {category === 'microsd' && (
                <span className="text-[9px] text-teal-700 font-bold bg-teal-50 px-1 rounded border border-teal-200">
                  MicroSD {microSdCapacity}
                </span>
              )}
              {category === 'powerbank' && (
                <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                  Powerbank
                </span>
              )}
              {category === 'perdana' && (
                <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1 rounded border border-purple-200">
                  Perdana
                </span>
              )}
            </label>
            <input
              type="text"
              id="quick-package-name"
              value={productName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                category === 'microsd'
                  ? 'misal: MicroSD Sandisk Ultra 32GB'
                  : category === 'powerbank'
                  ? 'misal: Powerbank Robot 10000mAh'
                  : category === 'perdana'
                  ? 'misal: Perdana Telkomsel 14GB'
                  : 'misal: Telkomsel Flash 10GB'
              }
              className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {category === 'microsd'
                ? 'Kapasitas / Varian'
                : category === 'powerbank'
                ? 'Keterangan'
                : 'Masa Aktif (B)'}
            </label>
            <input
              type="text"
              id="quick-package-days"
              value={
                category === 'microsd'
                  ? microSdCapacity
                  : category === 'powerbank'
                  ? 'Aksesoris'
                  : activeDaysInput
              }
              onChange={(e) => {
                if (category === 'microsd') setMicroSdCapacity(e.target.value);
                else setActiveDaysInput(e.target.value);
              }}
              disabled={category === 'powerbank'}
              placeholder="misal: 30 hari / 32GB"
              className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono disabled:bg-slate-100 disabled:text-slate-500"
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
            <span
              className={`font-semibold px-1 py-0.5 rounded border ${
                category === 'microsd'
                  ? 'text-teal-700 bg-teal-50 border-teal-200'
                  : category === 'powerbank'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : category === 'perdana'
                  ? 'text-purple-700 bg-purple-50 border-purple-200'
                  : 'text-indigo-700 bg-indigo-50 border-indigo-200'
              }`}
            >
              Margin: {previewPkg.marginFormatted} ({previewPkg.categoryLabel})
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
            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Tambah ke Tabel</span>
          </button>
        </div>
      </form>
    </div>
  );
};


