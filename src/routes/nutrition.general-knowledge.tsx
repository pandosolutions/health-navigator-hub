import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/nutrition/general-knowledge")({
  head: () => ({
    meta: [
      { title: "General Knowledge — Personalized Nutrition" },
      { name: "description", content: "The fundamentals of nutrition." },
      { property: "og:title", content: "General Knowledge — Personalized Nutrition" },
      { property: "og:description", content: "The fundamentals of nutrition." },
    ],
  }),
  component: GeneralKnowledge,
});

function GeneralKnowledge() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">General Knowledge</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        The fundamentals of nutrition.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
