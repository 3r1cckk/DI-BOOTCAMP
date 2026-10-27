import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const storePath = path.resolve(
  process.env.MPESA_DATA_PATH || "./data/mpesa-payments.json"
);
mkdirSync(path.dirname(storePath), { recursive: true });

let payments = [];
try {
  const savedPayments = JSON.parse(readFileSync(storePath, "utf8"));
  if (!Array.isArray(savedPayments)) {
    throw new TypeError("M-Pesa payment store must contain a JSON array.");
  }
  payments = savedPayments;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

export function createPayment({ checkoutRequestId, userId, chamaId, memberName, phone, amount }) {
  if (payments.some((payment) => payment.checkoutRequestId === checkoutRequestId)) {
    throw new Error("Daraja returned a duplicate checkout request ID.");
  }
  const payment = {
    id: randomUUID(),
    checkoutRequestId,
    userId,
    chamaId,
    memberName,
    phone,
    amount,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  payments.push(payment);
  persistPayments();
  return payment;
}

export function getPayment(checkoutRequestId, userId) {
  return payments.find((payment) =>
    payment.checkoutRequestId === checkoutRequestId &&
    (userId === undefined || payment.userId === userId)
  ) || null;
}

export function updatePayment(checkoutRequestId, changes) {
  const payment = getPayment(checkoutRequestId);
  if (!payment) return null;
  Object.assign(payment, changes);
  persistPayments();
  return payment;
}

function persistPayments() {
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(payments, null, 2), { mode: 0o600 });
  renameSync(temporaryPath, storePath);
}
