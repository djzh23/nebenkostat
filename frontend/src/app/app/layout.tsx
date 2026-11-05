import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

import { BetaSystemInfo } from "./_components/beta-system-info";
import { SignOutButton } from "./_components/sign-out-button";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  return (
    <div className="min-h-screen">
      <header data-no-print className="border-b border-ink/20 bg-desk">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 md:px-8">
          <div className="flex items-baseline gap-6">
            <Link href="/" className="font-sans text-lg font-black tracking-tight">
              Nebenkostat
            </Link>
            <nav aria-label="Hauptnavigation" className="flex gap-6 text-sm font-semibold">
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
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            {email ? <span className="max-w-52 truncate">{email}</span> : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">{children}</div>
      <footer data-no-print className="border-t border-ink/20 bg-desk">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-8">
          <div className="text-sm text-ink-muted">Nebenkostat Beta</div>
          <BetaSystemInfo />
        </div>
      </footer>
    </div>
  );
}
