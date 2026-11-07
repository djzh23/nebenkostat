import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 4_000;
const FEEDBACK_COOLDOWN_MS = 60_000;

export async function POST(request: Request) {
  const { supabase, user, error: userError } = await getAuthenticatedContext();

  if (userError || !user || !user.email) {
    return NextResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 });
  }

  if (!input || typeof input !== "object") {
    return NextResponse.json({ detail: "Ungültige Eingabe." }, { status: 400 });
  }

  const record = input as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const wantsBetaUpdates = record.wantsBetaUpdates === true;

  if (message.length < 5 || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { detail: `Bitte zwischen 5 und ${MAX_MESSAGE_LENGTH} Zeichen eingeben.` },
      { status: 400 },
    );
  }

  const cooldownSince = new Date(Date.now() - FEEDBACK_COOLDOWN_MS).toISOString();
  const { data: recent, error: recentError } = await supabase
    .from("beta_feedback")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", cooldownSince)
    .limit(1);

  if (recentError) {
    console.error("Beta-Feedback konnte nicht geprüft werden.", recentError);
    return NextResponse.json({ detail: "Feedback ist gerade nicht verfügbar." }, { status: 502 });
  }

  if (recent && recent.length > 0) {
    return NextResponse.json(
      { detail: "Danke — bitte sende erst in einer Minute weiteres Feedback." },
      { status: 429 },
    );
  }

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id,
    email: user.email,
    message,
    wants_beta_updates: wantsBetaUpdates,
  });

  if (error) {
    console.error("Beta-Feedback konnte nicht gespeichert werden.", error);
    return NextResponse.json({ detail: "Feedback konnte nicht gespeichert werden." }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
