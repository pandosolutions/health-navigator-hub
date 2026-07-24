import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/hub/saved")({
  head: () => ({
    meta: [{ title: "Saved readings" }, { name: "robots", content: "noindex" }],
  }),
  component: Saved,
});

type Row = { id: string; topic_slug: string; topic_title: string | null; created_at: string };

function Saved() {
  const { user } = Route.useRouteContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("saved_readings")
        .select("id, topic_slug, topic_title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [user.id]);

  return (
    <section>
      <h2 className="text-2xl font-semibold">Saved readings</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Bookmarked topics live here. Bookmarking will be enabled soon.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-sm border border-[color:var(--color-hairline)] p-6">
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
          {rows.map((r) => (
            <li key={r.id} className="py-5">
              <Link
                to="/topics/$slug"
                params={{ slug: r.topic_slug }}
                className="text-lg [@media(hover:hover)]:hover:underline"
              >
                {r.topic_title ?? r.topic_slug}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
