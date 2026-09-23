import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusSchema = z.enum(["open", "in_progress", "resolved"]);
const prioritySchema = z.enum(["low", "medium", "high"]);
const categorySchema = z.enum(["Hardware", "Software", "Access"]);

const listSchema = z.object({ mine: z.boolean().default(true) }).strict();

const createSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(5000).default(""),
    priority: prioritySchema,
    category: categorySchema,
  })
  .strict();

const updateSchema = z
  .object({
    id: z.string().uuid(),
    patch: z
      .object({
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        status: statusSchema.optional(),
        priority: prioritySchema.optional(),
        category: categorySchema.optional(),
        resolution: z.string().max(5000).nullable().optional(),
        resolved_at: z.string().nullable().optional(),
      })
      .strict(),
  })
  .strict();

const deleteSchema = z.object({ id: z.string().uuid() }).strict();

const COLUMNS =
  "id,title,description,status,priority,category,resolution,resolved_at,created_at,updated_at,created_by";

/** True when the signed-in caller is an IT admin (verified admin email or granted role). */
export const getIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("is_admin");
    if (error) throw new Error("Could not check your access level");
    return { isAdmin: data === true };
  });

export const listTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    // RLS already limits rows to the caller's own tickets (admins see everything);
    // `mine` narrows an admin's view back to their own submissions.
    let query = context.supabase.from("tickets").select(COLUMNS);
    if (data.mine) query = query.eq("created_by", context.userId);
    const { data: rows, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error("Could not load tickets");
    return { tickets: rows ?? [] };
  });

export const createTicketFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("tickets")
      .insert({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        status: "open",
        created_by: context.userId,
      })
      .select(COLUMNS)
      .single();
    if (error) throw new Error("Could not create the ticket");
    return { ticket: row };
  });

export const updateTicketFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error, count } = await context.supabase
      .from("tickets")
      .update(data.patch as Record<string, never>, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error("Could not save the ticket");
    if (!count) throw new Error("This ticket could not be found");
    return { ok: true };
  });

export const deleteTicketFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tickets").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the ticket");
    return { ok: true };
  });
