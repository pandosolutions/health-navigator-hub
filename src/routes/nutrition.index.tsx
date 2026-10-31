import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/nutrition/")({
  head: () => ({
    meta: [
      { title: "Nutrition — Personalized Nutrition" },
      {
        name: "description",
        content: "Ingredients, recipes, and general nutrition knowledge.",
      },
      { property: "og:title", content: "Nutrition — Personalized Nutrition" },
      {
        property: "og:description",
        content: "Ingredients, recipes, and general nutrition knowledge.",
      },
    ],
  }),
  component: Nutrition,
});

const SECTIONS = [
  {
    to: "/nutrition/general-knowledge",
    label: "General Knowledge",
    tag: "The fundamentals of nutrition",
  },
  {
    to: "/nutrition/recipes",
    label: "Recipes",
    tag: "Healthy & therapeutic recipes",
  },
  {
    to: "/nutrition/ingredient-index",
    label: "Ingredient Index",
    tag: "Nutrition facts for your favorite ingredients",
  },
] as const;

function Nutrition() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Nutrition</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Everything nutrition, in one place.
      </h1>
      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex min-h-40 flex-col justify-between rounded-sm border border-[color:var(--color-hairline)] p-6 transition-colors [@media(hover:hover)]:hover:border-foreground active:border-foreground"
          >
            <div>
              <div className="text-2xl font-medium">{s.label}</div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {s.tag}
              </div>
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:group-hover:text-foreground group-active:text-foreground">
              Open →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
