import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(path.resolve(__dirname, "../.."));

function resolvePath(value: string): string {
  return path.resolve(value);
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const statePath = resolvePath(process.env.E2E_STORAGE_STATE ?? "playwright/.auth/user.json");
  const markerPath = resolvePath(process.env.E2E_AUTH_MARKER ?? "playwright/.auth/ready");
  const metadataPath = resolvePath("playwright/.auth/metadata.json");
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? config.projects[0]?.use.baseURL ?? "http://localhost:3100";
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await assertNebenkostatTarget(baseURL);
  console.log(`[Playwright] Nebenkostat-Testziel bestätigt: ${baseURL}`);

  const mustCreateFreshUser = process.env.E2E_CREATE_FRESH_USER === "1" || process.env.E2E_ISOLATED_MUTATIONS === "1";
  if (await fileExists(statePath) && !mustCreateFreshUser) {
    if (await hasUsableStorageState(statePath, baseURL)) {
      await fs.writeFile(markerPath, "provided\n", "utf8");
      console.log(`[Playwright] Gültiger Auth-State wird verwendet: ${statePath}`);
      return;
    }
    console.warn(`[Playwright] Auth-State ist abgelaufen oder nicht für ${baseURL} gültig: ${statePath}`);
  }

  const magicLink = process.env.E2E_MAGIC_LINK_URL;
  let userId: string | undefined;
  let email: string | undefined;
  let actionLink = magicLink;

  const supabaseUrl = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
  if (!actionLink && supabaseUrl && serviceRoleKey && process.env.E2E_EMAIL) {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const freshUser = process.env.E2E_CREATE_FRESH_USER === "1";
    email = createFreshEmail(process.env.E2E_EMAIL, freshUser);
    if (freshUser) {
      const created = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (created.error || !created.data.user) {
        throw new Error(`E2E-Testkonto konnte nicht angelegt werden: ${created.error?.message ?? "unbekannter Fehler"}`);
      }
      userId = created.data.user.id;
    } else {
      const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingUser = users.data.users.find((user) => user.email?.toLowerCase() === email?.toLowerCase());
      if (users.error || !existingUser) {
        throw new Error(`E2E-Testkonto ${email} wurde nicht gefunden. Setze E2E_CREATE_FRESH_USER=1 für einen neuen isolierten Benutzer.`);
      }
      userId = existingUser.id;
    }
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${baseURL}/auth/callback` },
    });
    if (link.error || !link.data.properties?.action_link) {
      throw new Error(`E2E-Magic-Link konnte nicht erzeugt werden: ${link.error?.message ?? "unbekannter Fehler"}`);
    }
    const hashedToken = link.data.properties.hashed_token;
    actionLink = hashedToken
      ? `${baseURL}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
      : link.data.properties.action_link;
  }

  if (!actionLink) {
    if (process.env.E2E_RESET_AUTH !== "1" && await hasUsableStorageState(statePath, baseURL)) {
      await fs.writeFile(markerPath, "provided\n", "utf8");
      console.log(`[Playwright] Vorhandener Auth-State wird verwendet: ${statePath}`);
      return;
    }
    await fs.writeFile(statePath, JSON.stringify({ cookies: [], origins: [] }, null, 2), "utf8");
    await fs.rm(markerPath, { force: true });
    await fs.rm(metadataPath, { force: true });
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(actionLink, { waitUntil: "domcontentloaded" });
    await page.waitForURL((url) => url.pathname.startsWith("/app"), { timeout: 60_000 });
    await page.getByRole("heading", { name: "Übersicht", exact: true }).waitFor({ timeout: 15_000 });
    const sessionCheck = await page.request.get(new URL("/api/properties", baseURL).toString());
    if (sessionCheck.status() !== 200) {
      throw new Error(`Die erzeugte E2E-Session wird von /api/properties abgelehnt (HTTP ${sessionCheck.status()}).`);
    }
    await context.storageState({ path: statePath });
  } catch (error) {
    throw new Error(`E2E-Login konnte nicht abgeschlossen werden. Aktuelle URL: ${page.url()}. ${String(error)}`);
  } finally {
    await browser.close();
  }
  await fs.writeFile(markerPath, "generated\n", "utf8");
  await fs.writeFile(
    metadataPath,
    JSON.stringify({ userId, email, createdBySetup: process.env.E2E_CREATE_FRESH_USER === "1" }, null, 2),
    "utf8",
  );
}

async function assertNebenkostatTarget(baseURL: string): Promise<void> {
  if (process.env.PLAYWRIGHT_SKIP_TARGET_CHECK === "1") return;

  let response: Response;
  try {
    response = await fetch(baseURL, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    throw new Error(`Nebenkostat-Testziel ${baseURL} ist nicht erreichbar. Starte den Test ohne fremden Parallel-Server. ${String(error)}`);
  }

  const body = await response.text();
  const hasProductMarker = body.includes("Nebenkosten, die du selbst nachrechnen kannst.") || body.includes("Nebenkostat");
  if (!response.ok || !hasProductMarker) {
    throw new Error(`Falsches E2E-Testziel unter ${baseURL}. Erwartet wurde die Nebenkostat-Landingpage; der Server wird aus Sicherheitsgründen nicht getestet.`);
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hasUsableStorageState(filePath: string, baseURL: string): Promise<boolean> {
  let state: { cookies?: unknown[]; origins?: unknown[] };
  try {
    state = JSON.parse(await fs.readFile(filePath, "utf8")) as {
      cookies?: unknown[];
      origins?: unknown[];
    };
  } catch {
    return false;
  }

  if ((state.cookies?.length ?? 0) === 0 && (state.origins?.length ?? 0) === 0) return false;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ storageState: filePath });
    const page = await context.newPage();
    await page.goto(new URL("/app", baseURL).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    return new URL(page.url()).pathname.startsWith("/app");
  } catch {
    return false;
  } finally {
    await browser.close();
  }
}

function createFreshEmail(seed: string, fresh: boolean): string {
  if (!fresh) return seed;
  const at = seed.indexOf("@");
  if (at < 1) throw new Error("E2E_EMAIL muss eine gültige E-Mail-Adresse sein.");
  return `${seed.slice(0, at)}+playwright-${Date.now()}${seed.slice(at)}`;
}
