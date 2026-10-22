// Informasi bisnis (kontak & alamat) yang tampil di footer, halaman kontak,
// dan halaman kebijakan. Nilai diambil dari setting admin (tabel settings);
// nilai default dipakai sebagai fallback bila setting belum diisi.
export const BUSINESS_DEFAULTS = {
  address: "Jl. Kasuari 1 No. 167, Jaticempaka, Pondok Gede, Bekasi",
  email: "ekonindonesiajaya@gmail.com",
  adminPhone: "087753427090",
  whatsappNumber: "6287865407492",
  website: "https://www.eliteikon.com",
  instagram: "@eliteikon_",
};

export function resolveBusinessInfo(settings = {}) {
  return {
    address: String(settings.business_address || "").trim() || BUSINESS_DEFAULTS.address,
    email: String(settings.business_email || "").trim() || BUSINESS_DEFAULTS.email,
    adminPhone: String(settings.business_phone_admin || "").trim() || BUSINESS_DEFAULTS.adminPhone,
    whatsappNumber:
      String(settings.whatsapp_number || "").replace(/\D/g, "") || BUSINESS_DEFAULTS.whatsappNumber,
    website: BUSINESS_DEFAULTS.website,
    instagram: BUSINESS_DEFAULTS.instagram,
  };
}
