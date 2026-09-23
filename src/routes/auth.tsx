import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  signInWithEmail,
  signUpWithEmail,
  landingPathForCurrentUser,
} from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — FixLog IT Support Desk" },
      {
        name: "description",
        content:
          "Sign in to FixLog to file IT support tickets and track their resolution, or open the admin dashboard.",
      },
      { property: "og:title", content: "Sign in — FixLog IT Support Desk" },
      {
        property: "og:description",
        content: "Sign in to file IT support tickets and follow their resolution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const field =
  "w-full rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-3 py-2.5 text-[15px] text-[var(--auth-surface-foreground)] outline-none transition-colors placeholder:text-[var(--auth-surface-foreground)]/40 focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        const path = await landingPathForCurrentUser();
        navigate({ to: path, replace: true });
        return;
      }
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { needsConfirmation } = await signUpWithEmail(email.trim(), password);
        if (needsConfirmation) {
          setNotice("Check your email to confirm the account, then sign in.");
          setBusy(false);
          return;
        }
      } else {
        await signInWithEmail(email.trim(), password);
      }
      const path = await landingPathForCurrentUser();
      navigate({ to: path, replace: true });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "That didn't work. Please try again.",
      );
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--auth-surface)] px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            ✕
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--auth-surface-foreground)]">
            FixLog
          </h1>
          <p className="text-sm text-[var(--auth-surface-foreground)]/60">
            The IT support logbook. Sign in to file and follow your tickets.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)] p-6 shadow-xl">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-[var(--auth-surface)] p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-[var(--auth-surface-foreground)]/70 hover:text-[var(--auth-surface-foreground)]"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--auth-surface-foreground)]/60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={field}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--auth-surface-foreground)]/60"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={field}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-priority-high/40 bg-priority-high/10 px-3 py-2 text-sm text-priority-high">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg border border-status-resolved/40 bg-status-resolved/10 px-3 py-2 text-sm text-status-resolved">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || checking}
              className="stamp w-full rounded-lg bg-primary px-4 py-2.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--auth-surface-foreground)]/45">
          <Link to="/" className="underline hover:text-[var(--auth-surface-foreground)]/70">
            Back to the front desk
          </Link>
        </p>
      </div>
    </main>
  );
}
