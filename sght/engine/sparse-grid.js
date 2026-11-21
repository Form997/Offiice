import { getAxisOffset, getAxisSize, findAxisIndexAtOffset } from "./grid-geometry.js";
/**
 * HAI ĐẤT SGHT — Sparse Grid Core (Stage 18.1)
 * Logical address and viewport primitives for a resource-aware virtual grid.
 * Stores only occupied cells; it does not allocate a rectangular matrix.
 */

export function columnLabel(column) {
  if (!Number.isSafeInteger(column) || column < 1) throw new RangeError("Chỉ số cột phải là số nguyên dương an toàn.");
  let n = column, label = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export function cellAddress(row, column) {
  if (!Number.isSafeInteger(row) || row < 1) throw new RangeError("Chỉ số hàng phải là số nguyên dương an toàn.");
  return columnLabel(column) + row;
}

export function parseCellAddress(address) {
  if (typeof address !== "string") return null;
  const match = /^([A-Z]+)([1-9][0-9]*)$/i.exec(address.trim());
  if (!match) return null;
  let column = 0;
  for (const character of match[1].toUpperCase()) {
    column = column * 26 + character.charCodeAt(0) - 64;
    if (!Number.isSafeInteger(column)) return null;
  }
  const row = Number(match[2]);
  if (!Number.isSafeInteger(row) || row < 1) return null;
  return { row, column, address: columnLabel(column) + row };
}

/** Find the smallest rectangle containing actual values or formats. */
export function getSparseBounds(cells = {}, formats = {}) {
  let minRow = Infinity, minColumn = Infinity, maxRow = 0, maxColumn = 0, occupied = 0;
  const seen = new Set();
  for (const source of [cells, formats]) {
    for (const key of Object.keys(source || {})) {
      const parsed = parseCellAddress(key);
      if (!parsed || seen.has(parsed.address)) continue;
      seen.add(parsed.address);
      minRow = Math.min(minRow, parsed.row);
      minColumn = Math.min(minColumn, parsed.column);
      maxRow = Math.max(maxRow, parsed.row);
      maxColumn = Math.max(maxColumn, parsed.column);
      occupied++;
    }
  }
  return occupied
    ? { minRow, minColumn, maxRow, maxColumn, occupied }
    : { minRow: 1, minColumn: 1, maxRow: 0, maxColumn: 0, occupied: 0 };
}

/**
 * Convert a scroll viewport to a bounded set of cells to render.
 * Row/column coordinates remain logical; no blank-cell matrix is allocated.
 */
export function getVirtualWindow({
  scrollTop = 0, scrollLeft = 0, viewportHeight = 600, viewportWidth = 900,
  rowHeight = 32, columnWidth = 112, overscanRows = 5, overscanColumns = 2,
  maxRow = Number.MAX_SAFE_INTEGER, maxColumn = Number.MAX_SAFE_INTEGER, geometry = null
} = {}) {
  const finiteNonNegative = (value, fallback) => Number.isFinite(value) && value >= 0 ? value : fallback;
  const top = finiteNonNegative(scrollTop, 0);
  const left = finiteNonNegative(scrollLeft, 0);
  const height = Math.max(1, finiteNonNegative(viewportHeight, 600));
  const width = Math.max(1, finiteNonNegative(viewportWidth, 900));
  const rh = Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 32;
  const cw = Number.isFinite(columnWidth) && columnWidth > 0 ? columnWidth : 112;
  const or = Number.isSafeInteger(overscanRows) && overscanRows >= 0 ? overscanRows : 5;
  const oc = Number.isSafeInteger(overscanColumns) && overscanColumns >= 0 ? overscanColumns : 2;
  const lastRow = Number.isSafeInteger(maxRow) && maxRow > 0 ? maxRow : Number.MAX_SAFE_INTEGER;
  const lastColumn = Number.isSafeInteger(maxColumn) && maxColumn > 0 ? maxColumn : Number.MAX_SAFE_INTEGER;
  const firstVisibleRow = geometry ? findAxisIndexAtOffset(geometry, "row", top) : Math.floor(top / rh) + 1;
  const firstVisibleColumn = geometry ? findAxisIndexAtOffset(geometry, "column", left) : Math.floor(left / cw) + 1;
  const lastVisibleRow = geometry ? findAxisIndexAtOffset(geometry, "row", top + height - 1) : firstVisibleRow + Math.ceil(height / rh) - 1;
  const lastVisibleColumn = geometry ? findAxisIndexAtOffset(geometry, "column", left + width - 1) : firstVisibleColumn + Math.ceil(width / cw) - 1;
  const visibleRows = Math.max(1, lastVisibleRow - firstVisibleRow + 1);
  const visibleColumns = Math.max(1, lastVisibleColumn - firstVisibleColumn + 1);
  const rowStart = Math.max(1, firstVisibleRow - or);
  const columnStart = Math.max(1, firstVisibleColumn - oc);
  const rowEnd = Math.min(lastRow, lastVisibleRow + or);
  const columnEnd = Math.min(lastColumn, lastVisibleColumn + oc);
  const topOffset = geometry ? getAxisOffset(geometry, "row", rowStart) : (rowStart - 1) * rh;
  const leftOffset = geometry ? getAxisOffset(geometry, "column", columnStart) : (columnStart - 1) * cw;
  const bottomOffset = geometry ? Math.max(0, getAxisOffset(geometry, "row", lastRow + 1) - getAxisOffset(geometry, "row", rowEnd + 1)) : Math.max(0, (lastRow - rowEnd) * rh);
  const rightOffset = geometry ? Math.max(0, getAxisOffset(geometry, "column", lastColumn + 1) - getAxisOffset(geometry, "column", columnEnd + 1)) : Math.max(0, (lastColumn - columnEnd) * cw);
  return {
    rowStart, rowEnd, columnStart, columnEnd,
    visibleRows, visibleColumns,
    topOffset, leftOffset, bottomOffset, rightOffset,
    renderedRows: Math.max(0, rowEnd - rowStart + 1),
    renderedColumns: Math.max(0, columnEnd - columnStart + 1)
  };
}

/** Copy-on-write update for sparse cell maps. Empty values remove their keys. */
export function updateSparseCells(cells = {}, updates = {}) {
  const next = Object.assign(Object.create(null), cells);
  for (const [key, value] of Object.entries(updates)) {
    const parsed = parseCellAddress(key);
    if (!parsed) throw new TypeError("Địa chỉ ô không hợp lệ: " + key);
    if (value === null || value === undefined || value === "") delete next[parsed.address];
    else next[parsed.address] = value;
  }
  return next;
}
