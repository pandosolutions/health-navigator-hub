import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Personalized Nutrition" },
      { name: "description", content: "Medical and nutritional disclaimer." },
      { property: "og:title", content: "Disclaimer — Personalized Nutrition" },
      { property: "og:description", content: "Medical and nutritional disclaimer." },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight">Disclaimer</h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Content coming soon.
      </p>
    </div>
  );
}
