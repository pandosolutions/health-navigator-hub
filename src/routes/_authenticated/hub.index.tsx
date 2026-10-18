import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/hub/")({
  head: () => ({
    meta: [{ title: "Account settings" }, { name: "robots", content: "noindex" }],
  }),
  component: Account,
});

/**
 * Account settings: profile details, password (change it, or set one for
 * an account that signs in with Google) and deleting the account. The
 * password check and the delete go through my_account_has_password() and
 * delete_my_account() (migration 20261019000000_account_settings).
 */

const schema = z.object({
  fullName: z.string().trim().max(120, "Name is too long"),
  username: z.string().trim().min(2, "Username needs at least 2 characters").max(40),
  email: z.string().trim().email("Enter a valid email").max(254),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

const MIN_PASSWORD = 6;

const buttonCls =
  "rounded-sm bg-foreground px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-background disabled:opacity-50";
const labelCls = "text-[11px] uppercase tracking-[0.25em] text-muted-foreground";

function Account() {
  return (
    <div className="space-y-16">
      <ProfileSection />
      <PasswordSection />
      <DeleteSection />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-8 max-w-md">{children}</div>
    </section>
  );
}

function ProfileSection() {
  const { user } = Route.useRouteContext();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, email, phone")
        .eq("id", user.id)
        .maybeSingle();
      const meta = user.user_metadata ?? {};
      setFullName(data?.full_name ?? meta.full_name ?? meta.name ?? "");
      if (data) {
        setUsername(data.username ?? "");
        setEmail(data.email ?? user.email ?? "");
        setPhone(data.phone ?? "");
      }
      setInitial(false);
    })();
  }, [user.id, user.email, user.user_metadata]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, username, email, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName || null,
        username: parsed.data.username,
        phone: parsed.data.phone || null,
        email: parsed.data.email,
      })
      .eq("id", user.id);
    // A new email takes effect once it's confirmed from the link Supabase sends.
    let emailError = null;
    const emailChanged = parsed.data.email !== user.email;
    if (emailChanged) {
      const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
      emailError = error;
    }
    setLoading(false);
    if (profileError || emailError) {
      toast.error(profileError?.message ?? emailError?.message ?? "Save failed");
      return;
    }
    toast.success(
      emailChanged ? "Saved. Check your new inbox to confirm the email change." : "Saved.",
    );
  }

  if (initial) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Section title="Account settings">
      <form onSubmit={save} className="space-y-6">
        <Field label="Name" value={fullName} onChange={setFullName} autoComplete="name" />
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" />
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Phone" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
        <button type="submit" disabled={loading} className={buttonCls}>
          {loading ? "…" : "Save changes"}
        </button>
      </form>
    </Section>
  );
}

function PasswordSection() {
  const { user } = Route.useRouteContext();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.rpc("my_account_has_password").then(({ data, error }) => {
      // If the check isn't available, assume there's a password: asking for
      // the current one is the safe side.
      setHasPassword(error ? true : !!data);
    });
  }, [user.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < MIN_PASSWORD) {
      return toast.error(`Password must be at least ${MIN_PASSWORD} characters`);
    }
    if (next !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    if (hasPassword) {
      // Check the current password before replacing it.
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email ?? "",
        password: current,
      });
      if (error) {
        setSaving(false);
        return toast.error("Current password is incorrect");
      }
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(
      hasPassword ? "Password changed." : "Password set. You can now sign in with your email too.",
    );
    setHasPassword(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  if (hasPassword === null) return null;

  return (
    <Section
      title={hasPassword ? "Change password" : "Set a password"}
      description={
        hasPassword
          ? undefined
          : `You sign in with Google. Set a password to also sign in with ${user.email ?? "your email"}.`
      }
    >
      <form onSubmit={save} className="space-y-6">
        {hasPassword && (
          <Field
            label="Current password"
            type="password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
        )}
        <Field
          label="New password"
          type="password"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <Field
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={saving || !next || !confirm || (hasPassword && !current)}
          className={buttonCls}
        >
          {saving ? "…" : hasPassword ? "Change password" : "Set password"}
        </button>
      </form>
    </Section>
  );
}

function DeleteSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setDeleting(false);
      return toast.error(error.message);
    }
    await supabase.auth.signOut();
    toast.success("Your account has been deleted.");
    router.navigate({ to: "/", replace: true });
  }

  return (
    <Section
      title="Delete account"
      description="Permanently deletes your account, profile, health data and saved items. This can't be undone."
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm border border-red-600/60 px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-red-700 dark:text-red-400"
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-6 rounded-sm border border-red-600/40 p-5">
          <Field label='Type "DELETE" to confirm' value={typed} onChange={setTyped} />
          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={remove}
              disabled={typed !== "DELETE" || deleting}
              className="rounded-sm bg-red-700 px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full border-b border-[color:var(--color-hairline)] bg-transparent py-3 text-base outline-none focus:border-foreground"
      />
    </label>
  );
}
