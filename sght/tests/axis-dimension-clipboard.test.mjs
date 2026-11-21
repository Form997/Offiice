import test from "node:test";
import assert from "node:assert/strict";
import { createGridGeometry, getAxisSize } from "../engine/grid-geometry.js";
import { copyAxisDimension, applyCopiedAxisDimension } from "../engine/axis-dimension-clipboard.js";

test("sao chép chiều cao hàng và áp dụng cho nhiều hàng", () => {
  const source = createGridGeometry({ rowHeights: { "7": 58 } });
  const clipboard = copyAxisDimension(source, "row", 7);
  const target = applyCopiedAxisDimension(createGridGeometry(), clipboard, [2, 3, 4]);
  assert.deepEqual(clipboard, { version: 1, axis: "row", sourceIndex: 7, size: 58 });
  assert.equal(getAxisSize(target, "row", 2), 58);
  assert.equal(getAxisSize(target, "row", 4), 58);
  assert.equal(getAxisSize(target, "row", 5), 32);
});

test("sao chép độ rộng cột có thể áp dụng sang geometry của trang tính khác", () => {
  const clipboard = copyAxisDimension(createGridGeometry({ columnWidths: { "4": 188 } }), "column", 4);
  const target = applyCopiedAxisDimension(createGridGeometry(), clipboard, [1, 5]);
  assert.equal(getAxisSize(target, "column", 1), 188);
  assert.equal(getAxisSize(target, "column", 5), 188);
  assert.equal(getAxisSize(target, "column", 4), 108);
});

test("từ chối clipboard sai trục, chỉ số sai và vùng quá lớn", () => {
  assert.throws(() => copyAxisDimension(createGridGeometry(), "cell", 1), TypeError);
  assert.throws(() => copyAxisDimension(createGridGeometry(), "row", 0), RangeError);
  assert.throws(() => applyCopiedAxisDimension(createGridGeometry(), null, [1]), TypeError);
  assert.throws(() => applyCopiedAxisDimension(createGridGeometry(), { version: 1, axis: "row", size: 40 }, [0]), RangeError);
  assert.throws(() => applyCopiedAxisDimension(createGridGeometry(), { version: 1, axis: "row", size: 40 }, Array.from({ length: 5001 }, (_, i) => i + 1)), RangeError);
});
