import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { chromium } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const statePath = path.resolve(process.env.E2E_STORAGE_STATE ?? "playwright/.auth/user.json");
const markerPath = path.resolve(process.env.E2E_AUTH_MARKER ?? "playwright/.auth/ready");

await fs.mkdir(path.dirname(statePath), { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  console.log(`Playwright-Browser geöffnet: ${baseURL}/login`);
  console.log("Melde dich im geöffneten Browser normal bei Nebenkostat an.");
  console.log("Wenn der Magic-Link in einem anderen Browser geöffnet wird, kopiere die Link-Adresse und füge sie im Playwright-Browser in die Adresszeile ein.");

  const terminal = readline.createInterface({ input, output });
  await terminal.question("Drücke hier Enter, sobald der Playwright-Browser auf /app angekommen ist: ");
  terminal.close();

  await page.waitForURL((url) => url.pathname.startsWith("/app"), { timeout: 5_000 });
  await context.storageState({ path: statePath });
  await fs.writeFile(markerPath, "manual\n", "utf8");
  console.log(`E2E-Session gespeichert: ${statePath}`);
} finally {
  await browser.close();
}
