/**
 * Compute a bounded per-frame scroll delta while a row/column resize is held near a pane edge.
 * Negative values scroll toward the start; positive values scroll toward the end.
 */
export function calculateAxisResizeAutoScrollDelta({coordinate,start,end,edgeSize=44,maxSpeed=16} = {}) {
  const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const left = finite(start), right = finite(end), point = finite(coordinate);
  const extent = right - left;
  const edge = Math.max(1, Math.min(Math.abs(finite(edgeSize)) || 44, extent / 2));
  const speed = Math.max(0, Math.abs(finite(maxSpeed)));
  if (extent <= 0 || speed === 0) return 0;
  if (point < left + edge) {
    const ratio = Math.max(0, Math.min(1, (left + edge - point) / edge));
    return -Math.round(speed * ratio);
  }
  if (point > right - edge) {
    const ratio = Math.max(0, Math.min(1, (point - (right - edge)) / edge));
    return Math.round(speed * ratio);
  }
  return 0;
}
