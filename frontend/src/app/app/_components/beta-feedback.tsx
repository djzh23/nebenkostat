"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { buttonPrimary, ErrorText, Panel, SectionHeading } from "../../_components/ui";

export function BetaFeedback() {
  const [message, setMessage] = useState("");
  const [wantsBetaUpdates, setWantsBetaUpdates] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, wantsBetaUpdates }),
      });
      const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
      if (!response.ok) {
        throw new Error(typeof payload?.detail === "string" ? payload.detail : "Feedback konnte nicht gespeichert werden.");
      }
      setMessage("");
      setStatus("sent");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Feedback konnte nicht gespeichert werden.");
    }
  }

  return (
    <Panel>
      <SectionHeading note="Kostenlose Beta">Feedback willkommen</SectionHeading>
      <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
        Was hat dir geholfen, wo bist du hängen geblieben, und was sollte als Nächstes besser werden? Deine Rückmeldung
        entscheidet mit, welche Funktionen zuerst kommen.
      </p>
      <form onSubmit={submit} className="mt-6 max-w-2xl space-y-4">
        <label htmlFor="beta-feedback-message" className="block text-sm font-semibold">
          Deine Rückmeldung
        </label>
        <textarea
          id="beta-feedback-message"
          name="message"
          required
          minLength={5}
          maxLength={4000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          className="w-full border border-rule bg-paper px-4 py-3 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-paper"
          placeholder="Zum Beispiel: Ich habe die Formel verstanden, aber …"
        />
        <label className="flex items-start gap-3 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={wantsBetaUpdates}
            onChange={(event) => setWantsBetaUpdates(event.target.checked)}
            className="mt-1 size-4 accent-stamp"
          />
          <span>
            Ich möchte Beta-Updates und ein frühes Preisangebot per E-Mail erhalten. Die Einwilligung kann ich jederzeit
            widerrufen. <Link href="/datenschutz" className="underline underline-offset-4">Datenschutz</Link>
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={status === "sending"} className={buttonPrimary}>
            {status === "sending" ? "Wird gespeichert …" : "Feedback senden"}
          </button>
          {status === "sent" ? <p role="status" className="text-sm text-ink-muted">Danke, dein Feedback ist angekommen.</p> : null}
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </form>
    </Panel>
  );
}
