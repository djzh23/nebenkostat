import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

import { BetaSystemInfo } from "./_components/beta-system-info";
import { MobileNavigation } from "./_components/mobile-navigation";
import { SignOutButton } from "./_components/sign-out-button";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header data-no-print className="relative border-b border-ink/20 bg-desk">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
          <div className="flex min-w-0 items-baseline gap-6">
            <Link href="/" className="font-sans text-lg font-black tracking-tight">
              Nebenkostat
            </Link>
            <nav aria-label="Hauptnavigation" className="hidden gap-6 text-sm font-semibold md:flex">
              <Link href="/app" className="hover:underline underline-offset-4">
                Übersicht
              </Link>
              <Link href="/app/objekte/neu" className="hover:underline underline-offset-4">
                Objekt anlegen
              </Link>
              <Link href="/app/hilfe" className="hover:underline underline-offset-4">
                So funktioniert&apos;s
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-xs text-ink-muted">
            <div className="hidden items-center gap-4 md:flex">
              {email ? <span className="max-w-52 truncate">{email}</span> : null}
              <SignOutButton />
            </div>
            <MobileNavigation email={email} />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">{children}</div>
      </main>
      <footer data-no-print className="border-t border-ink/20 bg-desk">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-8">
          <div className="text-sm text-ink-muted">Nebenkostat Beta</div>
          <BetaSystemInfo />
        </div>
      </footer>
    </div>
  );
}
