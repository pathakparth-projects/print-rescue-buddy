import {
  listTickets,
  createTicketFn,
  updateTicketFn,
  deleteTicketFn,
  getIsAdmin,
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
  created_by: string | null;
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

export interface TicketPatch {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  resolution?: string | null;
  resolved_at?: string | null;
}

export async function fetchIsAdmin(): Promise<boolean> {
  const result = await getIsAdmin({ data: undefined as never });
  return result.isAdmin;
}

/** `mine: false` returns the global log — only admins are allowed to see it. */
export async function fetchTickets(mine = true): Promise<Ticket[]> {
  const result = await listTickets({ data: { mine } as never });
  return result.tickets as unknown as Ticket[];
}

export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  const result = await createTicketFn({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      category: input.category,
    } as never,
  });
  return result.ticket as unknown as Ticket;
}

export async function updateTicket(id: string, patch: TicketPatch): Promise<void> {
  await updateTicketFn({ data: { id, patch } as never });
}

export async function deleteTicket(id: string): Promise<void> {
  await deleteTicketFn({ data: { id } as never });
}
