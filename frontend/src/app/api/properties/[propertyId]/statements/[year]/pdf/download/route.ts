import { NextResponse } from "next/server";
import { createTenantStatementPdf, normalizeStatementResult } from "@/lib/pdf/statement-pdf";
import { getAuthenticatedContext } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ propertyId: string; year: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { propertyId, year: yearParam } = await context.params;
  const year = Number(yearParam);
  const tenancyId = new URL(request.url).searchParams.get("tenancyId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(propertyId) || !/^[0-9a-f-]{36}$/i.test(tenancyId) || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ detail: "Ungültige Abrechnungsdaten." }, { status: 400 });
  }

  const { supabase, user, error: userError } = await getAuthenticatedContext();
  if (userError || !user) {
    return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
  }

  const { data: statement, error: statementError } = await supabase
    .from("statements")
    .select("status, result, finalized_at")
    .eq("property_id", propertyId)
    .eq("billing_year", year)
    .maybeSingle();
  if (statementError) {
    console.error("Abrechnung konnte für den Mietparteien-PDF-Export nicht geladen werden.", statementError);
    return NextResponse.json({ detail: "Die Abrechnung konnte nicht geladen werden." }, { status: 502 });
  }
  if (!statement) return NextResponse.json({ detail: "Abrechnung nicht gefunden." }, { status: 404 });
  if (statement.status !== "finalized" || typeof statement.finalized_at !== "string") {
    return NextResponse.json({ detail: "Nur abgeschlossene Abrechnungen können versendet werden." }, { status: 409 });
  }

  const result = normalizeStatementResult(statement.result);
  if (!result || result.year !== year) {
    return NextResponse.json({ detail: "Das eingefrorene Abrechnungsergebnis ist ungültig." }, { status: 409 });
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("name, street, zip, city, landlord_name, landlord_street, landlord_zip, landlord_city, landlord_email")
    .eq("id", propertyId)
    .maybeSingle();
  if (propertyError) {
    console.error("Objekt konnte für den Mietparteien-PDF-Export nicht geladen werden.", propertyError);
    return NextResponse.json({ detail: "Das Objekt konnte nicht geladen werden." }, { status: 502 });
  }
  if (!property) return NextResponse.json({ detail: "Objekt nicht gefunden." }, { status: 404 });

  try {
    const pdf = await createTenantStatementPdf(property, result, statement.finalized_at, tenancyId);
    const body = pdf.bytes.buffer.slice(pdf.bytes.byteOffset, pdf.bytes.byteOffset + pdf.bytes.byteLength) as ArrayBuffer;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Mietparteien-PDF konnte nicht erzeugt werden.", error);
    return NextResponse.json({ detail: "Das Mietparteien-PDF konnte nicht erzeugt werden." }, { status: 409 });
  }
}
