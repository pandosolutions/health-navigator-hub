import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in…" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Session may take a tick to hydrate after OAuth
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (!cancelled) navigate({ to: "/hub", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) setError("Sign-in didn't complete. Please try again.");
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Please wait
        </p>
        <h1 className="mt-4 text-2xl font-semibold">
          {error ? "Sign-in failed" : "Signing you in…"}
        </h1>
        {error && (
          <>
            <p className="mt-4 text-sm text-muted-foreground">{error}</p>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="mt-8 inline-block border-b border-foreground pb-1 text-[12px] uppercase tracking-[0.2em]"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
