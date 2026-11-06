"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { settlementYear } from "@/lib/domain/settlement";
import { upsertCost, upsertProperty, upsertUnit } from "@/lib/domain/store";
import type { CostItem, KeyType, Unit } from "@/lib/domain/types";
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

function parseUnit(value: unknown, propertyId: string): Unit | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.property_id !== "string" || value.property_id !== propertyId) {
    return null;
  }

  const areaM2 = Number(value.area_m2);
  if (typeof value.label !== "string" || !Number.isFinite(areaM2) || areaM2 <= 0) return null;

  return {
    id: value.id,
    propertyId,
    label: value.label,
    areaHundredths: Math.round(areaM2 * 100),
  };
}

function isKeyType(value: unknown): value is KeyType {
  return value === "flaeche" || value === "personen" || value === "einheiten" || value === "direkt";
}

function parseCost(value: unknown, propertyId: string): CostItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.property_id !== "string" ||
    value.property_id !== propertyId ||
    typeof value.category !== "string" ||
    !isKeyType(value.distribution_key)
  ) {
    return null;
  }

  const year = Number(value.billing_year);
  const amountEur = Number(value.amount_eur);
  if (!Number.isInteger(year) || !Number.isFinite(amountEur) || amountEur <= 0) return null;

  return {
    id: value.id,
    propertyId,
    year,
    category: value.category,
    amountCents: Math.round(amountEur * 100),
    key: value.distribution_key,
    directTenancyId: typeof value.direct_tenancy_id === "string" ? value.direct_tenancy_id : null,
    receipts: typeof value.receipt_path === "string" && value.receipt_path ? [value.receipt_path] : [],
  };
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
      const parsedUnitOne = parseUnit(unitOne, property.id);
      if (!parsedUnitOne) throw new Error("Die erste Einheit konnte nicht bestätigt werden.");
      upsertUnit(parsedUnitOne);

      const unitTwo = await postJson(`/api/properties/${property.id}/units`, {
        label: String(form.get("unitTwoLabel") ?? ""),
        areaM2: Number(form.get("unitTwoArea")),
      });
      const parsedUnitTwo = parseUnit(unitTwo, property.id);
      if (!parsedUnitTwo) throw new Error("Die zweite Einheit konnte nicht bestätigt werden.");
      upsertUnit(parsedUnitTwo);

      const cost = await postJson(`/api/properties/${property.id}/costs`, {
        billingYear: year,
        category: String(form.get("category") ?? "Wasser"),
        amountEur: Number(form.get("amountEur")),
        distributionKey: "flaeche",
      });
      const parsedCost = parseCost(cost, property.id);
      if (!parsedCost) throw new Error("Die Kostenposition konnte nicht bestätigt werden.");
      upsertCost(parsedCost);

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
              <div className="sm:col-span-2">
                <span className={fieldLabel}>Abrechnungsjahr</span>
                <div aria-label={`Abrechnungsjahr ${year}`} aria-readonly="true" className={`${fieldText} flex items-center bg-desk text-ink-muted`}>
                  {year}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  Dieses Jahr ist für den Schnellstart festgelegt. Die Abrechnung entsteht für das Vorjahr.
                </p>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading note="2 von 3">Einheiten</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="quickstart-unit-one-label" className={fieldLabel}>Bezeichnung 1 <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-one-label" name="unitOneLabel" required placeholder="z. B. EG links" className={fieldText} />
              </div>
              <div>
                <label htmlFor="quickstart-unit-one-area" className={fieldLabel}>Wohnfläche in m² <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-one-area" name="unitOneArea" required type="number" min="0.01" step="0.01" placeholder="z. B. 60" className={fieldInput} />
              </div>
              <div>
                <label htmlFor="quickstart-unit-two-label" className={fieldLabel}>Bezeichnung 2 <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-two-label" name="unitTwoLabel" required placeholder="z. B. OG rechts" className={fieldText} />
              </div>
              <div>
                <label htmlFor="quickstart-unit-two-area" className={fieldLabel}>Wohnfläche in m² <span className="text-stamp-deep">*</span></label>
                <input id="quickstart-unit-two-area" name="unitTwoArea" required type="number" min="0.01" step="0.01" placeholder="z. B. 40" className={fieldInput} />
              </div>
            </div>
          </section>

          <section>
            <SectionHeading note="3 von 3">Eine Kostenposition</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="quickstart-category" className={fieldLabel}>Kostenart <span className="text-stamp-deep">*</span></label>
                <select id="quickstart-category" name="category" defaultValue="" required className={fieldText}>
                  <option value="">Bitte auswählen</option>
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
