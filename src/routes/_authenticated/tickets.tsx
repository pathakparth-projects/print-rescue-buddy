import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { NewTicketForm, TicketDetailDialog, TicketList } from "@/components/tickets-ui";
import { fetchIsAdmin, fetchTickets, STATUS_LABELS } from "@/lib/tickets";
import type { TicketStatus } from "@/lib/tickets";
import { Route as AuthedRoute } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({
    meta: [
      { title: "My tickets — FixLog" },
      {
        name: "description",
        content: "File a new IT support ticket and follow the progress of every ticket you submitted.",
      },
      { property: "og:title", content: "My tickets — FixLog" },
      {
        property: "og:description",
        content: "File a new IT support ticket and follow the progress of your own tickets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketDesk,
});

const FILTERS: Array<{ key: "all" | TicketStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "open", label: STATUS_LABELS.open },
  { key: "in_progress", label: STATUS_LABELS.in_progress },
  { key: "resolved", label: STATUS_LABELS.resolved },
];

function TicketDesk() {
  const { user } = AuthedRoute.useRouteContext();
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin });
  const ticketsQuery = useQuery({
    queryKey: ["tickets", "mine"],
    queryFn: () => fetchTickets(true),
  });

  const tickets = ticketsQuery.data ?? [];
  const visible = useMemo(
    () => (filter === "all" ? tickets : tickets.filter((t) => t.status === filter)),
    [tickets, filter],
  );
  const current = tickets.find((t) => t.id === selected) ?? null;

  return (
    <AppShell
      subtitle="My support tickets"
      email={user.email}
      isAdmin={adminQuery.data === true}
    >
      <section className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-xl font-bold tracking-tight">File a ticket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the problem. IT picks it up from here and writes the fix back into the log.
        </p>
        <div className="mt-5">
          <NewTicketForm />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight">Your tickets</h2>
          <span className="stamp text-muted-foreground">{tickets.length} total</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
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

        <div className="mt-5">
          {ticketsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your tickets…</p>
          ) : ticketsQuery.isError ? (
            <p className="rounded-xl border border-priority-high/40 bg-priority-high/10 p-4 text-sm text-priority-high">
              Your tickets could not be loaded. Please refresh the page.
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nothing here yet. Use the form above to file your first ticket.
            </p>
          ) : (
            <TicketList tickets={visible} onSelect={setSelected} />
          )}
        </div>
      </section>

      <TicketDetailDialog
        ticket={current}
        onClose={() => setSelected(null)}
        canManage={adminQuery.data === true}
      />
    </AppShell>
  );
}
