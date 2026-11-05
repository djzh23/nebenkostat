"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { buttonPrimary, buttonQuiet, Panel, SectionHeading } from "../../_components/ui";

const DISMISSED_KEY = "nebenkostat:first-run-onboarding:dismissed";

function subscribeNever() {
  return () => {};
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

const steps = [
  ["01", "Objekt anlegen", "Adresse und Abrechnungsjahr festlegen."],
  ["02", "Daten erfassen", "Einheiten, Mietverhältnisse, Kosten und Belege eintragen."],
  ["03", "Rechenweg prüfen", "Formeln kontrollieren und erst danach PDFs erzeugen."],
] as const;

export function FirstRunOnboarding() {
  const dismissed = useSyncExternalStore(subscribeNever, readDismissed, () => false);
  const [dismissedThisVisit, setDismissedThisVisit] = useState(false);

  if (dismissed || dismissedThisVisit) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // The local dismissal still applies for this visit when storage is unavailable.
    }
    setDismissedThisVisit(true);
  }

  return (
    <Panel className="border-l-2 border-stamp">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-stamp-deep">Erster Durchlauf · ca. 5 Minuten</p>
          <SectionHeading note="Du kannst jederzeit überspringen">Dein erster Weg zur Formel-Karte</SectionHeading>
          <p className="max-w-2xl text-base leading-relaxed text-ink-muted">
            Starte mit einem echten Objekt. Nebenkostat führt dich von den Eingaben zum nachvollziehbaren Rechenweg und lässt dich jeden Schritt vor dem PDF-Export prüfen.
          </p>
        </div>
        <button type="button" onClick={dismiss} className={`${buttonQuiet} min-h-0 text-sm`}>
          Später erkunden
        </button>
      </div>

      <ol className="mt-7 grid gap-5 border-y border-dashed border-rule py-5 md:grid-cols-3 md:gap-8">
        {steps.map(([number, title, description]) => (
          <li key={number} className="grid grid-cols-[2rem_1fr] gap-3">
            <span className="font-mono text-sm font-semibold text-stamp-deep">{number}</span>
            <div>
              <h3 className="font-sans font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <Link href="/app/schnellstart" className={buttonPrimary}>
          Schnellstart beginnen
        </Link>
        <Link href="/app/hilfe" className={buttonQuiet}>
          Ablauf ansehen
        </Link>
      </div>
    </Panel>
  );
}
