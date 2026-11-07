import { expect, type Page } from "@playwright/test";

type UploadFile = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

export class ReceiptPage {
  constructor(private readonly page: Page) {}

  async expectCostSection(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Kosten und Belege", exact: true })).toBeVisible();
    await expect(this.page.getByText("Wasser", { exact: true }).first()).toBeVisible();
  }

  async upload(file: UploadFile): Promise<void> {
    const input = this.page.locator('input[type="file"]').first();
    await input.setInputFiles(file);
    await expect(this.page.getByText(/Noch nicht gespeichert/i)).toBeVisible();
    await this.page.getByRole("button", { name: "Datei hochladen", exact: true }).first().click();
  }

  async expectUploadError(message: RegExp): Promise<void> {
    await expect(this.page.locator('p[role="alert"]')).toContainText(message);
  }

  async expectSaved(fileName: string): Promise<void> {
    await expect(this.page.getByRole("status").filter({ hasText: "Datei gespeichert." })).toBeVisible();
    await expect(this.page.getByText(fileName, { exact: true })).toBeVisible();
  }

  async deleteReceipt(): Promise<void> {
    await this.page.getByRole("button", { name: "Datei löschen", exact: true }).first().click();
    const confirmation = this.page.getByRole("group", { name: "Datei löschen bestätigen" });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Löschen", exact: true }).click();
    await expect(this.page.getByRole("status").filter({ hasText: "Datei gelöscht." })).toBeVisible();
  }

  async downloadArchive(): Promise<void> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.getByRole("button", { name: "Belegarchiv als ZIP laden", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^Belegarchiv-\d{4}\.zip$/);
    await expect(download.failure()).resolves.toBeNull();
  }
}

export function receiptFile(name: string, mimeType: string, buffer: Buffer): UploadFile {
  return { name, mimeType, buffer };
}
