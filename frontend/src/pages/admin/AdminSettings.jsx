import { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import {
  Loader2,
  Save,
  Building2,
  User,
  KeyRound,
  Eye,
  EyeOff,
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

  // --- Akun admin ---
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.AUTH.PROFILE);
      if (res.success && res.user) {
        setProfileName(res.user.name || "");
        setProfileEmail(res.user.email || "");
      }
    } catch (error) {
      console.error("Gagal memuat profil admin:", error);
    }
  };

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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const cleanName = profileName.trim();
    const cleanEmail = profileEmail.trim();
    if (!cleanName) {
      toast.error("Nama wajib diisi.");
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Masukkan alamat email yang valid.");
      return;
    }

    setProfileSaving(true);
    const toastId = toast.loading("Menyimpan profil admin...");
    try {
      const res = await request.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        name: cleanName,
        email: cleanEmail,
      });
      if (res.success) {
        toast.success("Profil admin berhasil diperbarui. Login berikutnya memakai email baru.", { id: toastId });
        fetchProfile();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan profil admin.", { id: toastId });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!pwCurrent || !pwNew || !pwConfirm) {
      toast.error("Isi password lama, password baru, dan konfirmasinya.");
      return;
    }
    if (pwNew.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error("Konfirmasi password baru tidak sama.");
      return;
    }

    setPwSaving(true);
    const toastId = toast.loading("Mengubah password...");
    try {
      const res = await request.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: pwCurrent,
        new_password: pwNew,
      });
      if (res.success) {
        toast.success("Password berhasil diubah. Silakan login ulang.", { id: toastId });
        setPwCurrent("");
        setPwNew("");
        setPwConfirm("");
        // Paksa login ulang agar sesi memakai kredensial baru
        setTimeout(() => {
          localStorage.removeItem("elkon_token");
          window.location.href = "/login";
        }, 1200);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengubah password.", { id: toastId });
    } finally {
      setPwSaving(false);
    }
  };

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

      {/* ================= Akun Admin ================= */}
      <div className="bg-white border border-stone-150 p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <User className="h-5 w-5 text-stone-400" />
            Akun Admin
          </h3>
          <p className="text-xs text-stone-400">
            Ubah nama, email login, dan password admin. Setelah ganti password Anda akan diminta login ulang.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Nama Admin
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                  placeholder="Nama admin"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Email Login
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                  placeholder="admin@tokosaya.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
              >
                {profileSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{profileSaving ? "Menyimpan..." : "Simpan Profil"}</span>
              </button>
            </form>

            <div className="h-[1px] w-full bg-stone-100" />

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-stone-400" />
                  Ganti Password
                </h4>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Password Lama
                </label>
                <div className="relative">
                  <input
                    type={showPwCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 pr-11 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                    placeholder="Password saat ini"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwCurrent((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-700"
                  >
                    {showPwCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Password Baru (min. 8 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showPwNew ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 pr-11 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                    placeholder="Password baru"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwNew((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-700"
                  >
                    {showPwNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                  placeholder="Ulangi password baru"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={pwSaving}
                className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
              >
                {pwSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                <span>{pwSaving ? "Menyimpan..." : "Ganti Password"}</span>
              </button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}
