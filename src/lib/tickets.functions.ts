import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ownerKeySchema = z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/);

const statusSchema = z.enum(["open", "in_progress", "resolved"]);
const prioritySchema = z.enum(["low", "medium", "high"]);

const listSchema = z.object({ ownerKey: ownerKeySchema });

const createSchema = z.object({
  ownerKey: ownerKeySchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(""),
  priority: prioritySchema,
});

const updateSchema = z.object({
  ownerKey: ownerKeySchema,
  id: z.string().uuid(),
  patch: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      status: statusSchema.optional(),
      priority: prioritySchema.optional(),
      resolution: z.string().max(5000).nullable().optional(),
      resolved_at: z.string().nullable().optional(),
    })
    .strict(),
});

const deleteSchema = z.object({ ownerKey: ownerKeySchema, id: z.string().uuid() });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Attach any not-yet-claimed rows (e.g. the seeded example) to the first device that visits. */
async function claimUnowned(ownerKey: string) {
  const db = await admin();
  await db.from("tickets").update({ owner_key: ownerKey }).is("owner_key", null);
}

export const listTickets = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async ({ data }) => {
    await claimUnowned(data.ownerKey);
    const db = await admin();
    const { data: rows, error } = await db
      .from("tickets")
      .select("id,title,description,status,priority,resolution,resolved_at,created_at,updated_at")
      .eq("owner_key", data.ownerKey)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load tickets");
    return rows ?? [];
  });

export const createTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("tickets")
      .insert({
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "open",
        owner_key: data.ownerKey,
      })
      .select("id,title,description,status,priority,resolution,resolved_at,created_at,updated_at")
      .single();
    if (error) throw new Error("Could not create the ticket");
    return row;
  });

export const updateTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db
      .from("tickets")
      .update(data.patch as Record<string, never>)
      .eq("id", data.id)
      .eq("owner_key", data.ownerKey);
    if (error) throw new Error("Could not save the ticket");
    return { ok: true };
  });

export const deleteTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db
      .from("tickets")
      .delete()
      .eq("id", data.id)
      .eq("owner_key", data.ownerKey);
    if (error) throw new Error("Could not delete the ticket");
    return { ok: true };
  });
