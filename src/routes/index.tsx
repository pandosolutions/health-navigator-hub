import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import anatomyColor from "@/assets/anatomy-color.png.asset.json";
import anatomyLines from "@/assets/anatomy-lines-white.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Personalized Nutrition for All" },
      {
        name: "description",
        content:
          "Evidence-based, personalized nutrition programs — for disease prevention, weight loss, and strength.",
      },
      { property: "og:title", content: "Personalized Nutrition for All" },
      {
        property: "og:description",
        content:
          "Evidence-based nutrition programs — for disease prevention, weight loss, and strength.",
      },
    ],
  }),
  component: Home,
});

const PROGRAMS = [
  {
    slug: "disease-compass",
    name: "Disease Compass",
    anatomy: "Heart",
    blurb:
      "A cardiometabolic protocol that maps your labs to targeted nutrition strategies to lower disease risk.",
    // % coords over the anatomy image (heart area)
    dot: { x: 47, y: 32 },
  },
  {
    slug: "weight-loss",
    name: "Weight Loss",
    anatomy: "Adipose Tissue",
    blurb:
      "Sustainable fat-loss designed around your body composition, hunger signaling, and metabolic response.",
    dot: { x: 55, y: 52 },
  },
  {
    slug: "strength-development",
    name: "Strength Development",
    anatomy: "Skeletal Muscle",
    blurb:
      "Nutrition for muscle synthesis: protein timing, creatine dosing, and recovery periodization.",
    dot: { x: 30, y: 46 },
  },
] as const;

const TOPICS = [
  { n: "01", slug: "bps-profiles", title: "BPS Profiles" },
  { n: "02", slug: "supplements-dos-donts", title: "Supplements Dos/Don'ts" },
  { n: "03", slug: "superfoods", title: "Superfoods" },
  { n: "04", slug: "toxicology-report", title: "Toxicology Report" },
] as const;

function Home() {
  return (
    <>
      <HeroSection />
      <ProgramsSection />
      <TrendingSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24 lg:pb-32">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="order-2 md:order-1">
          <img
            src={anatomyColor.url}
            alt="Anatomical illustration of the human body"
            className="w-full max-w-[520px] mx-auto"
            loading="eager"
          />
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
            One body. One biology. One protocol. Nutrition science translated
            into programs designed around who you actually are.
          </p>
          <div className="mt-10 flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.2em]">
            <Link
              to="/programs"
              className="border-b border-foreground pb-1 [@media(hover:hover)]:hover:text-muted-foreground"
            >
              Explore programs
            </Link>
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

function ProgramsSection() {
  const [active, setActive] = useState<(typeof PROGRAMS)[number]["slug"] | null>(null);

  return (
    <section className="border-t border-[color:var(--color-hairline)]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Section 02 — Programs
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Mapped to your anatomy.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Each program targets a specific system. Tap a line to learn more,
            or open the full program.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 md:gap-8">
          {/* Anatomy diagram */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <img
              src={anatomyLines.url}
              alt="Anatomical line illustration"
              className="w-full"
            />
            {PROGRAMS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onFocus={() => setActive(p.slug)}
                onMouseEnter={() => setActive(p.slug)}
                onMouseLeave={() => setActive((a) => (a === p.slug ? null : a))}
                onClick={() => setActive((a) => (a === p.slug ? null : p.slug))}
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground bg-background transition-all data-[on=true]:bg-foreground data-[on=true]:scale-125"
                data-on={active === p.slug || undefined}
                style={{ left: `${p.dot.x}%`, top: `${p.dot.y}%` }}
                aria-label={`${p.name} — ${p.anatomy}`}
              />
            ))}
          </div>

          {/* Program list */}
          <ul className="flex flex-col justify-center">
            {PROGRAMS.map((p) => {
              const on = active === p.slug;
              return (
                <li
                  key={p.slug}
                  className="group border-t border-[color:var(--color-hairline)] last:border-b"
                >
                  <div
                    className="flex flex-col gap-3 py-6"
                    onMouseEnter={() => setActive(p.slug)}
                    onMouseLeave={() => setActive((a) => (a === p.slug ? null : a))}
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() =>
                          setActive((a) => (a === p.slug ? null : p.slug))
                        }
                      >
                        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                          {p.anatomy}
                        </div>
                        <div className="mt-2 text-2xl font-medium md:text-3xl">
                          {p.name}
                        </div>
                      </button>
                      <Link
                        to="/programs/$slug"
                        params={{ slug: p.slug }}
                        className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground active:text-foreground"
                      >
                        Open →
                      </Link>
                    </div>
                    <div
                      className="grid transition-all duration-300"
                      style={{
                        gridTemplateRows: on ? "1fr" : "0fr",
                      }}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                          {p.blurb}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TrendingSection() {
  return (
    <section className="border-t border-[color:var(--color-hairline)]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Section 03 — Trending Topics
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            What we're reading now.
          </h2>
        </div>

        <ul className="grid gap-0 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <li key={t.slug}>
              <Link
                to="/topics/$slug"
                params={{ slug: t.slug }}
                className="group flex items-baseline gap-6 border-t border-[color:var(--color-hairline)] py-8 [@media(hover:hover)]:hover:bg-white/[0.02] active:bg-white/[0.03] transition-colors [&:nth-last-child(-n+2)]:border-b"
              >
                <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  {t.n}
                </span>
                <span className="text-2xl font-medium md:text-3xl">
                  {t.title}
                </span>
                <span className="ml-auto text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:group-hover:text-foreground group-active:text-foreground">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
