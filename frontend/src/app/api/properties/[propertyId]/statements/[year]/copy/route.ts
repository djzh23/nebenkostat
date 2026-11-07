import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ propertyId: string; year: string }> };

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function validYear(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 2000 && value <= 2100;
}

export async function POST(request: Request, context: RouteContext) {
  const { propertyId, year: yearParam } = await context.params;
  const year = Number(yearParam);
  if (!validUuid(propertyId) || !validYear(year)) {
    return NextResponse.json({ detail: "Ungültige Abrechnungsdaten." }, { status: 400 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 });
  }
  const sourceYear = input && typeof input === "object" && "sourceYear" in input
    ? Number((input as { sourceYear?: unknown }).sourceYear)
    : NaN;
  if (!validYear(sourceYear) || sourceYear === year) {
    return NextResponse.json({ detail: "Bitte ein anderes gültiges Vorjahr auswählen." }, { status: 400 });
  }

  const { supabase, user, error: userError } = await getAuthenticatedContext();
  if (userError || !user) {
    return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle();
  if (propertyError) {
    console.error("Objekt konnte zum Kopieren der Vorjahresabrechnung nicht geladen werden.", propertyError);
    return NextResponse.json({ detail: "Das Objekt konnte nicht geladen werden." }, { status: 502 });
  }
  if (!property) {
    return NextResponse.json({ detail: "Objekt nicht gefunden." }, { status: 404 });
  }

  const { data: targetStatement, error: targetStatementError } = await supabase
    .from("statements")
    .select("status")
    .eq("property_id", propertyId)
    .eq("billing_year", year)
    .maybeSingle();
  if (targetStatementError) {
    console.error("Zielabrechnung konnte vor dem Kopieren nicht geprüft werden.", targetStatementError);
    return NextResponse.json({ detail: "Die Zielabrechnung konnte nicht geprüft werden." }, { status: 502 });
  }
  if (targetStatement?.status === "finalized") {
    return NextResponse.json({ detail: `Die Abrechnung ${year} ist bereits abgeschlossen.` }, { status: 409 });
  }

  const { data: existingTargetCosts, error: existingTargetError } = await supabase
    .from("cost_items")
    .select("id")
    .eq("property_id", propertyId)
    .eq("billing_year", year)
    .limit(1);
  if (existingTargetError) {
    console.error("Zielkosten konnten vor dem Kopieren nicht geprüft werden.", existingTargetError);
    return NextResponse.json({ detail: "Die Zielkosten konnten nicht geprüft werden." }, { status: 502 });
  }
  if (existingTargetCosts && existingTargetCosts.length > 0) {
    return NextResponse.json(
      { detail: `Für ${year} gibt es bereits Kostenpositionen. Kopieren wurde zur Sicherheit nicht ausgeführt.` },
      { status: 409 },
    );
  }

  const { data: sourceCosts, error: sourceError } = await supabase
    .from("cost_items")
    .select("category, description, amount_eur, distribution_key")
    .eq("property_id", propertyId)
    .eq("billing_year", sourceYear)
    .neq("distribution_key", "direkt")
    .order("created_at", { ascending: true });
  if (sourceError) {
    console.error("Vorjahreskosten konnten nicht geladen werden.", sourceError);
    return NextResponse.json({ detail: "Die Vorjahreskosten konnten nicht geladen werden." }, { status: 502 });
  }
  if (!sourceCosts || sourceCosts.length === 0) {
    return NextResponse.json({ detail: `Für ${sourceYear} wurden keine Kostenpositionen gefunden.` }, { status: 404 });
  }

  const rows = sourceCosts.map((cost) => ({
    property_id: propertyId,
    user_id: user.id,
    billing_year: year,
    category: cost.category,
    description: cost.description,
    amount_eur: cost.amount_eur,
    distribution_key: cost.distribution_key,
    receipt_path: null,
  }));
  const { data: copiedCosts, error: insertError } = await supabase
    .from("cost_items")
    .insert(rows)
    .select("id, property_id, billing_year, category, amount_eur, distribution_key, receipt_path");
  if (insertError || !copiedCosts) {
    console.error("Vorjahreskosten konnten nicht kopiert werden.", insertError);
    return NextResponse.json({ detail: "Die Vorjahreskosten konnten nicht kopiert werden." }, { status: 502 });
  }

  return NextResponse.json({ sourceYear, targetYear: year, copiedCount: copiedCosts.length, costs: copiedCosts }, { status: 201 });
}
