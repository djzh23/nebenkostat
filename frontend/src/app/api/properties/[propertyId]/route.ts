import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/supabase/server";
import { checkFinalizedStatement } from "@/lib/supabase/statement-lock";

type RouteContext = { params: Promise<{ propertyId: string }> };

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function optionalText(record: Record<string, unknown>, key: string, max: number): string | null {
  const value = record[key];
  if (value === undefined || value === null) return "";
  return typeof value === "string" && value.trim().length <= max ? value.trim() : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { propertyId } = await context.params;
  if (!validUuid(propertyId)) return NextResponse.json({ detail: "Ungültige Objekt-ID." }, { status: 400 });

  const { supabase, user, error: userError } = await getAuthenticatedContext();
  if (userError || !user) return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });

  const lock = await checkFinalizedStatement(supabase, propertyId);
  if (lock.error) {
    console.error("Abschlussstatus konnte vor dem Ändern der Stammdaten nicht geprüft werden.", lock.error);
    return NextResponse.json({ detail: "Die Stammdaten konnten nicht geprüft werden." }, { status: 502 });
  }
  if (lock.locked) return NextResponse.json({ detail: "Eine Abrechnung dieses Objekts ist abgeschlossen. Stammdaten sind gesperrt." }, { status: 409 });

  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 });
  const record = input as Record<string, unknown>;
  const name = optionalText(record, "name", 120);
  const street = optionalText(record, "street", 160);
  const zip = optionalText(record, "zip", 20);
  const city = optionalText(record, "city", 120);
  const landlordName = optionalText(record, "landlordName", 160);
  const landlordStreet = optionalText(record, "landlordStreet", 160);
  const landlordZip = optionalText(record, "landlordZip", 20);
  const landlordCity = optionalText(record, "landlordCity", 120);
  const landlordEmail = optionalText(record, "landlordEmail", 254);
  if (!name) return NextResponse.json({ detail: "Bitte einen Namen mit 1 bis 120 Zeichen angeben." }, { status: 400 });
  if ([street, zip, city, landlordName, landlordStreet, landlordZip, landlordCity, landlordEmail].some((value) => value === null)) {
    return NextResponse.json({ detail: "Eine Angabe ist zu lang oder ungültig." }, { status: 400 });
  }

  const { data: property, error } = await supabase
    .from("properties")
    .update({
      name,
      street: street || null,
      zip: zip || null,
      city: city || null,
      landlord_name: landlordName || null,
      landlord_street: landlordStreet || null,
      landlord_zip: landlordZip || null,
      landlord_city: landlordCity || null,
      landlord_email: landlordEmail || null,
    })
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .select("id, name, street, zip, city, landlord_name, landlord_street, landlord_zip, landlord_city, landlord_email")
    .maybeSingle();

  if (error) {
    console.error("Objekt konnte nicht aktualisiert werden.", error);
    return NextResponse.json({ detail: "Die Stammdaten konnten nicht gespeichert werden." }, { status: 502 });
  }
  if (!property) return NextResponse.json({ detail: "Objekt nicht gefunden." }, { status: 404 });
  return NextResponse.json(property);
}
