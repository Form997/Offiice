import test from "node:test";
import assert from "node:assert/strict";
import {
  createGridGeometry, getAxisSize, getAxisOffset, getAxisRangeSize,
  findAxisIndexAtOffset, setAxisSize, resetAxisSize, serializeGridGeometry
} from "../engine/grid-geometry.js";

test("kích thước mặc định và offset tương thích lưới hiện tại", () => {
  const g = createGridGeometry();
  assert.equal(getAxisSize(g, "row", 1), 32);
  assert.equal(getAxisSize(g, "column", 1), 108);
  assert.equal(getAxisOffset(g, "row", 11), 320);
  assert.equal(getAxisOffset(g, "column", 6), 540);
});

test("kích thước tùy biến chỉ lưu các hàng/cột được thay đổi", () => {
  let g = createGridGeometry();
  g = setAxisSize(g, "row", 4, 48);
  g = setAxisSize(g, "column", 3, 160);
  assert.equal(getAxisSize(g, "row", 4), 48);
  assert.equal(getAxisSize(g, "row", 5), 32);
  assert.equal(getAxisOffset(g, "row", 5), 144);
  assert.equal(getAxisOffset(g, "column", 4), 376);
  assert.deepEqual(Object.keys(g.rowHeights), ["4"]);
  assert.deepEqual(Object.keys(g.columnWidths), ["3"]);
});

test("tính tổng vùng gồm cả các kích thước riêng", () => {
  const g = setAxisSize(createGridGeometry(), "row", 2, 50);
  assert.equal(getAxisRangeSize(g, "row", 1, 3), 114);
  assert.equal(getAxisRangeSize(g, "row", 2, 2), 50);
});

test("tìm đúng hàng/cột tại ranh giới và bên trong ô", () => {
  let g = createGridGeometry();
  g = setAxisSize(g, "row", 2, 50);
  assert.equal(findAxisIndexAtOffset(g, "row", 0), 1);
  assert.equal(findAxisIndexAtOffset(g, "row", 32), 2);
  assert.equal(findAxisIndexAtOffset(g, "row", 81), 2);
  assert.equal(findAxisIndexAtOffset(g, "row", 82), 3);
  assert.equal(findAxisIndexAtOffset(g, "row", 999999999), 100000);
});

test("khôi phục kích thước mặc định khi reset", () => {
  let g = setAxisSize(createGridGeometry(), "column", 7, 200);
  g = resetAxisSize(g, "column", 7);
  assert.equal(getAxisSize(g, "column", 7), 108);
  assert.deepEqual(Object.keys(g.columnWidths), []);
});

test("từ chối chỉ số và kích thước ngoài giới hạn", () => {
  const g = createGridGeometry();
  assert.throws(() => getAxisSize(g, "row", 0), RangeError);
  assert.throws(() => getAxisOffset(g, "column", 16386), RangeError);
  assert.throws(() => setAxisSize(g, "row", 1, 10), RangeError);
  assert.throws(() => setAxisSize(g, "column", 1, 900), RangeError);
  assert.throws(() => findAxisIndexAtOffset(g, "row", -1), RangeError);
});

test("chuẩn hóa dữ liệu kích thước thưa và xuất metadata gọn", () => {
  const g = createGridGeometry({ rowHeights: { "2": 44, "0": 60, "999999": 70, bad: 50 }, columnWidths: { "5": 140 } });
  const saved = serializeGridGeometry(g);
  assert.deepEqual(saved.rowHeights, { "2": 44 });
  assert.deepEqual(saved.columnWidths, { "5": 140 });
  assert.equal(Object.keys(saved.rowHeights).length, 1);
  assert.equal(Object.keys(saved.columnWidths).length, 1);
});

test("không cấp phát mảng theo tổng số hàng hoặc cột", () => {
  const g = createGridGeometry();
  assert.equal(Array.isArray(g.rowHeights), false);
  assert.equal(Array.isArray(g.columnWidths), false);
  assert.equal(Object.keys(g.rowHeights).length, 0);
  assert.equal(Object.keys(g.columnWidths).length, 0);
});

test("đổi đồng loạt nhiều hàng/cột trong một thao tác thưa", () => {
  let g = createGridGeometry();
  g = setAxisSizes(g, "row", [2, 3, 4, 4], 44);
  g = setAxisSizes(g, "column", [1, 5, 8], 150);
  assert.equal(getAxisSize(g, "row", 2), 44);
  assert.equal(getAxisSize(g, "row", 4), 44);
  assert.equal(getAxisSize(g, "row", 5), 32);
  assert.equal(getAxisSize(g, "column", 8), 150);
  assert.deepEqual(Object.keys(serializeGridGeometry(g).rowHeights), ["2", "3", "4"]);
  assert.throws(() => setAxisSizes(g, "row", Array.from({length: 5001}, (_, i) => i + 1), 40), RangeError);
  assert.throws(() => setAxisSizes(g, "column", [1, 0], 120), RangeError);
});
