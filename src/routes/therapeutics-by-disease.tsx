import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/therapeutics-by-disease")({
  head: () => ({
    meta: [
      { title: "Therapeutics by Disease — Personalized Nutrition" },
      {
        name: "description",
        content: "Predictive, Preventative, Personalize, Participatory Medicine.",
      },
      { property: "og:title", content: "Therapeutics by Disease — Personalized Nutrition" },
      {
        property: "og:description",
        content: "Predictive, Preventative, Personalize, Participatory Medicine.",
      },
    ],
  }),
  component: TherapeuticsByDisease,
});

function TherapeuticsByDisease() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        Therapeutics by Disease
      </p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Predictive, Preventative, Personalize, Participatory Medicine.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
