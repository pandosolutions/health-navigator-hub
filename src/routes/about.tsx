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
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">How it works</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        Our approach.
      </h1>
      <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Everything on Moringa starts from your BPS profile. It is the reference point we use to
        personalize both medicine and nutrition.
      </p>

      <AboutSection label="BPS profiles" title="A profile built around you.">
        <p>
          A BPS profile is a code made of three values: your sex and age band, your ancestry, and
          your health conditions. It places you among people who share the same reference values,
          so the guidance you see starts from a baseline that fits you rather than a population
          average.
        </p>
        <p>
          We leverage data to align the values in your BPS profile, whether that data is genetic,
          ancestry-based, or tied to a health condition.
        </p>
      </AboutSection>

      <AboutSection label="Personalized medicine" title="Best practice, matched to your profile.">
        <p>
          We integrate best practices from medical therapeutic agendas for critical diseases. Our
          work covers general fitness and also specializes in critical diseases, so it is a mix of
          both. The same profile supports everyday health and condition-specific care.
        </p>
      </AboutSection>

      <AboutSection label="Personalized nutrition" title="Targets for optimal function.">
        <p>
          Our recommended daily allowances are built around physiological optimization rather than
          disease. Instead of values that only prevent deficiency, we use values that represent
          optimized health and best function, aligned to your BPS profile.
        </p>
      </AboutSection>
    </div>
  );
}

function AboutSection({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20 border-t border-[color:var(--color-hairline)] pt-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
