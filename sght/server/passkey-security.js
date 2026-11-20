// WebAuthn signature-counter policy. A zero counter means the authenticator
// does not provide clone-detection signals; do not treat that as an anomaly.
export function hasSignatureCounterAnomaly(previousCounter, nextCounter) {
  const previous = Number(previousCounter);
  const next = Number(nextCounter);
  if (!Number.isSafeInteger(previous) || previous < 0 ||
      !Number.isSafeInteger(next) || next < 0) {
    throw new TypeError("WebAuthn counters must be non-negative safe integers.");
  }
  return previous > 0 && next > 0 && next <= previous;
}
