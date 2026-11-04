import type { Metadata, Viewport } from "next";
import "@fontsource/archivo/latin-400.css";
import "@fontsource/archivo/latin-600.css";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/archivo/latin-800.css";
import "@fontsource/archivo/latin-900.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nebenkostat: Nebenkostenabrechnung als Kassenbon",
  description:
    "Nebenkostenabrechnung für Privatvermieter mit 2 bis 5 Wohneinheiten. Jede Umlage mit Rechenweg, Belegarchiv und PDF-Export. Kein Ersatz für Rechtsberatung.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
