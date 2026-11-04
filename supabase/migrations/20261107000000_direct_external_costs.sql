-- Externe Einzelabrechnungen werden einem konkreten Mietverhältnis zugeordnet.
-- Die App berechnet Heiz- oder Warmwasserkosten nicht selbst nach HeizkostenV.

alter table public.cost_items
  drop constraint if exists cost_items_distribution_key_check;

alter table public.cost_items
  add constraint cost_items_distribution_key_check
  check (distribution_key in ('flaeche', 'personen', 'einheiten', 'direkt'));

alter table public.cost_items
  add column if not exists direct_tenancy_id uuid references public.tenancies(id) on delete restrict;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cost_items_direct_tenancy_check'
      and conrelid = 'public.cost_items'::regclass
  ) then
    alter table public.cost_items
      add constraint cost_items_direct_tenancy_check
      check (
        (distribution_key = 'direkt' and direct_tenancy_id is not null)
        or (distribution_key <> 'direkt' and direct_tenancy_id is null)
      );
  end if;
end $$;

create or replace function public.validate_direct_cost_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.distribution_key = 'direkt' and not exists (
    select 1
    from public.tenancies t
    join public.units u on u.id = t.unit_id
    where t.id = new.direct_tenancy_id
      and t.user_id = new.user_id
      and u.property_id = new.property_id
      and u.user_id = new.user_id
      and t.start_date <= make_date(new.billing_year, 12, 31)
      and (t.end_date is null or t.end_date >= make_date(new.billing_year, 1, 1))
  ) then
    raise exception 'direct_cost_tenancy_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_direct_cost_item on public.cost_items;
create trigger validate_direct_cost_item
  before insert or update on public.cost_items
  for each row execute function public.validate_direct_cost_item();
