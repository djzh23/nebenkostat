"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { settlementYear } from "@/lib/domain/settlement";
import { upsertProperty } from "@/lib/domain/store";
import { buttonPrimary, buttonQuiet, ErrorText, fieldInput, fieldLabel, fieldText, Panel, SectionHeading } from "../../_components/ui";

type CreatedProperty = {
  id: string;
  name: string;
  street: string | null;
  zip: string | null;
  city: string | null;
};

function isCreatedProperty(value: unknown): value is CreatedProperty {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    (typeof record.street === "string" || record.street === null) &&
    (typeof record.zip === "string" || record.zip === null) &&
    (typeof record.city === "string" || record.city === null)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

async function postJson(path: string, payload: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const detail = isRecord(result) && typeof result.detail === "string" ? result.detail : "Der Schritt konnte nicht gespeichert werden.";
    throw new Error(detail);
  }
  return result;
}

export function QuickstartForm() {
  const router = useRouter();
  const year = settlementYear();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setCreatedPropertyId(null);

    let property: CreatedProperty | null = null;
    try {
      const propertyResult = await postJson("/api/properties", {
        name: String(form.get("propertyName") ?? ""),
        street: String(form.get("street") ?? ""),
        zip: String(form.get("zip") ?? ""),
        city: String(form.get("city") ?? ""),
      });
      if (!isCreatedProperty(propertyResult)) throw new Error("Die API hat kein gültiges Objekt zurückgegeben.");
      property = propertyResult;
      setCreatedPropertyId(property.id);
      upsertProperty({
        id: property.id,
        name: property.name,
        street: property.street ?? "",
        zip: property.zip ?? "",
        city: property.city ?? "",
        landlordName: "",
        landlordStreet: "",
        landlordZip: "",
        landlordCity: "",
        landlordEmail: "",
      });

      const unitOne = await postJson(`/api/properties/${property.id}/units`, {
        label: String(form.get("unitOneLabel") ?? ""),
        areaM2: Number(form.get("unitOneArea")),
      });
      if (!isRecord(unitOne) || typeof unitOne.id !== "string") throw new Error("Die erste Einheit konnte nicht bestätigt werden.");

      const unitTwo = await postJson(`/api/properties/${property.id}/units`, {
        label: String(form.get("unitTwoLabel") ?? ""),
        areaM2: Number(form.get("unitTwoArea")),
      });
      if (!isRecord(unitTwo) || typeof unitTwo.id !== "string") throw new Error("Die zweite Einheit konnte nicht bestätigt werden.");

      const cost = await postJson(`/api/properties/${property.id}/costs`, {
        billingYear: year,
        category: String(form.get("category") ?? "Wasser"),
        amountEur: Number(form.get("amountEur")),
        distributionKey: "flaeche",
      });
      if (!isRecord(cost) || typeof cost.id !== "string") throw new Error("Die Kostenposition konnte nicht bestätigt werden.");

      router.push(`/app/objekte/${property.id}/${year}/abrechnung`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Der Schnellstart konnte nicht abgeschlossen werden.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app" className={`${buttonQuiet} min-h-0 text-sm`}>Zur Übersicht</Link>
        <h1 className="mt-4 font-sans text-[clamp(2.25rem,4vw,3.25rem)] font-black leading-none tracking-[-0.03em]">
          Deine erste Formel-Karte
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink-muted">
          Ein Objekt, zwei Einheiten und eine Kostenposition. Danach siehst du den vollständigen Rechenweg für {year}.
        </p>
      </div>

      <Panel className="max-w-4xl">
        <form onSubmit={onSubmit} className="space-y-10">
          <section>
            <SectionHeading note="1 von 3">Objekt</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="quickstart-property-name" className={fieldLabel}>Name des Objekts <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-property-name" name="propertyName" required autoComplete="off" placeholder="z. B. Haus Lindenweg" className={fieldText} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="quickstart-street" className={fieldLabel}>Straße und Hausnummer</label>
                <input id="quickstart-street" name="street" autoComplete="street-address" className={fieldText} />
              </div>
              <div>
                <label htmlFor="quickstart-zip" className={fieldLabel}>PLZ</label>
                <input id="quickstart-zip" name="zip" inputMode="numeric" autoComplete="postal-code" className={fieldInput} />
              </div>
              <div>
                <label htmlFor="quickstart-city" className={fieldLabel}>Ort</label>
                <input id="quickstart-city" name="city" autoComplete="address-level2" className={fieldText} />
              </div>
            </div>
          </section>

          <section>
            <SectionHeading note="2 von 3">Einheiten</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="quickstart-unit-one-label" className={fieldLabel}>Bezeichnung 1 <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-one-label" name="unitOneLabel" required defaultValue="EG links" className={fieldText} />
              </div>
              <div>
                <label htmlFor="quickstart-unit-one-area" className={fieldLabel}>Wohnfläche in m² <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-one-area" name="unitOneArea" required type="number" min="0.01" step="0.01" defaultValue="62" className={fieldInput} />
              </div>
              <div>
                <label htmlFor="quickstart-unit-two-label" className={fieldLabel}>Bezeichnung 2 <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-two-label" name="unitTwoLabel" required defaultValue="OG rechts" className={fieldText} />
              </div>
              <div>
                <label htmlFor="quickstart-unit-two-area" className={fieldLabel}>Wohnfläche in m² <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-two-area" name="unitTwoArea" required type="number" min="0.01" step="0.01" defaultValue="118" className={fieldInput} />
              </div>
            </div>
          </section>

          <section>
            <SectionHeading note="3 von 3">Eine Kostenposition</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="quickstart-category" className={fieldLabel}>Kostenart <span className="text-stamp-deep">*</span></label>
                <select id="quickstart-category" name="category" defaultValue="Wasser" className={fieldText}>
                  <option>Wasser</option>
                  <option>Müll</option>
                  <option>Grundsteuer</option>
                  <option>Versicherung</option>
                  <option>Beleuchtung</option>
                  <option>Sonstige Kosten</option>
                </select>
              </div>
              <div>
                <label htmlFor="quickstart-amount" className={fieldLabel}>Gesamtbetrag in € <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-amount" name="amountEur" required type="number" min="0.01" step="0.01" defaultValue="1200" className={fieldInput} />
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Die erste Kostenposition wird nach Wohnfläche verteilt. Den Rechenweg kannst du danach direkt prüfen.</p>
          </section>

          <div className="space-y-4 border-t border-ink pt-6">
            {error ? <ErrorText>{error}</ErrorText> : null}
            {createdPropertyId && error ? (
              <p className="text-sm text-ink-muted">
                Das Objekt wurde bereits angelegt. <Link className="font-semibold underline underline-offset-4" href={`/app/objekte/${createdPropertyId}/${year}`}>Zum Objekt</Link>
              </p>
            ) : null}
            <button type="submit" disabled={pending} aria-busy={pending} className={buttonPrimary}>
              {pending ? "Formel-Karte wird vorbereitet …" : "Erste Formel-Karte anzeigen"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
