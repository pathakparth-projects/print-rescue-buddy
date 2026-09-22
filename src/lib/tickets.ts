import {
  listTickets,
  createTicketFn,
  updateTicketFn,
  deleteTicketFn,
} from "@/lib/tickets.functions";

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high";
export type TicketCategory = "Hardware" | "Software" | "Access";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
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

export const CATEGORIES: TicketCategory[] = ["Hardware", "Software", "Access"];

export interface NewTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

const OWNER_KEY_STORAGE = "fixlog.owner-key";

/** Backup copy of the browser identity, for contexts where cookies are blocked. */
function readFallbackKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(OWNER_KEY_STORAGE) ?? undefined;
  } catch {
    return undefined;
  }
}

function rememberKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OWNER_KEY_STORAGE, key);
  } catch {
    // storage blocked — the server cookie carries identity instead
  }
}

function payload(extra: Record<string, unknown> = {}) {
  const fallbackKey = readFallbackKey();
  return fallbackKey ? { fallbackKey, ...extra } : extra;
}

export async function fetchTickets(): Promise<Ticket[]> {
  const result = await listTickets({ data: payload() as never });
  rememberKey(result.ownerKey);
  return result.tickets as Ticket[];
}

export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  const result = await createTicketFn({
    data: payload({
      title: input.title,
      description: input.description,
      priority: input.priority,
      category: input.category,
    }) as never,
  });
  rememberKey(result.ownerKey);
  return result.ticket as Ticket;
}

export interface TicketPatch {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  resolution?: string | null;
  resolved_at?: string | null;
}

export async function updateTicket(id: string, patch: TicketPatch): Promise<void> {
  const result = await updateTicketFn({ data: payload({ id, patch }) as never });
  rememberKey(result.ownerKey);
}

export async function deleteTicket(id: string): Promise<void> {
  const result = await deleteTicketFn({ data: payload({ id }) as never });
  rememberKey(result.ownerKey);
}
