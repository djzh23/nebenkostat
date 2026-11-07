import { ReceiptCalculator } from "./_components/receipt-calculator";
import { CalculatorCta } from "./_components/calculator-cta";
import { ButtonLink } from "@/components/ui/button";
import { Receipt } from "@/components/ui/receipt";
import { Container, Section, SplitSection } from "@/components/ui/layout";
import { PageTitle, SectionTitle } from "@/components/ui/heading";

const benefits = [
  ["Rechenwege nachvollziehen", "Sieh bei jeder Umlage, wie sich der Anteil zusammensetzt."],
  ["Mietzeiträume berücksichtigen", "Nebenkostat berücksichtigt hinterlegte Mietzeiträume bei der Verteilung."],
  ["Belege zusammenhalten", "Sammle Belege je Objekt und Abrechnungsjahr. Lade sie bei Bedarf als ZIP herunter."],
] as const;

const steps = [
  ["Objekt und Wohnungen anlegen", "Trage Objekt, Wohnungen und Wohnflächen ein."],
  ["Mietverhältnisse, Kosten und Belege erfassen", "Hinterlege Mietzeiträume, Kostenpositionen, Schlüssel und Nachweise."],
  ["Prüfen und als PDF herunterladen", "Sieh dir Rechenwege und Salden an, bevor du die Abrechnung abschließt."],
] as const;

const keys = [
  ["Flächenschlüssel", "Kosten × Wohnfläche ÷ Gesamtfläche × Zeitanteil"],
  ["Personenschlüssel", "Kosten × Personen-Tage ÷ Summe aller Personen-Tage"],
  ["Einheitenschlüssel", "Kosten ÷ Anzahl Einheiten × Zeitanteil"],
] as const;

const freeFeatures = [
  "1 Objekt mit bis zu 5 Wohneinheiten",
  "Kostenpositionen; Belege bis 10 MB je Datei",
  "Abrechnung berechnen und als PDF exportieren",
  "Belegarchiv als ZIP exportieren",
];

const disclaimer = "Erstellt mit Nebenkostat · Angaben bitte vor dem Versand prüfen.";

export default function Home() {
  return (
    <>
      <header className="border-b border-ink/10">
        <Container className="flex items-center justify-between gap-6 py-5">
          <a href="#top" className="font-sans text-lg font-black tracking-tight">
            Nebenkostat
          </a>
          <nav aria-label="Hauptnavigation" className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#ablauf" className="underline-offset-4 hover:underline">So funktioniert&apos;s</a>
            <a href="#beta" className="underline-offset-4 hover:underline">Kostenlose Beta</a>
            <a href="#hinweise" className="underline-offset-4 hover:underline">Hinweise</a>
          </nav>
          <ButtonLink href="/login" variant="quiet" size="sm">
            Anmelden
          </ButtonLink>
        </Container>
      </header>

      <main id="top">
        <Container className="grid gap-14 pt-12 pb-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-20 lg:pb-28">
          <div className="min-w-0 max-w-2xl">
            <PageTitle>Deine Nebenkostenabrechnung. Mit Rechenweg statt Excel-Formeln.</PageTitle>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl">
              Für private Vermieter mit 2 bis 5 Wohnungen: Kosten verteilen, Belege sammeln und die Abrechnung als PDF
              herunterladen.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <ButtonLink href="/login" className="md:min-w-52">
                Kostenlos starten
              </ButtonLink>
              <CalculatorCta>Beispielrechnung ansehen</CalculatorCta>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              Während der Beta kostenlos: 1 Objekt mit bis zu 5 Wohnungen. Keine Zahlungsdaten.
            </p>
          </div>

          <div id="rechner" className="flex min-w-0 w-full justify-center overflow-hidden scroll-mt-8 lg:justify-end">
            <ReceiptCalculator />
          </div>
        </Container>

        <Section divided>
          <Container>
            <SplitSection heading={<SectionTitle>Weniger Tabellenarbeit. Mehr Überblick.</SectionTitle>}>
              <Receipt padding="md">
                <ul>
                  {benefits.map(([title, detail]) => (
                    <li key={title} className="border-b border-dashed border-rule py-5 last:border-b-0">
                      <p className="font-sans text-lg font-bold">{title}</p>
                      <p className="mt-2 leading-relaxed text-ink-muted">{detail}</p>
                    </li>
                  ))}
                </ul>
              </Receipt>
            </SplitSection>
          </Container>
        </Section>

        <Section id="ablauf" divided>
          <Container>
            <SplitSection heading={<SectionTitle>So entsteht deine Abrechnung.</SectionTitle>}>
              <Receipt padding="md">
                <ol>
                  {steps.map(([title, detail], index) => (
                    <li key={title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-dashed border-rule py-5">
                      <span className="font-mono text-2xl font-semibold tabular-nums text-stamp">{index + 1}</span>
                      <span className="min-w-0">
                        <span className="block font-sans text-xl font-bold">{title}</span>
                        <span className="mt-1 block text-ink-muted">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 font-medium">Prüfe jeden Rechenschritt, bevor du die Abrechnung als PDF herunterlädst.</p>
              </Receipt>
            </SplitSection>
          </Container>
        </Section>

        <Section divided>
          <Container>
            <SplitSection heading={<SectionTitle>Wie werden die Kosten verteilt?</SectionTitle>}>
              <Receipt as="details" padding="md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-lg font-bold [&::-webkit-details-marker]:hidden">
                  <span>Die drei Verteilungsschlüssel</span>
                  <span className="disclosure-icon" aria-hidden="true" />
                </summary>
                <p className="mt-6 max-w-2xl leading-relaxed text-ink-muted">
                  Je nach Kostenposition kannst du nach Wohnfläche, Personen oder Wohnungen verteilen. Nebenkostat zeigt
                  den verwendeten Rechenweg und weist nicht zugeordnete Anteile gesondert aus.
                </p>
                <dl className="mt-5">
                  {keys.map(([key, formula]) => (
                    <div key={key} className="border-b border-dashed border-rule py-5 last:border-b-0">
                      <dt className="font-sans text-lg font-bold">{key}</dt>
                      <dd className="mt-2 font-mono text-sm leading-relaxed tabular-nums text-ink-muted">{formula}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-sm leading-relaxed text-ink-muted">
                  Welcher Schlüssel für deine Abrechnung passt, prüfst du anhand deiner Unterlagen.
                </p>
              </Receipt>
            </SplitSection>
          </Container>
        </Section>

        <Section id="beta" divided>
          <Container>
            <SectionTitle>Kostenlos starten und ausprobieren.</SectionTitle>
            <div className="mt-14 max-w-3xl">
              <Receipt padding="lg" className="flex flex-col">
                <p className="font-sans text-lg font-bold">Kostenlose Beta</p>
                <p className="mt-3 font-mono text-5xl font-semibold tabular-nums tracking-tight">0 € während der Beta</p>
                <ul className="mt-8 flex-1 space-y-3 border-t border-dashed border-rule pt-6 text-base">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="font-mono text-stamp" aria-hidden="true">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 border-t border-dashed border-rule pt-6 text-base leading-relaxed">
                  Keine Zahlungsdaten. Keine automatische Umstellung auf ein Bezahlpaket. Preis und Umfang einer späteren
                  Bezahlversion kündigen wir vorher an.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                  <ButtonLink href="/login">Kostenlos starten</ButtonLink>
                  <ButtonLink href="/beispiel-pdf" variant="quiet">Beispielabrechnung als PDF ansehen</ButtonLink>
                </div>
              </Receipt>
            </div>
          </Container>
        </Section>

        <Section id="hinweise" divided>
          <Container>
            <SplitSection heading={<SectionTitle>Nebenkostat rechnet. Du behältst den Überblick.</SectionTitle>}>
              <div className="space-y-5 text-lg leading-relaxed text-ink-muted">
                <p>
                  Die App berechnet mit deinen Angaben und dem gewählten Verteilungsschlüssel. Prüfe vor dem Versand, ob
                  Kosten, Mietzeiträume und Schlüssel zu deinen Unterlagen passen.
                </p>
                <p className="font-medium text-ink">Nebenkostat ersetzt keine Rechtsberatung.</p>
                <p className="border-l border-stamp pl-5 font-medium text-ink">„{disclaimer}“</p>
              </div>
            </SplitSection>
          </Container>
        </Section>
      </main>

      <footer className="border-t border-ink/20">
        <Container className="flex flex-col gap-3 py-10 text-sm text-ink-muted">
          <p className="font-sans font-bold text-ink">Nebenkostat</p>
        </Container>
      </footer>
    </>
  );
}
