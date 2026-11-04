const signatures = {
  "image/jpeg": (bytes: Uint8Array) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "application/pdf": (bytes: Uint8Array) => new TextDecoder().decode(bytes).includes("%PDF-"),
} as const;

export type ReceiptMimeType = keyof typeof signatures;

export async function hasExpectedFileSignature(file: Blob, contentType: string): Promise<boolean> {
  if (!(contentType in signatures)) return false;
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return signatures[contentType as ReceiptMimeType](bytes);
}
