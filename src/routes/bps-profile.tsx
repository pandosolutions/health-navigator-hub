import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BPS_PREMIUM, BPS_PRIMARY, ageInYear, computeBps, primaryCode } from "@/lib/bps";
import { fetchBpsUx, type BpsProfileRow, type BpsUx } from "@/lib/bps-client";
import { BpsFeatureRows } from "@/components/bps/BpsFeatureRows";
import { BpsOverlay } from "@/components/bps/BpsOverlay";
import { ProfileMatrix } from "@/components/bps/ProfileMatrix";
import {
  EMPTY_VALUES,
  SYSTEM_LABEL,
  ghostBtn,
  hasAnyAnswer,
  labelCls,
  primaryBtn,
  type BpsValues,
} from "@/components/bps/shared";

export const Route = createFileRoute("/bps-profile")({
  head: () => ({
    meta: [
      { title: "BPS Profile — Personalized Nutrition" },
      {
        name: "description",
        content:
          "Create your biopsychosocial (BPS) profile: the physiological, demographic and health factors Moringa uses to tailor programs to you.",
      },
      { property: "og:title", content: "BPS Profile — Personalized Nutrition" },
    ],
  }),
  component: BpsProfilePage,
});

const GUEST_KEY = "bps-guest-values";

function readGuest(): BpsValues | null {
  try {
    const raw = window.sessionStorage.getItem(GUEST_KEY);
    return raw ? ({ ...EMPTY_VALUES, ...JSON.parse(raw) } as BpsValues) : null;
  } catch {
    return null;
  }
}
function writeGuest(v: BpsValues | null) {
  try {
    if (v && hasAnyAnswer(v)) window.sessionStorage.setItem(GUEST_KEY, JSON.stringify(v));
    else window.sessionStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage can be blocked; the page works without it.
  }
}

function BpsProfilePage() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [saved, setSaved] = useState<BpsProfileRow | null>(null);
  const [values, setValues] = useState<BpsValues>(EMPTY_VALUES);
  const [draft, setDraft] = useState<BpsValues | null>(null);
  const [open, setOpen] = useState(false);
  const [ux, setUx] = useState<BpsUx | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      if (!data.user) {
        const guest = readGuest();
        if (guest) setValues(guest);
        return;
      }
      const { data: row } = await supabase
        .from("bps_profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (!row) {
        const guest = readGuest();
        if (guest) setValues(guest);
        return;
      }
      const p = row as BpsProfileRow;
      setSaved(p);
      setValues({
        sex: p.sex,
        birthYear: String(p.birth_year),
        ancestry: p.ancestry_code,
        conditions: p.conditions ?? [],
      });
    })();
  }, []);

  // Keep a visitor's answers for this browser session until they sign up.
  useEffect(() => {
    if (userId === null) writeGuest(values);
  }, [userId, values]);

  const year = Number(values.birthYear);
  const yearOk = values.birthYear.length === 4 && Number.isFinite(year);
  const result = useMemo(
    () =>
      computeBps({
        sex: values.sex,
        birthYear: yearOk ? year : null,
        ancestry: values.ancestry,
        conditions: values.conditions,
      }),
    [values.sex, values.ancestry, values.conditions, yearOk, year],
  );
  const primary = useMemo(
    () => (values.sex && yearOk ? primaryCode(values.sex, ageInYear(year)) : null),
    [values.sex, yearOk, year],
  );

  // What the profile configures, from the correlation database.
  useEffect(() => {
    if (!result) return setUx(null);
    let live = true;
    const t = setTimeout(async () => {
      const next = await fetchBpsUx(result.code);
      if (live) setUx(next);
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [result?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const systems = (ux?.["anatomy.systems"] as string[] | undefined) ?? result?.systems ?? [];

  async function save() {
    if (!userId || !result || !values.sex) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("bps_profiles")
      .upsert(
        {
          user_id: userId,
          sex: values.sex,
          birth_year: year,
          ancestry_code: result.secondary.code,
          conditions: values.conditions,
          primary_code: result.primary.code,
          secondary_code: result.secondary.code,
          tertiary_code: result.tertiary.code,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setSaved(data as BpsProfileRow);
    writeGuest(null);
    toast.success(`Saved. Your profile is BPS ${result.code}.`);
  }

  async function remove() {
    if (!userId || !window.confirm("Delete your saved BPS profile?")) return;
    const { error } = await supabase.from("bps_profiles").delete().eq("user_id", userId);
    if (error) return toast.error(error.message);
    setSaved(null);
    toast.success("Your BPS profile was deleted.");
  }

  const dirty =
    !!result &&
    (!saved ||
      saved.code !== result.code ||
      saved.birth_year !== year ||
      saved.sex !== values.sex ||
      [...saved.conditions].sort().join() !== [...values.conditions].sort().join());

  const code = result?.code ?? (primary !== null ? String(primary) : null);
  const started = hasAnyAnswer(values);

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">BPS Profile</p>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.05] md:text-6xl">
          Create your Biopsychosocial profile!
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A BPS profile matches your age, sex, ethnic background, activity level, body composition,
          &amp; conditions/disease (if applicable) to the nutrient targets, recipes and risk
          patterns that research links to people like you.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <button type="button" onClick={() => setOpen(true)} className={primaryBtn}>
            {started ? "Update my answers" : "Get started"}
          </button>
          <a
            href="#features"
            className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 [@media(hover:hover)]:hover:text-foreground"
          >
            See what a profile unlocks
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Four short questions, about two minutes. Skip ancestry if you prefer not to say.
        </p>
      </section>

      {/* Your profile */}
      {primary !== null && (
        <section
          id="your-profile"
          className="mt-20 max-w-3xl scroll-mt-24 border border-[color:var(--color-hairline)] p-6 sm:p-8"
        >
          <p className={labelCls}>Your profile</p>
          <p className="mt-3 font-mono text-4xl font-semibold tracking-tight">
            BPS {result?.code ?? primary}
          </p>
          <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
            <Tier
              n="1"
              term="Primary"
              value={BPS_PRIMARY.find((p) => p.code === primary)?.label ?? ""}
            />
            <Tier n="2" term="Secondary" value={result?.secondary.label ?? "Not provided"} />
            <Tier n="3" term="Tertiary" value={result?.tertiary.label ?? "Not provided"} />
          </dl>

          {!result && (
            <p className="mt-6 text-sm text-muted-foreground">
              Add your ancestry to complete your code.{" "}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="underline underline-offset-4 [@media(hover:hover)]:hover:text-foreground"
              >
                Continue
              </button>
            </p>
          )}

          {systems.length > 0 && (
            <div className="mt-6 border-t border-[color:var(--color-hairline)] pt-5">
              <p className={labelCls}>Focus areas</p>
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

          {result && (
            <div className="mt-6">
              {userId ? (
                <div className="flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || !dirty}
                    className={primaryBtn}
                  >
                    {saving ? "…" : saved ? (dirty ? "Update profile" : "Saved") : "Save profile"}
                  </button>
                  {saved && (
                    <button
                      type="button"
                      onClick={remove}
                      className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ) : userId === null ? (
                <Link
                  to="/auth"
                  search={{ mode: "signup" } as never}
                  className="inline-block rounded-sm border border-foreground px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.15em]"
                >
                  Sign up to save it
                </Link>
              ) : null}
            </div>
          )}
        </section>
      )}

      {/* How it works */}
      <section className="mt-28 border-t border-[color:var(--color-hairline)] pt-16">
        <p className={labelCls}>How it works</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
          Let&apos;s personalize your health profile!
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <Step
            n="1"
            title="Answer a few questions"
            body="Sex and year of birth give you your first value. Ancestry and health conditions add the next two."
          />
          <Step
            n="2"
            title="Get matched to a profile"
            body="Your answers become a code like BPS 6.4.13 that places you among people with the same reference values."
          />
          <Step
            n="3"
            title="See it across the site"
            body="The same profile feeds your daily targets, recipe matches, at-risk patterns and the literature behind them."
          />
        </div>
      </section>

      {/* Profiles */}
      <section className="mt-28 border-t border-[color:var(--color-hairline)] pt-16">
        <p className={labelCls}>The profiles</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
          Ten reference profiles, one for each age band and sex.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Each profile is a starting point. Your ancestry and conditions add the second and third
          values of your code.
        </p>
        <div className="mt-10">
          <ProfileMatrix primary={primary} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Profiles run men then women within each age band. Profile data is pending for every
          profile.
        </p>
      </section>

      {/* What a profile is made of */}
      <section className="mt-28 border-t border-[color:var(--color-hairline)] pt-16">
        <p className={labelCls}>What shapes a profile</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
          Three values today, two more with Premium.
        </h2>
        <div className="mt-10 grid gap-x-12 md:grid-cols-2">
          <Value
            n="1"
            title="Sex and age"
            body="Ten profiles, from men and women aged 18 to 29 up to 60 and over."
          />
          <Value
            n="2"
            title="Ancestry"
            body="Nineteen groups. Ancestry can affect how you process some nutrients."
          />
          <Value
            n="3"
            title="Health conditions"
            body="Single conditions and common combinations, matched to the closest profile value."
          />
          <Value
            n="4"
            title={BPS_PREMIUM.quaternary.title}
            body="Premium. More precise programs, not collected yet."
            muted
          />
          <Value
            n="5"
            title={BPS_PREMIUM.quinary.title}
            body="Premium. More precise programs, not collected yet."
            muted
          />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mt-28 scroll-mt-24 border-t border-[color:var(--color-hairline)] pt-16"
      >
        <p className={labelCls}>What a profile unlocks</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
          One profile, five places it works for you.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Until you answer the questions, each section describes what it will show. Once you do, it
          becomes a preview of your own profile.
        </p>
        <div className="mt-10">
          <BpsFeatureRows code={code} systems={systems} onStart={() => setOpen(true)} />
        </div>
      </section>

      <p className="mt-20 max-w-xl text-xs leading-relaxed text-muted-foreground">
        Your answers are private: only you and Moringa&apos;s admins can see a saved profile. This
        isn&apos;t a diagnosis; talk to your doctor about your health.
      </p>

      <BpsOverlay
        open={open}
        onOpenChange={setOpen}
        initial={draft ?? values}
        onComplete={(v) => {
          setValues(v);
          setDraft(null);
          requestAnimationFrame(() =>
            document.getElementById("your-profile")?.scrollIntoView({ block: "start" }),
          );
        }}
        onSaveDraft={setDraft}
      />
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <span className="font-mono text-sm text-muted-foreground">{n}</span>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Value({
  n,
  title,
  body,
  muted,
}: {
  n: string;
  title: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 border-t border-[color:var(--color-hairline)] py-6 ${muted ? "opacity-70" : ""}`}
    >
      <span className="w-4 shrink-0 font-mono text-sm text-muted-foreground">{n}</span>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Tier({ n, term, value }: { n: string; term: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-4 shrink-0 font-mono text-muted-foreground">{n}</span>
      <div>
        <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{term}</dt>
        <dd className="mt-0.5">{value}</dd>
      </div>
    </div>
  );
}
