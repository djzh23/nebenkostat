-- Produktionsdaten für versandfertige Abrechnungen und eine explizite
-- Vorauszahlungsregel bei Ein- und Auszügen.

alter table public.properties
  add column if not exists landlord_name text,
  add column if not exists landlord_street text,
  add column if not exists landlord_zip text,
  add column if not exists landlord_city text,
  add column if not exists landlord_email text;

alter table public.tenancies
  add column if not exists tenant_street text,
  add column if not exists tenant_zip text,
  add column if not exists tenant_city text,
  add column if not exists prepayment_mode text not null default 'kalendermonate'
    check (prepayment_mode in ('kalendermonate', 'taggenau'));
