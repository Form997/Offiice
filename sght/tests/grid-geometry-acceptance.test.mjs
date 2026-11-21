import test from "node:test";
import assert from "node:assert/strict";
import {
  createGridGeometry, getAxisSize, getAxisOffset, getAxisRangeSize,
  findAxisIndexAtOffset, setAxisSize, setAxisSizes, setAxisSizeMap,
  resetAxisSize, serializeGridGeometry
} from "../engine/grid-geometry.js";

test("tọa độ biên của hàng/cột thay đổi trả đúng chỉ số chứa điểm", () => {
  const geometry = createGridGeometry({
    maxRows: 8, maxColumns: 6,
    rowHeights: { "2": 48, "5": 20, "8": 60 },
    columnWidths: { "1": 140, "3": 72, "6": 200 }
  });
  const rowEdges = [0, 32, 80, 112, 144, 164, 196, 228, 288];
  for (let i = 0; i < rowEdges.length - 1; i++) {
    assert.equal(findAxisIndexAtOffset(geometry, "row", rowEdges[i]), i + 1);
    assert.equal(findAxisIndexAtOffset(geometry, "row", rowEdges[i + 1] - 0.001), i + 1);
  }
  const colEdges = [0, 140, 248, 320, 428, 536, 736];
  for (let i = 0; i < colEdges.length - 1; i++) {
    assert.equal(findAxisIndexAtOffset(geometry, "column", colEdges[i]), i + 1);
    assert.equal(findAxisIndexAtOffset(geometry, "column", colEdges[i + 1] - 0.001), i + 1);
  }
  assert.equal(findAxisIndexAtOffset(geometry, "row", 280), 8);
  assert.equal(findAxisIndexAtOffset(geometry, "column", 736), 6);
});

test("offset, tổng vùng và tổng trục nhất quán với kích thước thưa", () => {
  const geometry = createGridGeometry({
    maxRows: 10, maxColumns: 8,
    rowHeights: { "2": 48, "7": 60 },
    columnWidths: { "3": 160, "8": 200 }
  });
  assert.equal(getAxisOffset(geometry, "row", 1), 0);
  assert.equal(getAxisOffset(geometry, "row", 3), 80);
  assert.equal(getAxisRangeSize(geometry, "row", 2, 7), 48 + 32 + 32 + 20 + 32 + 32);
  assert.equal(getAxisOffset(geometry, "row", 11), 32 * 10 + 16 + 28);
  assert.equal(getAxisRangeSize(geometry, "column", 2, 4), 108 + 160 + 108);
  assert.equal(getAxisOffset(geometry, "column", 9), 108 * 8 + 52 + 92);
});

test("đổi kích thước đơn, theo lô và theo bản đồ không làm đột biến geometry nguồn", () => {
  const original = createGridGeometry();
  const one = setAxisSize(original, "row", 4, 52);
  const many = setAxisSizes(one, "row", [4, 5, 5, 6], 64);
  const mapped = setAxisSizeMap(many, "column", { "1": 180, "2": 108, "8": 240 });
  assert.equal(getAxisSize(original, "row", 4), 32);
  assert.equal(getAxisSize(one, "row", 4), 52);
  assert.equal(getAxisSize(many, "row", 5), 64);
  assert.equal(getAxisSize(mapped, "column", 1), 180);
  assert.equal(getAxisSize(mapped, "column", 2), 108);
  assert.equal(getAxisSize(mapped, "column", 8), 240);
  assert.deepEqual(serializeGridGeometry(original).rowHeights, {});
});

test("reset và lưu-mở geometry khôi phục chính xác các override", () => {
  const changed = setAxisSizeMap(createGridGeometry(), "column", { "2": 220, "4": 300 });
  const restored = createGridGeometry(JSON.parse(JSON.stringify(serializeGridGeometry(changed))));
  assert.equal(getAxisSize(restored, "column", 2), 220);
  assert.equal(getAxisSize(restored, "column", 4), 300);
  const reset = resetAxisSize(restored, "column", 2);
  assert.equal(getAxisSize(reset, "column", 2), 108);
  assert.equal(getAxisSize(reset, "column", 4), 300);
  assert.deepEqual(serializeGridGeometry(reset).columnWidths, { "4": 300 });
});

test("chặn chỉ số, tọa độ và kích thước ngoài giới hạn", () => {
  const geometry = createGridGeometry({ maxRows: 10, maxColumns: 8 });
  assert.throws(() => getAxisSize(geometry, "row", 0), RangeError);
  assert.throws(() => getAxisSize(geometry, "column", 9), RangeError);
  assert.throws(() => getAxisOffset(geometry, "row", 12), RangeError);
  assert.throws(() => getAxisRangeSize(geometry, "row", 4, 3), RangeError);
  assert.throws(() => findAxisIndexAtOffset(geometry, "row", -1), RangeError);
  assert.throws(() => findAxisIndexAtOffset(geometry, "column", Number.NaN), RangeError);
  assert.throws(() => setAxisSize(geometry, "row", 2, 241), RangeError);
  assert.throws(() => setAxisSize(geometry, "column", 2, 39), RangeError);
  assert.throws(() => setAxisSizes(geometry, "row", [], 40), TypeError);
  assert.throws(() => setAxisSizes(geometry, "row", Array.from({length:5001}, (_, i) => i + 1), 40), RangeError);
  assert.throws(() => setAxisSizeMap(geometry, "column", {}), RangeError);
  assert.throws(() => setAxisSizeMap(geometry, "column", { "9": 120 }), RangeError);
});

test("geometry tiếp tục thưa khi lưới đạt giới hạn tối đa", () => {
  const geometry = setAxisSizeMap(createGridGeometry(), "row", { "1": 40, "50000": 80, "100000": 120 });
  const serialized = serializeGridGeometry(geometry);
  assert.deepEqual(Object.keys(serialized.rowHeights), ["1", "50000", "100000"]);
  assert.equal(Array.isArray(serialized.rowHeights), false);
  assert.equal(Object.keys(serialized.columnWidths).length, 0);
});
