"use client";

import Link from "next/link";
import { useState } from "react";

import { SignOutButton } from "./sign-out-button";

export function MobileNavigation({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ink px-3 text-2xl leading-none"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "×" : "☰"}
      </button>

      {open ? (
        <div id="mobile-navigation-panel" className="absolute inset-x-0 top-full z-20 border-b border-ink/20 bg-desk px-4 py-4 shadow-sm">
          <nav aria-label="Mobile Hauptnavigation" className="flex flex-col gap-1 text-base font-semibold">
            <Link href="/app" onClick={closeMenu} className="min-h-11 flex items-center border-b border-dashed border-rule">
              Übersicht
            </Link>
            <Link href="/app/objekte/neu" onClick={closeMenu} className="min-h-11 flex items-center border-b border-dashed border-rule">
              Objekt anlegen
            </Link>
            <Link href="/app/hilfe" onClick={closeMenu} className="min-h-11 flex items-center border-b border-dashed border-rule">
              So funktioniert&apos;s
            </Link>
          </nav>
          <div className="mt-4 flex items-center justify-between gap-4 text-xs text-ink-muted">
            {email ? <span className="min-w-0 truncate">{email}</span> : null}
            <SignOutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
