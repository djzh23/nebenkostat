-- Einmaliges Wartungsskript für den Onboarding-Test.
-- Dieses Skript ist absichtlich KEINE automatisch laufende Produktivmigration.
-- Es lässt den Auth-Benutzer bestehen, damit dieselbe E-Mail weiterverwendet
-- werden kann. Gelöscht werden nur dessen Objekte und abhängige Testdaten.
--
-- Sicherheitsstopps:
-- 1. Es wird ausschließlich exakt diese E-Mail gesucht.
-- 2. Bei einer bereits abgeschlossenen Abrechnung wird abgebrochen.
-- 3. Das Skript läuft vollständig in einer Transaktion.

begin;

do $$
declare
  target_user_id uuid;
  property_count integer;
  finalized_count integer;
  deleted_property_count integer;
begin
  select id
    into target_user_id
    from auth.users
   where lower(email) = 'akhnokh94gabriel@gmail.com';

  if target_user_id is null then
    raise exception 'Testkonto akhnokh94gabriel@gmail.com wurde nicht gefunden. Es wurden keine Daten verändert.';
  end if;

  select count(*)
    into property_count
    from public.properties
   where user_id = target_user_id;

  select count(*)
    into finalized_count
    from public.statements
   where user_id = target_user_id
     and status = 'finalized';

  if finalized_count > 0 then
    raise exception 'Abbruch: Für dieses Konto existiert bereits eine abgeschlossene Abrechnung. Es wurden keine Daten verändert.';
  end if;

  delete from public.beta_feedback
   where user_id = target_user_id;

  delete from public.properties
   where user_id = target_user_id;

  get diagnostics deleted_property_count = row_count;

  raise notice 'Onboarding-Testkonto zurückgesetzt: % von % Objekt(en) gelöscht; Login-Konto bleibt bestehen.', deleted_property_count, property_count;
end;
$$;

commit;
