import React, { useEffect, useState } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";

// Split Subpages
import AdminStats from "./admin/AdminStats";
import AdminProducts from "./admin/AdminProducts";
import AdminCategories from "./admin/AdminCategories";
import AdminBanners from "./admin/AdminBanners";
import AdminOrders from "./admin/AdminOrders";
import AdminContacts from "./admin/AdminContacts";
import AdminSettings from "./admin/AdminSettings";

export default function AdminDashboard() {
  // Navigation tab states: products, categories, banners, orders, contacts, settings
  const [activeTab, setActiveTab] = useState("products");

  // Stats dashboard state
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStockCount: 0,
    totalStockCount: 0,
    totalCategories: 0,
    unreadContacts: 0,
    totalContacts: 0,
    totalBanners: 0,
    totalOrders: 0,
    pendingOrders: 0
  });

  // Fetch Dynamic Global Stats
  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.ADMIN.STATS);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error("Gagal mengambil statistik:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-150 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-light text-stone-900 tracking-wide">PANEL ADMIN ELKON</h1>
          <p className="text-xs text-stone-550">Kelola banner promosi, kategori dinamis, pesan pelanggan, produk, dan varian.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => { setActiveTab("products"); }}
          className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === "products"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Produk ({stats.totalProducts})
        </button>
        <button
          onClick={() => { setActiveTab("categories"); }}
          className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === "categories"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Kategori ({stats.totalCategories})
        </button>
        <button
          onClick={() => { setActiveTab("banners"); }}
          className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === "banners"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Banner Swiper ({stats.totalBanners})
        </button>
        <button
          onClick={() => { setActiveTab("orders"); }}
          className={`relative px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === "orders"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Pesanan ({stats.totalOrders})
          {stats.pendingOrders > 0 && (
            <span className="absolute top-2 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {stats.pendingOrders}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("contacts"); }}
          className={`relative px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === "contacts"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Pesan Kontak
          {stats.unreadContacts > 0 && (
            <span className="absolute top-2 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-650 text-[9px] font-bold text-white">
              {stats.unreadContacts}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("settings"); }}
          className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
            activeTab === "settings"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          Pengaturan
        </button>
      </div>

      {/* Dynamic Statistics Cards */}
      <AdminStats stats={stats} />

      {/* --- CONTENT TABS SWITCHING --- */}
      <div className="bg-white p-6 border border-stone-150 shadow-xs">
        {activeTab === "products" && (
          <AdminProducts onActionSuccess={fetchStats} />
        )}
        {activeTab === "categories" && (
          <AdminCategories onActionSuccess={fetchStats} />
        )}
        {activeTab === "banners" && (
          <AdminBanners onActionSuccess={fetchStats} />
        )}
        {activeTab === "orders" && (
          <AdminOrders onActionSuccess={fetchStats} />
        )}
        {activeTab === "contacts" && (
          <AdminContacts onActionSuccess={fetchStats} />
        )}
        {activeTab === "settings" && (
          <AdminSettings onActionSuccess={fetchStats} />
        )}
      </div>
    </div>
  );
}
