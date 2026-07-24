import { createFileRoute, Link, notFound } from "@tanstack/react-router";

const TOPICS: Record<string, { title: string; number: string }> = {
  "bps-profiles": { title: "BPS Profiles", number: "01" },
  "supplements-dos-donts": { title: "Supplements Dos/Don'ts", number: "02" },
  superfoods: { title: "Superfoods", number: "03" },
  "toxicology-report": { title: "Toxicology Report", number: "04" },
};

export const Route = createFileRoute("/topics/$slug")({
  loader: ({ params }) => {
    const t = TOPICS[params.slug];
    if (!t) throw notFound();
    return t;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Topics` },
          { name: "description", content: `${loaderData.title}. A trending nutrition topic.` },
          { property: "og:title", content: `${loaderData.title} — Topics` },
          { property: "og:description", content: `${loaderData.title}. A trending nutrition topic.` },
        ]
      : [{ title: "Topic — Not found" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Topic not found</h1>
      <Link to="/topics" className="mt-6 inline-block border-b border-foreground pb-1 text-sm uppercase tracking-[0.2em]">
        Back to topics
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-4xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Error</h1>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: TopicPage,
});

function TopicPage() {
  const topic = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
      <Link
        to="/topics"
        className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
      >
        ← Topics
      </Link>
      <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {topic.number}
      </p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-6xl">
        {topic.title}
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </article>
  );
}
