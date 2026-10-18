import { BPS_DATA } from "@/data/bps.generated";

/**
 * BPS (biopsychosocial) profile algorithm.
 *
 * A profile is coded primary.secondary.tertiary, e.g. "1.4.13":
 *   primary    sex x age band           (1-10)
 *   secondary  ancestry                 (1-19)
 *   tertiary   condition or combination (0-137, 0 = none listed)
 *
 * The premium version adds two more levels (body composition & blood
 * pressure, metabolic labs) for more precision. Their reference data is in
 * BPS_DATA.premium, but they aren't collected yet: BPS_LIVE_LEVELS = 3.
 *
 * The same reference data is in the database (bps_values), so the code a
 * user gets here is a row of bps_combinations, and bps_ux(code) returns
 * what each UX should do for it. Both come from scripts/generate-bps.py.
 */

export const BPS_LIVE_LEVELS = 3;

export type Sex = "male" | "female";

export type BpsInput = {
  sex: Sex | null;
  birthYear: number | null;
  ancestry: number | null;
  /** Condition keys from BPS_CONDITIONS. */
  conditions: string[];
};

export type BpsResult = {
  code: string;
  primary: { code: number; label: string };
  secondary: { code: number; label: string };
  tertiary: { code: number; label: string; snomed: string | null };
  /** Anatomy systems the tertiary value involves (home page explorer ids). */
  systems: string[];
  /** Premium levels this profile would use, if it had them. */
  premium: { quaternary: boolean; quinary: boolean };
};

export type BpsCondition = (typeof BPS_DATA.conditions)[number];

export const BPS_PRIMARY = BPS_DATA.primary;
export const BPS_ANCESTRY = BPS_DATA.secondary;
export const BPS_CONDITIONS = BPS_DATA.conditions;
export const BPS_TERTIARY = BPS_DATA.tertiary;
export const BPS_PREMIUM = BPS_DATA.premium;

const PARENT = new Map<string, string | null>(BPS_CONDITIONS.map((c) => [c.key, c.parent]));

export function ageInYear(birthYear: number, now = new Date()) {
  // Without a birth date this can be a year high for part of the year; the
  // age bands are ten years wide, so that only matters at a band's edge.
  return now.getFullYear() - birthYear;
}

/** Sex x age band. Null under 18: BPS profiles are for adults. */
export function primaryCode(sex: Sex, age: number): number | null {
  if (!Number.isFinite(age) || age < 18) return null;
  const band = BPS_PRIMARY.find(
    (p) => p.sex === sex && age >= p.ageMin && (p.ageMax === null || age <= p.ageMax),
  );
  return band?.code ?? null;
}

/** The chosen conditions plus what they imply (atrial fibrillation -> arrhythmia). */
export function expandConditions(keys: string[]): Set<string> {
  const out = new Set<string>();
  for (const k of keys) {
    let cur: string | null | undefined = k;
    while (cur && !out.has(cur)) {
      out.add(cur);
      cur = PARENT.get(cur);
    }
  }
  return out;
}

/**
 * The tertiary value for a set of conditions. A combination that covers more
 * of the person's conditions beats a smaller one, and any combination beats
 * a single condition; ties go to the lower code (the sheet's order, which
 * lists heart conditions first). No match is 0.
 */
export function tertiaryCode(keys: string[]): number {
  const have = expandConditions(keys);
  let best: { code: number; size: number } | null = null;
  for (const t of BPS_TERTIARY) {
    if (t.code === 0 || !t.requires.length) continue;
    const ok = t.requires.every((anyOf) => anyOf.some((k) => have.has(k)));
    if (!ok) continue;
    const size = t.requires.length;
    if (!best || size > best.size || (size === best.size && t.code < best.code)) {
      best = { code: t.code, size };
    }
  }
  return best?.code ?? 0;
}

/** Whether the premium levels would apply (the sheet's Step 4 / Step 5 rules). */
export function premiumLevels(keys: string[]) {
  const have = expandConditions(keys);
  const systems = new Set(
    BPS_CONDITIONS.filter((c) => have.has(c.key)).flatMap((c) => c.systems),
  );
  const q4 = BPS_PREMIUM.quaternary;
  const q5 = BPS_PREMIUM.quinary;
  return {
    quaternary:
      q4.unlockSystems.some((s) => systems.has(s)) || q4.unlockKeys.some((k) => have.has(k)),
    quinary: q5.unlockKeys.some((k) => have.has(k)),
  };
}

export function computeBps(input: BpsInput, now = new Date()): BpsResult | null {
  if (!input.sex || !input.birthYear || !input.ancestry) return null;
  const p = primaryCode(input.sex, ageInYear(input.birthYear, now));
  if (p === null) return null;
  const s = BPS_ANCESTRY.find((a) => a.code === input.ancestry);
  if (!s) return null;
  const t = BPS_TERTIARY.find((x) => x.code === tertiaryCode(input.conditions))!;
  const pr = BPS_PRIMARY.find((x) => x.code === p)!;
  return {
    code: `${p}.${s.code}.${t.code}`,
    primary: { code: p, label: pr.label },
    secondary: { code: s.code, label: s.label },
    tertiary: { code: t.code, label: t.label, snomed: t.snomed },
    systems: [...t.systems],
    premium: premiumLevels(input.conditions),
  };
}
