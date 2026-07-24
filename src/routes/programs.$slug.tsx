import { createFileRoute, Link, notFound } from "@tanstack/react-router";

const PROGRAMS: Record<
  string,
  { name: string; anatomy: string; tagline: string }
> = {
  "disease-compass": {
    name: "Disease Compass",
    anatomy: "Heart",
    tagline: "Cardiometabolic risk, mapped and managed through nutrition.",
  },
  "weight-loss": {
    name: "Weight Loss",
    anatomy: "Adipose Tissue",
    tagline: "Sustainable fat loss built around your metabolic response.",
  },
  "strength-development": {
    name: "Strength Development",
    anatomy: "Skeletal Muscle",
    tagline: "Nutrition for muscle synthesis, recovery, and performance.",
  },
};

export const Route = createFileRoute("/programs/$slug")({
  loader: ({ params }) => {
    const p = PROGRAMS[params.slug];
    if (!p) throw notFound();
    return { ...p, slug: params.slug };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Program` },
          { name: "description", content: loaderData.tagline },
          { property: "og:title", content: `${loaderData.name} — Program` },
          { property: "og:description", content: loaderData.tagline },
        ]
      : [{ title: "Program — Not found" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Program not found</h1>
      <Link to="/programs" className="mt-6 inline-block border-b border-foreground pb-1 text-sm uppercase tracking-[0.2em]">
        Back to programs
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-4xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Error</h1>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: ProgramPage,
});

function ProgramPage() {
  const p = Route.useLoaderData();
  return (
    <article>
      {/* Hero */}
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-20 lg:px-10 lg:pt-24 lg:pb-24">
        <Link
          to="/programs"
          className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
        >
          ← All programs
        </Link>
        <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {p.anatomy}
        </p>
        <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
          {p.name}
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {p.tagline}
        </p>
      </div>

      {/* Overview */}
      <Section number="01" title="Overview">
        <p>
          A brief description of the science, philosophy, and intended
          outcomes of this program. Content coming soon.
        </p>
      </Section>

      {/* Who It's For */}
      <Section number="02" title="Who It's For">
        <p>
          Who this program is designed to help, common starting points, and
          contraindications. Content coming soon.
        </p>
      </Section>

      {/* Plan Breakdown */}
      <Section number="03" title="Plan Breakdown">
        <p>
          A structural view of the program — phases, protocols, and
          measurement points. Content coming soon.
        </p>
      </Section>

      {/* CTA */}
      <section className="border-t border-[color:var(--color-hairline)]">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center lg:px-10 lg:py-32">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Ready to begin
          </p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
            Start the {p.name} program.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-[12px] uppercase tracking-[0.2em]">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="border-b border-foreground pb-1"
            >
              Create an account
            </Link>
            <Link
              to="/about"
              className="border-b border-muted-foreground pb-1 text-muted-foreground [@media(hover:hover)]:hover:text-foreground [@media(hover:hover)]:hover:border-foreground"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[color:var(--color-hairline)]">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-[160px_1fr] md:gap-16 lg:px-10 lg:py-24">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {number}
          </div>
          <h2 className="mt-3 text-2xl font-medium">{title}</h2>
        </div>
        <div className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </section>
  );
}
