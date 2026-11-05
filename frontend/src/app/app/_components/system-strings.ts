export const BETA_DOCUMENTATION = {
  title: "Entwickler-Dokumentation & System-Architektur",
  provider: "Nebenkostat Development Team",
  supportEmail: "[Deine Support-E-Mail-Adresse]",
  section1_Title: "1. Betrieb & Nutzungseinschränkung",
  section1_Content: "Die Applikation befindet sich in einer geschlossenen Pre-Launch-Phase. Der Online-Rechner dient als digitale Rechenhilfe zur Unterstützung bei Betriebskostenaufstellungen. Es wird keine Gewährleistung für Vollständigkeit oder Fehlerfreiheit der generierten PDFs übernommen. Keine Rechts- oder Steuerberatung. Nutzung erfolgt auf eigene Verantwortung des Nutzers.",
  section2_Title: "2. Verarbeitete Datenstrukturen (Auth & Storage)",
  section2_Content: "Zur Bereitstellung des Dienstes werden Kontodaten (E-Mail-Adresse für Magic-Link-Authentifizierung, keine Passwörter) sowie anwenderspezifische Abrechnungsdaten (Mieterdaten, Objektadressen und Beträge) gespeichert, um plattformübergreifendes Bearbeiten und PDF-Exporte zu ermöglichen.",
  section3_Title: "3. Infrastruktur-Dienstleister (Sub-Prozessoren)",
  section3_Content: "Die technische Bereitstellung erfolgt über automatisierte Cloud-Systeme: Datenbank-Hosting via Supabase, Applikations-Hosting über das Vercel-Netzwerk, und transaktionaler E-Mail-Versand (Login-Links) über Resend im Rahmen der Infrastrukturbereitstellung. Eine Weitergabe an unbefugte Dritte oder Analyse zu Werbezwecken findet nicht statt. Ein Löschantrag kann formlos an die Support-Mail gestellt werden.",
};
