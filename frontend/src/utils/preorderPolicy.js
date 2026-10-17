export const DEFAULT_PREORDER_POLICY = {
  items: [
    "Estimasi produksi: 7–14 hari kerja, kalau orderan terlalu banyak maksimal 40 hari kerja.",
    "Pembayaran dilakukan sebelum pesanan diproses.",
    "Pesanan yang sudah masuk produksi tidak dapat dibatalkan.",
    "Perubahan ukuran/warna maksimal 1x24 jam setelah pembayaran.",
    "Produk dikirim setelah proses produksi dan QC selesai.",
    "Penukaran hanya berlaku untuk kesalahan pengiriman atau cacat produksi dengan video unboxing.",
  ],
  disclaimer: "By placing an order, you agree to our Pre-Order Policy. ✨",
};

export function parsePreorderPolicy(settings) {
  if (!settings?.preorder_policy) {
    return DEFAULT_PREORDER_POLICY;
  }

  try {
    const parsed = JSON.parse(settings.preorder_policy);
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((item) => String(item).trim()).filter(Boolean)
      : [];
    const disclaimer = String(parsed.disclaimer || "").trim();

    return {
      items: items.length > 0 ? items : DEFAULT_PREORDER_POLICY.items,
      disclaimer: disclaimer || DEFAULT_PREORDER_POLICY.disclaimer,
    };
  } catch {
    return DEFAULT_PREORDER_POLICY;
  }
}

export function serializePreorderPolicy({ items, disclaimer }) {
  const cleanItems = items
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return JSON.stringify({
    items: cleanItems,
    disclaimer: disclaimer.trim(),
  });
}
