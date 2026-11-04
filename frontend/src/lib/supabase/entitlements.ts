import type { createClient } from "./server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const BETA_LIMITS = {
  properties: 1,
  units: 5,
} as const;

export type CreationLimit = {
  allowed: boolean;
  plan: "beta";
  current: number;
  limit: number;
  upgradeUrl: null;
};

type LimitResult = CreationLimit & { error?: Error };

function resultFor(current: number, limit: number): CreationLimit {
  return {
    allowed: current < limit,
    plan: "beta",
    current,
    limit,
    upgradeUrl: null,
  };
}

export function betaLimitResult(current: number, limit: number) {
  return resultFor(current, limit);
}

export async function checkPropertyCreationLimit(supabase: SupabaseClient): Promise<LimitResult> {
  const { count, error } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true });

  if (error) {
    return {
      ...resultFor(count ?? 0, BETA_LIMITS.properties),
      error: new Error("Das Beta-Nutzungslimit konnte nicht geprüft werden."),
    };
  }

  return resultFor(count ?? 0, BETA_LIMITS.properties);
}

export async function checkUnitCreationLimit(supabase: SupabaseClient): Promise<LimitResult> {
  const { count, error } = await supabase
    .from("units")
    .select("id", { count: "exact", head: true });

  if (error) {
    return {
      ...resultFor(count ?? 0, BETA_LIMITS.units),
      error: new Error("Das Beta-Nutzungslimit konnte nicht geprüft werden."),
    };
  }

  return resultFor(count ?? 0, BETA_LIMITS.units);
}
