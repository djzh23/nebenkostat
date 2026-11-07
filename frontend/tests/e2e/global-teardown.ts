import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

import { createClient } from "@supabase/supabase-js";

loadEnvConfig(path.resolve(__dirname, "../.."));

export default async function globalTeardown(): Promise<void> {
  const metadataPath = path.resolve("playwright/.auth/metadata.json");
  const statePath = path.resolve(process.env.E2E_STORAGE_STATE ?? "playwright/.auth/user.json");
  const markerPath = path.resolve(process.env.E2E_AUTH_MARKER ?? "playwright/.auth/ready");
  try {
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8")) as { userId?: unknown; createdBySetup?: unknown };
    const supabaseUrl = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
    if (metadata.createdBySetup === true && typeof metadata.userId === "string" && supabaseUrl && serviceRoleKey) {
      const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
      await admin.auth.admin.deleteUser(metadata.userId);
    }
    if (metadata.createdBySetup === true) {
      await fs.rm(statePath, { force: true });
      await fs.rm(markerPath, { force: true });
    }
    await fs.rm(metadataPath, { force: true });
  } catch {
    // No generated test user means there is nothing to clean up.
  }
}
