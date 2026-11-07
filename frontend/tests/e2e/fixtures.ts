import fs from "node:fs";
import path from "node:path";

import { test as base, expect } from "@playwright/test";

function hasAuthMarker(): boolean {
  return fs.existsSync(path.resolve(process.env.E2E_AUTH_MARKER ?? "playwright/.auth/ready"));
}

export const test = base.extend<{ authenticated: boolean }>({
  authenticated: [async ({}, use, testInfo) => {
    if (!hasAuthMarker()) {
      testInfo.skip(true, "Authentifizierte Tests benötigen E2E_STORAGE_STATE oder E2E-Supabase-Testkonto.");
    }
    await use(true);
  }, { auto: true }],
});

export { expect };
