import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NUTRIENT_LOOKUP } from "@/data/daily-intake";

export const Route = createFileRoute("/daily-intake/$nutrient")({
  loader: ({ params }) => {
    const entry = NUTRIENT_LOOKUP[params.nutrient];
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Daily Intake` },
          { name: "description", content: `${loaderData.title} daily intake recommendations.` },
          { property: "og:title", content: `${loaderData.title} — Daily Intake` },
        ]
      : [{ title: "Nutrient — Not found" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Nutrient not found</h1>
      <Link
        to="/daily-intake"
        className="mt-6 inline-block border-b border-foreground pb-1 text-sm uppercase tracking-[0.2em]"
      >
        Back to Daily Intake
      </Link>
    </div>
  ),
  component: NutrientPage,
});

function NutrientPage() {
  const nutrient = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
      <Link
        to="/daily-intake"
        className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
      >
        ← Daily Intake
      </Link>
      <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {nutrient.section}
      </p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-6xl">{nutrient.title}</h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </article>
  );
}
