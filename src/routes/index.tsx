import { createFileRoute, Link } from "@tanstack/react-router";
import { AnatomyExplorer } from "@/components/anatomy/AnatomyExplorer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Personalized Nutrition for All" },
      {
        name: "description",
        content:
          "Evidence-based, personalized nutrition — standards, supplements, therapeutics, ingredients, and recipes.",
      },
      { property: "og:title", content: "Personalized Nutrition for All" },
      {
        property: "og:description",
        content:
          "Evidence-based, personalized nutrition — standards, supplements, therapeutics, ingredients, and recipes.",
      },
    ],
  }),
  component: Home,
});

const OFFERINGS = [
  {
    slug: "daily-nutrition-standards",
    name: "Daily Nutrition Standards",
    tag: "Adults, Children, Elderly, Pregnancies",
  },
  {
    slug: "supplement-smarts",
    name: "Supplement Smarts",
    tag: "The Rules of Supplementation",
  },
  {
    slug: "therapeutics-by-disease",
    name: "Therapeutics by Disease",
    tag: "Predictive, Preventative, Personalize, Participatory Medicine",
    href: "/therapeutics-by-disease",
  },
  {
    slug: "ingredient-index",
    name: "Ingredient Index",
    tag: "Nutrition facts for your favorite ingredients",
    href: "/nutrition/ingredient-index",
  },
  {
    slug: "recipes",
    name: "Recipes",
    tag: "Healthy & Therapeutic Recipes",
    href: "/nutrition/recipes",
  },
] as const;

function Home() {
  return (
    <>
      <HeroSection />
      <OfferingsSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24 lg:pb-32">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="order-2 md:order-1">
          <div className="relative">
            <AnatomyExplorer />
            <div className="relative z-10 mt-5 grid grid-cols-3 gap-2" aria-label="Explore body systems">
              {[
                ["neuro", "Nervous", "#96dcff"],
                ["cardio", "Cardiovascular", "#ff4d5e"],
                ["resp", "Respiratory", "#8fd3ff"],
                ["digest", "Digestive", "#ffb35c"],
                ["musc", "Musculoskeletal", "#ff7a90"],
                ["endo", "Endocrine", "#c59bff"],
              ].map(([id, label, color]) => (
                <Link key={id} to="/systems/$system" params={{ system: id }}
                  className="rounded-md border px-2 py-3 text-center text-[11px] font-medium transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2"
                  style={{ borderColor: color, color }} title={`Explore ${label} system`}>
                  {label} ↗
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Section 01 — Cover
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
            Personalized
            <br />
            Nutrition
            <br />
            <span className="text-muted-foreground">for All.</span>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
            Nutrition science translated into programs designed around you.
          </p>
          <div className="mt-10 flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.2em]">
            <a
              href="#offerings"
              className="border-b border-foreground pb-1 [@media(hover:hover)]:hover:text-muted-foreground"
            >
              Explore
            </a>
            <Link
              to="/about"
              className="border-b border-muted-foreground pb-1 text-muted-foreground [@media(hover:hover)]:hover:text-foreground [@media(hover:hover)]:hover:border-foreground"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function OfferingsSection() {
  return (
    <section id="offerings" className="border-t border-[color:var(--color-hairline)]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Section 02 — What We Offer
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            Five ways in.
          </h2>
        </div>

        <ul className="border-t border-[color:var(--color-hairline)]">
          {OFFERINGS.map((o) => {
            const content = (
              <>
                <div>
                  <div className="text-3xl font-medium md:text-4xl">{o.name}</div>
                  <div className="mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    {o.tag}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {"href" in o ? "Open →" : "Coming soon"}
                </div>
              </>
            );
            return (
              <li key={o.slug}>
                {"href" in o ? (
                  <Link
                    to={o.href}
                    className="group flex flex-wrap items-baseline justify-between gap-6 border-b border-[color:var(--color-hairline)] py-10 [@media(hover:hover)]:hover:bg-white/[0.02] active:bg-white/[0.03] transition-colors [&>div:last-child]:[@media(hover:hover)]:group-hover:text-foreground [&>div:last-child]:group-active:text-foreground"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-[color:var(--color-hairline)] py-10">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
