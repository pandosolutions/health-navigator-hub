import { createFileRoute, Link } from "@tanstack/react-router";

const PROGRAMS = [
  { slug: "disease-compass", name: "Disease Compass", anatomy: "Heart" },
  { slug: "weight-loss", name: "Weight Loss", anatomy: "Adipose Tissue" },
  { slug: "strength-development", name: "Strength Development", anatomy: "Skeletal Muscle" },
] as const;

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs — Personalized Nutrition" },
      { name: "description", content: "Nutrition programs: Disease Compass, Weight Loss, and Strength Development." },
      { property: "og:title", content: "Programs — Personalized Nutrition" },
      { property: "og:description", content: "Nutrition programs: Disease Compass, Weight Loss, and Strength Development." },
    ],
  }),
  component: Programs,
});

function Programs() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Programs</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Three programs.
        <br />
        <span className="text-muted-foreground">One biology.</span>
      </h1>

      <ul className="mt-20 border-t border-[color:var(--color-hairline)]">
        {PROGRAMS.map((p) => (
          <li key={p.slug}>
            <Link
              to="/programs/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-wrap items-baseline justify-between gap-6 border-b border-[color:var(--color-hairline)] py-10 [@media(hover:hover)]:hover:bg-white/[0.02] active:bg-white/[0.03] transition-colors"
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {p.anatomy}
                </div>
                <div className="mt-3 text-3xl font-medium md:text-4xl">{p.name}</div>
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:group-hover:text-foreground group-active:text-foreground">
                Open program →
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
