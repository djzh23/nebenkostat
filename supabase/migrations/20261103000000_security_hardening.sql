-- Sicherheits-Härtung für den produktiven MVP-Pfad.
-- Die API prüft diese Regeln für bessere Fehlermeldungen; RLS erzwingt sie zusätzlich
-- für direkte Zugriffe mit dem öffentlichen Supabase-Schlüssel.

create or replace function public.property_has_finalized_statement(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.statements s
    join public.properties p on p.id = s.property_id
    where s.property_id = p_property_id
      and p.user_id = auth.uid()
      and s.status = 'finalized'
  );
$$;

create or replace function public.can_create_property(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id = auth.uid()
    and (select count(*) < 1 from public.properties where user_id = p_user_id);
$$;

create or replace function public.can_create_unit(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id = auth.uid()
    and (select count(*) < 5 from public.units where user_id = p_user_id);
$$;

revoke execute on function public.property_has_finalized_statement(uuid) from public;
revoke execute on function public.can_create_property(uuid) from public;
revoke execute on function public.can_create_unit(uuid) from public;
grant execute on function public.property_has_finalized_statement(uuid) to authenticated;
grant execute on function public.can_create_property(uuid) to authenticated;
grant execute on function public.can_create_unit(uuid) to authenticated;

-- Ein Objekt ist nur dann gültig, wenn die Eigentümer-ID dem eingeloggten Nutzer
-- entspricht und das Free-Limit nicht direkt an RLS vorbei umgangen wird.
drop policy if exists "Users can insert own properties" on public.properties;
drop policy if exists "Users can update own properties" on public.properties;
drop policy if exists "Users can delete own properties" on public.properties;

create policy "Users can insert own properties" on public.properties
  for insert with check (
    auth.uid() = user_id
    and public.can_create_property(auth.uid())
  );
create policy "Users can update own properties" on public.properties
  for update using (
    auth.uid() = user_id
    and not public.property_has_finalized_statement(id)
  ) with check (
    auth.uid() = user_id
    and not public.property_has_finalized_statement(id)
  );
create policy "Users can delete own properties" on public.properties
  for delete using (
    auth.uid() = user_id
    and not public.property_has_finalized_statement(id)
  );

-- Kindtabellen dürfen nur unter einem Objekt desselben Nutzers angelegt werden.
drop policy if exists "Users can insert own units" on public.units;
drop policy if exists "Users can update own units" on public.units;
drop policy if exists "Users can delete own units" on public.units;

create policy "Users can insert own units" on public.units
  for insert with check (
    auth.uid() = user_id
    and public.can_create_unit(auth.uid())
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  );
create policy "Users can update own units" on public.units
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  );
create policy "Users can delete own units" on public.units
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  );

drop policy if exists "Users can insert own tenancies" on public.tenancies;
drop policy if exists "Users can update own tenancies" on public.tenancies;
drop policy if exists "Users can delete own tenancies" on public.tenancies;

create policy "Users can insert own tenancies" on public.tenancies
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.units u
      join public.properties p on p.id = u.property_id
      where u.id = unit_id
        and u.user_id = auth.uid()
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  );
create policy "Users can update own tenancies" on public.tenancies
  for update using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.units u
      join public.properties p on p.id = u.property_id
      where u.id = unit_id
        and u.user_id = auth.uid()
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.units u
      join public.properties p on p.id = u.property_id
      where u.id = unit_id
        and u.user_id = auth.uid()
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  );
create policy "Users can delete own tenancies" on public.tenancies
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.units u
      join public.properties p on p.id = u.property_id
      where u.id = unit_id
        and u.user_id = auth.uid()
        and p.user_id = auth.uid()
        and not public.property_has_finalized_statement(p.id)
    )
  );

drop policy if exists "Users can insert own cost_items" on public.cost_items;
drop policy if exists "Users can update own cost_items" on public.cost_items;
drop policy if exists "Users can delete own cost_items" on public.cost_items;

create policy "Users can insert own cost_items" on public.cost_items
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.user_id = auth.uid()
        and not exists (
          select 1 from public.statements s
          where s.property_id = cost_items.property_id
            and s.billing_year = cost_items.billing_year
            and s.status = 'finalized'
        )
    )
  );
create policy "Users can update own cost_items" on public.cost_items
  for update using (
    auth.uid() = user_id
    and not exists (
      select 1 from public.statements s
      where s.property_id = cost_items.property_id
        and s.billing_year = cost_items.billing_year
        and s.status = 'finalized'
    )
  ) with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.statements s
      where s.property_id = cost_items.property_id
        and s.billing_year = cost_items.billing_year
        and s.status = 'finalized'
    )
  );
create policy "Users can delete own cost_items" on public.cost_items
  for delete using (
    auth.uid() = user_id
    and not exists (
      select 1 from public.statements s
      where s.property_id = cost_items.property_id
        and s.billing_year = cost_items.billing_year
        and s.status = 'finalized'
    )
  );

drop policy if exists "Users can insert own statements" on public.statements;
drop policy if exists "Users can update own statements" on public.statements;
drop policy if exists "Users can delete own statements" on public.statements;

create policy "Users can insert own statements" on public.statements
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );
create policy "Users can update own statements" on public.statements
  for update using (
    auth.uid() = user_id
    and status <> 'finalized'
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );
create policy "Users can delete own statements" on public.statements
  for delete using (
    auth.uid() = user_id
    and status <> 'finalized'
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

create or replace function public.prevent_finalized_statement_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'finalized' then
    raise exception 'finalized_statement_is_immutable'
      using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists prevent_finalized_statement_changes on public.statements;
create trigger prevent_finalized_statement_changes
  before update or delete on public.statements
  for each row execute function public.prevent_finalized_statement_changes();

-- Archivierte PDFs sind append-only. Die API darf neue Dateien anlegen, aber weder
-- vorhandene Statement-Dateien überschreiben noch löschen.
drop policy if exists "Users can update own statements" on storage.objects;
drop policy if exists "Users can delete own statements" on storage.objects;
