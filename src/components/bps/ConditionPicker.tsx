import { useMemo, useState } from "react";
import { BPS_CONDITIONS, type BpsCondition } from "@/lib/bps";
import { GROUP_ORDER, SYSTEM_LABEL, inputCls, labelCls } from "./shared";

/** Conditions grouped by body system; subtypes sit under their parent. */
export function ConditionPicker({
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
          <span className={labelCls}>Search conditions</span>
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
            <legend className={labelCls}>{SYSTEM_LABEL[g.id] ?? "Other"}</legend>
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
