export function normalizeRecoveryEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^\\S+@\\S+\\.\\S+$/.test(email) ? email : "";
}
