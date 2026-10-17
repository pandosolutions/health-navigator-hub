import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { diseaseBySlug } from "@/data/diseases";

export const Route = createFileRoute("/diseases/$slug")({
  loader: ({ params }) => {
    const d = diseaseBySlug(params.slug);
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Diseases` },
          { name: "description", content: `${loaderData.name}: ${loaderData.summary}` },
          { property: "og:title", content: `${loaderData.name} — Diseases` },
          { property: "og:description", content: `${loaderData.name}: ${loaderData.summary}` },
        ]
      : [{ title: "Disease — Not found" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Condition not found</h1>
      <Link
        to="/diseases"
        className="mt-6 inline-block border-b border-foreground pb-1 text-sm uppercase tracking-[0.2em]"
      >
        Back to diseases
      </Link>
    </div>
  ),
  component: DiseasePage,
});

function DiseasePage() {
  const d = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
      <Link
        to="/diseases"
        className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
      >
        ← Diseases
      </Link>
      <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{d.n}</p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-6xl">{d.name}</h1>
      <p className="mt-6 text-lg text-muted-foreground">{d.summary}</p>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </article>
  );
}
