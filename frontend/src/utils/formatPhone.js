// Format nomor telepon Indonesia untuk ditampilkan.
// Contoh: "6287865407492" -> "+62 878-6540-7492", "087753427090" -> "+62 877-5342-7090"
export function formatPhoneDisplay(value) {
  if (!value) return "";

  let digits = String(value).replace(/\D/g, "");
  if (!digits) return String(value).trim();

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  }
  if (!digits.startsWith("62")) {
    return `+${digits}`;
  }

  const local = digits.slice(2);
  const part1 = local.slice(0, 3);
  const part2 = local.slice(3, 7);
  const part3 = local.slice(7);

  return `+62 ${[part1, part2, part3].filter(Boolean).join("-")}`;
}

// Tautan WhatsApp siap pakai: toWhatsAppLink("087753427090", "Halo") -> https://wa.me/6287753427090?text=Halo
export function toWhatsAppLink(value, text) {
  const digits = String(value || "").replace(/\D/g, "").replace(/^0/, "62");
  if (!digits) return "";

  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
