import test from "node:test";
import assert from "node:assert/strict";
import {
  createGridGeometry, getAxisOffset, getAxisSize,
  setAxisSizeMap, serializeGridGeometry
} from "../engine/grid-geometry.js";
import { getVirtualWindow } from "../engine/sparse-grid.js";
import { buildFreezeLayout } from "../engine/freeze-panes.js";
import {
  normalizeSplitSettings, synchronizeQuadrantPositions, quadrantScrollTargets
} from "../engine/split-panes.js";
import { normalizeWorkbookSheets, updateWorkbookSheet } from "../engine/workbook-sheets.js";
import { calculateAxisResizeGuidePosition } from "../engine/axis-resize-guide.js";
import { calculateAxisResizeAutoScrollDelta } from "../engine/axis-resize-autoscroll.js";

test("geometry hàng/cột tùy chỉnh đi xuyên suốt virtual window và Freeze Panes", () => {
  const geometry = setAxisSizeMap(createGridGeometry(), "row", { "1": 40, "2": 56 });
  const sized = setAxisSizeMap(geometry, "column", { "1": 120, "2": 160 });
  const top = getAxisOffset(sized, "row", 4);
  const left = getAxisOffset(sized, "column", 4);
  const viewport = getVirtualWindow({
    scrollTop: top, scrollLeft: left, viewportHeight: 32, viewportWidth: 108,
    overscanRows: 0, overscanColumns: 0, maxRow: 100000, maxColumn: 16384, geometry: sized
  });
  assert.equal(viewport.rowStart, 4);
  assert.equal(viewport.columnStart, 4);
  assert.equal(viewport.topOffset, top);
  assert.equal(viewport.leftOffset, left);

  const freeze = buildFreezeLayout(viewport, { rows: 2, columns: 2 }, { gridGeometry: sized });
  assert.equal(freeze.activeRows, true);
  assert.equal(freeze.activeColumns, true);
  assert.deepEqual(freeze.pinnedRows, [1, 2]);
  assert.deepEqual(freeze.pinnedColumns, [1, 2]);
  assert.equal(freeze.topGap, 32);
  assert.equal(freeze.leftGap, 108);
});

test("lưu-mở workbook giữ nguyên geometry, Freeze, Split và nội dung ô", () => {
  const geometry = setAxisSizeMap(createGridGeometry(), "row", { "3": 72 });
  const withColumns = setAxisSizeMap(geometry, "column", { "4": 188 });
  const source = normalizeWorkbookSheets([{
    id: "sheet-main", name: "Dữ liệu",
    cells: { A1: 12, B2: "=A1*2" },
    formats: { A1: { bold: true } },
    geometry: serializeGridGeometry(withColumns),
    freeze: { rows: 2, columns: 1 },
    split: { mode: "quadrant", ratio: 0.6, quadrants: {
      topLeft: { top: 32, left: 0 }, topRight: { top: 32, left: 400 },
      bottomLeft: { top: 500, left: 0 }, bottomRight: { top: 500, left: 400 }
    } }
  }]);
  const roundTrip = normalizeWorkbookSheets(JSON.parse(JSON.stringify(source)));
  const sheet = roundTrip[0];
  assert.equal(getAxisSize(createGridGeometry(sheet.geometry), "row", 3), 72);
  assert.equal(getAxisSize(createGridGeometry(sheet.geometry), "column", 4), 188);
  assert.deepEqual(sheet.cells, { A1: 12, B2: "=A1*2" });
  assert.deepEqual(sheet.formats, { A1: { bold: true } });
  assert.deepEqual(sheet.freeze, { rows: 2, columns: 1 });
  assert.equal(normalizeSplitSettings(sheet.split).mode, "quadrant");
});

test("Split/Quadrant đồng bộ vị trí theo trục liên kết mà không làm đổi geometry", () => {
  const positions = {
    topLeft: { top: 100, left: 200 },
    topRight: { top: 0, left: 500 },
    bottomLeft: { top: 600, left: 0 },
    bottomRight: { top: 0, left: 0 }
  };
  const synced = synchronizeQuadrantPositions("topLeft", positions);
  assert.equal(synced.topRight.top, 100);
  assert.equal(synced.bottomLeft.left, 200);
  assert.deepEqual(quadrantScrollTargets("topLeft"), ["topRight", "bottomLeft"]);
  assert.equal(positions.topRight.top, 0);
  assert.equal(positions.bottomLeft.left, 0);
  assert.deepEqual(serializeGridGeometry(createGridGeometry()), {
    defaultRowHeight: 32, defaultColumnWidth: 108, maxRows: 100000, maxColumns: 16384,
    rowHeights: {}, columnWidths: {}
  });
});

test("resize guide và edge auto-scroll cùng xử lý delta hợp lệ, chặn tọa độ lỗi", () => {
  assert.equal(calculateAxisResizeGuidePosition({
    axis: "column", startGuideCoordinate: 250, pointerCoordinate: 340,
    startCoordinate: 300, origin: 100, extent: 500
  }), 190);
  assert.equal(calculateAxisResizeGuidePosition({
    axis: "row", startGuideCoordinate: 250, pointerCoordinate: 900,
    startCoordinate: 300, origin: 100, extent: 500
  }), 500);
  assert.equal(calculateAxisResizeAutoScrollDelta({
    coordinate: 105, start: 100, end: 800, edgeSize: 44, maxSpeed: 16
  }), -14);
  assert.equal(calculateAxisResizeAutoScrollDelta({
    coordinate: Number.NaN, start: 100, end: 800
  }), 0);
});

test("geometry theo lô vẫn giới hạn 5.000 trục và giữ lưu trữ thưa ở lưới lớn", () => {
  const geometry = setAxisSizeMap(createGridGeometry(), "row", {
    "1": 40, "50000": 80, "100000": 120
  });
  assert.deepEqual(Object.keys(serializeGridGeometry(geometry).rowHeights), ["1", "50000", "100000"]);
  assert.throws(() => setAxisSizeMap(createGridGeometry(), "column",
    Object.fromEntries(Array.from({ length: 5001 }, (_, index) => [String(index + 1), 120]))
  ), RangeError);
});
