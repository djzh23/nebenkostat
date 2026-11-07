import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/supabase/server";
import { checkFinalizedStatement } from "@/lib/supabase/statement-lock";
import { overlapsCalendarYear } from "@/lib/domain/dates";

type RouteContext = { params: Promise<{ propertyId: string; costId: string }> };
const distributionKeys = new Set(["flaeche", "personen", "einheiten", "direkt"]);

export async function PATCH(request: Request, context: RouteContext) {
  const { propertyId, costId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(propertyId) || !/^[0-9a-f-]{36}$/i.test(costId)) return NextResponse.json({ detail: "Ungültige ID." }, { status: 400 });
  const { supabase, user, error: userError } = await getAuthenticatedContext();
  if (userError || !user) return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
  const { data: existing } = await supabase.from("cost_items").select("id, billing_year").eq("id", costId).eq("property_id", propertyId).maybeSingle();
  if (!existing) return NextResponse.json({ detail: "Kostenposition nicht gefunden." }, { status: 404 });
  const lock = await checkFinalizedStatement(supabase, propertyId, existing.billing_year);
  if (lock.error) return NextResponse.json({ detail: "Die Kostenposition konnte nicht geprüft werden." }, { status: 502 });
  if (lock.locked) return NextResponse.json({ detail: `Die Abrechnung ${existing.billing_year} ist abgeschlossen. Änderungen sind gesperrt.` }, { status: 409 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 });
  const record = input as Record<string, unknown>;
  const category = typeof record.category === "string" ? record.category.trim() : "";
  const amountEur = typeof record.amountEur === "number" ? record.amountEur : Number(record.amountEur);
  const distributionKey = typeof record.distributionKey === "string" ? record.distributionKey : "";
  const directTenancyId = typeof record.directTenancyId === "string" ? record.directTenancyId.trim() : "";
  if (!category || category.length > 160 || !Number.isFinite(amountEur) || amountEur <= 0 || amountEur > 100_000_000 || !distributionKeys.has(distributionKey)) {
    return NextResponse.json({ detail: "Kostenart, Betrag oder Verteilungsschlüssel sind ungültig." }, { status: 400 });
  }
  if (distributionKey === "direkt" && !/^[0-9a-f-]{36}$/i.test(directTenancyId)) return NextResponse.json({ detail: "Bitte ein Mietverhältnis für die externe Direktabrechnung auswählen." }, { status: 400 });
  if (distributionKey !== "direkt" && directTenancyId) return NextResponse.json({ detail: "Ein Mietverhältnis darf nur bei einer externen Direktabrechnung verknüpft werden." }, { status: 400 });
  if (distributionKey === "direkt") {
    const { data: units } = await supabase.from("units").select("id").eq("property_id", propertyId);
    const { data: tenancy } = await supabase.from("tenancies").select("id, unit_id, start_date, end_date").eq("id", directTenancyId).maybeSingle();
    if (tenancy && !overlapsCalendarYear(tenancy.start_date, tenancy.end_date, existing.billing_year)) return NextResponse.json({ detail: "Das Ziel-MietverhÃ¤ltnis ist im Abrechnungsjahr nicht aktiv." }, { status: 400 });
    if (!tenancy || !(units ?? []).some((unit) => unit.id === tenancy.unit_id)) return NextResponse.json({ detail: "Das Ziel-Mietverhältnis gehört nicht zu diesem Objekt." }, { status: 400 });
  }
  const { data: cost, error } = await supabase.from("cost_items").update({ category, amount_eur: amountEur, distribution_key: distributionKey, direct_tenancy_id: distributionKey === "direkt" ? directTenancyId : null }).eq("id", costId).eq("property_id", propertyId).eq("user_id", user.id).select("id, property_id, billing_year, category, amount_eur, distribution_key, direct_tenancy_id, receipt_path").maybeSingle();
  if (error) {
    console.error("Kostenposition konnte nicht aktualisiert werden.", error);
    return NextResponse.json({ detail: "Die Kostenposition konnte nicht gespeichert werden." }, { status: 502 });
  }
  if (!cost) return NextResponse.json({ detail: "Kostenposition nicht gefunden." }, { status: 404 });
  return NextResponse.json(cost);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { propertyId, costId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(propertyId) || !/^[0-9a-f-]{36}$/i.test(costId)) {
    return NextResponse.json({ detail: "Ungültige ID." }, { status: 400 });
  }

  const { supabase, user, error: userError } = await getAuthenticatedContext();

  if (userError || !user) {
    return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
  }

  const { data: cost } = await supabase
    .from("cost_items")
    .select("id, billing_year")
    .eq("id", costId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (!cost) {
    return NextResponse.json({ detail: "Kostenposition nicht gefunden." }, { status: 404 });
  }

  const lock = await checkFinalizedStatement(supabase, propertyId, cost.billing_year);
  if (lock.error) {
    console.error("Abschlussstatus konnte vor dem Löschen der Kosten nicht geprüft werden.", lock.error);
    return NextResponse.json({ detail: "Die Kostenposition konnte nicht geprüft werden." }, { status: 502 });
  }
  if (lock.locked) {
    return NextResponse.json(
      { detail: `Die Abrechnung ${cost.billing_year} ist abgeschlossen. Änderungen sind gesperrt.` },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("cost_items")
    .delete()
    .eq("id", costId)
    .eq("property_id", propertyId);

  if (error) {
    console.error("Kostenposition konnte in Supabase nicht gelöscht werden.", error);
    return NextResponse.json({ detail: "Die Kostenposition konnte nicht gelöscht werden." }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
