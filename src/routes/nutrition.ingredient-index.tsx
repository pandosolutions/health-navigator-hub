import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/nutrition/ingredient-index")({
  head: () => ({
    meta: [
      { title: "Ingredient Index — Personalized Nutrition" },
      { name: "description", content: "Nutrition facts for your favorite ingredients." },
      { property: "og:title", content: "Ingredient Index — Personalized Nutrition" },
      { property: "og:description", content: "Nutrition facts for your favorite ingredients." },
    ],
  }),
  component: IngredientIndex,
});

function IngredientIndex() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Ingredient Index</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Nutrition facts for your favorite ingredients.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
