export const SPLIT_MODES = Object.freeze(["none","horizontal","vertical"]);

export function normalizeSplitSettings(value={}) {
  const mode = value && SPLIT_MODES.includes(value.mode) ? value.mode : "none";
  return { mode };
}

export function synchronizedAxis(mode) {
  if (mode === "horizontal") return "x";
  if (mode === "vertical") return "y";
  return null;
}

export function splitViewportState(mode, primary, secondary) {
  const normalized = normalizeSplitSettings({mode}).mode;
  const a = {top: Math.max(0, Number(primary?.top)||0), left: Math.max(0, Number(primary?.left)||0)};
  const b = {top: Math.max(0, Number(secondary?.top)||0), left: Math.max(0, Number(secondary?.left)||0)};
  if (normalized === "horizontal") b.left = a.left;
  if (normalized === "vertical") b.top = a.top;
  return {primary:a, secondary:b, synchronizedAxis:synchronizedAxis(normalized)};
}
