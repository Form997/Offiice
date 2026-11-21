const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;

/** Convert viewport pointer coordinates to a bounded offset in the shared sheet-panes overlay. */
export function calculateAxisResizeGuidePosition({axis,startGuideCoordinate,pointerCoordinate,startCoordinate,origin,extent} = {}) {
  if (axis !== "row" && axis !== "column") throw new TypeError("Trục resize phải là row hoặc column.");
  const size = Math.max(0, finite(extent));
  const position = finite(startGuideCoordinate) + (finite(pointerCoordinate) - finite(startCoordinate)) - finite(origin);
  return Math.min(size, Math.max(0, position));
}
