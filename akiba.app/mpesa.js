import { timingSafeEqual } from "node:crypto";

export function normalizeKenyanPhone(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;

  let digits = String(value).replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) {
    digits = `254${digits.slice(1)}`;
  } else if (/^7\d{8}$/.test(digits) || /^1\d{8}$/.test(digits)) {
    digits = `254${digits}`;
  }

  return /^254[17]\d{8}$/.test(digits) ? digits : null;
}

export function isValidCallbackSecret(received, expected) {
  if (typeof received !== "string" || !expected) return false;

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);
}
