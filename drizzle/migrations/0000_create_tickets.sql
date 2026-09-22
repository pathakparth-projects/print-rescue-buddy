create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 200),
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO anon;
GRANT ALL ON public.tickets TO service_role;

alter table public.tickets enable row level security;

create policy "Public tickets are readable"
  on public.tickets for select
  to anon, authenticated
  using (true);

create policy "Public tickets are insertable"
  on public.tickets for insert
  to anon, authenticated
  with check (true);

create policy "Public tickets are updatable"
  on public.tickets for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Public tickets are deletable"
  on public.tickets for delete
  to anon, authenticated
  using (true);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_touch_updated_at
  before update on public.tickets
  for each row execute function public.touch_updated_at();

insert into public.tickets (title, description, status, priority, resolution, resolved_at)
values (
  'Printer stuck — queue not clearing',
  'Print jobs were piling up in the queue and nothing would print. Jobs showed as stuck/spooling indefinitely.',
  'resolved',
  'high',
  'Cleared the stuck print queue and restarted the printer. Test page printed successfully.',
  now()
);
