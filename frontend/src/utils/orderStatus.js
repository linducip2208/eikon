// Metadata status pesanan (dipakai halaman order publik & admin panel)
export const ORDER_STATUS_META = {
  pending: {
    label: "Menunggu Pembayaran",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  paid: {
    label: "Sudah Dibayar",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  processing: {
    label: "Sedang Diproses",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  shipped: {
    label: "Dikirim",
    badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  },
  completed: {
    label: "Selesai",
    badge: "bg-stone-900 text-white border border-stone-900",
  },
  cancelled: {
    label: "Dibatalkan",
    badge: "bg-red-50 text-red-600 border border-red-200",
  },
  expired: {
    label: "Kedaluwarsa",
    badge: "bg-stone-100 text-stone-500 border border-stone-200",
  },
};

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_META);

export function getOrderStatusMeta(status) {
  return (
    ORDER_STATUS_META[status] || {
      label: status || "-",
      badge: "bg-stone-100 text-stone-500 border border-stone-200",
    }
  );
}
