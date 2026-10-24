import { useState, useEffect } from "react";
import { X, Trash2, Plus, Minus, CreditCard, ShoppingBag, Loader2, Wallet, Landmark } from "lucide-react";
import { getImageUrl } from "../utils/api";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import toast from "react-hot-toast";

const formatUSD = (idr, rate) => {
  if (!rate || rate <= 0) return "";
  const usd = Math.ceil((Number(idr) / rate) * 100) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd);
};

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    phone: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("tripay");
  const [paymentMethods, setPaymentMethods] = useState({ tripay: true, paypal: false, rate: 16000, currency: "USD" });
  const [methodsLoading, setMethodsLoading] = useState(false);

  // Muat gateway yang aktif saat masuk ke form checkout
  useEffect(() => {
    if (!isCheckingOut) return;
    let cancelled = false;
    setMethodsLoading(true);
    request
      .get(API_ENDPOINTS.PAYMENT.METHODS)
      .then((res) => {
        if (cancelled || !res.success) return;
        const tripay = Boolean(res.data?.tripay?.enabled);
        const paypal = Boolean(res.data?.paypal?.enabled);
        setPaymentMethods({
          tripay,
          paypal,
          rate: Number(res.data?.paypal?.rate) || 16000,
          currency: res.data?.paypal?.currency || "USD",
        });
        setPaymentMethod(tripay ? "tripay" : "paypal");
      })
      .catch(() => {
        // Gagal memuat -> tampilkan Tripay saja, backend tetap yang memvalidasi
      })
      .finally(() => {
        if (!cancelled) setMethodsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCheckingOut]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.variant.price_override !== null ? parseFloat(item.variant.price_override) : parseFloat(item.product.base_price);
    return acc + price * item.quantity;
  }, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || !shippingInfo.phone || !shippingInfo.email) {
      toast.error("Silakan lengkapi semua data pengiriman (termasuk email).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email.trim())) {
      toast.error("Format email tidak valid.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang Anda masih kosong.");
      return;
    }

    if (paymentMethod !== "tripay" && paymentMethod !== "paypal") {
      toast.error("Pilih metode pembayaran Tripay atau PayPal.");
      return;
    }
    if (paymentMethod === "tripay" && !paymentMethods.tripay) {
      toast.error("Pembayaran Tripay sedang nonaktif.");
      return;
    }
    if (paymentMethod === "paypal" && !paymentMethods.paypal) {
      toast.error("Pembayaran PayPal sedang nonaktif.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Membuat pesanan & menyiapkan pembayaran...");

    try {
      const res = await request.post(API_ENDPOINTS.ORDERS.CREATE, {
        buyer_name: shippingInfo.name,
        buyer_phone: shippingInfo.phone,
        buyer_email: shippingInfo.email,
        address: shippingInfo.address,
        city: shippingInfo.city,
        notes: shippingInfo.notes,
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          variant_id: item.variant.id,
          quantity: item.quantity,
        })),
      });

      if (res.success && res.data?.payment_url) {
        toast.success("Pesanan dibuat! Mengarahkan ke halaman pembayaran...", { id: toastId });
        onClearCart();
        window.location.href = res.data.payment_url;
        return;
      }

      toast.error("Gagal membuat pesanan. Silakan coba lagi.", { id: toastId });
    } catch {
      // Pesan error spesifik sudah ditampilkan oleh request helper (toast)
      toast.dismiss(toastId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isCheckingOut) onClose();
        }}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-[#FBFBF9] shadow-2xl transition-transform duration-300 ease-in-out">
          <div className="flex h-full flex-col overflow-y-scroll">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-6">
              <h2 className="font-serif text-lg font-medium uppercase tracking-wider text-stone-900">
                {isCheckingOut ? "Detail Pengiriman" : "Tas Belanja"}
              </h2>
              <button
                type="button"
                className="rounded-full p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-500 transition-all"
                onClick={() => {
                  if (isCheckingOut) {
                    setIsCheckingOut(false);
                  } else {
                    onClose();
                  }
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4">
              {isCheckingOut ? (
                /* Checkout Form */
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  <div className="bg-stone-50 p-4 border border-stone-100 rounded">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">Ringkasan Pesanan</h3>
                    <div className="flex justify-between text-sm text-stone-900 font-medium">
                      <span>Total Harga ({cartItems.length} item)</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-base text-stone-900">Alamat Pengiriman</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-stone-200 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="Budi Santoso"
                        value={shippingInfo.name}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Nomor Telepon</label>
                      <input
                        type="tel"
                        required
                        className="w-full bg-white border border-stone-200 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="cth. 08123456789"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Email (Wajib)</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-white border border-stone-200 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="cth. nama@email.com"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Alamat Lengkap</label>
                      <textarea
                        required
                        rows="3"
                        className="w-full bg-white border border-stone-200 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="Nama jalan, nama gedung, nomor rumah, RT/RW, kelurahan/kecamatan"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Kota / Provinsi</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-stone-200 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="cth. Jakarta Selatan, DKI Jakarta"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Catatan (opsional)</label>
                      <textarea
                        rows="2"
                        className="w-full bg-white border border-stone-200 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="cth. warna cadangan, patokan alamat, atau permintaan khusus"
                        value={shippingInfo.notes}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <h3 className="font-serif text-base text-stone-900">Metode Pembayaran</h3>

                  {methodsLoading ? (
                    <div className="flex items-center justify-center py-4 border border-stone-100 bg-white">
                      <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.tripay && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("tripay")}
                          className={`flex flex-col items-start gap-1 border p-4 text-left transition-all ${
                            paymentMethod === "tripay"
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Landmark className="h-4 w-4" />
                            Tripay
                          </span>
                          <span className={`text-[10px] leading-relaxed ${paymentMethod === "tripay" ? "text-stone-300" : "text-stone-400"}`}>
                            VA bank, QRIS, e-wallet, gerai retail (IDR)
                          </span>
                        </button>
                      )}
                      {paymentMethods.paypal && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paypal")}
                          className={`flex flex-col items-start gap-1 border p-4 text-left transition-all ${
                            paymentMethod === "paypal"
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Wallet className="h-4 w-4" />
                            PayPal
                          </span>
                          <span className={`text-[10px] leading-relaxed ${paymentMethod === "paypal" ? "text-stone-300" : "text-stone-400"}`}>
                            Kartu &amp; saldo PayPal ({formatUSD(subtotal, paymentMethods.rate) || paymentMethods.currency})
                          </span>
                        </button>
                      )}
                      {!paymentMethods.tripay && !paymentMethods.paypal && (
                        <p className="col-span-2 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                          Semua metode pembayaran sedang nonaktif. Hubungi kami via WhatsApp untuk memesan.
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {paymentMethod === "paypal" ? (
                      <>
                        Anda akan diarahkan ke halaman resmi PayPal untuk membayar{" "}
                        <span className="font-semibold text-stone-600">
                          {formatUSD(subtotal, paymentMethods.rate)} {paymentMethods.currency}
                        </span>{" "}
                        (dikonversi dari {formatPrice(subtotal)}). Status pesanan ter-update otomatis setelah pembayaran
                        disetujui.
                      </>
                    ) : (
                      <>
                        Setelah menekan tombol di bawah, Anda akan diarahkan ke halaman pembayaran resmi (VA bank, QRIS,
                        e-wallet).
                      </>
                    )}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Buat Pesanan &amp; Bayar</span>
                      </>
                    )}
                  </button>
                </form>
              ) : cartItems.length === 0 ? (
                /* Empty Cart State */
                <div className="flex h-96 flex-col items-center justify-center space-y-4">
                  <div className="rounded-full bg-stone-50 p-4 border border-stone-100">
                    <ShoppingBag className="h-10 w-10 text-stone-300" />
                  </div>
                  <h3 className="font-serif text-lg text-stone-700">Tas belanja Anda kosong</h3>
                  <p className="text-xs text-stone-400 text-center max-w-[240px]">
                    Jelajahi koleksi kami dan temukan pilihan varian pakaian yang premium.
                  </p>
                </div>
              ) : (
                /* Cart Items List */
                <div className="divide-y divide-stone-100">
                  {cartItems.map((item, idx) => {
                    const price = item.variant.price_override !== null ? parseFloat(item.variant.price_override) : parseFloat(item.product.base_price);

                    return (
                      <div key={`${item.product.id}-${item.variant.id}-${idx}`} className="flex py-6">
                        {/* Image */}
                        <div className="h-24 w-18 flex-shrink-0 overflow-hidden border border-stone-100 bg-stone-50">
                          <img
                            src={getImageUrl(item.product.image)}
                            alt={item.product.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>

                        {/* Info details */}
                        <div className="ml-4 flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex justify-between text-sm font-medium text-stone-900">
                              <h3 className="font-serif line-clamp-1">{item.product.name}</h3>
                              <p className="ml-4 text-xs font-semibold">{formatPrice(price)}</p>
                            </div>
                            <p className="mt-1 text-xs text-stone-500">
                              Ukuran: {item.variant.size} &middot; Warna: {item.variant.color}
                            </p>
                            <p className="mt-0.5 text-[10px] text-stone-400 tracking-wider">
                              SKU: {item.variant.sku}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            {/* Quantity Adjuster */}
                            <div className="flex items-center border border-stone-200">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                                className="p-1 hover:bg-stone-50 text-stone-500 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2 text-xs font-medium text-stone-800">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                                className="p-1 hover:bg-stone-50 text-stone-500 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id, item.variant.id)}
                              className="text-stone-400 hover:text-stone-600 p-1 rounded hover:bg-stone-50 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && !isCheckingOut && (
              <div className="border-t border-stone-100 px-6 py-6 bg-stone-50/50">
                <div className="flex justify-between text-base font-medium text-stone-900">
                  <span className="font-serif">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-stone-400">Biaya pengiriman dan pajak dihitung saat pembayaran.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black transition-all duration-200"
                  >
                    <span>Lanjutkan ke Pembayaran</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
