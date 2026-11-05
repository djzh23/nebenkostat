import Link from "next/link";
import {
  buttonPrimary,
  buttonQuiet,
  Notice,
  Panel,
  SectionHeading,
} from "../../_components/ui";

const workflow = [
  {
    number: "01",
    title: "Objekt anlegen",
    body: "Lege das Gebäude für das Abrechnungsjahr an und trage die Objektadresse ein. Diese Angaben werden später im Archiv und in den Mietparteien-PDFs verwendet.",
  },
  {
    number: "02",
    title: "Einheiten erfassen",
    body: "Füge jede Wohnung mit einer eindeutigen Bezeichnung und der Wohnfläche hinzu. Die Gesamtfläche bildet die Grundlage für flächenbezogene Kosten.",
  },
  {
    number: "03",
    title: "Mietverhältnisse eintragen",
    body: "Erfasse Mietpartei, Zeitraum, Personenzahl und Vorauszahlung. Mieterwechsel werden über die Zeiträume abgebildet; unbelegte Zeiträume bleiben als Leerstand sichtbar.",
  },
  {
    number: "04",
    title: "Kosten und Belege sammeln",
    body: "Trage jede Kostenposition einmal mit Betrag, Verteilungsschlüssel und zugehörigem Beleg ein. Nutze nur Kosten, die laut Mietvertrag und eigener Prüfung umlagefähig sind.",
  },
  {
    number: "05",
    title: "Rechenweg und Prüfliste kontrollieren",
    body: "Die Formel-Karten zeigen, wie jeder Anteil entsteht. Die Prüfliste markiert fehlende Belege, Lücken, Vorauszahlungen, Adressen und fachliche Sonderfälle.",
  },
  {
    number: "06",
    title: "Abschließen und PDFs verwenden",
    body: "Nach deiner Prüfung frierst du das Abrechnungsjahr ein. Danach bleibt die Berechnung unveränderlich, wird archiviert und kann als Gesamtübersicht oder als einzelne Mietparteien-PDF geöffnet werden.",
  },
] as const;

const keys = [
  ["Wohnfläche", "Kosten werden nach Fläche und Zeitanteil verteilt."],
  ["Personen", "Kosten werden nach Personen-Tagen verteilt. Leerstandszeiten werden nicht automatisch als Vermieteranteil bewertet."],
  ["Einheiten", "Kosten werden gleichmäßig auf die Einheiten und zeitanteilig auf die belegten Zeiträume verteilt."],
  ["Externe Direktabrechnung", "Ein bereits geprüfter Einzelbetrag wird genau einer Mietpartei zugeordnet."],
] as const;

export default function HelpPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <Link href="/app" className={`${buttonQuiet} min-h-0 text-sm`}>Zurück zur Übersicht</Link>
          <h1 className="mt-4 max-w-3xl font-sans text-[clamp(2.25rem,4vw,3.5rem)] font-black leading-none tracking-[-0.035em]">
            So funktioniert Nebenkostat
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Von den Eingaben zur nachvollziehbaren Betriebskostenaufstellung – Schritt für Schritt, mit sichtbarem Rechenweg.
          </p>
        </div>
        <Link href="/app/schnellstart" className={buttonPrimary}>Schnellstart öffnen</Link>
      </div>

      <Notice>
        Nebenkostat berechnet, archiviert und erzeugt PDFs. Die Auswahl umlagefähiger Kosten, die fachliche Prüfung und die Weitergabe der Abrechnung bleiben beim Vermieter.
      </Notice>

      <Panel>
        <SectionHeading note="Der empfohlene Ablauf">In sechs Schritten zur Abrechnung</SectionHeading>
        <ol className="divide-y divide-dashed divide-rule">
          {workflow.map((step) => (
            <li key={step.number} className="grid gap-3 py-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6">
              <span className="font-mono text-sm font-semibold text-stamp-deep">{step.number}</span>
              <div>
                <h3 className="font-sans text-xl font-bold">{step.title}</h3>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel>
          <SectionHeading>Was Nebenkostat erledigt</SectionHeading>
          <dl className="divide-y divide-dashed divide-rule">
            <div className="py-4 first:pt-0">
              <dt className="font-semibold">Berechnen</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-muted">Anteile pro Kostenposition, Mietpartei und Zeitraum mit nachvollziehbarer Formel.</dd>
            </div>
            <div className="py-4">
              <dt className="font-semibold">Archivieren</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-muted">Abgeschlossene Ergebnisse und hochgeladene Belege bleiben im privaten Konto zugänglich.</dd>
            </div>
            <div className="py-4 last:pb-0">
              <dt className="font-semibold">Exportieren</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-muted">Eine interne Gesamtübersicht und separate PDFs für einzelne Mietparteien.</dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <SectionHeading note="Jede Zahl bleibt prüfbar">Verteilungsschlüssel</SectionHeading>
          <div className="divide-y divide-dashed divide-rule">
            {keys.map(([title, description]) => (
              <div key={title} className="py-4 first:pt-0 last:pb-0">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel>
        <SectionHeading note="Vor dem Weitergeben prüfen">Was in deiner Verantwortung bleibt</SectionHeading>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          <div>
            <h3 className="font-sans text-lg font-bold">Kosten und Mietvertrag</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Prüfe, ob jede Position laufende Betriebskosten betrifft, im Mietvertrag vereinbart ist und zum gewählten Schlüssel passt. Verwaltung, Reparatur und Instandhaltung gehören nicht automatisch in die Abrechnung.</p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">Heizung und Warmwasser</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Nebenkostat erstellt keine automatische verbrauchsabhängige Heizkostenabrechnung. Übernimm nur eine bereits geprüfte Verbrauchs- oder externe Einzelabrechnung.</p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">Adressen und Belege</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Vervollständige Absender- und Empfängeradressen und ordne jeder Kostenposition den passenden Beleg zu. Die Prüfliste zeigt offene Punkte vor dem Abschluss.</p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">Versand und Aufbewahrung</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Verwende für jede Mietpartei nur deren eigenes PDF. Die Gesamtübersicht und das Belegarchiv bleiben intern. Bewahre außerdem den Nachweis der Weitergabe auf.</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <SectionHeading>Die zwei PDF-Arten</SectionHeading>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border-l-2 border-ink pl-5">
            <h3 className="font-sans text-xl font-bold">Archivierte Gesamtübersicht</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Für dich als Vermieter: alle Kosten, Rechenwege, Mietparteien, Salden und Leerstandsanteile. Dieses Dokument enthält Daten des gesamten Objekts.</p>
          </div>
          <div className="border-l-2 border-stamp pl-5">
            <h3 className="font-sans text-xl font-bold">Mietparteien-PDF</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Für eine konkrete Mietpartei: nur deren Zeitraum, Kostenanteil, Vorauszahlungen, Saldo und Rechenweg. Dieses PDF kannst du gezielt weitergeben.</p>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-5">
        <Link href="/app" className={buttonPrimary}>Zur Übersicht</Link>
        <Link href="/app/objekte/neu" className={buttonQuiet}>Objekt anlegen</Link>
      </div>
    </div>
  );
}
