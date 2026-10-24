
// Renderer bagian-bagian kebijakan (heading + paragraf/list) agar halaman
// Refund & Syarat Ketentuan konsisten dan mudah dirawat.
export default function PolicySections({ sections }) {
  return (
    <div className="space-y-10">
      {sections.map((section, index) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-serif text-xl font-light text-stone-900">
            <span className="mr-2 text-stone-300">{String(index + 1).padStart(2, "0")}</span>
            {section.heading}
          </h2>

          {section.paragraphs?.map((text, i) => (
            <p key={i} className="text-sm font-light leading-relaxed text-stone-600">
              {text}
            </p>
          ))}

          {section.list && (
            <ul className="space-y-2 pl-1">
              {section.list.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-light leading-relaxed text-stone-600">
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-stone-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
