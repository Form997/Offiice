/** SGHT freeze-pane layout for a virtualized grid. */
export function normalizeFreezeSettings(value = {}) {
  const rows = Number(value.rows ?? 0), columns = Number(value.columns ?? 0);
  if (!Number.isInteger(rows) || rows < 0 || rows > 20) throw new RangeError("Số hàng ghim phải từ 0 đến 20.");
  if (!Number.isInteger(columns) || columns < 0 || columns > 10) throw new RangeError("Số cột ghim phải từ 0 đến 10.");
  return { rows, columns };
}
export function buildFreezeLayout(window, settings = {}, geometry = {}) {
  const freeze = normalizeFreezeSettings(settings);
  const rowHeight = Number.isFinite(geometry.rowHeight) && geometry.rowHeight > 0 ? geometry.rowHeight : 32;
  const columnWidth = Number.isFinite(geometry.columnWidth) && geometry.columnWidth > 0 ? geometry.columnWidth : 108;
  const activeRows = freeze.rows > 0 && window.rowStart > freeze.rows;
  const activeColumns = freeze.columns > 0 && window.columnStart > freeze.columns;
  const pinnedRows = activeRows ? Array.from({ length: freeze.rows }, (_, i) => i + 1) : [];
  const pinnedColumns = activeColumns ? Array.from({ length: freeze.columns }, (_, i) => i + 1) : [];
  return {
    activeRows, activeColumns, pinnedRows, pinnedColumns,
    topGap: activeRows ? Math.max(0, window.topOffset - freeze.rows * rowHeight) : window.topOffset,
    leftGap: activeColumns ? Math.max(0, window.leftOffset - freeze.columns * columnWidth) : window.leftOffset
  };
}
