import { BPS_PRIMARY } from "@/lib/bps";
import { labelCls } from "./shared";

/** The ten primary profiles: sex (rows) by age band (columns). */
export function ProfileMatrix({ primary }: { primary: number | null }) {
  const bands = BPS_PRIMARY.filter((p) => p.sex === "male").map((p) => ({
    ageMin: p.ageMin,
    ageMax: p.ageMax,
  }));
  const rows = [
    { sex: "female" as const, title: "Women" },
    { sex: "male" as const, title: "Men" },
  ];

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[640px] gap-2"
        style={{ gridTemplateColumns: `5.5rem repeat(${bands.length}, minmax(0, 1fr))` }}
        role="group"
        aria-label="BPS primary profiles"
      >
        <span />
        {bands.map((b) => (
          <span key={b.ageMin} className={`${labelCls} self-end pb-1`}>
            {b.ageMax ? `${b.ageMin}–${b.ageMax}` : `${b.ageMin}+`}
          </span>
        ))}
        {rows.map((r) => (
          <MatrixRow key={r.sex} title={r.title} sex={r.sex} bands={bands} primary={primary} />
        ))}
      </div>
    </div>
  );
}

function MatrixRow({
  title,
  sex,
  bands,
  primary,
}: {
  title: string;
  sex: "male" | "female";
  bands: { ageMin: number; ageMax: number | null }[];
  primary: number | null;
}) {
  return (
    <>
      <span className="self-center text-sm font-medium">{title}</span>
      {bands.map((b) => {
        const p = BPS_PRIMARY.find((x) => x.sex === sex && x.ageMin === b.ageMin);
        if (!p) return <span key={b.ageMin} />;
        const you = primary === p.code;
        return (
          <div
            key={p.code}
            className={`rounded-sm border p-3 ${
              you ? "border-foreground bg-foreground/10" : "border-[color:var(--color-hairline)]"
            }`}
          >
            <p className="font-mono text-xs text-muted-foreground">BPS {p.code}</p>
            <p className="mt-1 text-sm">{p.label}</p>
            <p
              className={`mt-1 text-[11px] ${you ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              {you ? "Your profile" : "Data pending"}
            </p>
          </div>
        );
      })}
    </>
  );
}
