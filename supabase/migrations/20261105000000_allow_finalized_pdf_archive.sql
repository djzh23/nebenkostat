-- Erlaubt das einmalige Anhängen des archivierten PDF-Pfads an eine bereits
-- finalisierte Abrechnung. Alle anderen Felder bleiben nach Finalisierung unveränderlich.

drop policy if exists "Users can update own statements" on public.statements;

create policy "Users can update own statements" on public.statements
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
    and (
      status <> 'finalized'
      or (status = 'finalized' and pdf_path is null)
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
    and (
      status <> 'finalized'
      or (status = 'finalized' and pdf_path is not null)
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
    if tg_op <> 'UPDATE'
      or old.pdf_path is not null
      or new.pdf_path is null
      or new.id <> old.id
      or new.property_id <> old.property_id
      or new.user_id <> old.user_id
      or new.billing_year <> old.billing_year
      or new.status <> old.status
      or new.result is distinct from old.result
      or new.finalized_at is distinct from old.finalized_at then
      raise exception 'finalized_statement_is_immutable'
        using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
