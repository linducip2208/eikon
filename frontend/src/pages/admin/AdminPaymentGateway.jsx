import React, { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import {
  Loader2,
  Save,
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

// Pilihan gateway yang didukung — label di sini hanya untuk tampilan.
// Seluruh kredensial dibaca dari tabel settings (tanpa hardcode).
const GATEWAYS = [
  {
    id: "ipaymu",
    label: "iPaymu",
    description: "Virtual Account bank, QRIS, dan e-wallet.",
  },
  {
    id: "tripay",
    label: "Tripay",
    description: "Virtual Account bank, gerai retail, QRIS, dan e-wallet.",
  },
];

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

  // Gateway yang dipilih di form (akan menjadi gateway aktif setelah disimpan)
  const [selectedGateway, setSelectedGateway] = useState("ipaymu");
  // Gateway yang saat ini sudah tersimpan aktif di database
  const [savedGateway, setSavedGateway] = useState("ipaymu");

  const [siteUrl, setSiteUrl] = useState("");

  // --- iPaymu ---
  const [ipaymuEnv, setIpaymuEnv] = useState("sandbox");
  const [ipaymuVa, setIpaymuVa] = useState("");
  const [ipaymuApiKey, setIpaymuApiKey] = useState("");
  const [ipaymuNotifyUrl, setIpaymuNotifyUrl] = useState("");

  // --- Tripay ---
  const [tripayEnv, setTripayEnv] = useState("sandbox");
  const [tripayMerchantCode, setTripayMerchantCode] = useState("");
  const [tripayApiKey, setTripayApiKey] = useState("");
  const [tripayPrivateKey, setTripayPrivateKey] = useState("");
  const [tripayChannel, setTripayChannel] = useState("");
  const [tripayExpiredMinutes, setTripayExpiredMinutes] = useState("60");
  const [tripayCallbackUrl, setTripayCallbackUrl] = useState("");

  // Tampilkan/sembunyikan kunci rahasia
  const [showIpaymuKey, setShowIpaymuKey] = useState(false);
  const [showTripayApiKey, setShowTripayApiKey] = useState(false);
  const [showTripayPrivateKey, setShowTripayPrivateKey] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Endpoint admin mengembalikan seluruh settings termasuk kredensial payment gateway
      const res = await request.get(API_ENDPOINTS.SETTINGS.ADMIN);
      if (res.success && res.data) {
        const data = res.data;
        const activeGateway = data.active_payment_gateway === "tripay" ? "tripay" : "ipaymu";
        setSavedGateway(activeGateway);
        setSelectedGateway(activeGateway);
        setSiteUrl(data.site_url || window.location.origin);

        setIpaymuEnv((data.ipaymu_env || "sandbox").toLowerCase());
        setIpaymuVa(data.ipaymu_va || "");
        setIpaymuApiKey(data.ipaymu_api_key || "");
        setIpaymuNotifyUrl(data.ipaymu_notify_url || "");

        setTripayEnv((data.tripay_env || "sandbox").toLowerCase());
        setTripayMerchantCode(data.tripay_merchant_code || "");
        setTripayApiKey(data.tripay_api_key || "");
        setTripayPrivateKey(data.tripay_private_key || "");
        setTripayChannel(data.tripay_channel || "");
        setTripayExpiredMinutes(data.tripay_expired_minutes || "60");
        setTripayCallbackUrl(data.tripay_callback_url || "");
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan payment gateway:", error);
      toast.error("Gagal memuat pengaturan payment gateway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const gatewayConfigured = {
    ipaymu: Boolean(ipaymuVa.trim() && ipaymuApiKey.trim()),
    tripay: Boolean(
      tripayMerchantCode.trim() && tripayApiKey.trim() && tripayPrivateKey.trim() && tripayChannel.trim()
    ),
  };
  const gatewayEnv = { ipaymu: ipaymuEnv, tripay: tripayEnv };

  const selectedLabel = selectedGateway === "tripay" ? "Tripay" : "iPaymu";
  const selectedConfigured = gatewayConfigured[selectedGateway];
  const cleanSiteUrl = siteUrl.trim().replace(/\/+$/, "");
  const callbackPreview = `${cleanSiteUrl || window.location.origin}/api/${selectedGateway}/callback`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cleanSiteUrl && !/^https?:\/\//i.test(cleanSiteUrl)) {
      toast.error("URL Website Toko harus diawali http:// atau https://");
      return;
    }

    const payload = {
      active_payment_gateway: selectedGateway,
      site_url: cleanSiteUrl,
    };

    if (selectedGateway === "ipaymu") {
      const cleanVa = ipaymuVa.trim();
      const cleanKey = ipaymuApiKey.trim();
      const cleanNotifyUrl = ipaymuNotifyUrl.trim();

      if (!cleanVa || !cleanKey) {
        toast.error("Isi Nomor VA dan API Key iPaymu untuk mengaktifkan gateway ini.");
        return;
      }
      if (!/^[0-9]+$/.test(cleanVa)) {
        toast.error("Nomor VA iPaymu hanya boleh berisi angka.");
        return;
      }
      if (cleanNotifyUrl && !/^https?:\/\//i.test(cleanNotifyUrl)) {
        toast.error("URL Callback iPaymu harus diawali http:// atau https://");
        return;
      }

      payload.ipaymu_env = ipaymuEnv;
      payload.ipaymu_va = cleanVa;
      payload.ipaymu_api_key = cleanKey;
      payload.ipaymu_notify_url = cleanNotifyUrl;
    } else {
      const cleanMerchantCode = tripayMerchantCode.trim();
      const cleanApiKey = tripayApiKey.trim();
      const cleanPrivateKey = tripayPrivateKey.trim();
      const cleanChannel = tripayChannel.trim();
      const cleanCallbackUrl = tripayCallbackUrl.trim();

      if (!cleanMerchantCode || !cleanApiKey || !cleanPrivateKey || !cleanChannel) {
        toast.error("Lengkapi Merchant Code, API Key, Private Key, dan Channel Tripay untuk mengaktifkan gateway ini.");
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

      payload.tripay_env = tripayEnv;
      payload.tripay_merchant_code = cleanMerchantCode;
      payload.tripay_api_key = cleanApiKey;
      payload.tripay_private_key = cleanPrivateKey;
      payload.tripay_channel = cleanChannel;
      payload.tripay_expired_minutes = String(minutes);
      payload.tripay_callback_url = cleanCallbackUrl;
    }

    setSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan payment gateway...");
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, payload);
      if (res.success) {
        toast.success(`Gateway aktif: ${selectedLabel}.`, { id: toastId });
        fetchSettings();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan payment gateway.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-stone-400" />
            Payment Gateway
          </h3>
          <p className="text-xs text-stone-400">
            Pilih gateway yang aktif digunakan checkout, lalu lengkapi kredensialnya. Semua pengaturan tersimpan di
            database dan langsung aktif tanpa restart server.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ================= Pilih gateway ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GATEWAYS.map((gateway) => {
                const isSelected = selectedGateway === gateway.id;
                const isSaved = savedGateway === gateway.id;
                const isReady = gatewayConfigured[gateway.id];
                return (
                  <button
                    key={gateway.id}
                    type="button"
                    onClick={() => setSelectedGateway(gateway.id)}
                    className={`text-left border p-4 transition-all ${
                      isSelected
                        ? "border-stone-900 ring-1 ring-stone-900 bg-white"
                        : "border-stone-200 bg-white hover:border-stone-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base text-stone-900">{gateway.label}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-stone-900" />}
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400 leading-relaxed">{gateway.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="border border-stone-200 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-stone-500">
                        Mode: {gatewayEnv[gateway.id] === "production" ? "Production" : "Sandbox"}
                      </span>
                      <span
                        className={`border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                          isReady
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isReady ? "Siap digunakan" : "Belum lengkap"}
                      </span>
                      {isSaved && (
                        <span className="border border-stone-900 bg-stone-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                          Sedang aktif
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className={HINT_CLASS}>
              Kartu yang dipilih di atas menjadi gateway aktif untuk semua checkout baru setelah disimpan.
            </p>

            {/* ================= Status gateway terpilih ================= */}
            <div
              className={`flex items-center gap-3 border px-4 py-3 ${
                selectedConfigured
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              {selectedConfigured ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div className="text-xs leading-relaxed">
                {selectedConfigured ? (
                  <p className="text-emerald-800">
                    {selectedLabel} siap — mode{" "}
                    <span className="font-semibold">
                      {gatewayEnv[selectedGateway] === "production" ? "Production (live)" : "Sandbox (testing)"}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-amber-800">
                    Kredensial {selectedLabel} belum lengkap — checkout akan menampilkan pesan &quot;Payment gateway
                    belum dikonfigurasi&quot;.
                  </p>
                )}
              </div>
            </div>

            {/* ================= Form sesuai gateway terpilih ================= */}
            {selectedGateway === "ipaymu" ? (
              <>
                <div className="space-y-2">
                  <label className={LABEL_CLASS}>Mode iPaymu</label>
                  <select
                    value={ipaymuEnv}
                    onChange={(e) => setIpaymuEnv(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="sandbox">Sandbox (testing)</option>
                    <option value="production">Production (live)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={LABEL_CLASS}>Nomor VA iPaymu</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={INPUT_CLASS}
                    placeholder="cth. 1179001234567890"
                    value={ipaymuVa}
                    onChange={(e) => setIpaymuVa(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>

                <div className="space-y-2">
                  <label className={LABEL_CLASS}>API Key iPaymu</label>
                  <SecretInput
                    value={ipaymuApiKey}
                    onChange={setIpaymuApiKey}
                    placeholder="API Key dari dashboard iPaymu"
                    visible={showIpaymuKey}
                    onToggle={() => setShowIpaymuKey((prev) => !prev)}
                    title={showIpaymuKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                  />
                </div>

                <div className="space-y-2">
                  <label className={LABEL_CLASS}>URL Callback iPaymu (opsional)</label>
                  <input
                    type="url"
                    className={INPUT_CLASS}
                    placeholder={callbackPreview}
                    value={ipaymuNotifyUrl}
                    onChange={(e) => setIpaymuNotifyUrl(e.target.value)}
                  />
                  <p className={HINT_CLASS}>
                    Kosongkan untuk memakai otomatis:{" "}
                    <span className="font-mono font-medium text-stone-700 break-all">{callbackPreview}</span> —
                    daftarkan URL ini di dashboard iPaymu agar status pembayaran ter-update otomatis. Untuk testing di
                    komputer lokal, isi dengan URL tunnel (mis. ngrok).
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-150 p-4 text-[11px] text-stone-500 leading-relaxed space-y-1">
                  <p className="font-semibold text-stone-700">Cara mendapatkan kredensial iPaymu:</p>
                  <p>
                    1. Login ke dashboard iPaymu → menu <span className="font-medium">Integrasi</span>:{" "}
                    <span className="font-mono break-all">https://sandbox.ipaymu.com/integration</span> (sandbox) atau{" "}
                    <span className="font-mono break-all">https://my.ipaymu.com/integration</span> (production).
                  </p>
                  <p>
                    2. Salin <span className="font-medium">Nomor VA</span> dan <span className="font-medium">API Key</span>{" "}
                    ke kolom di atas, lalu simpan.
                  </p>
                  <p>3. Daftarkan URL Callback di dashboard iPaymu agar status pembayaran ter-update otomatis.</p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

            {/* ================= URL Website Toko (dipakai kedua gateway) ================= */}
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
                Dipakai kedua gateway untuk mengembalikan pembeli ke halaman status pesanan dan sebagai alamat callback
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
              <span>{saving ? "Menyimpan..." : "Simpan Payment Gateway"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
