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
        {/* Rule 1: Margin */}
        <div className="border-l-2 border-indigo-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px]">
            1. Margin Keuntungan (FR-03)
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            ≤ 3 Hari: <span className="text-indigo-700 font-bold">+Rp 2.000</span> | 4-14 Hari: <span className="text-indigo-700 font-bold">+Rp 2.500</span> | &gt; 14 Hari: <span className="text-indigo-700 font-bold">+Rp 3.000</span>
          </div>
        </div>

        {/* Rule 2: Pembulatan */}
        <div className="border-l-2 border-amber-500 pl-2.5 py-0.5">
          <div className="font-semibold text-slate-800 text-[11px]">
            2. Pembulatan Kustom Ribuan (FR-04)
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Sisa ratusan ≤ 300: <span className="text-amber-700 font-semibold">Bawah</span> | &gt; 300: <span className="text-emerald-700 font-semibold">Atas</span> (ke kelipatan 1.000)
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-2 bg-slate-50/70 p-2.5 rounded">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Contoh Penerapan:
          </div>
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>Modal Rp 51.300 (sisa 300)</span>
              <div className="flex items-center gap-1 text-slate-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                <span>Rp 51.000 (Turun)</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>Modal Rp 51.600 (sisa 600)</span>
              <div className="flex items-center gap-1 text-slate-800 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                <span>Rp 52.000 (Naik)</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            *Otomatis mengenali angka & teks (cth: &quot;3hr&quot;, &quot;30 Hari&quot;)
          </p>
        </div>
      )}
    </div>
  );
};

