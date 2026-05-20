// js shim for runtime compatibility.
// The email implementation lives in sendEmail.ts (or does not exist in this repo snapshot).
// For Phase 3 auth refactor, tests mock this module; runtime requires a safe stub.

export default async function sendEmail() {
  // No-op stub: keep app runnable in environments without SMTP config.
  return true;
}

export async function sendTemplateEmail() {
  return true;
}

