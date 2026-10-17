import React from "react";
import { Layers, TrendingUp, AlertOctagon, Mail } from "lucide-react";

export default function AdminStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white border border-stone-150 p-6 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Total Produk</span>
          <p className="text-2xl font-semibold text-stone-850">{stats.totalProducts}</p>
        </div>
        <Layers className="h-8 w-8 text-stone-300" />
      </div>

      <div className="bg-white border border-stone-150 p-6 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Total Unit Stok</span>
          <p className="text-2xl font-semibold text-stone-850">{stats.totalStockCount}</p>
        </div>
        <TrendingUp className="h-8 w-8 text-stone-300" />
      </div>

      <div className="bg-white border border-stone-150 p-6 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Kombinasi Stok Habis</span>
          <p className="text-2xl font-semibold text-red-650">{stats.outOfStockCount}</p>
        </div>
        <AlertOctagon className="h-8 w-8 text-red-200" />
      </div>

      <div className="bg-white border border-stone-150 p-6 flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Pesan Belum Dibaca</span>
          <p className="text-2xl font-semibold text-stone-850">{stats.unreadContacts}</p>
        </div>
        <Mail className="h-8 w-8 text-stone-300" />
      </div>
    </div>
  );
}
