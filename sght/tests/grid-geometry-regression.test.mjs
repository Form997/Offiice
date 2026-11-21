import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGridGeometry, getAxisSize, serializeGridGeometry, setAxisSize, setAxisSizes, setAxisSizeMap } from "../engine/grid-geometry.js";
import { getVirtualWindow } from "../engine/sparse-grid.js";
import { buildFreezeLayout } from "../engine/freeze-panes.js";
import { normalizeWorkbookSheets, updateWorkbookSheet } from "../engine/workbook-sheets.js";
import { copyAxisDimension, applyCopiedAxisDimension } from "../engine/axis-dimension-clipboard.js";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("hình học thay đổi vẫn định vị đúng cửa sổ ảo và không tạo lưới dày", () => {
  const geometry = createGridGeometry({ rowHeights: { "2": 48, "100000": 72 }, columnWidths: { "3": 160, "16384": 240 } });
  const window = getVirtualWindow({
    scrollTop: 32, scrollLeft: 216, viewportHeight: 48, viewportWidth: 160,
    overscanRows: 0, overscanColumns: 0, maxRow: 100000, maxColumn: 16384, geometry
  });
  assert.equal(window.rowStart, 2);
  assert.equal(window.columnStart, 3);
  assert.equal(window.topOffset, 32);
  assert.equal(window.leftOffset, 216);
  assert.equal(Array.isArray(geometry.rowHeights), false);
  assert.equal(Object.keys(geometry.rowHeights).length, 2);
});

test("freeze panes dùng tổng kích thước tùy chỉnh thay vì nhân kích thước mặc định", () => {
  const geometry = createGridGeometry({ rowHeights: { "1": 40, "2": 60 }, columnWidths: { "1": 120, "2": 140 } });
  const layout = buildFreezeLayout(
    { rowStart: 5, columnStart: 5, topOffset: 164, leftOffset: 476 },
    { rows: 2, columns: 2 },
    { gridGeometry: geometry }
  );
  assert.equal(layout.topGap, 64);
  assert.equal(layout.leftGap, 216);
  assert.deepEqual(layout.pinnedRows, [1, 2]);
  assert.deepEqual(layout.pinnedColumns, [1, 2]);
});

test("metadata hình học lưu riêng từng sheet và không làm đổi ô, công thức, định dạng", () => {
  const originalCells = { A1: 12, B2: "=A1*2", C3: "Giữ nguyên" };
  const originalFormats = { A1: { bold: true }, B2: { numberFormat: "0.00" } };
  const sheets = normalizeWorkbookSheets([
    { id: "source", name: "Nguồn", cells: originalCells, formats: originalFormats },
    { id: "target", name: "Đích", cells: { A1: 99 } }
  ]);
  const nextGeometry = serializeGridGeometry(setAxisSize(createGridGeometry(), "row", 2, 52));
  const updated = updateWorkbookSheet(sheets, "source", { geometry: nextGeometry });
  const roundTrip = normalizeWorkbookSheets(JSON.parse(JSON.stringify(updated)));
  assert.deepEqual(roundTrip[0].cells, originalCells);
  assert.deepEqual(roundTrip[0].formats, originalFormats);
  assert.equal(roundTrip[0].cells.B2, "=A1*2");
  assert.equal(roundTrip[0].geometry.rowHeights["2"], 52);
  assert.deepEqual(roundTrip[1].geometry, {});
});

test("clipboard kích thước chéo sheet chỉ áp dụng đúng trục và không sửa nguồn", () => {
  const source = createGridGeometry({ rowHeights: { "8": 64 }, columnWidths: { "4": 190 } });
  const copiedRow = copyAxisDimension(source, "row", 8);
  const target = createGridGeometry({ rowHeights: { "2": 44 }, columnWidths: { "9": 170 } });
  const applied = applyCopiedAxisDimension(target, copiedRow, [3, 4, 5]);
  assert.equal(getAxisSize(applied, "row", 3), 64);
  assert.equal(getAxisSize(applied, "row", 5), 64);
  assert.equal(getAxisSize(applied, "column", 9), 170);
  assert.equal(getAxisSize(target, "row", 3), 32);
  assert.equal(getAxisSize(source, "row", 8), 64);
});

test("AutoFit theo lô giữ giới hạn trục và lịch sử hình học có thể khôi phục snapshot", () => {
  const before = createGridGeometry();
  const after = setAxisSizeMap(before, "column", { "1": 220, "2": 300, "3": 108 });
  const undo = createGridGeometry(serializeGridGeometry(before));
  const redo = createGridGeometry(serializeGridGeometry(after));
  assert.equal(getAxisSize(undo, "column", 1), 108);
  assert.equal(getAxisSize(redo, "column", 1), 220);
  assert.equal(getAxisSize(redo, "column", 3), 108);
  assert.throws(() => setAxisSizeMap(before, "column", Object.fromEntries(Array.from({ length: 5001 }, (_, i) => [String(i + 1), 120]))), RangeError);
  assert.throws(() => setAxisSizes(before, "row", [1, 2], 241), RangeError);
});

test("mã giao diện nối drag, cancel, AutoFit, clipboard và lịch sử hình học", () => {
  assert.match(appSource, /function beginAxisResize\(event\)/);
  assert.match(appSource, /targets, startSize, previewSize:startSize/);
  assert.match(appSource, /window\.addEventListener\("pointerup",event=>finishAxisResize\(event,true\)\)/);
  assert.match(appSource, /window\.addEventListener\("pointercancel",event=>finishAxisResize\(event,false\)\)/);
  assert.match(appSource, /drag\.sheetId!==activeSheetId/);
  assert.match(appSource, /function autoFitSelection\(axis\)/);
  assert.match(appSource, /area>100000/);
  assert.match(appSource, /recordGeometryChange\(before,after,"AutoFit/);
  assert.match(appSource, /function applySelectedAxisDimension\(\)/);
  assert.match(appSource, /recordGeometryChange\(before,after,"Áp dụng kích thước/);
  for (const id of ["autoFitColumns", "autoFitRows", "copyRowDimension", "copyColumnDimension", "applyAxisDimension"]) {
    assert.ok(htmlSource.includes('id="' + id + '"'), "Thiếu nút " + id);
  }
});

test("drag resize cài đặt trên các pane lưới đang hiển thị", () => {
  assert.match(appSource, /\[grid,splitGrid,quadrantPanes\.topRight\.grid,quadrantPanes\.bottomLeft\.grid\]\.forEach\(installAxisResize\)/);
  assert.match(appSource, /function finishAxisResize\(event,commit=true\)/);
  assert.match(appSource, /if\(!commit\|\|drag\.sheetId!==activeSheetId/);
});
