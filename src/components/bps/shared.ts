import type { Sex } from "@/lib/bps";

export const SYSTEM_LABEL: Record<string, string> = {
  cardio: "Heart & circulation",
  endo: "Metabolism & hormones",
  resp: "Lungs & breathing",
  digest: "Digestion & liver",
  musc: "Bones, joints & muscles",
  neuro: "Brain & mental health",
};

export const GROUP_ORDER = ["cardio", "endo", "resp", "digest", "musc", "neuro", "other"];

export const labelCls = "text-[11px] uppercase tracking-[0.25em] text-muted-foreground";

export const inputCls =
  "mt-2 block w-full border-b border-[color:var(--color-hairline)] bg-transparent py-3 text-base outline-none focus:border-foreground";

export const primaryBtn =
  "rounded-sm bg-foreground px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-background disabled:opacity-50";

export const ghostBtn =
  "rounded-sm border border-[color:var(--color-hairline)] px-5 py-2.5 text-[12px] uppercase tracking-[0.15em] text-muted-foreground transition-colors [@media(hover:hover)]:hover:border-foreground [@media(hover:hover)]:hover:text-foreground";

/** What the person has told us so far. Year of birth stays a string while typing. */
export type BpsValues = {
  sex: Sex | null;
  birthYear: string;
  ancestry: number | null;
  conditions: string[];
};

export const EMPTY_VALUES: BpsValues = {
  sex: null,
  birthYear: "",
  ancestry: null,
  conditions: [],
};

export function hasAnyAnswer(v: BpsValues) {
  return !!v.sex || v.birthYear.length > 0 || v.ancestry !== null || v.conditions.length > 0;
}
