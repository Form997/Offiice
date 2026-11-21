import test from "node:test";
import assert from "node:assert/strict";
import { columnLabel, cellAddress, parseCellAddress, getSparseBounds, getVirtualWindow, updateSparseCells } from "../engine/sparse-grid.js";
import { createGridGeometry } from "../engine/grid-geometry.js";

test("đổi số cột sang nhãn A1 không giới hạn theo quy tắc cơ số 26", () => {
  assert.equal(columnLabel(1), "A");
  assert.equal(columnLabel(26), "Z");
  assert.equal(columnLabel(27), "AA");
  assert.equal(columnLabel(702), "ZZ");
  assert.equal(columnLabel(703), "AAA");
  assert.equal(cellAddress(1200000, 703), "AAA1200000");
  assert.throws(() => columnLabel(0), RangeError);
});

test("phân tích địa chỉ an toàn và từ chối chỉ số vượt miền số nguyên an toàn", () => {
  assert.deepEqual(parseCellAddress("aaa1200000"), { row: 1200000, column: 703, address: "AAA1200000" });
  assert.equal(parseCellAddress("A0"), null);
  assert.equal(parseCellAddress("A9007199254740992"), null);
  assert.equal(parseCellAddress("A1:B2"), null);
  assert.equal(parseCellAddress(null), null);
});

test("xác định phạm vi dữ liệu thưa từ cả giá trị và định dạng", () => {
  assert.deepEqual(getSparseBounds({ A1: 1, C9: 2 }, { B4: { bold: true }, C9: {} }), {
    minRow: 1, minColumn: 1, maxRow: 9, maxColumn: 3, occupied: 3
  });
  assert.deepEqual(getSparseBounds({}, {}), { minRow: 1, minColumn: 1, maxRow: 0, maxColumn: 0, occupied: 0 });
});

test("tính cửa sổ ảo chỉ gồm vùng nhìn thấy và overscan", () => {
  const w = getVirtualWindow({ scrollTop: 320, scrollLeft: 224, viewportHeight: 320, viewportWidth: 448, rowHeight: 32, columnWidth: 112, overscanRows: 2, overscanColumns: 1, maxRow: 1000000, maxColumn: 16384 });
  assert.equal(w.rowStart, 9);
  assert.equal(w.columnStart, 2);
  assert.equal(w.visibleRows, 10);
  assert.equal(w.visibleColumns, 4);
  assert.equal(w.renderedRows, 14);
  assert.equal(w.renderedColumns, 6);
  assert.equal(w.topOffset, 256);
  assert.equal(w.leftOffset, 112);
  assert.ok(w.renderedRows * w.renderedColumns < 1000);
});

test("cửa sổ ảo kẹp ở mép đầu/cuối và xử lý thông số không hợp lệ", () => {
  const start = getVirtualWindow({ scrollTop: 0, scrollLeft: 0, viewportHeight: 100, viewportWidth: 100, rowHeight: 20, columnWidth: 50, overscanRows: 3, overscanColumns: 2, maxRow: 4, maxColumn: 2 });
  assert.equal(start.rowStart, 1);
  assert.equal(start.rowEnd, 4);
  assert.equal(start.columnStart, 1);
  assert.equal(start.columnEnd, 2);
  const fallback = getVirtualWindow({ scrollTop: -10, rowHeight: 0, columnWidth: NaN });
  assert.equal(fallback.rowStart, 1);
  assert.equal(fallback.columnStart, 1);
});

test("cập nhật sparse map theo copy-on-write và chuẩn hóa địa chỉ", () => {
  const before = { A1: "old", B2: "keep" };
  const after = updateSparseCells(before, { a1: "new", B2: "", C3: 9 });
  assert.deepEqual(before, { A1: "old", B2: "keep" });
  assert.equal(after.A1, "new");
  assert.equal(after.B2, undefined);
  assert.equal(after.C3, 9);
  assert.throws(() => updateSparseCells(before, { "A1:B2": 1 }), TypeError);
});


test("cửa sổ ảo định vị đúng hàng/cột khi kích thước biến thiên",()=>{
 const geometry=createGridGeometry({rowHeights:{2:48},columnWidths:{3:160}});
 const w=getVirtualWindow({scrollTop:32,scrollLeft:216,viewportHeight:48,viewportWidth:160,overscanRows:0,overscanColumns:0,maxRow:3,maxColumn:4,geometry});
 assert.equal(w.rowStart,2);assert.equal(w.rowEnd,2);
 assert.equal(w.columnStart,3);assert.equal(w.columnEnd,3);
 assert.equal(w.topOffset,32);assert.equal(w.leftOffset,216);
 assert.equal(w.bottomOffset,32);assert.equal(w.rightOffset,108);
});
