import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/nutrition/recipes")({
  head: () => ({
    meta: [
      { title: "Recipes — Personalized Nutrition" },
      { name: "description", content: "Healthy and therapeutic recipes." },
      { property: "og:title", content: "Recipes — Personalized Nutrition" },
      { property: "og:description", content: "Healthy and therapeutic recipes." },
    ],
  }),
  component: Recipes,
});

function Recipes() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Recipes</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Healthy &amp; therapeutic recipes.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
