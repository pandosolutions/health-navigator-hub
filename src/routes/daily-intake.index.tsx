import { createFileRoute, Link } from "@tanstack/react-router";
import { DAILY_INTAKE_SECTIONS, type IntakeSection } from "@/data/daily-intake";

export const Route = createFileRoute("/daily-intake/")({
  head: () => ({
    meta: [
      { title: "Daily Intake — Personalized Nutrition" },
      { name: "description", content: "Daily intake recommendations for macros, vitamins, and minerals." },
      { property: "og:title", content: "Daily Intake — Personalized Nutrition" },
      { property: "og:description", content: "Daily intake recommendations for macros, vitamins, and minerals." },
    ],
  }),
  component: NutritionIndex,
});

function NutritionIndex() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        Nutrition Index
      </p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Daily Intake Recommendations
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Macros, Vitamins, &amp; Minerals
      </p>

      <div className="mt-16 border-t border-[color:var(--color-hairline)] pt-12">
        <h2 className="text-base font-semibold">Methodology</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          The values presented on this page are drawn from established, peer-reviewed reference
          sources — primarily the U.S. National Institutes of Health (NIH) and the European Food
          Safety Authority (EFSA) — the two most rigorously validated bodies for nutrient intake
          standards globally. Where these institutions diverge in their published ranges, we
          select the value derived from the most robust and current quantification methodology
          available, with a deliberate emphasis on figures that reflect optimal physiological
          function rather than the minimum threshold required to avoid overt deficiency or
          disease. Our aim is not simply to help you avoid nutritional insufficiency, but to
          support the intake levels associated with the body's fullest functional capacity — a
          distinction we believe is essential to genuinely proactive, evidence-based nutrition.
        </p>
      </div>

      {DAILY_INTAKE_SECTIONS.map((section) => (
        <IntakeSectionTable key={section.id} section={section} />
      ))}
    </div>
  );
}

function IntakeSectionTable({ section }: { section: IntakeSection }) {
  return (
    <section className="mt-20 border-t border-[color:var(--color-hairline)] pt-12">
      <div className="grid gap-6 md:grid-cols-[160px_1fr] md:items-center md:gap-10">
        <div>
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {section.source}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-hairline)]">
                <th className="w-0" />
                <th className="w-0" />
                {section.columns.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    {col.slug ? (
                      <Link
                        to="/daily-intake/$nutrient"
                        params={{ nutrient: col.slug }}
                        className="transition-colors [@media(hover:hover)]:hover:text-foreground"
                      >
                        {col.label}
                      </Link>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.groups.flatMap((group) =>
                group.rows.map((row, i) => (
                  <tr
                    key={`${group.label}-${row.label}`}
                    className="border-b border-[color:var(--color-hairline)] last:border-0"
                  >
                    {i === 0 && (
                      <td
                        rowSpan={group.rows.length}
                        className="w-0 whitespace-nowrap align-top px-4 py-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
                      >
                        {group.label}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {row.label}
                    </td>
                    {section.columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3">
                        {row.values[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
