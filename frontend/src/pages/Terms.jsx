import React from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import PolicySections from "../components/PolicySections";
import SupportCTA from "../components/SupportCTA";
import { POLICY_LAST_UPDATED, TERMS_SECTIONS } from "../data/legal";

export default function Terms({ settings }) {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <PageHero
        eyebrow="Kebijakan"
        title="Syarat & Ketentuan"
        subtitle="Ketentuan penggunaan situs dan layanan belanja Eliteikon, termasuk pembayaran, pengiriman, dan pengembalian dana."
      />

      <p className="text-[10px] uppercase tracking-wider text-stone-400">
        Terakhir diperbarui: {POLICY_LAST_UPDATED}
      </p>

      <div className="border border-stone-100 bg-white p-8 shadow-sm md:p-12">
        <PolicySections sections={TERMS_SECTIONS} />

        <p className="mt-10 border-t border-stone-100 pt-6 text-sm font-light leading-relaxed text-stone-600">
          Baca juga{" "}
          <Link to="/refund-policy" className="font-medium text-stone-900 underline underline-offset-4">
            Kebijakan Refund
          </Link>
          ,{" "}
          <Link to="/privacy-policy" className="font-medium text-stone-900 underline underline-offset-4">
            Kebijakan Privasi
          </Link>
          , dan{" "}
          <Link to="/faq" className="font-medium text-stone-900 underline underline-offset-4">
            FAQ
          </Link>{" "}
          kami untuk informasi lebih lengkap.
        </p>
      </div>

      <SupportCTA settings={settings} />
    </div>
  );
}
