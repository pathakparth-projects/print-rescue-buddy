import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { landingPathForCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FixLog — IT Support Ticket Log" },
      {
        name: "description",
        content:
          "FixLog is a shared IT support logbook: staff file tickets, IT admins track volume, categories and resolutions.",
      },
      { property: "og:title", content: "FixLog — IT Support Ticket Log" },
      {
        property: "og:description",
        content: "File IT support tickets and track every fix in one shared logbook.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        const path = await landingPathForCurrentUser();
        navigate({ to: path, replace: true });
        return;
      }
      setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="paper-grain min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
            ✕
          </span>
          <span className="font-display text-lg font-bold tracking-tight">FixLog</span>
          <Link
            to="/auth"
            className="stamp ml-auto rounded-lg bg-primary px-3.5 py-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="stamp text-muted-foreground">IT Support · Logbook</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Every problem logged. Every fix written down.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Staff file a ticket in seconds and follow it to resolution. IT admins get the full log,
          ticket volume over time and a breakdown of what keeps breaking.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            className="stamp rounded-lg bg-primary px-5 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            {checked ? "Sign in or create an account" : "Sign in"}
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {[
            {
              title: "File in seconds",
              body: "Title, description, category, priority. That's the whole form.",
            },
            {
              title: "Your tickets only",
              body: "Staff see strictly their own submissions — nobody else's.",
            },
            {
              title: "Admin metrics",
              body: "Daily ticket volume and open tickets split by Hardware, Software and Access.",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">{card.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
