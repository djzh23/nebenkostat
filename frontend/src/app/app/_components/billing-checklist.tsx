"use client";

import { buildBillingChecklist } from "@/lib/domain/checklist";
import type { AppState } from "@/lib/domain/types";
import { Panel, SectionHeading } from "../../_components/ui";

export function BillingChecklist({ state, propertyId, year }: { state: AppState; propertyId: string; year: number }) {
  const checklist = buildBillingChecklist(state, propertyId, year);
  const complete = checklist.openCount === 0;

  return (
    <Panel>
      <SectionHeading note={complete ? "Alles geprüft" : `${checklist.openCount} Punkte vor dem Abschluss prüfen`}>
        Prüfliste vor dem Versand
      </SectionHeading>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {checklist.groups.map((group) => (
          <section key={group.id} className="border border-rule p-4" aria-labelledby={`check-${group.id}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 id={`check-${group.id}`} className="font-semibold">{group.label}</h3>
              <span
                className={group.status === "ok" ? "font-mono text-xs font-semibold text-ink" : "font-mono text-xs font-semibold text-stamp-deep"}
                aria-label={group.status === "ok" ? "geprüft" : "bitte prüfen"}
              >
                {group.status === "ok" ? "OK" : "PRÜFEN"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{group.summary}</p>
            {group.details.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-dashed border-rule pt-3 text-xs text-stamp-deep">
                {group.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
      {!complete ? (
        <p className="mt-5 text-sm text-ink-muted">
          Hinweise blockieren den Export nicht. Bitte bestätige vor dem Abschluss, dass du Adressen, Mietzeiträume, Vorauszahlungen, Belege und fachliche Hinweise geprüft hast.
        </p>
      ) : null}
    </Panel>
  );
}

export function ChecklistAcknowledgement({ checked, onChange, disabled }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex max-w-2xl items-start gap-3 text-sm leading-relaxed text-ink-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-stamp"
      />
      <span>Ich habe die offenen Hinweise geprüft und bestätige, dass Adressen, Mietzeiträume, Vorauszahlungen, Belege und fachliche Punkte für diese Abrechnung geprüft sind.</span>
    </label>
  );
}
