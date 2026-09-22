import { supabase } from "@/integrations/supabase/client";

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

export async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ticket[];
}

export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: "open" as TicketStatus,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
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
  const { error } = await supabase.from("tickets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) throw error;
}
