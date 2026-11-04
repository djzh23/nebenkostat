import { NextResponse } from "next/server";
import { isValidIsoDate } from "@/lib/domain/dates";
import { createClient } from "@/lib/supabase/server";
import { checkFinalizedStatement } from "@/lib/supabase/statement-lock";

type RouteContext = { params: Promise<{ propertyId: string; tenancyId: string }> };
const uuid = /^[0-9a-f-]{36}$/i;

function text(record: Record<string, unknown>, key: string, max: number): string | null {
  const value = record[key];
  if (value === undefined || value === null) return "";
  return typeof value === "string" && value.trim().length <= max ? value.trim() : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { propertyId, tenancyId } = await context.params;
  if (!uuid.test(propertyId) || !uuid.test(tenancyId)) return NextResponse.json({ detail: "Ungültige ID." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
  const lock = await checkFinalizedStatement(supabase, propertyId);
  if (lock.error) return NextResponse.json({ detail: "Das Mietverhältnis konnte nicht geprüft werden." }, { status: 502 });
  if (lock.locked) return NextResponse.json({ detail: "Eine Abrechnung dieses Objekts ist abgeschlossen. Änderungen an Mietverhältnissen sind gesperrt." }, { status: 409 });

  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 });
  const record = input as Record<string, unknown>;
  const unitId = typeof record.unitId === "string" ? record.unitId.trim() : "";
  const tenantName = typeof record.tenantName === "string" ? record.tenantName.trim() : "";
  const persons = typeof record.persons === "number" ? record.persons : Number(record.persons);
  const monthlyPrepaymentEur = typeof record.monthlyPrepaymentEur === "number" ? record.monthlyPrepaymentEur : Number(record.monthlyPrepaymentEur);
  const startDate = record.startDate;
  const endDate = record.endDate ? record.endDate : null;
  const prepaymentMode = record.prepaymentMode === undefined ? "kalendermonate" : record.prepaymentMode;
  const tenantStreet = text(record, "tenantStreet", 160);
  const tenantZip = text(record, "tenantZip", 20);
  const tenantCity = text(record, "tenantCity", 120);
  if (!uuid.test(unitId) || !tenantName || tenantName.length > 160 || !Number.isInteger(persons) || persons < 1 || persons > 100 || !Number.isFinite(monthlyPrepaymentEur) || monthlyPrepaymentEur < 0 || monthlyPrepaymentEur > 1_000_000) {
    return NextResponse.json({ detail: "Bitte Mietpartei, Personen und Vorauszahlung korrekt angeben." }, { status: 400 });
  }
  if (!isValidIsoDate(startDate) || (endDate !== null && !isValidIsoDate(endDate)) || (endDate !== null && endDate < startDate)) {
    return NextResponse.json({ detail: "Bitte gültige Ein- und Auszugsdaten angeben." }, { status: 400 });
  }
  if (prepaymentMode !== "kalendermonate" && prepaymentMode !== "taggenau") return NextResponse.json({ detail: "Die Vorauszahlungslogik ist ungültig." }, { status: 400 });
  if ([tenantStreet, tenantZip, tenantCity].some((value) => value === null)) return NextResponse.json({ detail: "Eine Adressangabe der Mietpartei ist zu lang oder ungültig." }, { status: 400 });

  const { data: unit } = await supabase.from("units").select("id").eq("id", unitId).eq("property_id", propertyId).maybeSingle();
  if (!unit) return NextResponse.json({ detail: "Einheit nicht gefunden." }, { status: 404 });
  const { data: existing, error: existingError } = await supabase.from("tenancies").select("id, unit_id, start_date, end_date").eq("id", tenancyId).maybeSingle();
  if (existingError || !existing) return NextResponse.json({ detail: "Mietverhältnis nicht gefunden." }, { status: 404 });
  const { data: otherTenancies, error: overlapError } = await supabase.from("tenancies").select("start_date, end_date").eq("unit_id", unitId).neq("id", tenancyId);
  if (overlapError) return NextResponse.json({ detail: "Das Mietverhältnis konnte nicht geprüft werden." }, { status: 502 });
  const candidateEnd = endDate ?? "9999-12-31";
  if ((otherTenancies ?? []).some((other) => startDate <= (other.end_date ?? "9999-12-31") && other.start_date <= candidateEnd)) {
    return NextResponse.json({ detail: "Dieses Mietverhältnis überschneidet sich mit einem bestehenden auf derselben Einheit." }, { status: 409 });
  }

  const { data: tenancy, error } = await supabase.from("tenancies").update({
    unit_id: unitId,
    tenant_name: tenantName,
    persons,
    monthly_prepayment_eur: monthlyPrepaymentEur,
    start_date: startDate,
    end_date: endDate,
    prepayment_mode: prepaymentMode,
    tenant_street: tenantStreet || null,
    tenant_zip: tenantZip || null,
    tenant_city: tenantCity || null,
  }).eq("id", tenancyId).eq("user_id", user.id).select("id, unit_id, tenant_name, persons, monthly_prepayment_eur, start_date, end_date, prepayment_mode, tenant_street, tenant_zip, tenant_city").maybeSingle();
  if (error) {
    console.error("Mietverhältnis konnte nicht aktualisiert werden.", error);
    return NextResponse.json({ detail: "Das Mietverhältnis konnte nicht gespeichert werden." }, { status: 502 });
  }
  if (!tenancy) return NextResponse.json({ detail: "Mietverhältnis nicht gefunden." }, { status: 404 });
  return NextResponse.json(tenancy);
}
