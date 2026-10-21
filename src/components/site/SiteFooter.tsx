import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email")
  .max(254);

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("mailing_list")
      .insert({ email: parsed.data });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Couldn't subscribe. Please try again.");
      return;
    }
    toast.success("You're on the list.");
    setEmail("");
  }

  return (
    <footer className="mt-32 border-t border-[color:var(--color-hairline)]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-16 md:grid-cols-2 md:gap-24">
          <div>
            <h3 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Subscribe for updates
            </h3>
            <p className="mt-4 max-w-md text-lg leading-snug">
              Occasional notes on nutrition science, program updates, and new
              research summaries.
            </p>
            <form onSubmit={subscribe} className="mt-6 flex max-w-md gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 border-b border-[color:var(--color-hairline)] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
                maxLength={254}
              />
              <button
                type="submit"
                disabled={loading}
                className="ml-4 border-b border-foreground pb-3 text-[12px] font-medium uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {loading ? "…" : "Join"}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Navigate
              </h4>
              <ul className="mt-5 space-y-3">
                <li><Link to="/" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">Home</Link></li>
                <li><Link to="/diseases" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">Diseases</Link></li>
                <li><Link to="/daily-intake" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">Daily Intake</Link></li>
                <li><Link to="/nutrition" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">Nutrition</Link></li>
                <li><Link to="/about" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Legal
              </h4>
              <ul className="mt-5 space-y-3">
                <li><Link to="/privacy" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/disclaimer" className="text-muted-foreground active:text-foreground [@media(hover:hover)]:hover:text-foreground">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-hairline)] pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <div>© {new Date().getFullYear()} Personalized Nutrition</div>
          <div>Nutrition for all</div>
        </div>
      </div>
    </footer>
  );
}
