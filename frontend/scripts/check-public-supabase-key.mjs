import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const envFiles = [".env.local", ".env.development.local", ".env.production.local", ".env"];
const publicKeyNames = new Set([
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
]);

function readEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || match[1].startsWith("#")) return [];
        return [[match[1], match[2].replace(/^['"]|['"]$/g, "")]];
      }),
  );
}

function jwtRole(value) {
  const payload = value.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(normalized, "base64url")).role ?? null;
  } catch {
    return null;
  }
}

const values = Object.assign({}, ...envFiles.map(readEnvFile));
for (const keyName of publicKeyNames) {
  const value = values[keyName];
  if (!value) continue;

  const role = jwtRole(value);
  if (role === "service_role" || value.startsWith("sb_secret_")) {
    console.error(`${keyName} enthält einen geheimen Supabase-Key. Verwende im Browser nur den Publishable-/anon-Key.`);
    process.exit(1);
  }
}
