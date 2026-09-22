-- Lock down tickets: no direct anon/authenticated access.
-- Access is mediated by server functions scoped to a per-device owner key.

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS owner_key text;

CREATE INDEX IF NOT EXISTS tickets_owner_key_idx ON public.tickets (owner_key);

DROP POLICY IF EXISTS "Public tickets are readable" ON public.tickets;
DROP POLICY IF EXISTS "Public tickets are insertable" ON public.tickets;
DROP POLICY IF EXISTS "Public tickets are updatable" ON public.tickets;
DROP POLICY IF EXISTS "Public tickets are deletable" ON public.tickets;

REVOKE ALL ON public.tickets FROM anon;
REVOKE ALL ON public.tickets FROM authenticated;
GRANT ALL ON public.tickets TO service_role;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
