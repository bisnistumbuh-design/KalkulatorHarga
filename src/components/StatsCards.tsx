import React from 'react';
import { CalculatedPackage } from '../types';
import { formatRupiah } from '../utils/calculator';

interface StatsCardsProps {
  packages: CalculatedPackage[];
  executionTimeMs?: number;
  fileName?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  packages,
  executionTimeMs,
  fileName,
}) => {
  if (packages.length === 0) return null;

  const total = packages.length;
  const totalCost = packages.reduce((acc, p) => acc + p.costPrice, 0);
  const totalSelling = packages.reduce((acc, p) => acc + p.sellingPrice, 0);
  const totalProfit = packages.reduce((acc, p) => acc + p.actualProfit, 0);

  const avgCost = totalCost / total;
  const avgSelling = totalSelling / total;
  const avgProfit = totalProfit / total;

  const countTier1 = packages.filter((p) => p.category === 'paket' && p.tier === 'tier1').length;
  const countTier2 = packages.filter((p) => p.category === 'paket' && p.tier === 'tier2').length;
  const countTier3 = packages.filter((p) => p.category === 'paket' && p.tier === 'tier3').length;
  const countPerdana = packages.filter((p) => p.category === 'perdana' || p.isPerdana).length;
  const countMicroSd = packages.filter((p) => p.category === 'microsd').length;
  const countPowerbank = packages.filter((p) => p.category === 'powerbank').length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Processing Metrics
        </h2>
        {executionTimeMs !== undefined && (
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
            {executionTimeMs} ms • Berhasil
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Total Produk Dimuat</span>
          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
            {total}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Rata-rata Harga Modal</span>
          <span className="font-mono font-medium text-slate-700">
            {formatRupiah(avgCost)}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Rata-rata Harga Jual</span>
          <span className="font-mono font-bold text-indigo-700">
            {formatRupiah(avgSelling)}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Rata-rata Margin Riil</span>
          <span className="font-mono font-bold text-emerald-600">
            +{formatRupiah(avgProfit)}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
          <span className="text-slate-500 font-medium">Distribusi Kategori Produk:</span>
          <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
            {countMicroSd > 0 && (
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded font-semibold" title="MicroSD Penyimpanan (+10rb ~ +18rb)">
                {countMicroSd} MicroSD
              </span>
            )}
            {countPowerbank > 0 && (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold" title="Powerbank (+15rb)">
                {countPowerbank} Powerbank (+15rb)
              </span>
            )}
            {countPerdana > 0 && (
              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold" title="Penjualan Perdana (+Rp 5.000)">
                {countPerdana} Perdana (+5rb)
              </span>
            )}
            {countTier1 + countTier2 + countTier3 > 0 && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded" title="Paket Data Regular">
                {countTier1 + countTier2 + countTier3} Paket Data
              </span>
            )}
          </div>
        </div>


        {fileName && (
          <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-slate-100 flex items-center justify-between">
            <span className="truncate">File: {fileName}</span>
            <span className="text-emerald-600 font-semibold shrink-0">Status: Ready</span>
          </div>
        )}
      </div>
    </div>
  );
};

