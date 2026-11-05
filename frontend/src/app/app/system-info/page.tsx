import type { Metadata } from "next";

import { BetaSystemInfo } from "../_components/beta-system-info";

export const metadata: Metadata = {
  title: "System-Informationen | Nebenkostat",
  description: "Technische System-Informationen für registrierte Nebenkostat-Beta-Tester.",
};

export default function SystemInfoPage() {
  return <BetaSystemInfo />;
}
