import React from "react";
import PageHero from "../components/PageHero";
import PolicySections from "../components/PolicySections";
import SupportCTA from "../components/SupportCTA";
import { POLICY_LAST_UPDATED, REFUND_SECTIONS } from "../data/legal";

export default function RefundPolicy({ settings }) {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <PageHero
        eyebrow="Kebijakan"
        title="Kebijakan Refund"
        subtitle="Ketentuan pembatalan pesanan, penukaran produk, dan pengembalian dana untuk seluruh transaksi di Eliteikon."
      />

      <p className="text-[10px] uppercase tracking-wider text-stone-400">
        Terakhir diperbarui: {POLICY_LAST_UPDATED}
      </p>

      <div className="border border-stone-100 bg-white p-8 shadow-sm md:p-12">
        <PolicySections sections={REFUND_SECTIONS} />
      </div>

      <SupportCTA
        settings={settings}
        title="Ajukan klaim atau refund"
        description="Sertakan nomor referensi pesanan, video unboxing, dan foto kondisi produk agar klaim dapat kami verifikasi lebih cepat (maksimal 2×24 jam setelah paket diterima)."
      />
    </div>
  );
}
