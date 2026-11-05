import { createClient } from "@/lib/supabase/server";

import { BETA_DOCUMENTATION } from "./system-strings";

export async function BetaSystemInfo() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const session = data?.claims ?? null;

  if (session === null) return null;

  return (
    <details className="w-full text-xs leading-relaxed text-ink-muted">
      <summary className="cursor-pointer font-semibold underline decoration-ink/30 decoration-2 underline-offset-4 hover:decoration-stamp">
        {BETA_DOCUMENTATION.title}
      </summary>
      <div className="mt-5 grid gap-5 border-t border-dashed border-rule pt-5 md:grid-cols-3">
        <div>
          <p className="font-semibold text-ink">Bereitstellung &amp; Support</p>
          <p className="mt-1">{BETA_DOCUMENTATION.provider}</p>
          <p>{BETA_DOCUMENTATION.supportEmail}</p>
        </div>
        <div>
          <p className="font-semibold text-ink">{BETA_DOCUMENTATION.section1_Title}</p>
          <p className="mt-1">{BETA_DOCUMENTATION.section1_Content}</p>
        </div>
        <div>
          <p className="font-semibold text-ink">{BETA_DOCUMENTATION.section2_Title}</p>
          <p className="mt-1">{BETA_DOCUMENTATION.section2_Content}</p>
        </div>
        <div className="md:col-span-3">
          <p className="font-semibold text-ink">{BETA_DOCUMENTATION.section3_Title}</p>
          <p className="mt-1">{BETA_DOCUMENTATION.section3_Content}</p>
        </div>
      </div>
    </details>
  );
}
