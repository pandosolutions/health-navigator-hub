import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{
    data?: { client?: { name?: string }; redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
};

const oauth = () =>
  (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { mode: "login" as const, next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data ?? null;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-2xl font-semibold">Authorization request failed</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-16">
      <div className="w-full">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Authorize access
        </p>
        <h1 className="mt-6 text-3xl font-semibold leading-tight">
          Connect {clientName} to your account
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {clientName} will be able to read your profile, health record and saved readings, and
          act on your behalf in Health Navigator Hub.
        </p>
        {error && (
          <p role="alert" className="mt-6 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="mt-10 flex gap-4">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-sm bg-foreground py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-background disabled:opacity-50"
          >
            {busy ? "…" : "Approve"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-sm border border-[color:var(--color-hairline)] py-3 text-[12px] font-medium uppercase tracking-[0.2em] disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
