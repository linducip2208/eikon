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
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DEFAULT_PREORDER_POLICY,
  parsePreorderPolicy,
  serializePreorderPolicy,
} from "../../utils/preorderPolicy";

export default function AdminSettings({ onActionSuccess }) {
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [whatsappNumberSetting, setWhatsappNumberSetting] = useState("");
  const [preorderPolicyItems, setPreorderPolicyItems] = useState(
    DEFAULT_PREORDER_POLICY.items.join("\n")
  );
  const [preorderPolicyDisclaimer, setPreorderPolicyDisclaimer] = useState(
    DEFAULT_PREORDER_POLICY.disclaimer
  );

  // --- Informasi bisnis (kontak & alamat) ---
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAdminPhone, setBusinessAdminPhone] = useState("");
  const [businessSaving, setBusinessSaving] = useState(false);

  // --- Payment gateway (iPaymu) ---
  const [paymentEnv, setPaymentEnv] = useState("sandbox");
  const [paymentVa, setPaymentVa] = useState("");
  const [paymentApiKey, setPaymentApiKey] = useState("");
  const [paymentNotifyUrl, setPaymentNotifyUrl] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Endpoint admin mengembalikan seluruh settings termasuk kredensial payment gateway
      const res = await request.get(API_ENDPOINTS.SETTINGS.ADMIN);
      if (res.success && res.data) {
        setWhatsappNumberSetting(res.data.whatsapp_number || "");
        const policy = parsePreorderPolicy(res.data);
        setPreorderPolicyItems(policy.items.join("\n"));
        setPreorderPolicyDisclaimer(policy.disclaimer);
        setBusinessAddress(res.data.business_address || "");
        setBusinessEmail(res.data.business_email || "");
        setBusinessAdminPhone(res.data.business_phone_admin || "");
        setPaymentEnv((res.data.ipaymu_env || "sandbox").toLowerCase());
        setPaymentVa(res.data.ipaymu_va || "");
        setPaymentApiKey(res.data.ipaymu_api_key || "");
        setPaymentNotifyUrl(res.data.ipaymu_notify_url || "");
        setSiteUrl(res.data.site_url || window.location.origin);
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
      toast.error("Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();

    if (!whatsappNumberSetting.trim()) {
      toast.error("Nomor WhatsApp wajib diisi.");
      return;
    }

    if (!preorderPolicyItems.trim()) {
      toast.error("Informasi pre-order wajib diisi.");
      return;
    }

    const cleanNum = whatsappNumberSetting.trim().replace(/\D/g, "");
    if (cleanNum.length < 9) {
      toast.error("Silakan masukkan nomor WhatsApp yang valid (hanya angka).");
      return;
    }

    setModalLoading(true);
    const toastId = toast.loading("Menyimpan pengaturan...");
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, {
        whatsapp_number: cleanNum,
        preorder_policy: serializePreorderPolicy({
          items: preorderPolicyItems,
          disclaimer: preorderPolicyDisclaimer,
        }),
      });
      if (res.success) {
        toast.success("Pengaturan berhasil disimpan.", { id: toastId });
        fetchSettings();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan.", { id: toastId });
    } finally {
      setModalLoading(false);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();

    const cleanAddress = businessAddress.trim();
    const cleanEmail = businessEmail.trim();
    const cleanAdminPhone = businessAdminPhone.trim();

    if (!cleanAddress) {
      toast.error("Alamat bisnis wajib diisi (ditampilkan di footer & halaman kontak).");
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Masukkan alamat email bisnis yang valid.");
      return;
    }

    setBusinessSaving(true);
    const toastId = toast.loading("Menyimpan informasi bisnis...");
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, {
        business_address: cleanAddress,
        business_email: cleanEmail,
        business_phone_admin: cleanAdminPhone,
      });
      if (res.success) {
        toast.success("Informasi bisnis berhasil disimpan.", { id: toastId });
        fetchSettings();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan informasi bisnis.", { id: toastId });
    } finally {
      setBusinessSaving(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    const cleanVa = paymentVa.trim();
    const cleanKey = paymentApiKey.trim();
    const cleanSiteUrl = siteUrl.trim().replace(/\/+$/, "");
    const cleanNotifyUrl = paymentNotifyUrl.trim();

    if ((cleanVa && !cleanKey) || (!cleanVa && cleanKey)) {
      toast.error("Isi Nomor VA dan API Key sekaligus (kosongkan keduanya untuk menonaktifkan).");
      return;
    }
    if (cleanVa && !/^[0-9]+$/.test(cleanVa)) {
      toast.error("Nomor VA iPaymu hanya boleh berisi angka.");
      return;
    }
    if (cleanSiteUrl && !/^https?:\/\//i.test(cleanSiteUrl)) {
      toast.error("URL Website Toko harus diawali http:// atau https://");
      return;
    }
    if (cleanNotifyUrl && !/^https?:\/\//i.test(cleanNotifyUrl)) {
      toast.error("URL Callback harus diawali http:// atau https://");
      return;
    }

    setPaymentSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan payment gateway...");
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, {
        ipaymu_env: paymentEnv,
        ipaymu_va: cleanVa,
        ipaymu_api_key: cleanKey,
        ipaymu_notify_url: cleanNotifyUrl,
        site_url: cleanSiteUrl,
      });
      if (res.success) {
        toast.success("Pengaturan payment gateway berhasil disimpan.", { id: toastId });
        fetchSettings();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan payment gateway.", { id: toastId });
    } finally {
      setPaymentSaving(false);
    }
  };

  const isPaymentConfigured = Boolean(paymentVa.trim() && paymentApiKey.trim());
  const callbackPreview = `${
    siteUrl.trim().replace(/\/+$/, "") || window.location.origin
  }/api/ipaymu/callback`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ================= Pengaturan Global Toko ================= */}
      <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest">Pengaturan Global Toko</h3>
          <p className="text-xs text-stone-400">Sesuaikan data operasional, kanal kontak, dan kebijakan pre-order.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Nomor WhatsApp Admin (Checkout &amp; Floating WA)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                  placeholder="cth. 6287865407492"
                  value={whatsappNumberSetting}
                  onChange={(e) => setWhatsappNumberSetting(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-stone-450 leading-relaxed">
                Masukkan nomor WhatsApp lengkap menggunakan kode negara di bagian depan (tanpa tanda &apos;+&apos; atau spasi), contoh: <span className="font-mono font-medium text-stone-700">6287865407492</span> untuk nomor Indonesia.
              </p>
            </div>

            <div className="h-[1px] w-full bg-stone-100" />

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Informasi Pre-Order
              </label>
              <textarea
                required
                rows="8"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400 resize-y"
                placeholder="Satu poin kebijakan per baris"
                value={preorderPolicyItems}
                onChange={(e) => setPreorderPolicyItems(e.target.value)}
              />
              <p className="text-[10px] text-stone-450 leading-relaxed">
                Tulis setiap poin kebijakan pre-order pada baris terpisah. Teks ini ditampilkan di halaman detail produk pre-order.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Disclaimer Pre-Order
              </label>
              <input
                type="text"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. By placing an order, you agree to our Pre-Order Policy."
                value={preorderPolicyDisclaimer}
                onChange={(e) => setPreorderPolicyDisclaimer(e.target.value)}
              />
            </div>

            <div className="h-[1px] w-full bg-stone-100" />

            <button
              type="submit"
              disabled={modalLoading}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              {modalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{modalLoading ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </button>
          </form>
        )}
      </div>

      {/* ================= Informasi Bisnis ================= */}
      <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="h-5 w-5 text-stone-400" />
            Informasi Bisnis
          </h3>
          <p className="text-xs text-stone-400">
            Alamat dan kontak bisnis yang ditampilkan di footer, halaman Kontak, serta halaman kebijakan — bagian yang diverifikasi saat pengajuan payment gateway.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <form onSubmit={handleBusinessSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Alamat Bisnis (ditampilkan publik)
              </label>
              <textarea
                required
                rows="3"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400 resize-y"
                placeholder={"cth. Jl. Contoh Raya No. 123, Kel. Sukamaju, Kec. Cikarang Utara,\nKab. Bekasi, Jawa Barat 17530"}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
              />
              <p className="text-[10px] text-stone-450 leading-relaxed">
                Gunakan alamat lengkap bisnis/office (jalan, nomor, kelurahan, kecamatan, kota, kode pos). Alamat ini harus sama dengan data bisnis Anda.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Email Bisnis
              </label>
              <input
                type="email"
                required
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. tokosaya@gmail.com"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                No. Telepon Admin (opsional)
              </label>
              <input
                type="tel"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. 087753427090"
                value={businessAdminPhone}
                onChange={(e) => setBusinessAdminPhone(e.target.value)}
              />
              <p className="text-[10px] text-stone-450 leading-relaxed">
                Nomor WhatsApp Office diatur pada bagian Pengaturan Global Toko di atas.
              </p>
            </div>

            <div className="h-[1px] w-full bg-stone-100" />

            <button
              type="submit"
              disabled={businessSaving}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              {businessSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{businessSaving ? "Menyimpan..." : "Simpan Informasi Bisnis"}</span>
            </button>
          </form>
        )}
      </div>

      {/* ================= Payment Gateway ================= */}
      <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-stone-400" />
            Payment Gateway
          </h3>
          <p className="text-xs text-stone-400">
            Hubungkan toko dengan iPaymu untuk menerima pembayaran (VA bank, QRIS, e-wallet). Pengaturan tersimpan di database dan langsung aktif tanpa restart server.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Status koneksi */}
            <div
              className={`flex items-center gap-3 border px-4 py-3 ${
                isPaymentConfigured
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              {isPaymentConfigured ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div className="text-xs leading-relaxed">
                {isPaymentConfigured ? (
                  <p className="text-emerald-800">
                    Aktif — mode{" "}
                    <span className="font-semibold">
                      {paymentEnv === "production" ? "Production (live)" : "Sandbox (testing)"}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-amber-800">
                    Belum dikonfigurasi — tombol checkout akan menampilkan pesan &quot;Payment gateway belum dikonfigurasi&quot;.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">Mode iPaymu</label>
              <select
                value={paymentEnv}
                onChange={(e) => setPaymentEnv(e.target.value)}
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all"
              >
                <option value="sandbox">Sandbox (testing)</option>
                <option value="production">Production (live)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">Nomor VA iPaymu</label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. 1179001234567890"
                value={paymentVa}
                onChange={(e) => setPaymentVa(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">API Key iPaymu</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 pr-11 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                  placeholder="API Key dari dashboard iPaymu"
                  value={paymentApiKey}
                  onChange={(e) => setPaymentApiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-700"
                  title={showApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="h-[1px] w-full bg-stone-100" />

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">URL Website Toko</label>
              <input
                type="url"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. https://tokosaya.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
              <p className="text-[10px] text-stone-450 leading-relaxed">
                Dipakai untuk mengembalikan pembeli ke halaman status pesanan setelah pembayaran.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">URL Callback (opsional)</label>
              <input
                type="url"
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder={callbackPreview}
                value={paymentNotifyUrl}
                onChange={(e) => setPaymentNotifyUrl(e.target.value)}
              />
              <p className="text-[10px] text-stone-450 leading-relaxed">
                Kosongkan untuk memakai otomatis: <span className="font-mono font-medium text-stone-700 break-all">{callbackPreview}</span> — daftarkan URL ini di dashboard iPaymu agar status pembayaran ter-update otomatis. Untuk testing di komputer lokal, isi dengan URL tunnel (mis. ngrok).
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-150 p-4 text-[11px] text-stone-500 leading-relaxed space-y-1">
              <p className="font-semibold text-stone-700">Cara mendapatkan kredensial:</p>
              <p>
                1. Login ke dashboard iPaymu → menu <span className="font-medium">Integrasi</span>:{" "}
                <span className="font-mono break-all">https://sandbox.ipaymu.com/integration</span> (sandbox) atau{" "}
                <span className="font-mono break-all">https://my.ipaymu.com/integration</span> (production).
              </p>
              <p>
                2. Salin <span className="font-medium">Nomor VA</span> dan <span className="font-medium">API Key</span> ke kolom di atas, lalu simpan.
              </p>
              <p>3. Daftarkan URL Callback di dashboard iPaymu agar status pembayaran ter-update otomatis.</p>
            </div>

            <div className="h-[1px] w-full bg-stone-100" />

            <button
              type="submit"
              disabled={paymentSaving}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              {paymentSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{paymentSaving ? "Menyimpan..." : "Simpan Payment Gateway"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
