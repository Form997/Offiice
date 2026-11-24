/**
 * Compute a bounded per-frame scroll delta while a row/column resize is held near a pane edge.
 * Negative values scroll toward the start; positive values scroll toward the end.
 */
export function calculateAxisResizeAutoScrollDelta({coordinate,start,end,edgeSize=44,maxSpeed=16} = {}) {
  if (![coordinate,start,end].every(Number.isFinite)) return 0;
  const extent = end - start;
  const edgeInput = Number.isFinite(edgeSize) ? Math.abs(edgeSize) : 44;
  const edge = Math.max(1, Math.min(edgeInput || 44, extent / 2));
  const speed = Number.isFinite(maxSpeed) ? Math.max(0, Math.abs(maxSpeed)) : 16;
  if (extent <= 0 || speed === 0) return 0;
  if (coordinate < start + edge) {
    const ratio = Math.max(0, Math.min(1, (start + edge - coordinate) / edge));
    return -Math.round(speed * ratio);
  }
  if (coordinate > end - edge) {
    const ratio = Math.max(0, Math.min(1, (coordinate - (end - edge)) / edge));
    return Math.round(speed * ratio);
  }
  return 0;
}
