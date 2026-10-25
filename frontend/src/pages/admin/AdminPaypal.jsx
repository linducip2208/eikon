import { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { api } from "../../utils/api";
import { API_ENDPOINTS } from "../../utils/endpoints";
import {
  Loader2,
  Save,
  Wallet,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  PlugZap,
} from "lucide-react";
import toast from "react-hot-toast";

const INPUT_CLASS =
  "w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400";
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wider text-stone-500";
const HINT_CLASS = "text-[10px] text-stone-450 leading-relaxed";

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

export default function AdminPaypal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [siteUrl, setSiteUrl] = useState("");

  const [paypalEnv, setPaypalEnv] = useState("sandbox");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [paypalWebhookId, setPaypalWebhookId] = useState("");
  const [paypalRate, setPaypalRate] = useState("16000");

  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.ADMIN);
      if (res.success && res.data) {
        const data = res.data;
        setSiteUrl(data.site_url || window.location.origin);

        setPaypalEnv((data.paypal_env || "sandbox").toLowerCase());
        setPaypalClientId(data.paypal_client_id || "");
        setPaypalSecret(data.paypal_secret || "");
        setPaypalWebhookId(data.paypal_webhook_id || "");
        setPaypalRate(data.paypal_rate || "16000");
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan PayPal:", error);
      toast.error("Gagal memuat pengaturan PayPal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isConfigured = Boolean(paypalClientId.trim() && paypalSecret.trim());

  const cleanSiteUrl = siteUrl.trim().replace(/\/+$/, "");
  const webhookPreview = `${cleanSiteUrl || window.location.origin}/api/paypal/webhook`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cleanSiteUrl && !/^https?:\/\//i.test(cleanSiteUrl)) {
      toast.error("URL Website Toko harus diawali http:// atau https://");
      return;
    }

    const cleanClientId = paypalClientId.trim();
    const cleanSecret = paypalSecret.trim();
    const cleanWebhookId = paypalWebhookId.trim();

    if (!cleanClientId || !cleanSecret) {
      toast.error("Lengkapi Client ID dan Secret PayPal.");
      return;
    }
    const rate = Number(paypalRate);
    if (!Number.isFinite(rate) || rate < 500 || rate > 1000000) {
      toast.error("Kurs PayPal (IDR per 1 USD) harus antara 500 dan 1000000.");
      return;
    }

    const payload = {
      site_url: cleanSiteUrl,
      paypal_env: paypalEnv,
      paypal_client_id: cleanClientId,
      paypal_secret: cleanSecret,
      paypal_webhook_id: cleanWebhookId,
      paypal_rate: String(rate),
    };

    setSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan PayPal...");
    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, payload);
      if (res.success) {
        toast.success("Pengaturan PayPal tersimpan.", { id: toastId });
        fetchSettings();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan PayPal.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const toastId = toast.loading("Menguji koneksi ke PayPal...");
    try {
      // Pakai `api` langsung agar tidak double-toast (request.* selalu toast error sendiri)
      const { data } = await api.post(API_ENDPOINTS.PAYMENT.PAYPAL_TEST, {});
      if (data && data.success) {
        toast.success(data.message || "Koneksi PayPal berhasil.", { id: toastId });
      } else {
        toast.error((data && data.message) || "Koneksi PayPal gagal.", { id: toastId });
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message || error?.message || "Koneksi PayPal gagal. Cek Admin > Log untuk detail env.";
      toast.error(msg, { id: toastId, duration: 6000 });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest flex items-center gap-2">
          <Wallet className="h-5 w-5 text-stone-400" />
          PayPal
        </h3>
        <p className="text-xs text-stone-400">
          Pembayaran kartu &amp; saldo PayPal (dalam USD — nominal IDR dikonversi otomatis memakai kurs di bawah).
          Semua pengaturan tersimpan di database dan langsung aktif tanpa restart server.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  PayPal siap — mode{" "}
                  <span className="font-semibold">
                    {paypalEnv === "production" ? "Production (live)" : "Sandbox (testing)"}
                  </span>
                  .
                </p>
              ) : (
                <p className="text-amber-800">
                  Client ID / Secret PayPal belum lengkap — opsi PayPal tidak tampil di checkout.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className={LABEL_CLASS}>Mode PayPal</label>
            <select
              value={paypalEnv}
              onChange={(e) => setPaypalEnv(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="sandbox">Sandbox (testing)</option>
              <option value="production">Production (live)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={LABEL_CLASS}>Client ID PayPal</label>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="Client ID dari developer.paypal.com"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={LABEL_CLASS}>Secret PayPal</label>
            <SecretInput
              value={paypalSecret}
              onChange={setPaypalSecret}
              placeholder="Secret dari developer.paypal.com"
              visible={showSecret}
              onToggle={() => setShowSecret((prev) => !prev)}
              title={showSecret ? "Sembunyikan Secret" : "Tampilkan Secret"}
            />
            <p className={HINT_CLASS}>
              Secret dipakai otentikasi server ke PayPal — jangan dibagikan.
            </p>
          </div>

          <div className="space-y-2">
            <label className={LABEL_CLASS}>Kurs IDR → USD (Rp per 1 USD)</label>
            <input
              type="number"
              min="500"
              max="1000000"
              className={INPUT_CLASS}
              value={paypalRate}
              onChange={(e) => setPaypalRate(e.target.value)}
            />
            <p className={HINT_CLASS}>
              PayPal tidak mendukung IDR, jadi total belanja dikonversi ke USD memakai kurs ini saat membuat
              pembayaran (dibulatkan ke atas per sen agar tidak kurang bayar).
            </p>
          </div>

          <div className="space-y-2">
            <label className={LABEL_CLASS}>Webhook ID PayPal (opsional)</label>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="cth. 5MK7..."
              value={paypalWebhookId}
              onChange={(e) => setPaypalWebhookId(e.target.value)}
            />
            <p className={HINT_CLASS}>
              Daftarkan webhook di dashboard PayPal ke{" "}
              <span className="font-mono font-medium text-stone-700 break-all">{webhookPreview}</span> (event{" "}
              <span className="font-mono">CHECKOUT.ORDER.APPROVED</span> dan{" "}
              <span className="font-mono">PAYMENT.CAPTURE.COMPLETED</span>), lalu isi Webhook ID-nya di sini agar
              signature webhook terverifikasi. Kosongkan pun tetap aman: server membuktikan event dengan membaca
              order langsung dari API PayPal.
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-150 p-4 text-[11px] text-stone-500 leading-relaxed space-y-1">
            <p className="font-semibold text-stone-700">Cara mendapatkan kredensial PayPal:</p>
            <p>
              1. Login ke <span className="font-mono break-all">https://developer.paypal.com</span> → Dashboard →
              Apps &amp; Credentials.
            </p>
            <p>
              2. Mode <span className="font-medium">Sandbox</span>: pakai akun sandbox untuk testing. Mode{" "}
              <span className="font-medium">Production</span>: buat Live app di akun bisnis PayPal.
            </p>
            <p>
              3. Salin <span className="font-medium">Client ID</span> dan <span className="font-medium">Secret</span>{" "}
              ke kolom di atas.
            </p>
            <p>
              4. (Opsional) Tambahkan webhook + salin Webhook ID agar status ter-update otomatis walau pembeli
              menutup browser setelah membayar.
            </p>
          </div>

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
              Dipakai PayPal untuk mengembalikan pembeli ke halaman status pesanan:{" "}
              <span className="font-mono font-medium text-stone-700 break-all">
                {cleanSiteUrl || window.location.origin}/order/...?paypal=return
              </span>
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
            <span>{saving ? "Menyimpan..." : "Simpan PayPal"}</span>
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving || !isConfigured}
            title={!isConfigured ? "Lengkapi dan simpan Client ID & Secret dulu" : "Uji otentikasi ke PayPal"}
            className="w-full flex items-center justify-center space-x-2 border border-stone-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-all duration-200"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlugZap className="h-4 w-4" />
            )}
            <span>{testing ? "Menguji..." : "Test Koneksi PayPal"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
