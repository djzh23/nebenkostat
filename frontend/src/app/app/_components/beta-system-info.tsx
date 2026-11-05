import Link from "next/link";

import { Container, Section } from "@/components/ui/layout";
import { PageTitle, SectionTitle } from "@/components/ui/heading";
import { Receipt } from "@/components/ui/receipt";

export function BetaSystemInfo() {
  return (
    <main>
      <Section>
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <PageTitle>System-Informationen</PageTitle>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted">
                Technische Dokumentation für registrierte Beta-Tester.
              </p>
            </div>
            <Link
              href="/app"
              className="text-sm font-semibold underline decoration-ink/30 decoration-2 underline-offset-4 hover:decoration-stamp"
            >
              Zur Übersicht
            </Link>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-12">
              <section aria-labelledby="anbieter">
                <SectionTitle id="anbieter">System-Informationen &amp; Anbieterkennzeichnung</SectionTitle>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
                  <p>
                    <span className="font-semibold text-ink">Bereitstellung &amp; Support:</span>
                    <br />
                    Das Nebenkostat Development Team
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Kontakt für Feedback &amp; Support:</span>{" "}
                    [Deine Support-E-Mail-Adresse]
                  </p>
                </div>
              </section>

              <section aria-labelledby="haftung">
                <SectionTitle id="haftung">Haftungsausschluss für den Beta-Betrieb</SectionTitle>
                <p className="mt-6 text-base leading-relaxed text-ink-muted">
                  Die Plattform befindet sich aktuell in einer geschlossenen Beta-Phase (Pre-Launch). Bei diesem Online-Rechner handelt es sich um eine digitale Rechenhilfe zur Unterstützung bei der Erstellung von Betriebskostenaufstellungen. Der Bereitsteller übernimmt keine Gewährleistung für die rechtliche Vollständigkeit, Fehlerfreiheit oder Aktualität der generierten PDF-Dokumente oder Berechnungen. Das Tool ersetzt keine Rechts- oder Steuerberatung. Die Nutzung der Funktionen erfolgt ausschließlich auf eigene Verantwortung des Nutzers.
                </p>
              </section>

              <section aria-labelledby="datensicherheit">
                <SectionTitle id="datensicherheit">Technische Dokumentation &amp; Datensicherheit</SectionTitle>
                <p className="mt-6 text-base leading-relaxed text-ink-muted">
                  Der Schutz der Daten hat höchste Priorität. Die Erfassung und Verarbeitung erfolgt streng zweckgebunden.
                </p>
              </section>

              <section aria-labelledby="verarbeitungszwecke">
                <SectionTitle id="verarbeitungszwecke">1. Verarbeitungszwecke im System</SectionTitle>
                <ul className="mt-6 space-y-5 text-base leading-relaxed text-ink-muted">
                  <li>
                    <span className="font-semibold text-ink">Inhaberkonto (Account):</span> Die E-Mail-Adresse wird ausschließlich zur Authentifizierung mittels Magic Links und zur Verwaltung des Profils verarbeitet.
                  </li>
                  <li>
                    <span className="font-semibold text-ink">Abrechnungsdaten:</span> Die eingegebenen Mieterdaten, Adressen und Beträge werden gespeichert, um das Bearbeiten, Speichern und den Export (PDF-Generierung) der Dokumente zu ermöglichen.
                  </li>
                </ul>
              </section>

              <section aria-labelledby="dienstleister">
                <SectionTitle id="dienstleister">2. Infrastruktur &amp; eingebundene Dienstleister</SectionTitle>
                <p className="mt-6 text-base leading-relaxed text-ink-muted">
                  Zur Bereitstellung der Applikation werden folgende technische Dienstleister genutzt:
                </p>
                <ul className="mt-5 space-y-5 text-base leading-relaxed text-ink-muted">
                  <li>
                    <span className="font-semibold text-ink">Datenbank &amp; Authentifizierung:</span> Die Speicherung erfolgt verschlüsselt über Supabase.
                  </li>
                  <li>
                    <span className="font-semibold text-ink">Hosting &amp; CDN:</span> Die Bereitstellung der Web-Applikation erfolgt über Vercel.
                  </li>
                  <li>
                    <span className="font-semibold text-ink">System-E-Mails:</span> Der Versand von Transaktions-E-Mails (z. B. Login-Links) wird über den Dienstleister Resend abgewickelt.
                  </li>
                </ul>
              </section>

              <section aria-labelledby="sicherheit">
                <SectionTitle id="sicherheit">3. Datensicherheit</SectionTitle>
                <p className="mt-6 text-base leading-relaxed text-ink-muted">
                  Daten werden im Rahmen der technischen Bereitstellung an die genannten Dienstleister übermittelt. Eine Weitergabe an unbefugte Dritte oder eine Analyse zu Werbezwecken findet nicht statt. Ein Antrag auf Löschung des Accounts und aller Daten kann formlos per E-Mail an [Deine Support-E-Mail-Adresse] gestellt werden.
                </p>
              </section>
            </div>

            <aside className="h-fit lg:sticky lg:top-8">
              <Receipt padding="lg" tone="outline">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Beta-Systeminfo
                </p>
                <p className="mt-5 text-base leading-relaxed text-ink-muted">
                  Diese Seite beschreibt die technische Architektur und die Datenflüsse der geschützten Beta-Anwendung.
                </p>
                <div className="mt-8 border-t border-dashed border-rule pt-6 text-sm leading-relaxed text-ink-muted">
                  <p>Magic-Link-Authentifizierung</p>
                  <p className="mt-2">Private Supabase-Daten</p>
                  <p className="mt-2">PDF- und Belegexport</p>
                </div>
              </Receipt>
            </aside>
          </div>
        </Container>
      </Section>
    </main>
  );
}
