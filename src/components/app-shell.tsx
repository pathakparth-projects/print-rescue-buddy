import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { signOut } from "@/lib/auth";

export function AppShell({
  subtitle,
  email,
  isAdmin,
  actions,
  children,
}: {
  subtitle: string;
  email?: string | undefined;
  isAdmin?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="paper-grain min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
              ✕
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-none tracking-tight">
                FixLog
              </span>
              <span className="block text-xs text-muted-foreground">{subtitle}</span>
            </span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {isAdmin && (
              <nav className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                <Link
                  to="/dashboard"
                  className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "rounded-md px-2.5 py-1.5 text-sm bg-card text-foreground font-medium" }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tickets"
                  className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "rounded-md px-2.5 py-1.5 text-sm bg-card text-foreground font-medium" }}
                >
                  My tickets
                </Link>
              </nav>
            )}
            {actions}
            <div className="flex items-center gap-2">
              {email && (
                <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
              )}
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
