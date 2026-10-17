import React from "react";

// Header halaman statis (FAQ, kebijakan, kontak) dengan gaya konsisten.
export default function PageHero({ eyebrow, title, subtitle }) {
  return (
    <div className="space-y-2 border-b border-stone-100 pb-6">
      {eyebrow && (
        <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-400">
          {eyebrow}
        </span>
      )}
      <h1 className="font-serif text-3xl font-light uppercase tracking-widest text-stone-900 md:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="max-w-2xl text-sm font-light leading-relaxed text-stone-500">{subtitle}</p>
      )}
    </div>
  );
}
