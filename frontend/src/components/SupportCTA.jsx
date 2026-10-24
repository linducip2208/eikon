import { Mail, MessageCircle } from "lucide-react";
import { resolveBusinessInfo } from "../utils/businessInfo";
import { formatPhoneDisplay, toWhatsAppLink } from "../utils/formatPhone";

// Ajakan menghubungi customer service — dipakai di halaman FAQ & kebijakan.
export default function SupportCTA({ settings, title, description }) {
  const business = resolveBusinessInfo(settings);

  return (
    <div className="space-y-4 border border-stone-100 bg-white p-8 text-center md:p-10">
      <h3 className="font-serif text-xl font-light text-stone-900 md:text-2xl">
        {title || "Masih butuh bantuan?"}
      </h3>
      <p className="mx-auto max-w-xl text-sm font-light leading-relaxed text-stone-500">
        {description ||
          "Tim customer service kami siap membantu pertanyaan seputar produk, pesanan, pembayaran, maupun pengembalian dana."}
      </p>

      <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
        <a
          href={toWhatsAppLink(business.whatsappNumber, "Halo Eliteikon, saya butuh bantuan.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-stone-900 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-800"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp {formatPhoneDisplay(business.whatsappNumber)}
        </a>
        <a
          href={`mailto:${business.email}`}
          className="inline-flex items-center justify-center gap-2 border border-stone-300 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
        >
          <Mail className="h-4 w-4" />
          {business.email}
        </a>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-stone-400">
        Senin–Jumat 09.00–17.00 WIB &bull; Sabtu 09.00–15.00 WIB
      </p>
    </div>
  );
}
