const ACTION_KEYS = new Set(["invite", "verify", "reset"]);
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

/**
 * Read an account action from a mail link fragment and erase the fragment
 * from the visible URL immediately. The token is returned only in memory.
 */
export function consumeAccountAction(location = globalThis.location, history = globalThis.history) {
  if (!location || !history || typeof history.replaceState !== "function") return null;
  const rawHash = String(location.hash || "").replace(/^#/, "");
  if (!rawHash) return null;
  let action = null;
  try {
    const params = new URLSearchParams(rawHash);
    const entries = [...params.entries()];
    if (entries.length === 1) {
      const [type, token] = entries[0];
      if (ACTION_KEYS.has(type) && TOKEN_PATTERN.test(token)) action = { type, token };
    }
  } catch { /* malformed fragments are discarded */ }
  // Preserve path and query; never leave a bearer token in browser history.
  history.replaceState(history.state ?? null, "", String(location.pathname || "/") + String(location.search || ""));
  return action;
}

export function validateNewPassword(value) {
  return typeof value === "string" && value.length >= 12 && value.length <= 256;
}
