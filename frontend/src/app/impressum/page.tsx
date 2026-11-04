import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/layout";
import { PageTitle, SectionTitle } from "@/components/ui/heading";

export const metadata: Metadata = {
  title: "Impressum | Nebenkostat",
  description: "Anbieterkennzeichnung von Nebenkostat.",
};

export default function ImpressumPage() {
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
            <PageTitle>Impressum</PageTitle>
            <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_0.8fr]">
              <div className="space-y-8 text-base leading-relaxed">
                <section aria-labelledby="anbieter">
                  <SectionTitle id="anbieter">Anbieter</SectionTitle>
                  <dl className="mt-5 space-y-3">
                    <div>
                      <dt className="font-semibold">Name / Firma</dt>
                      <dd className="text-ink-muted">[Vorname Nachname oder vollständige Firma ergänzen]</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Anschrift</dt>
                      <dd className="text-ink-muted">
                        [Straße und Hausnummer ergänzen]
                        <br />
                        [PLZ und Ort, Deutschland ergänzen]
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">E-Mail</dt>
                      <dd className="text-ink-muted">[geschäftliche E-Mail-Adresse ergänzen]</dd>
                    </div>
                  </dl>
                </section>

                <section aria-labelledby="verantwortung">
                  <SectionTitle id="verantwortung">Verantwortlich für den Inhalt</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    [Name und ladungsfähige Anschrift der verantwortlichen Person ergänzen.]
                  </p>
                </section>

                <section aria-labelledby="hinweis">
                  <SectionTitle id="hinweis">Hinweis</SectionTitle>
                  <p className="mt-5 text-ink-muted">
                    Diese Seite ist eine technische Vorlage. Vor der öffentlichen Veröffentlichung müssen die Angaben
                    vollständig und rechtlich geprüft werden.
                  </p>
                </section>
              </div>

              <aside className="receipt h-fit border-l-2 border-stamp px-6 py-6 text-sm leading-relaxed">
                <p className="font-semibold">Vor Veröffentlichung ausfüllen</p>
                <p className="mt-3 text-ink-muted">
                  Ergänze die tatsächlichen Betreiber- und Kontaktdaten, bevor diese Seite öffentlich verwendet wird.
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
          <Link href="/datenschutz" className="underline decoration-ink/30 decoration-2 underline-offset-4 hover:decoration-stamp">
            Datenschutz
          </Link>
        </Container>
      </footer>
    </>
  );
}
