import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BPS_ANCESTRY,
  BPS_CONDITIONS,
  BPS_PREMIUM,
  computeBps,
  type BpsCondition,
  type Sex,
} from "@/lib/bps";
import { fetchBpsUx, type BpsProfileRow, type BpsUx } from "@/lib/bps-client";

export const Route = createFileRoute("/bps-profile")({
  head: () => ({
    meta: [
      { title: "BPS Profile — Personalized Nutrition" },
      {
        name: "description",
        content:
          "Your biopsychosocial (BPS) profile: the physiological, demographic and health factors Moringa uses to tailor programs to you.",
      },
      { property: "og:title", content: "BPS Profile — Personalized Nutrition" },
    ],
  }),
  component: BpsProfilePage,
});

const SYSTEM_LABEL: Record<string, string> = {
  cardio: "Heart & circulation",
  endo: "Metabolism & hormones",
  resp: "Lungs & breathing",
  digest: "Digestion & liver",
  musc: "Bones, joints & muscles",
  neuro: "Brain & mental health",
};
const GROUP_ORDER = ["cardio", "endo", "resp", "digest", "musc", "neuro", "other"];

const label = "text-[11px] uppercase tracking-[0.25em] text-muted-foreground";
const inputCls =
  "mt-2 block w-full border-b border-[color:var(--color-hairline)] bg-transparent py-3 text-base outline-none focus:border-foreground";

function BpsProfilePage() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [saved, setSaved] = useState<BpsProfileRow | null>(null);
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [ancestry, setAncestry] = useState<number | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [ux, setUx] = useState<BpsUx | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      if (!data.user) return;
      const { data: row } = await supabase
        .from("bps_profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (!row) return;
      const p = row as BpsProfileRow;
      setSaved(p);
      setSex(p.sex);
      setBirthYear(String(p.birth_year));
      setAncestry(p.ancestry_code);
      setConditions(p.conditions ?? []);
    })();
  }, []);

  const year = Number(birthYear);
  const result = useMemo(
    () =>
      computeBps({
        sex,
        birthYear: birthYear.length === 4 && Number.isFinite(year) ? year : null,
        ancestry,
        conditions,
      }),
    [sex, birthYear, year, ancestry, conditions],
  );
  const tooYoung =
    birthYear.length === 4 && Number.isFinite(year) && new Date().getFullYear() - year < 18;

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

  async function save() {
    if (!userId || !result || !sex) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("bps_profiles")
      .upsert(
        {
          user_id: userId,
          sex,
          birth_year: year,
          ancestry_code: result.secondary.code,
          conditions,
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
      saved.sex !== sex ||
      [...saved.conditions].sort().join() !== [...conditions].sort().join());

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">BPS Profile</p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">Your BPS profile.</h1>
      <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
        A biopsychosocial profile groups the physiological, demographic and health factors that
        shape how your body responds to nutrition. Tell us a little about yourself and Moringa
        tailors what you see to your profile.
      </p>

      <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-12">
          {/* 1. Primary */}
          <Step n={1} title="Sex and age" hint="Primary value">
            <div className="flex flex-wrap gap-3">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  aria-pressed={sex === s}
                  className={`rounded-sm border px-5 py-2.5 text-sm capitalize transition-colors ${
                    sex === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-[color:var(--color-hairline)] text-muted-foreground [@media(hover:hover)]:hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Biological sex, used for reference values like body fat and muscle mass.
            </p>
            <label className="mt-6 block max-w-xs">
              <span className={label}>Year of birth</span>
              <input
                inputMode="numeric"
                maxLength={4}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ""))}
                placeholder="1990"
                className={inputCls}
              />
            </label>
            {tooYoung && (
              <p className="mt-2 text-sm text-muted-foreground">
                BPS profiles are for adults, 18 and over.
              </p>
            )}
          </Step>

          {/* 2. Secondary */}
          <Step n={2} title="Ancestry" hint="Secondary value">
            <select
              value={ancestry ?? ""}
              onChange={(e) => setAncestry(e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} max-w-sm`}
            >
              <option value="">Choose the closest match</option>
              {BPS_ANCESTRY.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              Ancestry can affect how you process some nutrients. Choose the one that fits best.
            </p>
          </Step>

          {/* 3. Tertiary */}
          <Step n={3} title="Health conditions" hint="Tertiary value">
            <ConditionPicker value={conditions} onChange={setConditions} />
          </Step>
        </div>

        {/* Result */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-sm border border-[color:var(--color-hairline)] p-6">
            <p className={label}>Your profile</p>
            {result ? (
              <>
                <p className="mt-3 font-mono text-4xl font-semibold tracking-tight">
                  BPS {result.code}
                </p>
                <dl className="mt-6 space-y-4 text-sm">
                  <Tier n="1" term="Primary" value={result.primary.label} />
                  <Tier n="2" term="Secondary" value={result.secondary.label} />
                  <Tier n="3" term="Tertiary" value={result.tertiary.label} />
                </dl>

                {ux && Array.isArray(ux["anatomy.systems"]) && (
                  <div className="mt-6 border-t border-[color:var(--color-hairline)] pt-5">
                    <p className={label}>Focus areas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(ux["anatomy.systems"] as string[]).map((s) => (
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

                <div className="mt-6">
                  {userId ? (
                    <div className="flex flex-wrap items-center gap-5">
                      <button
                        onClick={save}
                        disabled={saving || !dirty}
                        className="rounded-sm bg-foreground px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-background disabled:opacity-50"
                      >
                        {saving ? "…" : saved ? (dirty ? "Update profile" : "Saved") : "Save profile"}
                      </button>
                      {saved && (
                        <button
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
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Choose your sex, year of birth and ancestry to see your profile code.
              </p>
            )}
          </div>

          <div className="mt-6 rounded-sm border border-dashed border-[color:var(--color-hairline)] p-6">
            <p className={label}>Premium · more precision</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Moringa Premium adds two more values to your profile for more precise programs:
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <PremiumRow
                n={4}
                title={BPS_PREMIUM.quaternary.title}
                applies={result?.premium.quaternary}
              />
              <PremiumRow n={5} title={BPS_PREMIUM.quinary.title} applies={result?.premium.quinary} />
            </ul>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Your answers are private: only you and Moringa's admins can see them. This
            isn't a diagnosis; talk to your doctor about your health.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-sm text-muted-foreground">{n}</span>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {hint}
        </span>
      </div>
      <div className="mt-5 pl-7">{children}</div>
    </section>
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

function PremiumRow({ n, title, applies }: { n: number; title: string; applies?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="w-4 shrink-0 font-mono text-muted-foreground">{n}</span>
      <span>
        {title}
        {applies && (
          <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            · applies to you
          </span>
        )}
      </span>
    </li>
  );
}

/** Conditions grouped by body system; subtypes sit under their parent. */
function ConditionPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const chosen = new Set(value);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const parents = BPS_CONDITIONS.filter((c) => !c.parent);
    const children = BPS_CONDITIONS.filter((c) => c.parent);
    const byGroup = new Map<string, BpsCondition[]>();
    const group = (c: BpsCondition) => {
      const parent = c.parent ? parents.find((p) => p.key === c.parent) : null;
      return (parent ?? c).systems[0] ?? "other";
    };
    const add = (c: BpsCondition) => {
      if (term && !c.label.toLowerCase().includes(term)) return;
      const g = group(c);
      byGroup.set(g, [...(byGroup.get(g) ?? []), c]);
    };
    for (const p of parents) {
      add(p);
      for (const ch of children.filter((x) => x.parent === p.key)) add(ch);
    }
    // Subtypes whose parent isn't a listed condition (e.g. dementia).
    for (const ch of children.filter((x) => !parents.some((p) => p.key === x.parent))) add(ch);
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      id: g,
      items: byGroup.get(g)!,
    }));
  }, [q]);

  const toggle = (key: string) =>
    onChange(chosen.has(key) ? value.filter((k) => k !== key) : [...value, key]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block w-full max-w-xs">
          <span className={label}>Search conditions</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. diabetes"
            className={inputCls}
          />
        </label>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
          >
            Clear ({value.length})
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Choose any that a doctor has diagnosed. Leave this empty if none apply.
      </p>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        {groups.map((g) => (
          <fieldset key={g.id}>
            <legend className={label}>{SYSTEM_LABEL[g.id] ?? "Other"}</legend>
            <div className="mt-3 space-y-1.5">
              {g.items.map((c) => (
                <label
                  key={c.key}
                  className={`flex cursor-pointer items-start gap-2.5 text-sm ${c.parent ? "pl-6" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={chosen.has(c.key)}
                    onChange={() => toggle(c.key)}
                    className="mt-0.5 accent-[color:var(--color-foreground)]"
                  />
                  <span className={c.parent ? "text-muted-foreground" : ""}>{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
