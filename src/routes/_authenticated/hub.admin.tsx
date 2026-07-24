import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hub/admin")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw redirect({ to: "/hub" });
    }
  },
  head: () => ({
    meta: [{ title: "Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: Admin,
});

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null;
};
type HealthRow = {
  age: number | null;
  gender: string | null;
  body_fat_percent: number | null;
  smm_kg: number | null;
  lab_values: Record<string, unknown> | null;
};
type AuditRow = {
  id: string;
  action: string;
  changed_at: string;
  changed_by: string | null;
  previous_value: unknown;
  new_value: unknown;
};

function Admin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, username, phone")
        .order("created_at", { ascending: false });
      setUsers((data as UserRow[]) ?? []);
    })();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-semibold">User management</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        View and edit user profiles and health data. All health-data changes are logged.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[280px_1fr]">
        <div className="border-r border-[color:var(--color-hairline)] pr-6">
          <h3 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            All users
          </h3>
          <ul className="mt-4 divide-y divide-[color:var(--color-hairline)]">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => setSelected(u)}
                  className={`block w-full py-3 text-left text-sm ${selected?.id === u.id ? "text-foreground" : "text-muted-foreground [@media(hover:hover)]:hover:text-foreground"}`}
                >
                  <div>{u.username ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </button>
              </li>
            ))}
            {users.length === 0 && (
              <li className="py-4 text-sm text-muted-foreground">No users yet.</li>
            )}
          </ul>
        </div>

        <div>
          {selected ? (
            <UserDetail key={selected.id} user={selected} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a user to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function UserDetail({ user }: { user: UserRow }) {
  const [health, setHealth] = useState<HealthRow | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [smm, setSmm] = useState("");
  const [labs, setLabs] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: h }, { data: a }] = await Promise.all([
        supabase
          .from("health_data")
          .select("age, gender, body_fat_percent, smm_kg, lab_values")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("health_data_audit")
          .select("id, action, changed_at, changed_by, previous_value, new_value")
          .eq("user_id", user.id)
          .order("changed_at", { ascending: false })
          .limit(50),
      ]);
      setHealth((h as HealthRow) ?? null);
      setAudit((a as AuditRow[]) ?? []);
      setAge(h?.age?.toString() ?? "");
      setGender(h?.gender ?? "");
      setBodyFat(h?.body_fat_percent?.toString() ?? "");
      setSmm(h?.smm_kg?.toString() ?? "");
      setLabs(h?.lab_values ? JSON.stringify(h.lab_values, null, 2) : "{}");
      setLoading(false);
    })();
  }, [user.id]);

  async function saveHealth(e: React.FormEvent) {
    e.preventDefault();
    let labValues: Record<string, unknown> = {};
    try {
      labValues = JSON.parse(labs || "{}");
    } catch {
      toast.error("Lab values must be valid JSON");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      age: age ? Number(age) : null,
      gender: gender || null,
      body_fat_percent: bodyFat ? Number(bodyFat) : null,
      smm_kg: smm ? Number(smm) : null,
      lab_values: labValues,
    };
    const { error } = await supabase
      .from("health_data")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved. Change logged.");
    // Refresh audit
    const { data: a } = await supabase
      .from("health_data_audit")
      .select("id, action, changed_at, changed_by, previous_value, new_value")
      .eq("user_id", user.id)
      .order("changed_at", { ascending: false })
      .limit(50);
    setAudit((a as AuditRow[]) ?? []);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-lg font-semibold">{user.username ?? user.email}</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <form onSubmit={saveHealth} className="space-y-5">
        <h4 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Health data
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" value={age} onChange={setAge} type="number" />
          <Field label="Gender" value={gender} onChange={setGender} />
          <Field label="Body fat %" value={bodyFat} onChange={setBodyFat} type="number" />
          <Field label="SMM (kg)" value={smm} onChange={setSmm} type="number" />
        </div>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Lab values (JSON)
          </span>
          <textarea
            value={labs}
            onChange={(e) => setLabs(e.target.value)}
            rows={8}
            className="mt-2 block w-full rounded-sm border border-[color:var(--color-hairline)] bg-transparent p-3 font-mono text-xs outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-foreground px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-background disabled:opacity-50"
        >
          {saving ? "…" : "Save health data"}
        </button>
      </form>

      <div>
        <h4 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Audit trail
        </h4>
        {audit.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No changes yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
            {audit.map((a) => (
              <li key={a.id} className="py-4 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="uppercase tracking-[0.2em] text-muted-foreground">
                    {a.action}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(a.changed_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-muted-foreground">
                  by {a.changed_by ?? "system"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full border-b border-[color:var(--color-hairline)] bg-transparent py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
