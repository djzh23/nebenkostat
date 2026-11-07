import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";

const allowedTypes: EmailOtpType[] = ["email", "magiclink"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const redirectToApp = NextResponse.redirect(new URL("/app", request.url));
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")
          ?.split("; ")
          .filter(Boolean)
          .map((entry) => {
            const separator = entry.indexOf("=");
            return {
              name: separator === -1 ? entry : entry.slice(0, separator),
              value: separator === -1 ? "" : entry.slice(separator + 1),
            };
          }) ?? [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectToApp.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectToApp;
    }
  }

  if (tokenHash && type && allowedTypes.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return redirectToApp;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_confirm", request.url));
}
