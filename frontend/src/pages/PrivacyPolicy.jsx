import React from "react";
import PageHero from "../components/PageHero";
import PolicySections from "../components/PolicySections";
import SupportCTA from "../components/SupportCTA";
import { POLICY_LAST_UPDATED, PRIVACY_SECTIONS } from "../data/legal";

export default function PrivacyPolicy({ settings }) {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <PageHero
        eyebrow="Kebijakan"
        title="Kebijakan Privasi"
        subtitle="Bagaimana Eliteikon mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat berbelanja di situs ini."
      />

      <p className="text-[10px] uppercase tracking-wider text-stone-400">
        Terakhir diperbarui: {POLICY_LAST_UPDATED}
      </p>

      <div className="border border-stone-100 bg-white p-8 shadow-sm md:p-12">
        <PolicySections sections={PRIVACY_SECTIONS} />
      </div>

      <SupportCTA
        settings={settings}
        title="Pertanyaan tentang data pribadi Anda?"
        description="Hubungi kami untuk meminta akses, koreksi, atau penghapusan data pribadi Anda sesuai Kebijakan Privasi ini."
      />
    </div>
  );
}
