export const SESSION_IDLE_TTL_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_TTL_MS = 8 * 60 * 60 * 1000;
export function normalizeUserAgent(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}
export function describeDevice(value) {
  const ua = normalizeUserAgent(value);
  if (!ua) return "Thiết bị không xác định";
  let browser = "Trình duyệt khác";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/CriOS\//i.test(ua)) browser = "Chrome (iOS)";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  let platform = "Hệ điều hành khác";
  if (/Android/i.test(ua)) platform = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) platform = "iOS";
  else if (/Windows NT/i.test(ua)) platform = "Windows";
  else if (/Mac OS X/i.test(ua)) platform = "macOS";
  else if (/Linux/i.test(ua)) platform = "Linux";
  return browser + " · " + platform;
}
export function isSessionIdleExpired(lastSeenAt, now = Date.now(), idleMs = SESSION_IDLE_TTL_MS) {
  const last = lastSeenAt instanceof Date ? lastSeenAt.getTime() : Date.parse(lastSeenAt);
  return !Number.isFinite(last) || !Number.isFinite(now) || now - last >= idleMs;
}
export function hasUserAgentChanged(original, current) {
  const before = normalizeUserAgent(original), after = normalizeUserAgent(current);
  return !!before && !!after && before !== after;
}
