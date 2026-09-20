import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export const RulesExplainer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Pricing Logic Active
        </h2>
        <button
          type="button"
          id="btn-toggle-rules-detail"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-indigo-600 font-semibold hover:text-indigo-800 inline-flex items-center gap-0.5"
        >
          <span>{isExpanded ? 'Sederhanakan' : 'Detail Rumus'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Rule 1: Margin Paket Data */}
        <div className="border-l-2 border-indigo-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px]">
            1. Margin Paket Data Biasa (FR-03)
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            ≤ 3 Hari: <span className="text-indigo-700 font-bold">+Rp 2.000</span> | 4-14 Hari: <span className="text-indigo-700 font-bold">+Rp 2.500</span> | &gt; 14 Hari: <span className="text-indigo-700 font-bold">+Rp 3.000</span>
          </div>
        </div>

        {/* Rule 2: Penjualan Perdana */}
        <div className="border-l-2 border-purple-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between">
            <span>2. Penjualan Perdana</span>
            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
              +Rp 5.000
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Kartu Perdana / SP: <span className="text-purple-700 font-bold">+Rp 5.000</span> dari modal
          </div>
        </div>

        {/* Rule 3: Kategori Penyimpanan (MicroSD) */}
        <div className="border-l-2 border-teal-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between">
            <span>3. Kategori Penyimpanan (MicroSD)</span>
            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 rounded border border-teal-200">
              Penyimpanan
            </span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono mt-0.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>4GB: <span className="text-teal-700 font-bold">+Rp 10.000</span></div>
            <div>8GB: <span className="text-teal-700 font-bold">+Rp 12.000</span></div>
            <div>16GB, 32GB: <span className="text-teal-700 font-bold">+Rp 15.000</span></div>
            <div>64GB, 128GB: <span className="text-teal-700 font-bold">+Rp 18.000</span></div>
          </div>
        </div>

        {/* Rule 4: Aksesoris Handphone */}
        <div className="border-l-2 border-orange-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between">
            <span>4. Aksesoris Handphone (Berdasarkan Modal)</span>
            <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1 rounded border border-orange-200">
              Aksesoris HP
            </span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono mt-0.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>Modal &le; 10rb: <span className="text-orange-700 font-bold">+Rp 3.000</span></div>
            <div>10.001 - 20rb: <span className="text-orange-700 font-bold">+Rp 5.000</span></div>
            <div>20.001 - 75rb: <span className="text-orange-700 font-bold">+Rp 15.000</span></div>
            <div>&gt; 75.001: <span className="text-orange-700 font-bold">+Rp 20.000</span></div>
          </div>
        </div>

        {/* Rule 5: Aksesoris Powerbank */}
        <div className="border-l-2 border-amber-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between">
            <span>5. Powerbank</span>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
              +Rp 15.000
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Powerbank: <span className="text-amber-700 font-bold">+Rp 15.000</span> dari harga modal
          </div>
        </div>

        {/* Rule 6: Pembulatan */}
        <div className="border-l-2 border-slate-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px]">
            6. Pembulatan Kustom Ribuan (Tetap)
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Sisa ratusan ≤ 300: <span className="text-slate-700 font-semibold">Bawah</span> | &gt; 300: <span className="text-emerald-700 font-semibold">Atas</span> (ke kelipatan 1.000)
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-2 bg-slate-50/70 p-2.5 rounded">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Contoh Penerapan Margin & Pembulatan:
          </div>
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-teal-200">
              <span className="text-teal-900 font-medium">MicroSD 4GB: Modal 28.200 (+10rb = 38.200)</span>
              <div className="flex items-center gap-1 text-teal-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-teal-400" />
                <span>Rp 38.000 (Turun)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-teal-200">
              <span className="text-teal-900 font-medium">MicroSD 32GB: Modal 48.600 (+15rb = 63.600)</span>
              <div className="flex items-center gap-1 text-teal-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-teal-400" />
                <span>Rp 64.000 (Naik)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-amber-200">
              <span className="text-amber-900 font-medium">Powerbank: Modal 84.200 (+15rb = 99.200)</span>
              <div className="flex items-center gap-1 text-amber-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-amber-400" />
                <span>Rp 99.000 (Turun)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-purple-200">
              <span className="text-purple-900 font-medium">Perdana: Modal 35.400 (+5rb = 40.400)</span>
              <div className="flex items-center gap-1 text-purple-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-purple-400" />
                <span>Rp 41.000 (Naik)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-orange-200">
              <span className="text-orange-950 font-medium">Aksesoris HP: Modal 7.500 (&le;10rb: +3rb = 10.500)</span>
              <div className="flex items-center gap-1 text-orange-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-orange-400" />
                <span>Rp 11.000 (Naik)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-orange-200">
              <span className="text-orange-950 font-medium">Aksesoris HP: Modal 38.500 (20-75rb: +15rb = 53.500)</span>
              <div className="flex items-center gap-1 text-orange-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-orange-400" />
                <span>Rp 54.000 (Naik)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>Paket 30hr: Modal 51.600 (+3rb = 54.600)</span>
              <div className="flex items-center gap-1 text-slate-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                <span>Rp 55.000 (Naik)</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            *Otomatis mengenali &quot;Aksesoris&quot;, &quot;Kabel&quot;, &quot;Charger&quot;, &quot;MicroSD&quot;, &quot;Powerbank&quot;, &quot;Perdana&quot;, dll. pada nama produk / Excel
          </p>
        </div>
      )}
    </div>
  );
};

