import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { resolveBusinessInfo } from "../utils/businessInfo";
import { formatPhoneDisplay, toWhatsAppLink } from "../utils/formatPhone";

const PAYMENT_METHODS = ["Virtual Account", "QRIS", "E-Wallet"];

export default function Footer({ settings }) {
  const business = resolveBusinessInfo(settings);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Baris utama */}
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <img src="/logo.png" alt="Eliteikon" className="h-9 w-auto" />
            <p className="text-xs font-light leading-relaxed text-stone-500">
              Fashion premium dengan pendekatan personal. Elegance beyond appearance, confidence beyond trends.
            </p>
          </div>

          {/* Navigasi */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">Navigasi</h4>
            <ul className="space-y-2.5 text-xs font-light text-stone-600">
              <li>
                <Link to="/" className="transition-colors hover:text-stone-900">Beranda</Link>
              </li>
              <li>
                <Link to="/shop" className="transition-colors hover:text-stone-900">Belanja</Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-stone-900">Hubungi Kami</Link>
              </li>
            </ul>
          </div>

          {/* Bantuan & Kebijakan */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              Bantuan &amp; Kebijakan
            </h4>
            <ul className="space-y-2.5 text-xs font-light text-stone-600">
              <li>
                <Link to="/faq" className="transition-colors hover:text-stone-900">FAQ</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="transition-colors hover:text-stone-900">Kebijakan Refund</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="transition-colors hover:text-stone-900">Kebijakan Privasi</Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors hover:text-stone-900">Syarat &amp; Ketentuan</Link>
              </li>
            </ul>
          </div>

          {/* Kontak & Alamat */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              Kontak &amp; Alamat
            </h4>
            <ul className="space-y-3 text-xs font-light text-stone-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
                <span className="leading-relaxed">{business.address}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
                <span>
                  <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Office
                  </span>
                  <a
                    href={toWhatsAppLink(business.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-stone-900"
                  >
                    {formatPhoneDisplay(business.whatsappNumber)}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
                <span>
                  <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                    Admin
                  </span>
                  <a href={`tel:+${business.adminPhone.replace(/\D/g, "").replace(/^0/, "62")}`} className="transition-colors hover:text-stone-900">
                    {formatPhoneDisplay(business.adminPhone)}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
                <a href={`mailto:${business.email}`} className="transition-colors hover:text-stone-900">
                  {business.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Strip pembayaran */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-100 py-6 md:flex-row">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Pembayaran aman &amp; terverifikasi via iPaymu
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="border border-stone-200 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.15em] text-stone-500"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-stone-100 py-6 text-center">
          <p className="text-[10px] tracking-wider text-stone-400">
            &copy; {year} ELITEIKON. HAK CIPTA DILINDUNGI. ELEGANCE BEYOND APPEARANCE, CONFIDENCE BEYOND TRENDS.
          </p>
        </div>
      </div>
    </footer>
  );
}
