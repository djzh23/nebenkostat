import Link from "next/link";
import type { ReactNode } from "react";
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
    body: "Gib dem Objekt einen Namen und trage die echte Adresse ein. Wähle das Abrechnungsjahr, für das du die Kosten sammeln möchtest.",
    click: "Klicke oben auf „Objekt anlegen“ oder starte den „Schnellstart“.",
    after: "Danach öffnet sich die Objektseite. Dort siehst du dein neues Objekt und die nächsten Eingabefelder.",
  },
  {
    number: "02",
    title: "Einheiten erfassen",
    body: "Lege jede Wohnung einzeln an. Verwende eine klare Bezeichnung wie „Erdgeschoss links“ und trage die Wohnfläche in Quadratmetern ein.",
    click: "Klicke im Bereich „Einheiten“ auf „Einheit hinzufügen“ und speichere jede Wohnung.",
    after: "Die Wohnungen erscheinen als Liste. Die Gesamtfläche wird automatisch angezeigt.",
  },
  {
    number: "03",
    title: "Mietverhältnisse eintragen",
    body: "Trage pro Wohnung die Mietpartei, Beginn und Ende des Mietzeitraums, die Personenzahl und die monatliche Vorauszahlung ein.",
    click: "Klicke im Bereich „Mietverhältnisse“ auf „Mietverhältnis hinzufügen“ und fülle die Felder aus.",
    after: "Das Mietverhältnis erscheint unter der passenden Wohnung. Ein Mieterwechsel wird durch einen zweiten Zeitraum erfasst.",
  },
  {
    number: "04",
    title: "Kosten und Belege sammeln",
    body: "Lege jede Rechnung als eigene Kostenposition an. Wähle Betrag und passenden Verteilungsschlüssel und lade den zugehörigen Beleg hoch.",
    click: "Klicke im Bereich „Kosten und Belege“ auf „Kosten hinzufügen“ und danach auf „Kosten speichern“.",
    after: "Die Kostenposition erscheint in der Liste. Fehlende Belege werden deutlich als offener Punkt markiert.",
  },
  {
    number: "05",
    title: "Rechenweg und Prüfliste kontrollieren",
    body: "Öffne die Abrechnung und lies die Formel-Karten. Prüfe außerdem jeden Hinweis in der Prüfliste, auch wenn der Export nicht automatisch blockiert wird.",
    click: "Klicke beim Objekt auf „Abrechnung“. Scrolle zu „Formel-Karten“ und zur „Prüfliste vor dem Versand“.",
    after: "Du siehst für jede Kostenposition die Eingaben, den Rechenweg und den Anteil pro Mietpartei.",
  },
  {
    number: "06",
    title: "Abschließen und PDFs verwenden",
    body: "Schließe die Abrechnung erst ab, wenn die Daten und offenen Hinweise geprüft sind. Danach bleibt dieses Abrechnungsjahr unveränderlich archiviert.",
    click: "Klicke unten auf „Abrechnung abschließen“ und bestätige anschließend bewusst.",
    after: "Danach öffnest du entweder das archivierte Gesamt-PDF oder beim jeweiligen Saldo das PDF für genau diese Mietpartei.",
  },
] as const;

const formulaExamples = [
  {
    title: "Wohnfläche",
    rule: "Kosten × Fläche × Tage ÷ (Gesamtfläche × Jahrestage)",
    example: "1.200,00\u00a0€ × 60 m² × 90 Tage ÷ (100 m² × 365 Tage)",
    result: "177,53\u00a0€ für Anna Beispiel",
    note: "Der Nenner bleibt fest. Dadurch wird ein nicht belegter Zeitraum als Leerstand sichtbar.",
  },
  {
    title: "Personen",
    rule: "Kosten × Personen-Tage ÷ Summe aller Personen-Tage",
    example: "365,00\u00a0€ × 1 Person × 90 Tage ÷ 1.034 Personen-Tage",
    result: "31,77\u00a0€ für Anna Beispiel",
    note: "Personen-Tage entstehen aus Personenzahl × belegten Tagen. Leerstandszeiten werden nicht automatisch bewertet.",
  },
  {
    title: "Einheiten",
    rule: "Kosten × Tage ÷ (Anzahl Einheiten × Jahrestage)",
    example: "600,00\u00a0€ × 90 Tage ÷ (2 Einheiten × 365 Tage)",
    result: "73,97\u00a0€ für eine Einheit",
    note: "Jede Einheit erhält denselben Grundanteil; der Zeitraum wird zusätzlich taggenau berücksichtigt.",
  },
  {
    title: "Externe Direktabrechnung",
    rule: "Externer Einzelbetrag × 1",
    example: "250,00\u00a0€ × 1",
    result: "250,00\u00a0€ für das ausgewählte Mietverhältnis",
    note: "Das ist keine eigene Heizkostenberechnung. Der externe Nachweis und die richtige Zuordnung bleiben maßgeblich.",
  },
] as const;

function PreviewFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="border border-ink/20 bg-desk p-3">
      <div className="receipt min-h-52 px-4 py-5 text-sm">
        <div className="mb-4 flex items-center justify-between border-b border-ink pb-2">
          <span className="font-sans font-bold">Nebenkostat</span>
          <span className="font-mono text-[0.65rem] text-ink-muted">VORSCHAU · MUSTERDATEN</span>
        </div>
        {children}
      </div>
      <figcaption className="px-1 pt-3 text-sm font-semibold text-ink-muted">{label}</figcaption>
    </figure>
  );
}

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
        <SectionHeading note="Du brauchst keine Vorkenntnisse">Die wichtigsten Schaltflächen</SectionHeading>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          <div>
            <h3 className="font-sans text-lg font-bold">Hauptbutton</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Der rote Button speichert einen Schritt oder führt dich weiter. Lies den Text auf dem Button: „Kosten speichern“ speichert Kosten, „Abrechnung abschließen“ beendet das Abrechnungsjahr.</p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">Unterstrichener Link</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Ein unterstrichener Text öffnet eine andere Ansicht oder führt zurück, zum Beispiel „Zur Übersicht“ oder „PDF laden“.</p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">„Bearbeiten“</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Damit änderst du eine offene Einheit, ein Mietverhältnis oder eine Kostenposition. Nach dem Abschluss des Abrechnungsjahres sind diese Daten bewusst gesperrt.</p>
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold">„Prüfen“</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">Ein roter Hinweis bedeutet: Bitte diesen Punkt lesen und selbst kontrollieren. Die App entscheidet nicht automatisch, ob eine Kostenposition fachlich passt.</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <SectionHeading note="Drei Stationen, ein roter Faden">So sieht der Weg in der App aus</SectionHeading>
        <div className="grid gap-6 lg:grid-cols-3">
          <PreviewFrame label="1 · Schnellstart: Objekt, Einheiten und eine Kostenposition">
            <p className="font-sans text-lg font-bold">Deine erste Formel-Karte</p>
            <div className="mt-4 space-y-2 text-xs text-ink-muted">
              <div className="border border-rule px-3 py-2">Musterstraße 12 · 12345 Beispielstadt</div>
              <div className="border border-rule px-3 py-2">2 Einheiten · Wohnfläche</div>
              <div className="border border-rule px-3 py-2">Wasser · 1.200,00{"\u00a0"}€</div>
            </div>
            <p className="mt-4 font-semibold text-stamp-deep">Erste Formel-Karte anzeigen</p>
          </PreviewFrame>

          <PreviewFrame label="2 · Formel-Karte: Anteil mit Rechenweg">
            <p className="font-sans text-lg font-bold">Wasser</p>
            <p className="mt-2 text-xs text-ink-muted">Verteilung nach Wohnfläche</p>
            <div className="mt-5 border-l-2 border-stamp pl-3">
              <p className="font-mono text-xs leading-relaxed tabular-nums">1.200,00{"\u00a0"}€ × 60 m² × 90 Tage</p>
              <p className="font-mono text-xs leading-relaxed tabular-nums">÷ (100 m² × 365 Tage)</p>
            </div>
            <p className="mt-5 text-right font-mono text-xl font-semibold tabular-nums">177,53{"\u00a0"}€</p>
          </PreviewFrame>

          <PreviewFrame label="3 · Ergebnis: Saldo und PDF-Ausgabe">
            <p className="font-sans text-lg font-bold">Saldo je Mietpartei</p>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-dashed border-rule pb-2"><span>Anna Beispiel</span><span className="whitespace-nowrap font-mono">90,70{"\u00a0"}€ Guthaben</span></div>
              <div className="flex justify-between border-b border-dashed border-rule pb-2"><span>Bernd Muster</span><span className="whitespace-nowrap font-mono">47,68{"\u00a0"}€ Nachzahlung</span></div>
              <div className="flex justify-between"><span>Clara Test</span><span className="whitespace-nowrap font-mono">162,31{"\u00a0"}€ Guthaben</span></div>
            </div>
            <p className="mt-5 font-semibold underline decoration-ink/40 underline-offset-4">Mieter-PDF laden</p>
          </PreviewFrame>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Die Vorschauen zeigen den Zusammenhang: erst Eingaben, dann die sichtbare Rechnung, danach Ergebnis und getrennte PDF-Ausgabe. Du musst nicht alles auf einmal kennen.
        </p>
      </Panel>

      <Panel>
        <SectionHeading note="Der empfohlene Ablauf">In sechs Schritten zur Abrechnung</SectionHeading>
        <ol className="divide-y divide-dashed divide-rule">
          {workflow.map((step) => (
            <li key={step.number} className="grid gap-3 py-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6">
              <span className="font-mono text-sm font-semibold text-stamp-deep">{step.number}</span>
              <div>
                <h3 className="font-sans text-xl font-bold">{step.title}</h3>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink-muted">{step.body}</p>
                <div className="mt-4 grid gap-2 border-l-2 border-rule pl-4 text-sm leading-relaxed text-ink-muted sm:grid-cols-2 sm:gap-6">
                  <p><span className="font-semibold text-ink">Du klickst:</span> {step.click}</p>
                  <p><span className="font-semibold text-ink">Danach siehst du:</span> {step.after}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel>
        <SectionHeading note="Ein vollständiges, nachvollziehbares Beispiel">Von den Eingaben zum Saldo</SectionHeading>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h3 className="font-sans text-xl font-bold">Beispieldaten</h3>
            <dl className="mt-5 divide-y divide-dashed divide-rule text-sm">
              <div className="flex justify-between gap-4 py-3"><dt>Wasser</dt><dd className="font-mono tabular-nums">1.200,00{"\u00a0"}€ · Wohnfläche</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt>Müll</dt><dd className="font-mono tabular-nums">365,00{"\u00a0"}€ · Personen</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt>Heizung</dt><dd className="font-mono tabular-nums">250,00{"\u00a0"}€ · direkt an Bernd Muster</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt>Einheiten</dt><dd className="font-mono tabular-nums">60 m² + 40 m²</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt>Personen-Tage</dt><dd className="font-mono tabular-nums">1.034 insgesamt</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt>Vorauszahlungen</dt><dd className="font-mono tabular-nums">Anna: 300{"\u00a0"}€ · Bernd: 700{"\u00a0"}€ · Clara: 900{"\u00a0"}€</dd></div>
            </dl>
          </div>
          <div className="border-l-2 border-stamp pl-5">
            <p className="font-mono text-sm leading-relaxed tabular-nums text-ink-muted">
              Wasser: 1.200,00{"\u00a0"}€ × 60 m² × 90 Tage ÷ (100 m² × 365 Tage) = 177,53{"\u00a0"}€
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
              Für Anna Beispiel kommen 31,77{"\u00a0"}€ Müll und 177,53{"\u00a0"}€ Wasser zusammen. Die Kosten betragen 209,30{"\u00a0"}€. Davon werden 300,00{"\u00a0"}€ Vorauszahlungen abgezogen:
            </p>
            <p className="mt-4 font-mono text-2xl font-semibold tabular-nums">209,30{"\u00a0"}€ − 300,00{"\u00a0"}€ = −90,70{"\u00a0"}€</p>
            <p className="mt-3 font-semibold text-stamp-deep">Ergebnis: 90,70{"\u00a0"}€ Guthaben</p>
          </div>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="mb-3 text-left font-semibold">Zusammenfassung des Beispiels</caption>
            <thead>
              <tr className="border-y border-ink text-left font-mono text-xs uppercase tracking-wider">
                <th className="py-3 pr-4">Mietpartei</th>
                <th className="py-3 pr-4">Kosten</th>
                <th className="py-3 pr-4">Vorauszahlungen</th>
                <th className="py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-rule">
              <tr><th scope="row" className="py-3 pr-4 text-left font-semibold">Anna Beispiel</th><td className="whitespace-nowrap py-3 pr-4 font-mono">209,30{"\u00a0"}€</td><td className="whitespace-nowrap py-3 pr-4 font-mono">300,00{"\u00a0"}€</td><td className="whitespace-nowrap py-3 text-right font-mono">90,70{"\u00a0"}€ Guthaben</td></tr>
              <tr><th scope="row" className="py-3 pr-4 text-left font-semibold">Bernd Muster</th><td className="whitespace-nowrap py-3 pr-4 font-mono">747,68{"\u00a0"}€</td><td className="whitespace-nowrap py-3 pr-4 font-mono">700,00{"\u00a0"}€</td><td className="whitespace-nowrap py-3 text-right font-mono">47,68{"\u00a0"}€ Nachzahlung</td></tr>
              <tr><th scope="row" className="py-3 pr-4 text-left font-semibold">Clara Test</th><td className="whitespace-nowrap py-3 pr-4 font-mono">737,69{"\u00a0"}€</td><td className="whitespace-nowrap py-3 pr-4 font-mono">900,00{"\u00a0"}€</td><td className="whitespace-nowrap py-3 text-right font-mono">162,31{"\u00a0"}€ Guthaben</td></tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <SectionHeading note="Die Formeln stehen auch in jeder Abrechnung">Die vier Verteilungsschlüssel</SectionHeading>
        <div className="grid gap-6 md:grid-cols-2">
          {formulaExamples.map((item) => (
            <article key={item.title} className="border border-rule p-5">
              <h3 className="font-sans text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm text-ink-muted">{item.rule}</p>
              <p className="mt-4 border-l-2 border-stamp pl-3 font-mono text-sm leading-relaxed tabular-nums">{item.example}</p>
              <p className="mt-4 font-mono text-lg font-semibold tabular-nums">{item.result}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.note}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 border-l-2 border-ink px-4 py-3 text-sm leading-relaxed text-ink-muted">
          Einzelbeträge werden auf Cent gerundet. Bei Flächen- und Einheitenschlüsseln wird die Differenz als „Leerstand (Vermieter)“ ausgewiesen, damit die Kostenposition vollständig aufgeht.
        </p>
      </Panel>

      <section className="grid gap-10 lg:grid-cols-2">
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
          <SectionHeading>Vorauszahlungen und Saldo</SectionHeading>
          <p className="text-sm leading-relaxed text-ink-muted">
            Der Saldo ist immer: Kostenanteil minus angerechnete Vorauszahlungen. Standardmäßig zählt jeder berührte Kalendermonat als voller Vorauszahlungsmonat; optional kann taggenau gerechnet werden.
          </p>
          <p className="mt-5 border-l-2 border-stamp pl-4 font-mono text-sm leading-relaxed tabular-nums">
            747,68{"\u00a0"}€ Kosten − 700,00{"\u00a0"}€ Vorauszahlungen = 47,68{"\u00a0"}€ Nachzahlung
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Ein negatives Ergebnis wird als Guthaben angezeigt. Tatsächliche Zahlungseingänge prüft die App nicht.
          </p>
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

      <Notice>
        Musterhinweis: Alle Namen, Adressen und Zahlen auf dieser Hilfe-Seite sind frei erfundene Beispiele. „Anna Beispiel“, „Bernd Muster“, „Clara Test“, „Musterstraße 12“ und „12345 Beispielstadt“ sind keine echten Personen oder Adressen. In deinem Objekt trägst du ausschließlich deine eigenen Daten ein.
      </Notice>

      <div className="flex flex-wrap items-center gap-5">
        <Link href="/app" className={buttonPrimary}>Zur Übersicht</Link>
        <Link href="/app/objekte/neu" className={buttonQuiet}>Objekt anlegen</Link>
      </div>
    </div>
  );
}
