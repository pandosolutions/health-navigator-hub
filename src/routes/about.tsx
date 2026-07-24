import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Personalized Nutrition" },
      { name: "description", content: "About Personalized Nutrition for All." },
      { property: "og:title", content: "About — Personalized Nutrition" },
      { property: "og:description", content: "About Personalized Nutrition for All." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">About</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Our approach.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
