import test from "node:test";
import assert from "node:assert/strict";
import {
  createGridGeometry, getAxisSize, getAxisOffset, getAxisRangeSize,
  findAxisIndexAtOffset, setAxisSize, serializeGridGeometry
} from "../engine/grid-geometry.js";
import { getVirtualWindow } from "../engine/sparse-grid.js";
import { normalizeWorkbookSheets, updateWorkbookSheet } from "../engine/workbook-sheets.js";

test("mọi ranh giới kích thước tùy biến ánh xạ đúng hàng và cột", () => {
  let geometry = createGridGeometry();
  geometry = setAxisSize(geometry, "row", 1, 20);
  geometry = setAxisSize(geometry, "row", 2, 240);
  geometry = setAxisSize(geometry, "row", 50000, 77);
  geometry = setAxisSize(geometry, "column", 1, 40);
  geometry = setAxisSize(geometry, "column", 2, 500);
  geometry = setAxisSize(geometry, "column", 16000, 125);

  for (const [axis, indices] of [
    ["row", [1, 2, 3, 49999, 50000, 50001, 100000]],
    ["column", [1, 2, 3, 15999, 16000, 16001, 16384]]
  ]) {
    for (const index of indices) {
      assert.equal(findAxisIndexAtOffset(geometry, axis, getAxisOffset(geometry, axis, index)), index);
    }
    assert.equal(getAxisOffset(geometry, axis, 1), 0);
    assert.equal(getAxisOffset(geometry, axis, indices.at(-1) + 1) > 0, true);
  }
  assert.equal(getAxisRangeSize(geometry, "row", 1, 2), 260);
  assert.equal(getAxisRangeSize(geometry, "column", 1, 2), 540);
});

test("giới hạn min/max hợp lệ, ngoài giới hạn bị từ chối và reset trả về sparse mặc định", () => {
  let geometry = createGridGeometry();
  geometry = setAxisSize(geometry, "row", 7, 20);
  geometry = setAxisSize(geometry, "row", 8, 240);
  geometry = setAxisSize(geometry, "column", 7, 40);
  geometry = setAxisSize(geometry, "column", 8, 500);
  assert.equal(getAxisSize(geometry, "row", 7), 20);
  assert.equal(getAxisSize(geometry, "row", 8), 240);
  assert.equal(getAxisSize(geometry, "column", 7), 40);
  assert.equal(getAxisSize(geometry, "column", 8), 500);
  assert.throws(() => setAxisSize(geometry, "row", 7, 19.99), RangeError);
  assert.throws(() => setAxisSize(geometry, "row", 7, 240.01), RangeError);
  assert.throws(() => setAxisSize(geometry, "column", 7, 39.99), RangeError);
  assert.throws(() => setAxisSize(geometry, "column", 7, 500.01), RangeError);
  geometry = setAxisSize(geometry, "row", 7, 32);
  geometry = setAxisSize(geometry, "column", 7, 108);
  assert.equal(Object.hasOwn(serializeGridGeometry(geometry).rowHeights, "7"), false);
  assert.equal(Object.hasOwn(serializeGridGeometry(geometry).columnWidths, "7"), false);
});

test("virtual window sát cuối lưới không vượt giới hạn khi có kích thước riêng", () => {
  let geometry = createGridGeometry();
  geometry = setAxisSize(geometry, "row", 100000, 20);
  geometry = setAxisSize(geometry, "column", 16384, 40);
  const window = getVirtualWindow({
    scrollTop: getAxisOffset(geometry, "row", 100000),
    scrollLeft: getAxisOffset(geometry, "column", 16384),
    viewportHeight: 20, viewportWidth: 40,
    overscanRows: 0, overscanColumns: 0,
    maxRow: 100000, maxColumn: 16384, geometry
  });
  assert.equal(window.rowStart, 100000);
  assert.equal(window.rowEnd, 100000);
  assert.equal(window.columnStart, 16384);
  assert.equal(window.columnEnd, 16384);
  assert.equal(window.bottomOffset, 0);
  assert.equal(window.rightOffset, 0);
  assert.equal(window.renderedRows, 1);
  assert.equal(window.renderedColumns, 1);
});

test("workbook cũ không có geometry vẫn tương thích và mỗi sheet giữ metadata riêng", () => {
  const legacy = normalizeWorkbookSheets([
    { id: "old", name: "Cũ", cells: { A1: 10 }, formats: { A1: { bold: true } } },
    { id: "new", name: "Mới", cells: { B2: "=A1*2" }, geometry: { rowHeights: { "2": 64 } } }
  ]);
  assert.deepEqual(legacy[0].geometry, {});
  assert.deepEqual(legacy[1].geometry.rowHeights, { "2": 64 });

  const oldGeometry = serializeGridGeometry(createGridGeometry(legacy[0].geometry));
  const newGeometry = serializeGridGeometry(createGridGeometry(legacy[1].geometry));
  assert.equal(getAxisSize(createGridGeometry(oldGeometry), "row", 2), 32);
  assert.equal(getAxisSize(createGridGeometry(newGeometry), "row", 2), 64);

  const updated = updateWorkbookSheet(legacy, "old", { geometry: { columnWidths: { "3": 180 } } });
  const restored = normalizeWorkbookSheets(JSON.parse(JSON.stringify(updated)));
  assert.deepEqual(restored[0].geometry.columnWidths, { "3": 180 });
  assert.deepEqual(restored[1].geometry.rowHeights, { "2": 64 });
  assert.deepEqual(restored[0].cells, { A1: 10 });
  assert.deepEqual(restored[0].formats, { A1: { bold: true } });
  assert.deepEqual(restored[1].cells, { B2: "=A1*2" });
});

test("geometry nguồn không bị thay đổi khi tạo bản mới và serialize", () => {
  const source = createGridGeometry();
  const changed = setAxisSize(source, "row", 12, 88);
  assert.equal(getAxisSize(source, "row", 12), 32);
  assert.equal(getAxisSize(changed, "row", 12), 88);
  assert.deepEqual(serializeGridGeometry(source).rowHeights, {});
  assert.deepEqual(serializeGridGeometry(changed).rowHeights, { "12": 88 });
});
