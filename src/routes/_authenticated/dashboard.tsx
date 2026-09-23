import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  NewTicketDialog,
  TicketAnalytics,
  TicketDetailDialog,
  TicketList,
  inputClass,
} from "@/components/tickets-ui";
import { fetchIsAdmin, fetchTickets, STATUS_LABELS } from "@/lib/tickets";
import type { TicketStatus } from "@/lib/tickets";
import { Route as AuthedRoute } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — FixLog" },
      {
        name: "description",
        content: "IT admin view: ticket volume trends, open tickets by category, and the full support log.",
      },
      { property: "og:title", content: "Admin dashboard — FixLog" },
      {
        property: "og:description",
        content: "Ticket volume trends, category breakdowns and the full IT support log.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const FILTERS: Array<{ key: "all" | TicketStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "open", label: STATUS_LABELS.open },
  { key: "in_progress", label: STATUS_LABELS.in_progress },
  { key: "resolved", label: STATUS_LABELS.resolved },
];

function Dashboard() {
  const { user } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin });
  const isAdmin = adminQuery.data === true;

  useEffect(() => {
    if (adminQuery.isSuccess && !isAdmin) navigate({ to: "/tickets", replace: true });
  }, [adminQuery.isSuccess, isAdmin, navigate]);

  const ticketsQuery = useQuery({
    queryKey: ["tickets", "all"],
    queryFn: () => fetchTickets(false),
    enabled: isAdmin,
  });

  const tickets = ticketsQuery.data ?? [];
  const counts = useMemo(() => {
    const base = { open: 0, in_progress: 0, resolved: 0 } as Record<TicketStatus, number>;
    for (const t of tickets) base[t.status] += 1;
    return base;
  }, [tickets]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.resolution ?? "").toLowerCase().includes(q)
      );
    });
  }, [tickets, filter, search]);

  const current = tickets.find((t) => t.id === selected) ?? null;

  if (adminQuery.isLoading || (adminQuery.isSuccess && !isAdmin)) {
    return (
      <div className="paper-grain flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  return (
    <AppShell
      subtitle="IT admin dashboard"
      email={user.email}
      isAdmin={isAdmin}
      actions={
        <button
          onClick={() => setCreating(true)}
          className="stamp rounded-lg bg-primary px-3.5 py-1.5 text-primary-foreground transition-opacity hover:opacity-90"
        >
          New ticket
        </button>
      }
    >
      <h1 className="font-display text-2xl font-bold tracking-tight">Support overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every ticket filed across the organisation, with volume and category trends.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: tickets.length },
          { label: STATUS_LABELS.open, value: counts.open },
          { label: STATUS_LABELS.in_progress, value: counts.in_progress },
          { label: STATUS_LABELS.resolved, value: counts.resolved },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {ticketsQuery.isSuccess && tickets.length > 0 && (
        <div className="mt-8">
          <TicketAnalytics tickets={tickets} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold tracking-tight">Global ticket log</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  filter === f.key
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className={`${inputClass} sm:ml-auto sm:max-w-xs`}
          />
        </div>

        <div className="mt-5">
          {ticketsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading the log…</p>
          ) : ticketsQuery.isError ? (
            <p className="rounded-xl border border-priority-high/40 bg-priority-high/10 p-4 text-sm text-priority-high">
              The ticket log could not be loaded. Please refresh the page.
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No tickets match this view.
            </p>
          ) : (
            <TicketList tickets={visible} onSelect={setSelected} />
          )}
        </div>
      </section>

      <NewTicketDialog open={creating} onClose={() => setCreating(false)} />
      <TicketDetailDialog
        ticket={current}
        onClose={() => setSelected(null)}
        canManage={isAdmin}
      />
    </AppShell>
  );
}
