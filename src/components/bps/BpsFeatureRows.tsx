import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SYSTEM_LABEL, ghostBtn, labelCls } from "./shared";

/**
 * The five places a BPS profile is used. Each row describes the feature until the
 * visitor has a profile, then previews it. No profile-specific data has been ingested
 * yet, so every preview other than the focus areas shows labelled sample values.
 */
export function BpsFeatureRows({
  code,
  systems,
  onStart,
}: {
  /** "6.4.13", or just "6" while only the primary value is known; null with no profile. */
  code: string | null;
  systems: string[];
  onStart: () => void;
}) {
  const filled = code !== null;

  return (
    <div>
      {filled && (
        <div className="mb-2 flex flex-wrap items-center gap-3 border border-[color:var(--color-hairline)] px-4 py-3 text-sm">
          <span className="rounded-full border border-foreground px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]">
            Preview
          </span>
          <span className="text-muted-foreground">
            Showing previews for BPS {code}. Values are samples until data is ingested.
          </span>
        </div>
      )}

      <Feature
        kicker="Engine"
        title="Profile data optimization"
        blurb="How your answers tune the standard targets."
        filled={filled}
        onStart={onStart}
        bullets={[
          "See which answer drives each change",
          "Add a measurement to refine a target",
          "Compare standard and profile-adjusted values",
        ]}
        description="Your answers adjust the standard targets to fit your body. Sex, age, ancestry and conditions each move specific nutrients up or down."
      >
        {systems.length > 0 && (
          <div className="mb-6">
            <p className={labelCls}>Focus areas for your profile</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {systems.map((s) => (
                <span
                  key={s}
                  className="rounded-sm border border-[color:var(--color-hairline)] px-2 py-1 text-xs"
                >
                  {SYSTEM_LABEL[s] ?? s}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className={`${labelCls} text-left`}>
                <th className="pb-2 pr-4 font-normal">Nutrient</th>
                <th className="pb-2 pr-4 font-normal">Standard</th>
                <th className="pb-2 pr-4 font-normal">Your profile</th>
                <th className="pb-2 font-normal">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-hairline)] border-t border-[color:var(--color-hairline)] font-mono">
              {SAMPLE_ADJUSTMENTS.map((r) => (
                <tr key={r.name}>
                  <td className="py-3 pr-4 font-sans">{r.name}</td>
                  <td className="py-3 pr-4">{r.base}</td>
                  <td className="py-3 pr-4">{r.adjusted}</td>
                  <td className="py-3">{r.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SampleNote />
      </Feature>

      <Feature
        kicker="Daily targets"
        title="RDA values"
        blurb="Recommended intakes for your profile."
        filled={filled}
        onStart={onStart}
        link={
          <Link to="/daily-intake" className={ghostBtn}>
            Open Daily Intake
          </Link>
        }
        bullets={[
          "Vitamins, minerals, protein and fiber",
          "Standard and adjusted values side by side",
          "A link to the full Daily Intake page",
        ]}
        description="Daily nutrient targets for your profile, starting from the standard RDA and adjusted by the optimization step."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SAMPLE_ADJUSTMENTS.concat(SAMPLE_EXTRA).map((r) => (
            <div
              key={r.name}
              className="rounded-sm border border-[color:var(--color-hairline)] p-4"
            >
              <p className="text-xs text-muted-foreground">{r.name}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{r.adjusted}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">standard {r.base}</p>
            </div>
          ))}
        </div>
        <SampleNote />
      </Feature>

      <Feature
        kicker="Meals"
        title="Recipe recommendations"
        blurb="Recipes ranked by fit with your targets."
        filled={filled}
        onStart={onStart}
        link={
          <Link to="/therapeutics-by-disease" className={ghostBtn}>
            Open Therapeutics by Disease
          </Link>
        }
        bullets={[
          "A match score for each recipe",
          "The nutrients that earn the match",
          "A link to the recipe pages",
        ]}
        description="Recipes ranked by how well their nutrient and phytochemical content fits your profile targets."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLE_RECIPES.map((r) => (
            <div
              key={r.name}
              className="rounded-sm border border-[color:var(--color-hairline)] p-4"
            >
              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                <span>Match</span>
                <span>{r.match}%</span>
              </div>
              <div className="mt-2 h-[3px] bg-[color:var(--color-hairline)]">
                <div className="h-full bg-foreground" style={{ width: `${r.match}%` }} />
              </div>
              <p className="mt-4 font-medium leading-snug">{r.name}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border border-[color:var(--color-hairline)] px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <SampleNote />
      </Feature>

      <Feature
        kicker="Patterns"
        title="At-risk correlations"
        blurb="Associations for profiles like yours. Not a diagnosis."
        filled={filled}
        onStart={onStart}
        link={
          <Link to="/diseases" className={ghostBtn}>
            Open Diseases
          </Link>
        }
        bullets={[
          "Which areas run higher or lower for your profile",
          "The measurements behind each association",
          "A link to the disease pages",
        ]}
        description="Population-level associations between profiles like yours and common nutritional risks."
      >
        <ul className="divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
          {SAMPLE_RISKS.map((r) => (
            <li
              key={r.name}
              className="grid items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]"
            >
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.basis}</p>
              </div>
              <div className="h-[3px] bg-[color:var(--color-hairline)]">
                <div className="h-full bg-foreground" style={{ width: `${r.level}%` }} />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {r.label}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          These describe populations, not you. Sample values until data is ingested.
        </p>
      </Feature>

      <Feature
        kicker="Evidence"
        title="Literature"
        blurb="The studies behind each target and association."
        filled={filled}
        onStart={onStart}
        bullets={[
          "Primary sources with DOI links",
          "Evidence tier and study type",
          "Which target or association each source supports",
        ]}
        description="The studies behind each target and association, graded by evidence tier."
      >
        <ul className="divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
          {SAMPLE_LITERATURE.map((l) => (
            <li key={l.supports} className="space-y-1.5 py-4">
              <p className="font-medium">Sample entry: study title appears here</p>
              <p className="font-mono text-xs text-muted-foreground">
                {l.tier} · {l.type} · DOI links here · Supports: {l.supports}
              </p>
            </li>
          ))}
        </ul>
        <SampleNote />
      </Feature>
    </div>
  );
}

function SampleNote() {
  return <p className="mt-3 text-xs text-muted-foreground">Sample values for layout only.</p>;
}

function Feature({
  kicker,
  title,
  blurb,
  description,
  bullets,
  filled,
  onStart,
  link,
  children,
}: {
  kicker: string;
  title: string;
  blurb: string;
  description: string;
  bullets: string[];
  filled: boolean;
  onStart: () => void;
  link?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-12 gap-y-6 border-t border-[color:var(--color-hairline)] py-10 first-of-type:border-t-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)]">
      <div className="space-y-3 self-start">
        <p className={labelCls}>{kicker}</p>
        <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{blurb}</p>
        {filled && link && <div className="pt-2">{link}</div>}
      </div>
      <div className="min-w-0">
        {filled ? (
          children
        ) : (
          <div className="space-y-4 rounded-sm border border-dashed border-[color:var(--color-hairline)] p-6">
            <p className="text-sm leading-relaxed">{description}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <button type="button" onClick={onStart} className={ghostBtn}>
              Get started to unlock
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

const SAMPLE_ADJUSTMENTS = [
  { name: "Protein", base: "0.8 g/kg", adjusted: "1.1 g/kg", change: "+0.3" },
  { name: "Fiber", base: "25 g", adjusted: "30 g", change: "+5" },
  { name: "Magnesium", base: "320 mg", adjusted: "340 mg", change: "+20" },
  { name: "Potassium", base: "2,600 mg", adjusted: "2,900 mg", change: "+300" },
];

const SAMPLE_EXTRA = [
  { name: "Vitamin D", base: "15 µg", adjusted: "15 µg", change: "0" },
  { name: "Vitamin K", base: "90 µg", adjusted: "90 µg", change: "0" },
];

const SAMPLE_RECIPES = [
  { name: "Moringa and lentil stew", match: 92, tags: ["Protein", "Magnesium", "Fiber"] },
  { name: "Holy basil chickpea bowl", match: 87, tags: ["Fiber", "Potassium"] },
  { name: "Sardine, kale and white bean plate", match: 81, tags: ["Vitamin D", "Protein"] },
];

const SAMPLE_RISKS = [
  {
    name: "Low muscle mass",
    basis: "Based on sex and age band",
    level: 64,
    label: "Higher than average",
  },
  {
    name: "Metabolic strain",
    basis: "Based on listed conditions",
    level: 38,
    label: "Near average",
  },
  {
    name: "Low vitamin D status",
    basis: "Based on ancestry and age band",
    level: 56,
    label: "Higher than average",
  },
];

const SAMPLE_LITERATURE = [
  { tier: "Evidence tier 1", type: "Randomized trial", supports: "Protein" },
  { tier: "Evidence tier 1", type: "Meta-analysis", supports: "Magnesium" },
  { tier: "Evidence tier 2", type: "Cohort study", supports: "Vitamin D" },
];
