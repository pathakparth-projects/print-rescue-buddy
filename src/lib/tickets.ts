import {
  listTickets,
  createTicketFn,
  updateTicketFn,
  deleteTicketFn,
} from "@/lib/tickets.functions";

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface NewTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
}

const OWNER_KEY_STORAGE = "fixlog.owner-key";

/** Stable per-device secret that scopes this browser's tickets. */
function getOwnerKey(): string {
  if (typeof window === "undefined") return "";
  let key = window.localStorage.getItem(OWNER_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(OWNER_KEY_STORAGE, key);
  }
  return key;
}

export async function fetchTickets(): Promise<Ticket[]> {
  const ownerKey = getOwnerKey();
  if (!ownerKey) return [];
  const rows = await listTickets({ data: { ownerKey } });
  return rows as Ticket[];
}

export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  const row = await createTicketFn({
    data: {
      ownerKey: getOwnerKey(),
      title: input.title,
      description: input.description,
      priority: input.priority,
    },
  });
  return row as Ticket;
}

export interface TicketPatch {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  resolution?: string | null;
  resolved_at?: string | null;
}

export async function updateTicket(id: string, patch: TicketPatch): Promise<void> {
  await updateTicketFn({ data: { ownerKey: getOwnerKey(), id, patch } });
}

export async function deleteTicket(id: string): Promise<void> {
  await deleteTicketFn({ data: { ownerKey: getOwnerKey(), id } });
}
