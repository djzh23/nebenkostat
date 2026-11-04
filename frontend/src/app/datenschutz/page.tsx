import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/layout";
import { PageTitle, SectionTitle } from "@/components/ui/heading";

export const metadata: Metadata = {
  title: "Datenschutz | Nebenkostat",
  description: "Datenschutzhinweise von Nebenkostat.",
};

export default function DatenschutzPage() {
  return (
    <>
      <header className="border-b border-ink/10">
        <Container className="flex items-center justify-between gap-6 py-5">
          <Link href="/" className="font-sans text-lg font-black tracking-tight">
            Nebenkostat
          </Link>
          <ButtonLink href="/login" variant="quiet" size="sm">
            Anmelden
          </ButtonLink>
        </Container>
      </header>

      <main>
        <Section>
          <Container className="max-w-4xl">
            <PageTitle>Datenschutz</PageTitle>
            <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_0.8fr]">
              <div className="space-y-8 text-base leading-relaxed">
                <section aria-labelledby="verantwortlicher">
                  <SectionTitle id="verantwortlicher">Verantwortlicher</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    [Name/Firma, Anschrift und Kontakt des Verantwortlichen ergänzen.]
                  </p>
                </section>

                <section aria-labelledby="daten">
                  <SectionTitle id="daten">Welche Daten verarbeitet die App?</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    Für die Anmeldung wird die E-Mail-Adresse verarbeitet. Im geschützten Bereich können außerdem
                    Objekt-, Einheiten-, Mietverhältnis-, Kosten- und Belegdaten sowie erzeugte PDF-Abrechnungen
                    gespeichert werden. Trage hier vor Veröffentlichung die tatsächlich eingesetzten Dienste und
                    Datenflüsse vollständig ein.
                  </p>
                </section>

                <section aria-labelledby="zwecke">
                  <SectionTitle id="zwecke">Zwecke und Rechtsgrundlagen</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    Die Daten dienen dem Login, der Berechnung und Archivierung von Nebenkostenabrechnungen sowie dem
                    vom Nutzer ausgelösten Export. Rechtsgrundlagen, Aufbewahrungsfristen und gegebenenfalls
                    berechtigte Interessen müssen vor Veröffentlichung für den konkreten Betrieb ergänzt werden.
                  </p>
                </section>

                <section aria-labelledby="anbieter">
                  <SectionTitle id="anbieter">Eingesetzte Anbieter</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    [Für Authentifizierung, Datenbank, Storage, Hosting, E-Mail und gegebenenfalls Zahlungen die
                    tatsächlichen Anbieter, Auftragsverarbeitungsverträge und Übermittlungen ergänzen.]
                  </p>
                </section>

                <section aria-labelledby="rechte">
                  <SectionTitle id="rechte">Rechte betroffener Personen</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    Ergänze hier den Kontakt für Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit
                    und Widerspruch sowie den Hinweis auf das Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
                  </p>
                </section>

                <section aria-labelledby="hinweis">
                  <SectionTitle id="hinweis">Hinweis</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    Diese Seite ist eine technische Vorlage und keine Rechtsberatung. Sie muss vor dem Einsatz mit den
                    tatsächlichen Datenverarbeitungen abgeglichen und fachlich geprüft werden.
                  </p>
                </section>
              </div>

              <aside className="receipt h-fit border-l-2 border-stamp px-6 py-6 text-sm leading-relaxed">
                <p className="font-semibold">Noch nicht veröffentlichen</p>
                <p className="mt-3 text-ink-muted">
                  Platzhalter dürfen nicht als fertige Datenschutzerklärung ausgegeben werden. Betreiber, Speicherorte,
                  Aufbewahrung und Rechtsgrundlagen müssen konkret ergänzt werden.
                </p>
              </aside>
            </div>
          </Container>
        </Section>
      </main>

      <footer className="mt-auto border-t border-ink/20">
        <Container className="flex flex-wrap gap-5 py-8 text-sm text-ink-muted">
          <Link href="/" className="underline decoration-ink/30 decoration-2 underline-offset-4 hover:decoration-stamp">
            Startseite
          </Link>
          <Link href="/impressum" className="underline decoration-ink/30 decoration-2 underline-offset-4 hover:decoration-stamp">
            Impressum
          </Link>
        </Container>
      </footer>
    </>
  );
}
