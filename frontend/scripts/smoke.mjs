const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", ...init });
}

const landing = await request("/");
const landingBody = await landing.text();
assert(landing.status === 200, `Landingpage erwartet 200, erhielt ${landing.status}`);
assert(landingBody.includes("Kostenlos starten"), "Primäre Landingpage-CTA fehlt");
assert(landingBody.includes("/impressum") && landingBody.includes("/datenschutz"), "Rechtliche Links fehlen");

for (const path of ["/impressum", "/datenschutz"]) {
  const response = await request(path);
  assert(response.status === 200, `${path} erwartet 200, erhielt ${response.status}`);
}

const protectedRoute = await request("/app/schnellstart");
assert(protectedRoute.status === 307, `Geschützte Route erwartet 307, erhielt ${protectedRoute.status}`);
assert(protectedRoute.headers.get("location") === "/login", "Geschützte Route leitet nicht zu /login weiter");

const unauthenticatedFeedback = await request("/api/beta-feedback", { method: "POST" });
assert(unauthenticatedFeedback.status === 401, `Feedback-Route muss ohne Login 401 liefern, erhielt ${unauthenticatedFeedback.status}`);

for (const [header, expected] of [
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
]) {
  assert(landing.headers.get(header) === expected, `Security-Header ${header} fehlt oder ist falsch`);
}

console.log(`Smoke-Test erfolgreich: ${baseUrl}`);
