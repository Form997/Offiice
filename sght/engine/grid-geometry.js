/**
 * SGHT grid geometry — sparse variable row/column dimensions.
 * UI geometry only: this module never reads or mutates workbook cell values.
 * Overrides are sparse maps keyed by 1-based logical indices; no full-axis arrays.
 */
export const GRID_GEOMETRY_DEFAULTS = Object.freeze({
  rowHeight: 32,
  columnWidth: 108,
  minRowHeight: 20,
  maxRowHeight: 240,
  minColumnWidth: 40,
  maxColumnWidth: 500,
  maxRows: 100000,
  maxColumns: 16384
});

function finiteInRange(value, min, max, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(label + " phải nằm trong khoảng " + min + "–" + max + ".");
  }
  return number;
}

function normalizeOverrides(input, limit, min, max, label) {
  if (input == null) return Object.create(null);
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Bản đồ kích thước " + label + " không hợp lệ.");
  }
  const output = Object.create(null);
  for (const [rawIndex, rawSize] of Object.entries(input)) {
    if (!/^[1-9][0-9]*$/.test(rawIndex)) continue;
    const index = Number(rawIndex);
    if (!Number.isSafeInteger(index) || index > limit) continue;
    const size = Number(rawSize);
    if (!Number.isFinite(size) || size < min || size > max) continue;
    output[index] = size;
  }
  return output;
}

/** Create a normalized geometry value with sparse row/column overrides. */
export function createGridGeometry(input = {}) {
  const options = input && typeof input === "object" ? input : {};
  const maxRows = options.maxRows === undefined ? GRID_GEOMETRY_DEFAULTS.maxRows : Number(options.maxRows);
  const maxColumns = options.maxColumns === undefined ? GRID_GEOMETRY_DEFAULTS.maxColumns : Number(options.maxColumns);
  if (!Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > GRID_GEOMETRY_DEFAULTS.maxRows) throw new RangeError("Giới hạn số hàng không hợp lệ.");
  if (!Number.isSafeInteger(maxColumns) || maxColumns < 1 || maxColumns > GRID_GEOMETRY_DEFAULTS.maxColumns) throw new RangeError("Giới hạn số cột không hợp lệ.");
  const rowHeight = finiteInRange(options.rowHeight ?? GRID_GEOMETRY_DEFAULTS.rowHeight, 1, 1000, "Chiều cao hàng mặc định");
  const columnWidth = finiteInRange(options.columnWidth ?? GRID_GEOMETRY_DEFAULTS.columnWidth, 1, 2000, "Độ rộng cột mặc định");
  const minRowHeight = finiteInRange(options.minRowHeight ?? GRID_GEOMETRY_DEFAULTS.minRowHeight, 1, 1000, "Chiều cao hàng tối thiểu");
  const maxRowHeight = finiteInRange(options.maxRowHeight ?? GRID_GEOMETRY_DEFAULTS.maxRowHeight, minRowHeight, 1000, "Chiều cao hàng tối đa");
  const minColumnWidth = finiteInRange(options.minColumnWidth ?? GRID_GEOMETRY_DEFAULTS.minColumnWidth, 1, 2000, "Độ rộng cột tối thiểu");
  const maxColumnWidth = finiteInRange(options.maxColumnWidth ?? GRID_GEOMETRY_DEFAULTS.maxColumnWidth, minColumnWidth, 2000, "Độ rộng cột tối đa");
  if (rowHeight < minRowHeight || rowHeight > maxRowHeight) throw new RangeError("Chiều cao hàng mặc định nằm ngoài giới hạn.");
  if (columnWidth < minColumnWidth || columnWidth > maxColumnWidth) throw new RangeError("Độ rộng cột mặc định nằm ngoài giới hạn.");
  return {
    rowHeight, columnWidth, minRowHeight, maxRowHeight, minColumnWidth, maxColumnWidth,
    maxRows, maxColumns,
    rowHeights: normalizeOverrides(options.rowHeights, maxRows, minRowHeight, maxRowHeight, "hàng"),
    columnWidths: normalizeOverrides(options.columnWidths, maxColumns, minColumnWidth, maxColumnWidth, "cột")
  };
}

function axisConfig(geometry, axis) {
  const g = geometry?.rowHeights && geometry?.columnWidths ? geometry : createGridGeometry(geometry);
  if (axis === "row") return { map: g.rowHeights, base: g.rowHeight, min: g.minRowHeight, max: g.maxRowHeight, count: g.maxRows };
  if (axis === "column") return { map: g.columnWidths, base: g.columnWidth, min: g.minColumnWidth, max: g.maxColumnWidth, count: g.maxColumns };
  throw new TypeError("Trục lưới phải là 'row' hoặc 'column'.");
}

function validIndex(index, count) {
  if (!Number.isSafeInteger(index) || index < 1 || index > count) throw new RangeError("Chỉ số hàng/cột nằm ngoài giới hạn lưới.");
  return index;
}

/** Return the pixel size of a 1-based row or column. */
export function getAxisSize(geometry, axis, index) {
  const config = axisConfig(geometry, axis);
  validIndex(index, config.count);
  return config.map[index] ?? config.base;
}

/** Return the pixel offset before a 1-based row/column. Index count+1 is allowed for total size. */
export function getAxisOffset(geometry, axis, index) {
  const config = axisConfig(geometry, axis);
  if (!Number.isSafeInteger(index) || index < 1 || index > config.count + 1) throw new RangeError("Mốc hàng/cột nằm ngoài giới hạn lưới.");
  let offset = (index - 1) * config.base;
  for (const [key, value] of Object.entries(config.map)) {
    const changedIndex = Number(key);
    if (changedIndex < index) offset += value - config.base;
  }
  return offset;
}

/** Return total pixel size of an inclusive 1-based range. */
export function getAxisRangeSize(geometry, axis, start, end) {
  const config = axisConfig(geometry, axis);
  validIndex(start, config.count);
  validIndex(end, config.count);
  if (end < start) throw new RangeError("Khoảng hàng/cột không hợp lệ.");
  return getAxisOffset(geometry, axis, end + 1) - getAxisOffset(geometry, axis, start);
}

/** Find the 1-based item containing a pixel coordinate from the axis origin. */
export function findAxisIndexAtOffset(geometry, axis, offset) {
  const config = axisConfig(geometry, axis);
  const point = Number(offset);
  if (!Number.isFinite(point) || point < 0) throw new RangeError("Tọa độ cuộn phải là số hữu hạn không âm.");
  const total = getAxisOffset(geometry, axis, config.count + 1);
  if (point >= total) return config.count;
  let low = 1, high = config.count;
  while (low < high) {
    const middle = Math.floor((low + high + 1) / 2);
    if (getAxisOffset(geometry, axis, middle) <= point) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** Return a new geometry with one explicit row height or column width. */
export function setAxisSize(geometry, axis, index, size) {
  const g = createGridGeometry(geometry);
  const config = axisConfig(g, axis);
  validIndex(index, config.count);
  const nextSize = finiteInRange(size, config.min, config.max, axis === "row" ? "Chiều cao hàng" : "Độ rộng cột");
  const key = String(index);
  const map = { ...config.map };
  if (nextSize === config.base) delete map[key];
  else map[key] = nextSize;
  return createGridGeometry({ ...g, [axis === "row" ? "rowHeights" : "columnWidths"]: map });
}

/** Remove a custom size and restore the axis default. */
export function resetAxisSize(geometry, axis, index) {
  const g = createGridGeometry(geometry);
  const config = axisConfig(g, axis);
  validIndex(index, config.count);
  const map = { ...config.map };
  delete map[String(index)];
  return createGridGeometry({ ...g, [axis === "row" ? "rowHeights" : "columnWidths"]: map });
}

/** Compact serializable geometry for workbook metadata (no dense arrays). */
export function serializeGridGeometry(geometry) {
  const g = createGridGeometry(geometry);
  const sorted = source => Object.fromEntries(Object.entries(source).sort((a, b) => Number(a[0]) - Number(b[0])));
  return {
    rowHeight: g.rowHeight, columnWidth: g.columnWidth,
    minRowHeight: g.minRowHeight, maxRowHeight: g.maxRowHeight,
    minColumnWidth: g.minColumnWidth, maxColumnWidth: g.maxColumnWidth,
    rowHeights: sorted(g.rowHeights), columnWidths: sorted(g.columnWidths)
  };
}
