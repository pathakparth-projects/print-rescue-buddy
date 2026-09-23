-- Roles ---------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin = explicit role grant, or a VERIFIED email that matches the admin list.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      COALESCE((auth.jwt() ->> 'email_verified')::boolean, false)
      AND (
        lower(COALESCE(auth.jwt() ->> 'email', '')) = 'pathakparth131@gmail.com'
        OR lower(split_part(COALESCE(auth.jwt() ->> 'email', ''), '@', 2)) = 'admin.com'
      )
    )
    OR public.has_role(auth.uid(), 'admin')
$$;

-- Tickets ownership ---------------------------------------------------------
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by uuid;
CREATE INDEX IF NOT EXISTS tickets_created_by_idx ON public.tickets (created_by);

COMMENT ON COLUMN public.tickets.owner_key IS 'DEPRECATED: replaced by created_by (authenticated user id)';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;

CREATE POLICY "Owners and admins can read tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert their own tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners and admins can update tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Owners and admins can delete tickets"
  ON public.tickets FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());
