import { getAxisSize, setAxisSizes } from "./grid-geometry.js";

/**
 * A separate, in-memory clipboard for row heights / column widths.
 * It never contains cell values, formulas, or formatting.
 */
export function copyAxisDimension(geometry, axis, sourceIndex) {
  if (axis !== "row" && axis !== "column") throw new TypeError("Trục kích thước phải là row hoặc column.");
  if (!Number.isSafeInteger(sourceIndex) || sourceIndex < 1) throw new RangeError("Hàng/cột nguồn không hợp lệ.");
  return Object.freeze({
    version: 1,
    axis,
    sourceIndex,
    size: getAxisSize(geometry, axis, sourceIndex)
  });
}

/** Apply a copied dimension to a bounded list of target rows / columns. */
export function applyCopiedAxisDimension(geometry, clipboard, targetIndices) {
  if (!clipboard || clipboard.version !== 1 || !["row", "column"].includes(clipboard.axis)) {
    throw new TypeError("Bộ nhớ kích thước chưa có dữ liệu hợp lệ.");
  }
  if (!Array.isArray(targetIndices) || !targetIndices.length || targetIndices.length > 5000) {
    throw new RangeError("Phạm vi áp dụng phải có từ 1 đến 5.000 hàng hoặc cột.");
  }
  return setAxisSizes(geometry, clipboard.axis, targetIndices, clipboard.size);
}
