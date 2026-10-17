import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { getOrderStatusMeta } from "../utils/orderStatus";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  PackageSearch,
  AlertTriangle,
} from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(price) || 0);

export default function OrderStatus() {
  const { referenceId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentCancelled = searchParams.get("payment") === "cancelled";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.BY_REFERENCE(referenceId));
      if (res.success) setOrder(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      }
      // error lain sudah di-toast oleh request helper
    } finally {
      if (!silent) setLoading(false);
    }
  }, [referenceId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Polling status selama menunggu pembayaran (callback iPaymu mengubah status di server)
  useEffect(() => {
    if (!order || order.status !== "pending") return;
    const timer = setInterval(() => fetchOrder(true), 5000);
    return () => clearInterval(timer);
  }, [order, fetchOrder]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FBFBF9]">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-4">
        <PackageSearch className="mx-auto h-12 w-12 text-stone-300" />
        <h1 className="font-serif text-2xl text-stone-900">Pesanan Tidak Ditemukan</h1>
        <p className="text-sm text-stone-500">
          Kode referensi <span className="font-mono">{referenceId}</span> tidak dikenali. Periksa kembali tautan pesanan Anda.
        </p>
        <Link to="/shop" className="inline-block bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-800 transition-all">
          Kembali ke Shop
        </Link>
      </div>
    );
  }

  const meta = getOrderStatusMeta(order.status);
  const isPending = order.status === "pending";
  const isPaid = ["paid", "processing", "shipped", "completed"].includes(order.status);

  return (
    <div className="bg-[#FBFBF9]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          {isPaid ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          ) : isPending ? (
            <Clock className="mx-auto h-12 w-12 text-amber-500" />
          ) : (
            <AlertTriangle className="mx-auto h-12 w-12 text-stone-400" />
          )}
          <h1 className="font-serif text-3xl font-light text-stone-900 tracking-wide">
            {isPaid ? "Pembayaran Berhasil" : isPending ? "Menunggu Pembayaran" : "Status Pesanan"}
          </h1>
          <p className="text-sm text-stone-500">
            Terima kasih, <span className="font-medium text-stone-700">{order.buyer_name}</span>. Simpan kode referensi berikut untuk melacak pesanan Anda.
          </p>
          <div className="inline-flex items-center space-x-3 border border-stone-200 bg-white px-5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Kode Pesanan</span>
            <span className="font-mono text-sm font-semibold text-stone-900">{order.reference_id}</span>
          </div>
        </div>

        {/* Status & aksi pembayaran */}
        <div className="border border-stone-150 bg-white p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Status Pesanan</span>
            <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
              {meta.label}
            </span>
          </div>

          {paymentCancelled && isPending && (
            <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Anda membatalkan proses pembayaran di halaman iPaymu. Pesanan masih tersimpan — klik tombol di bawah untuk mencoba lagi selama belum kedaluwarsa.
            </div>
          )}

          {isPending && (
            <>
              <p className="text-xs text-stone-500 leading-relaxed">
                Pesanan Anda sudah tercatat. Selesaikan pembayaran melalui halaman iPaymu (Virtual Account bank, QRIS, atau e-wallet). Status di halaman ini akan otomatis berubah setelah pembayaran terkonfirmasi.
              </p>
              {order.payment_url ? (
                <button
                  onClick={() => {
                    window.location.href = order.payment_url;
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Lanjutkan Pembayaran</span>
                </button>
              ) : (
                <div className="border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
                  Tautan pembayaran tidak tersedia. Hubungi kami via WhatsApp untuk bantuan pembayaran.
                </div>
              )}
            </>
          )}

          {isPaid && (
            <p className="text-xs text-emerald-700 leading-relaxed">
              Pembayaran Anda sudah kami terima{order.paid_at ? ` pada ${new Date(order.paid_at).toLocaleString("id-ID")}` : ""}. Pesanan akan segera kami proses.
            </p>
          )}

          {order.status === "expired" && (
            <p className="text-xs text-stone-500 leading-relaxed">
              Batas waktu pembayaran pesanan ini sudah berakhir. Silakan buat pesanan baru atau hubungi kami via WhatsApp untuk bantuan.
            </p>
          )}

          {order.status === "cancelled" && (
            <p className="text-xs text-red-600 leading-relaxed">
              Pesanan ini telah dibatalkan. Silakan hubungi kami jika Anda merasa ini sebuah kesalahan.
            </p>
          )}
        </div>

        {/* Ringkasan item */}
        <div className="border border-stone-150 bg-white">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="font-serif text-base text-stone-900">Ringkasan Pesanan</h2>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Dibuat {new Date(order.created_at).toLocaleString("id-ID")} • Kirim ke {order.city}
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-serif text-sm text-stone-900 truncate">{item.product_name}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {item.variant_size} / {item.variant_color}
                    {item.sku ? ` • ${item.sku}` : ""} • {item.quantity}x @ {formatPrice(item.price)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-stone-900 whitespace-nowrap">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-stone-150 px-6 py-4 bg-stone-50/50">
            <span className="font-serif text-base text-stone-900">Total</span>
            <span className="text-base font-semibold text-stone-900">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="text-center">
          <Link to="/shop" className="text-xs font-semibold uppercase tracking-widest text-stone-500 underline underline-offset-4 hover:text-stone-900 transition-all">
            Lanjut Belanja
          </Link>
        </div>
      </div>
    </div>
  );
}
