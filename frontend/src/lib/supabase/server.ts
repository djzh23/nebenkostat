import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "./config";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components dürfen Cookies nicht direkt setzen. Der Proxy
          // übernimmt die Session-Erneuerung und schreibt sie zurück.
        }
      },
    },
  });
}

/**
 * Authenticates server-side requests with the same verified JWT claims used by
 * the protected app layout. This avoids a second remote `/auth/v1/user` call
 * while keeping the identity bound to the signed Supabase access token.
 */
export async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const subject = typeof claims?.sub === "string" ? claims.sub : null;

  if (error || !subject) {
    return { supabase, user: null, error };
  }

  const email = typeof claims?.email === "string" ? claims.email : undefined;
  return {
    supabase,
    user: { id: subject, ...(email ? { email } : {}) } satisfies AuthenticatedUser,
    error: null,
  };
}
