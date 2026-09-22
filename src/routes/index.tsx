import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORIES,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
} from "@/lib/tickets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FixLog — IT Support Ticket Log" },
      {
        name: "description",
        content:
          "A personal support-ticket log: file IT issues, track their status, and record how each one was resolved.",
      },
      { property: "og:title", content: "FixLog — IT Support Ticket Log" },
      {
        property: "og:description",
        content:
          "File IT issues, track their status, and record how each one was resolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved"];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high"];

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "text-status-open border-status-open/40 bg-status-open/10",
  in_progress: "text-status-active border-status-active/40 bg-status-active/10",
  resolved: "text-status-resolved border-status-resolved/40 bg-status-resolved/10",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "text-priority-low border-priority-low/40 bg-priority-low/10",
  medium: "text-priority-medium border-priority-medium/40 bg-priority-medium/10",
  high: "text-priority-high border-priority-high/40 bg-priority-high/10",
};

const PRIORITY_DOTS: Record<TicketPriority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
};

const STATUS_DOT: Record<TicketStatus, string> = {
  open: "bg-status-open",
  in_progress: "bg-status-active",
  resolved: "bg-status-resolved",
};

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  Hardware: "var(--category-hardware)",
  Software: "var(--category-software)",
  Access: "var(--category-access)",
};

const CATEGORY_DOTS: Record<TicketCategory, string> = {
  Hardware: "bg-category-hardware",
  Software: "bg-category-software",
  Access: "bg-category-access",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`stamp inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${STATUS_STYLES[status]}`}
    >
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`stamp inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${PRIORITY_STYLES[priority]}`}
    >
      <span className={`size-1.5 rounded-full ${PRIORITY_DOTS[priority]}`} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className="stamp inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
      {category}
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-md">
      {label && <p className="stamp text-muted-foreground">{label}</p>}
      <p className="mt-0.5 text-sm font-semibold">
        {payload[0]?.value ?? 0} {payload[0]?.name ?? "tickets"}
      </p>
    </div>
  );
}

function TicketAnalytics({ tickets }: { tickets: Ticket[] }) {
  const dailyData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const ticket of tickets) {
      const day = ticket.created_at.slice(0, 10);
      totals.set(day, (totals.get(day) ?? 0) + 1);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, count]) => ({
        day: new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      }));
  }, [tickets]);

  const categoryData = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        count: tickets.filter(
          (ticket) => ticket.status === "open" && ticket.category === category,
        ).length,
      })),
    [tickets],
  );
  const openTotal = categoryData.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="grid gap-4 pb-6 md:grid-cols-[1.35fr_1fr]" aria-label="Ticket analytics">
      <div className="min-w-0 border-y border-border bg-card py-5 md:border md:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Tickets created</h2>
            <p className="stamp mt-1 text-muted-foreground">Daily · last 14 active days</p>
          </div>
          <span className="font-display text-2xl font-bold">{tickets.length}</span>
        </div>
        {dailyData.length ? (
          <div className="h-52 w-full" aria-label="Bar chart of tickets created per day">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" name="tickets" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No ticket history yet.</div>
        )}
      </div>

      <div className="min-w-0 border-y border-border bg-card py-5 md:border md:p-5">
        <div className="mb-2">
          <h2 className="font-display text-base font-semibold">Open by category</h2>
          <p className="stamp mt-1 text-muted-foreground">{openTotal} open total</p>
        </div>
        {openTotal ? (
          <div className="relative h-40 w-full" aria-label="Pie chart of open tickets by category">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="category" innerRadius={38} outerRadius={64} paddingAngle={2} stroke="var(--card)">
                  {categoryData.map((item) => (
                    <Cell key={item.category} fill={CATEGORY_COLORS[item.category]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-display text-2xl font-bold">{openTotal}</span>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No open tickets.</div>
        )}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {categoryData.map((item) => (
            <div key={item.category} className="min-w-0 text-center">
              <span className={`mx-auto mb-1 block size-2 rounded-full ${CATEGORY_DOTS[item.category]}`} />
              <p className="stamp truncate text-muted-foreground">{item.category}</p>
              <p className="text-sm font-semibold">{item.count}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

function NewTicketDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [category, setCategory] = useState<TicketCategory>("Hardware");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("Hardware");
      setError(null);
      onClose();
    },
    onError: () => setError("Could not save the ticket. Please try again."),
  });

  const submit = () => {
    if (!title.trim()) {
      setError("Give the ticket a title.");
      return;
    }
    create.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="New ticket">
      <div className="space-y-4">
        <div>
          <label className="stamp mb-1.5 block text-muted-foreground">Title</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wi-Fi keeps dropping on the laptop"
            maxLength={200}
          />
        </div>
        <div>
          <label className="stamp mb-1.5 block text-muted-foreground">
            What happened
          </label>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Symptoms, error messages, what you were doing when it broke…"
          />
        </div>
        <div>
          <label className="stamp mb-1.5 block text-muted-foreground">Category</label>
          <div className="flex gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`stamp rounded-md border px-3 py-1.5 transition-colors ${
                  category === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="stamp mb-1.5 block text-muted-foreground">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`stamp rounded-md border px-3 py-1.5 transition-colors ${
                  priority === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="stamp rounded-md border border-border px-4 py-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={create.isPending}
            className="stamp rounded-md bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? "Filing…" : "File ticket"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function TicketDetailDialog({
  ticket,
  onClose,
}: {
  ticket: Ticket | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TicketStatus>("open");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [category, setCategory] = useState<TicketCategory>("Hardware");
  const [resolution, setResolution] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setCategory(ticket.category);
      setResolution(ticket.resolution ?? "");
      setEditing(false);
      setError(null);
    }
  }, [ticket]);

  const save = useMutation({
    mutationFn: (vars: { id: string; resolved: boolean }) => {
      const patch: Parameters<typeof updateTicket>[1] = {
        status,
        priority,
        category,
        resolution: resolution.trim() || null,
      };
      if (status === "resolved" && !vars.resolved) {
        patch.resolved_at = new Date().toISOString();
      }
      return updateTicket(vars.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setEditing(false);
    },
    onError: () => setError("Could not save changes. Please try again."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onClose();
    },
    onError: () => setError("Could not delete the ticket. Please try again."),
  });

  if (!ticket) return null;

  const wasResolved = ticket.status === "resolved";

  return (
    <Dialog open={!!ticket} onClose={onClose} title={ticket.title}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="stamp rounded bg-muted px-2 py-1 text-muted-foreground">
            #{shortId(ticket.id)}
          </span>
          <PriorityBadge priority={ticket.priority} />
          <CategoryBadge category={ticket.category} />
          <span className="stamp text-muted-foreground">
            Filed {formatDate(ticket.created_at)}
          </span>
        </div>

        {ticket.description && (
          <div>
            <p className="stamp mb-1.5 text-muted-foreground">Description</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {ticket.description}
            </p>
          </div>
        )}

        {editing ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="stamp mb-1.5 block text-muted-foreground">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`stamp rounded-md border px-2.5 py-1.5 transition-colors ${
                        status === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="stamp mb-1.5 block text-muted-foreground">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={`stamp rounded-md border px-2.5 py-1.5 transition-colors ${
                        category === item
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="stamp mb-1.5 block text-muted-foreground">Priority</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`stamp rounded-md border px-2.5 py-1.5 transition-colors ${
                        priority === p
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="stamp mb-1.5 block text-muted-foreground">
                Resolution notes
              </label>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="What fixed it? Steps taken, parts replaced, settings changed…"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setError(null);
                  setStatus(ticket.status);
                  setPriority(ticket.priority);
                  setCategory(ticket.category);
                  setResolution(ticket.resolution ?? "");
                }}
                className="stamp rounded-md border border-border px-4 py-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => save.mutate({ id: ticket.id, resolved: wasResolved })}
                disabled={save.isPending}
                className="stamp rounded-md bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        ) : (
          <>
            {ticket.resolution && (
              <div className="rounded-lg border border-status-resolved/30 bg-status-resolved/5 p-4">
                <p className="stamp mb-1.5 text-status-resolved">Resolution</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {ticket.resolution}
                </p>
                {ticket.resolved_at && (
                  <p className="stamp mt-2 text-muted-foreground">
                    Resolved {formatDate(ticket.resolved_at)}
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button
                onClick={() => remove.mutate(ticket.id)}
                disabled={remove.isPending}
                className="stamp rounded-md border border-destructive/40 px-3 py-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {remove.isPending ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="stamp rounded-md bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90"
              >
                Update ticket
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

function App() {
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  const visible = useMemo(() => {
    if (!tickets) return [];
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (q && !`${t.title} ${t.description} ${t.category} ${t.resolution ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tickets, filter, search]);

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0 };
    for (const t of tickets ?? []) c[t.status] += 1;
    return c;
  }, [tickets]);

  const selected = tickets?.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="paper-grain min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
              ✕
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">FixLog</h1>
              <p className="stamp text-muted-foreground">IT support ticket log</p>
            </div>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="stamp flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span className="text-base leading-none">+</span> New ticket
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24">
        <div className="grid grid-cols-3 gap-3 py-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={`rounded-xl border bg-card p-4 text-left transition-colors ${
                filter === s ? "border-ring ring-2 ring-ring/20" : "hover:border-input"
              }`}
            >
              <p className="font-display text-3xl font-bold">{counts[s]}</p>
              <p className={`stamp mt-1 ${STATUS_STYLES[s].split(" ")[0]}`}>
                {STATUS_LABELS[s]}
              </p>
            </button>
          ))}
        </div>

        {!isLoading && !error && <TicketAnalytics tickets={tickets ?? []} />}

        <div className="flex flex-wrap items-center gap-2 pb-5">
          {(["all", ...STATUSES] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`stamp rounded-full border px-3.5 py-1.5 transition-colors ${
                filter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className={`${inputClass} ml-auto max-w-56`}
          />
        </div>

        {isLoading && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading tickets…
          </p>
        )}
        {error && (
          <p className="py-16 text-center text-sm text-destructive">
            Couldn't load tickets. Check your connection and refresh.
          </p>
        )}
        {!isLoading && !error && visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/60 py-16 text-center">
            <p className="font-display text-lg font-semibold">
              {tickets && tickets.length > 0 ? "No matching tickets" : "No tickets yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tickets && tickets.length > 0
                ? "Try a different filter or search."
                : "File your first IT issue to start the log."}
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {visible.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setSelectedId(t.id)}
                className="w-full rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-input hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <CategoryBadge category={t.category} />
                  <span className="stamp ml-auto text-muted-foreground">
                    {formatDate(t.created_at)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold leading-snug">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                )}
                {t.resolution && (
                  <p className="mt-2 line-clamp-1 text-sm italic text-status-resolved">
                    ✓ {t.resolution}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      </main>

      <NewTicketDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <TicketDetailDialog
        ticket={selected}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
