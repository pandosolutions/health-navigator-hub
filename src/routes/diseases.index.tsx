import { createFileRoute, Link } from "@tanstack/react-router";
import { DISEASES } from "@/data/diseases";

export const Route = createFileRoute("/diseases/")({
  head: () => ({
    meta: [
      { title: "Diseases — Personalized Nutrition" },
      { name: "description", content: "Nutrition and therapeutics for common chronic conditions." },
      { property: "og:title", content: "Diseases — Personalized Nutrition" },
      {
        property: "og:description",
        content: "Nutrition and therapeutics for common chronic conditions.",
      },
    ],
  }),
  component: Diseases,
});

function Diseases() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Diseases</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Nutrition by condition.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
        How diet and nutrients relate to common chronic conditions.
      </p>

      <ul className="mt-16 grid gap-0 sm:grid-cols-2">
        {DISEASES.map((d) => (
          <li key={d.slug}>
            <Link
              to="/diseases/$slug"
              params={{ slug: d.slug }}
              className="group flex items-baseline gap-6 border-t border-[color:var(--color-hairline)] py-8 transition-colors [@media(hover:hover)]:hover:bg-white/[0.02] active:bg-white/[0.03] sm:[&:nth-last-child(-n+2)]:border-b"
            >
              <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {d.n}
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-medium md:text-3xl">{d.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{d.summary}</span>
              </span>
              <span className="ml-auto text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:group-hover:text-foreground group-active:text-foreground">
                Read →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
