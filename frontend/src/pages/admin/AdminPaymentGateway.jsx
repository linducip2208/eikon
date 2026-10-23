import React, { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import AdminPaypal from "./AdminPaypal";
import {
  Loader2,
  Save,
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

const INPUT_CLASS =
  "w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400";
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wider text-stone-500";
const HINT_CLASS = "text-[10px] text-stone-450 leading-relaxed";

// Input kunci rahasia (API Key / Private Key) dengan tombol lihat-sembunyikan
function SecretInput({ value, onChange, placeholder, visible, onToggle, title }) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        className={`${INPUT_CLASS} pr-11`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-700"
        title={title}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function AdminPaymentGateway() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState("tripay");

  // Saklar tampil di checkout (per gateway)
  const [tripayEnabled, setTripayEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [siteUrl, setSiteUrl] = useState("");

  // --- Tripay ---
  const [tripayEnv, setTripayEnv] = useState("sandbox");
  const [tripayMerchantCode, setTripayMerchantCode] = useState("");
  const [tripayApiKey, setTripayApiKey] = useState("");
  const [tripayPrivateKey, setTripayPrivateKey] = useState("");
  const [tripayChannel, setTripayChannel] = useState("");
  const [tripayExpiredMinutes, setTripayExpiredMinutes] = useState("60");
  const [tripayCallbackUrl, setTripayCallbackUrl] = useState("");

  // Tampilkan/sembunyikan kunci rahasia
  const [showTripayApiKey, setShowTripayApiKey] = useState(false);
  const [showTripayPrivateKey, setShowTripayPrivateKey] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Endpoint admin mengembalikan seluruh settings termasuk kredensial Tripay
      const res = await request.get(API_ENDPOINTS.SETTINGS.ADMIN);
      if (res.success && res.data) {
        const data = res.data;
        setSiteUrl(data.site_url || window.location.origin);

        setTripayEnabled((data.tripay_enabled ?? "1") !== "0");
        setPaypalEnabled((data.paypal_enabled ?? "1") !== "0");

        setTripayEnv((data.tripay_env || "sandbox").toLowerCase());
        setTripayMerchantCode(data.tripay_merchant_code || "");
        setTripayApiKey(data.tripay_api_key || "");
        setTripayPrivateKey(data.tripay_private_key || "");
        setTripayChannel(data.tripay_channel || "");
        setTripayExpiredMinutes(data.tripay_expired_minutes || "60");
        setTripayCallbackUrl(data.tripay_callback_url || "");
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan Tripay:", error);
      toast.error("Gagal memuat pengaturan Tripay.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isConfigured = Boolean(
    tripayMerchantCode.trim() && tripayApiKey.trim() && tripayPrivateKey.trim() && tripayChannel.trim()
  );

  const cleanSiteUrl = siteUrl.trim().replace(/\/+$/, "");
  const callbackPreview = `${cleanSiteUrl || window.location.origin}/api/tripay/callback`;

  const handleToggleGateway = async (key, nextValue) => {
    setToggling(true);
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, { [key]: nextValue ? "1" : "0" });
      if (res.success) {
        if (key === "tripay_enabled") setTripayEnabled(nextValue);
        else setPaypalEnabled(nextValue);
        toast.success(`Pembayaran ${key === "tripay_enabled" ? "Tripay" : "PayPal"} ${nextValue ? "diaktifkan" : "dinonaktifkan"}.`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah status gateway.");
    } finally {
      setToggling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cleanSiteUrl && !/^https?:\/\//i.test(cleanSiteUrl)) {
      toast.error("URL Website Toko harus diawali http:// atau https://");
      return;
    }

    const cleanMerchantCode = tripayMerchantCode.trim();
    const cleanApiKey = tripayApiKey.trim();
    const cleanPrivateKey = tripayPrivateKey.trim();
    const cleanChannel = tripayChannel.trim().toUpperCase();
    const cleanCallbackUrl = tripayCallbackUrl.trim();

    if (!cleanMerchantCode || !cleanApiKey || !cleanPrivateKey || !cleanChannel) {
      toast.error("Lengkapi Merchant Code, API Key, Private Key, dan Channel Tripay.");
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(cleanChannel)) {
      toast.error("Kode channel Tripay hanya boleh berisi huruf, angka, dan garis bawah (cth. QRIS, BRIVA).");
      return;
    }
    const minutes = parseInt(tripayExpiredMinutes, 10);
    if (Number.isNaN(minutes) || minutes < 10 || minutes > 4320) {
      toast.error("Masa berlaku pembayaran Tripay harus antara 10 dan 4320 menit.");
      return;
    }
    if (cleanCallbackUrl && !/^https?:\/\//i.test(cleanCallbackUrl)) {
      toast.error("URL Callback Tripay harus diawali http:// atau https://");
      return;
    }

    const payload = {
      site_url: cleanSiteUrl,
      tripay_env: tripayEnv,
      tripay_merchant_code: cleanMerchantCode,
      tripay_api_key: cleanApiKey,
      tripay_private_key: cleanPrivateKey,
      tripay_channel: cleanChannel,
      tripay_expired_minutes: String(minutes),
      tripay_callback_url: cleanCallbackUrl,
    };

    setSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan Tripay...");
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, payload);
      if (res.success) {
        toast.success("Pengaturan Tripay tersimpan.", { id: toastId });
        fetchSettings();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan Tripay.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Saklar gateway yang tampil di checkout */}
      <div className="bg-white border border-stone-150 p-5 shadow-xs space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tampil di Checkout</p>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 border border-stone-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-700 cursor-pointer hover:border-stone-400">
            <input
              type="checkbox"
              checked={tripayEnabled}
              disabled={toggling || loading}
              onChange={(e) => handleToggleGateway("tripay_enabled", e.target.checked)}
              className="h-4 w-4 accent-stone-900"
            />
            Tripay
          </label>
          <label className="inline-flex items-center gap-2 border border-stone-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-700 cursor-pointer hover:border-stone-400">
            <input
              type="checkbox"
              checked={paypalEnabled}
              disabled={toggling || loading}
              onChange={(e) => handleToggleGateway("paypal_enabled", e.target.checked)}
              className="h-4 w-4 accent-stone-900"
            />
            PayPal
          </label>
        </div>
        <p className="text-[10px] text-stone-400 leading-relaxed">
          Gateway yang aktif dan kredensialnya lengkap akan muncul sebagai pilihan di checkout. Opsi yang
          kredensialnya belum lengkap otomatis disembunyikan walau dicentang.
        </p>
      </div>

      {/* Sub-tab Tripay | PayPal */}
      <div className="flex items-center gap-1.5">
        {( [
          { value: "tripay", label: "Tripay" },
          { value: "paypal", label: "PayPal" },
        ] ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSubTab(tab.value)}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all ${
              subTab === tab.value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "tripay" && (
      <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-stone-400" />
            Tripay
          </h3>
          <p className="text-xs text-stone-400">
            Satu-satunya payment gateway lokal yang dipakai checkout (VA bank, gerai retail, QRIS, e-wallet).
            Semua pengaturan tersimpan di database dan langsung aktif tanpa restart server.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ================= Status ================= */}
            <div
              className={`flex items-center gap-3 border px-4 py-3 ${
                isConfigured
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              {isConfigured ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div className="text-xs leading-relaxed">
                {isConfigured ? (
                  <p className="text-emerald-800">
                    Tripay siap — mode{" "}
                    <span className="font-semibold">
                      {tripayEnv === "production" ? "Production (live)" : "Sandbox (testing)"}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-amber-800">
                    Kredensial Tripay belum lengkap — checkout akan menampilkan pesan &quot;Payment gateway
                    belum dikonfigurasi&quot;.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>Mode Tripay</label>
              <select
                value={tripayEnv}
                onChange={(e) => setTripayEnv(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="sandbox">Sandbox (testing)</option>
                <option value="production">Production (live)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>Merchant Code</label>
              <input
                type="text"
                className={INPUT_CLASS}
                placeholder="cth. T0001"
                value={tripayMerchantCode}
                onChange={(e) => setTripayMerchantCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>API Key Tripay</label>
              <SecretInput
                value={tripayApiKey}
                onChange={setTripayApiKey}
                placeholder="API Key dari dashboard Tripay"
                visible={showTripayApiKey}
                onToggle={() => setShowTripayApiKey((prev) => !prev)}
                title={showTripayApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
              />
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>Private Key Tripay</label>
              <SecretInput
                value={tripayPrivateKey}
                onChange={setTripayPrivateKey}
                placeholder="Private Key dari dashboard Tripay"
                visible={showTripayPrivateKey}
                onToggle={() => setShowTripayPrivateKey((prev) => !prev)}
                title={showTripayPrivateKey ? "Sembunyikan Private Key" : "Tampilkan Private Key"}
              />
              <p className={HINT_CLASS}>
                Private Key dipakai untuk tanda tangan transaksi dan verifikasi callback — jangan dibagikan.
              </p>
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>Channel Pembayaran</label>
              <input
                type="text"
                className={INPUT_CLASS}
                placeholder="cth. QRIS, BRIVA, BNIVA, BCAVA, ALFAMART"
                value={tripayChannel}
                onChange={(e) => setTripayChannel(e.target.value.toUpperCase())}
              />
              <p className={HINT_CLASS}>
                Kode channel yang aktif di akun Tripay Anda (VA bank, gerai retail, QRIS, e-wallet). Contoh: QRIS,
                BRIVA, BNIVA, BCAVA, MANDIRIVA, ALFAMART, INDOMARET.
              </p>
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>Masa Berlaku Pembayaran (menit)</label>
              <input
                type="number"
                min="10"
                max="4320"
                className={INPUT_CLASS}
                value={tripayExpiredMinutes}
                onChange={(e) => setTripayExpiredMinutes(e.target.value)}
              />
              <p className={HINT_CLASS}>
                Sesuaikan dengan batas channel Tripay — mis. QRIS maksimal 60 menit, Virtual Account bisa lebih lama
                (hingga 4320 menit / 3 hari).
              </p>
            </div>

            <div className="space-y-2">
              <label className={LABEL_CLASS}>URL Callback Tripay (opsional)</label>
              <input
                type="url"
                className={INPUT_CLASS}
                placeholder={callbackPreview}
                value={tripayCallbackUrl}
                onChange={(e) => setTripayCallbackUrl(e.target.value)}
              />
              <p className={HINT_CLASS}>
                Kosongkan untuk memakai otomatis:{" "}
                <span className="font-mono font-medium text-stone-700 break-all">{callbackPreview}</span> —
                daftarkan URL ini di dashboard Tripay agar status pembayaran ter-update otomatis.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-150 p-4 text-[11px] text-stone-500 leading-relaxed space-y-1">
              <p className="font-semibold text-stone-700">Cara mendapatkan kredensial Tripay:</p>
              <p>
                1. Login ke dashboard Tripay:{" "}
                <span className="font-mono break-all">https://tripay.co.id/member</span>.
              </p>
              <p>
                2. Mode <span className="font-medium">Sandbox</span>: menu API &amp; Integrasi → Simulator → Merchant
                → Detail. Mode <span className="font-medium">Production</span>: menu Merchant → Opsi → Edit.
              </p>
              <p>
                3. Salin <span className="font-medium">Merchant Code</span>,{" "}
                <span className="font-medium">API Key</span>, dan <span className="font-medium">Private Key</span> ke
                kolom di atas.
              </p>
              <p>
                4. Pastikan channel pembayaran (mis. QRIS/BRIVA) sudah aktif, lalu daftarkan URL Callback agar status
                pembayaran ter-update otomatis.
              </p>
            </div>

            {/* ================= URL Website Toko ================= */}
            <div className="h-[1px] w-full bg-stone-100" />

            <div className="space-y-2">
              <label className={LABEL_CLASS}>URL Website Toko</label>
              <input
                type="url"
                className={INPUT_CLASS}
                placeholder="cth. https://tokosaya.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
              <p className={HINT_CLASS}>
                Dipakai Tripay untuk mengembalikan pembeli ke halaman status pesanan dan sebagai alamat callback
                default: <span className="font-mono font-medium text-stone-700 break-all">{callbackPreview}</span>
              </p>
            </div>

            <div className="h-[1px] w-full bg-stone-100" />

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Menyimpan..." : "Simpan Tripay"}</span>
            </button>
          </form>
        )}
      </div>
      )}

      {subTab === "paypal" && <AdminPaypal />}
    </div>
  );
}
