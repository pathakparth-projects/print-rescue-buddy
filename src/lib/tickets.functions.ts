import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const OWNER_COOKIE = "fixlog_owner";

const ownerKeySchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

const statusSchema = z.enum(["open", "in_progress", "resolved"]);
const prioritySchema = z.enum(["low", "medium", "high"]);

/** Optional client-held copy of the key, used when the cookie is unavailable (e.g. embedded previews). */
const fallbackSchema = z.object({ fallbackKey: ownerKeySchema.optional() }).strict();

const createSchema = fallbackSchema.extend({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(""),
  priority: prioritySchema,
});

const updateSchema = fallbackSchema.extend({
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

const deleteSchema = fallbackSchema.extend({ id: z.string().uuid() });

const COLUMNS =
  "id,title,description,status,priority,resolution,resolved_at,created_at,updated_at";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function newKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Identity for this browser: an HttpOnly cookie, with a client-stored fallback key
 * for contexts where cookies are blocked. Refreshed on every call so it keeps living.
 */
function resolveOwnerKey(fallbackKey?: string): string {
  let key = getCookie(OWNER_COOKIE);
  if (!key || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) key = fallbackKey ?? newKey();
  try {
    setCookie(OWNER_COOKIE, key, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 5,
    });
  } catch {
    // cookies unavailable — the client-side fallback key carries identity instead
  }
  return key;
}

/** Attach any not-yet-claimed rows (e.g. the seeded example) to the first browser that visits. */
async function claimUnowned(ownerKey: string) {
  const db = await admin();
  await db.from("tickets").update({ owner_key: ownerKey }).is("owner_key", null);
}

export const listTickets = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => fallbackSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const ownerKey = resolveOwnerKey(data.fallbackKey);
    await claimUnowned(ownerKey);
    const db = await admin();
    const { data: rows, error } = await db
      .from("tickets")
      .select(COLUMNS)
      .eq("owner_key", ownerKey)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load tickets");
    return { ownerKey, tickets: rows ?? [] };
  });

export const createTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerKey = resolveOwnerKey(data.fallbackKey);
    const db = await admin();
    const { data: row, error } = await db
      .from("tickets")
      .insert({
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "open",
        owner_key: ownerKey,
      })
      .select(COLUMNS)
      .single();
    if (error) throw new Error("Could not create the ticket");
    return { ownerKey, ticket: row };
  });

export const updateTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerKey = resolveOwnerKey(data.fallbackKey);
    const db = await admin();
    const { error, count } = await db
      .from("tickets")
      .update(data.patch as Record<string, never>, { count: "exact" })
      .eq("id", data.id)
      .eq("owner_key", ownerKey);
    if (error) throw new Error("Could not save the ticket");
    if (!count) throw new Error("This ticket could not be found");
    return { ownerKey };
  });

export const deleteTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerKey = resolveOwnerKey(data.fallbackKey);
    const db = await admin();
    const { error } = await db
      .from("tickets")
      .delete()
      .eq("id", data.id)
      .eq("owner_key", ownerKey);
    if (error) throw new Error("Could not delete the ticket");
    return { ownerKey };
  });
