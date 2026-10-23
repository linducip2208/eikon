import React, { useEffect, useState, useCallback } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import { ORDER_STATUS_OPTIONS, getOrderStatusMeta } from "../../utils/orderStatus";
import {
  Loader2,
  X,
  Eye,
  Inbox,
  ExternalLink,
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(price) || 0);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const LIMIT_OPTIONS = [10, 25, 50, 100];
const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "total_desc", label: "Total Tertinggi" },
  { value: "total_asc", label: "Total Terendah" },
];

export default function AdminOrders({ onActionSuccess }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // Detail modal
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Debounce search 300ms (standar admin panel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.LIST, {
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sort,
      });
      if (res.success) {
        setOrders(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Gagal mengambil pesanan:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sort]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openDetail = async (order) => {
    setDetailLoading(true);
    setDetail({ id: order.id, reference_id: order.reference_id });
    setNewStatus(order.status);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.DETAIL(order.id));
      if (res.success) {
        setDetail(res.data);
        setNewStatus(res.data.status);
      }
    } catch (error) {
      console.error(error);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!detail || !newStatus || newStatus === detail.status) return;
    setSavingStatus(true);
    try {
      const res = await request.put(API_ENDPOINTS.ORDERS.UPDATE_STATUS(detail.id), { status: newStatus });
      if (res.success) {
        toast.success("Status pesanan berhasil diperbarui.");
        setDetail({ ...detail, status: newStatus });
        fetchOrders();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingStatus(false);
    }
  };

  // Nomor halaman dengan elipsis
  const pageNumbers = () => {
    const total = pagination.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const result = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    if (start > 2) result.push("...");
    for (let i = start; i <= end; i += 1) result.push(i);
    if (end < total - 1) result.push("...");
    result.push(total);
    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-stone-900 tracking-wide">PESANAN MASUK</h2>
          <p className="text-xs text-stone-400">Kelola pesanan pembeli, pantau status pembayaran, dan perbarui status pengiriman.</p>
        </div>
      </div>

      {/* Toolbar: search, filter, sort, limit */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kode pesanan / nama / telepon..."
            className="w-full bg-white border border-stone-200 pl-9 pr-3 py-2.5 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-stone-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 focus:border-stone-900 focus:outline-none"
          >
            <option value="">Semua Status</option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getOrderStatusMeta(status).label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-stone-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 focus:border-stone-900 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="bg-white border border-stone-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 focus:border-stone-900 focus:outline-none"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / halaman
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-stone-150">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-150">
          <Inbox className="h-10 w-10 text-stone-200" />
          <p className="text-xs text-stone-400 mt-2">
            {search || statusFilter ? "Tidak ada pesanan yang cocok dengan filter." : "Belum ada pesanan masuk."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs">
            <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
              <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
                <tr>
                  <th className="px-6 py-4">Referensi</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Pembeli</th>
                  <th className="px-6 py-4 text-center">Item</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-stone-755">
                {orders.map((order) => {
                  const meta = getOrderStatusMeta(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-stone-900">
                        {order.reference_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-550">{formatDateTime(order.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-stone-900 font-semibold">{order.buyer_name}</p>
                        <p className="text-[11px] text-stone-400">{order.buyer_phone}</p>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-stone-600">{order.item_count}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-semibold text-stone-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openDetail(order)}
                          className="text-stone-500 hover:text-stone-900 p-1 hover:bg-stone-100 rounded transition-all"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-stone-400">
              Menampilkan {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pesanan
            </p>
            {pagination.totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="p-2 border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers().map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-stone-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`min-w-[34px] px-2 py-1.5 border text-xs font-semibold transition-all ${
                        item === pagination.page
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MODAL: DETAIL PESANAN --- */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => setDetail(null)} />
          <div className="relative transform bg-[#FBFBF9] border border-stone-150 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl transition-all space-y-6">
            <button
              className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-50"
              onClick={() => setDetail(null)}
            >
              <X className="h-5 w-5" />
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Detail Pesanan</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-mono text-base font-semibold text-stone-900">{detail.reference_id}</h3>
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${getOrderStatusMeta(detail.status).badge}`}>
                      {getOrderStatusMeta(detail.status).label}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400">Dibuat {formatDateTime(detail.created_at)}</p>
                </div>

                {/* Info pembeli */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-stone-150 p-4 space-y-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Pembeli</h4>
                    <p className="text-sm font-semibold text-stone-900">{detail.buyer_name}</p>
                    <p className="text-xs text-stone-600">{detail.buyer_phone}</p>
                    {detail.buyer_email && <p className="text-xs text-stone-600">{detail.buyer_email}</p>}
                  </div>
                  <div className="bg-white border border-stone-150 p-4 space-y-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Alamat Pengiriman</h4>
                    <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">{detail.address}</p>
                    <p className="text-xs font-semibold text-stone-900">{detail.city}</p>
                  </div>
                </div>

                {detail.notes && (
                  <div className="bg-amber-50/60 border border-amber-150 p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Catatan Pembeli</h4>
                    <p className="text-xs text-stone-700 whitespace-pre-wrap">{detail.notes}</p>
                  </div>
                )}

                {/* Item pesanan */}
                <div className="border border-stone-150 bg-white">
                  <div className="border-b border-stone-100 px-4 py-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Item Pesanan</h4>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {(detail.items || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-stone-900 truncate">{item.product_name}</p>
                          <p className="text-[11px] text-stone-400">
                            {item.variant_size} / {item.variant_color}
                            {item.sku ? ` • ${item.sku}` : ""} • {item.quantity}x @ {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-stone-900 whitespace-nowrap">{formatPrice(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-150 px-4 py-3 bg-stone-50/50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total</span>
                    <span className="text-sm font-semibold text-stone-900">{formatPrice(detail.total)}</span>
                  </div>
                </div>

                {/* Info pembayaran */}
                <div className="bg-white border border-stone-150 p-4 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Pembayaran ({detail.payment_provider === "paypal" ? "PayPal" : "Tripay"})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-stone-600">
                    <p>Channel: <span className="font-semibold text-stone-900">{detail.payment_channel || "-"}</span></p>
                    <p>Trx ID: <span className="font-mono">{detail.ipaymu_trx_id || "-"}</span></p>
                    <p>Session: <span className="font-mono break-all">{detail.payment_session_id || "-"}</span></p>
                    <p>Dibayar: <span className="font-semibold text-stone-900">{formatDateTime(detail.paid_at)}</span></p>
                  </div>
                  {detail.payment_url && detail.status === "pending" && (
                    <a
                      href={detail.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-700 underline underline-offset-4 hover:text-stone-900 mt-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Buka halaman pembayaran</span>
                    </a>
                  )}
                </div>

                {/* Update status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-stone-150">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Ubah Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 bg-white border border-stone-200 px-3 py-2.5 text-xs font-semibold text-stone-700 focus:border-stone-900 focus:outline-none"
                  >
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {getOrderStatusMeta(status).label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveStatus}
                    disabled={savingStatus || newStatus === detail.status}
                    className="inline-flex items-center justify-center space-x-2 bg-stone-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {savingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Simpan Status</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
