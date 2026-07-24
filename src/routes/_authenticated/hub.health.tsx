import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/hub/health")({
  head: () => ({
    meta: [{ title: "Health data" }, { name: "robots", content: "noindex" }],
  }),
  component: HealthData,
});

type HealthRow = {
  age: number | null;
  gender: string | null;
  body_fat_percent: number | null;
  smm_kg: number | null;
  lab_values: Record<string, unknown> | null;
  updated_at: string | null;
} | null;

function HealthData() {
  const { user } = Route.useRouteContext();
  const [row, setRow] = useState<HealthRow>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("health_data")
        .select("age, gender, body_fat_percent, smm_kg, lab_values, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      setRow((data as HealthRow) ?? null);
      setLoading(false);
    })();
  }, [user.id]);

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">Health data</h2>
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Read-only · Managed by admin
        </p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : !row ? (
        <div className="mt-10 rounded-sm border border-[color:var(--color-hairline)] p-6">
          <p className="text-sm text-muted-foreground">
            No health data on file yet. An admin will add your intake and lab
            values here.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <MetricList
            title="Baseline"
            items={[
              ["Age", row.age ?? "—"],
              ["Gender", row.gender ?? "—"],
              ["Body fat %", row.body_fat_percent ?? "—"],
              ["Skeletal muscle mass (kg)", row.smm_kg ?? "—"],
            ]}
          />
          <MetricList
            title="Lab values"
            items={
              row.lab_values && Object.keys(row.lab_values).length > 0
                ? Object.entries(row.lab_values as Record<string, unknown>).map(
                    ([k, v]) => [k, String(v)],
                  )
                : [["No entries", "—"]]
            }
          />
        </div>
      )}
    </section>
  );
}

function MetricList({
  title,
  items,
}: {
  title: string;
  items: [string, unknown][];
}) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-4 divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
        {items.map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between py-4">
            <span className="text-sm text-muted-foreground">{k}</span>
            <span className="text-sm">{String(v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
