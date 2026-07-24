import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/topics")({
  head: () => ({
    meta: [
      { title: "Topics — Personalized Nutrition" },
      { name: "description", content: "Browse nutrition topics and research summaries." },
      { property: "og:title", content: "Topics — Personalized Nutrition" },
      { property: "og:description", content: "Browse nutrition topics and research summaries." },
    ],
  }),
  component: Topics,
});

function Topics() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Topics</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Reading list.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
