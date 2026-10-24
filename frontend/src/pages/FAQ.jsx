import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PageHero from "../components/PageHero";
import SupportCTA from "../components/SupportCTA";
import { FAQ_ITEMS } from "../data/legal";

export default function FAQ({ settings }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
      <PageHero
        eyebrow="Bantuan"
        title="FAQ"
        subtitle="Jawaban untuk pertanyaan yang paling sering ditanyakan seputar produk, pembayaran, pengiriman, dan pengembalian dana."
      />

      <div className="divide-y divide-stone-100 border border-stone-100 bg-white">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-stone-50/60"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-stone-800">{item.question}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-stone-400 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6">
                  <p className="text-sm font-light leading-relaxed text-stone-600">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SupportCTA settings={settings} />
    </div>
  );
}
