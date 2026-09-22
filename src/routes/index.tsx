import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
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
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setTitle("");
      setDescription("");
      setPriority("medium");
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
  const [resolution, setResolution] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
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
            <div className="grid grid-cols-2 gap-4">
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
      if (q && !`${t.title} ${t.description} ${t.resolution ?? ""}`.toLowerCase().includes(q))
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
