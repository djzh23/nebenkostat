import { describe, expect, it } from "vitest";
import { hasExpectedFileSignature } from "./file-signature";

describe("hasExpectedFileSignature", () => {
  it("accepts a PDF header", async () => {
    expect(await hasExpectedFileSignature(new Blob(["%PDF-1.7\n"]), "application/pdf")).toBe(true);
  });

  it("accepts JPEG and PNG signatures", async () => {
    expect(await hasExpectedFileSignature(new Blob([new Uint8Array([0xff, 0xd8, 0xff])]), "image/jpeg")).toBe(true);
    expect(
      await hasExpectedFileSignature(
        new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])]),
        "image/png",
      ),
    ).toBe(true);
  });

  it("rejects a mismatched or unknown signature", async () => {
    expect(await hasExpectedFileSignature(new Blob(["not a pdf"]), "application/pdf")).toBe(false);
    expect(await hasExpectedFileSignature(new Blob(["data"]), "application/x-executable")).toBe(false);
  });
});
