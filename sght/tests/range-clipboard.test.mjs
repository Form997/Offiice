import test from "node:test";
import assert from "node:assert/strict";
import { captureRange, pasteCapturedRange } from "../engine/range-clipboard.js";

test("sao chép và dán vùng giữ nguyên công thức, giá trị và định dạng", () => {
  const cells = { A1: "7", B1: "=A1*2", A2: "rau" };
  const formats = { A1: { bold: true, color: "#ff0000" }, B1: { numberFormat: "currency" } };
  const payload = captureRange(cells, formats, { start: "A1", end: "B2" });
  const result = pasteCapturedRange(cells, formats, { r: 4, c: 3 }, payload);
  assert.equal(result.cells.C4, "7");
  assert.equal(result.cells.D4, "=A1*2");
  assert.equal(result.cells.C5, "rau");
  assert.equal(result.cells.D5, undefined);
  assert.deepEqual(result.formats.C4, formats.A1);
  assert.deepEqual(result.formats.D4, formats.B1);
  assert.equal(result.formats.C5, undefined);
  assert.equal(cells.C4, undefined, "không sửa trực tiếp workbook nguồn");
});

test("dán vùng chặn vượt giới hạn trước khi tạo thay đổi", () => {
  const payload = captureRange({ A1: "x" }, {}, { start: "A1", end: "A1" });
  assert.throws(() => pasteCapturedRange({}, {}, { r: 1000, c: 1 }, payload), /vượt giới hạn/);
  assert.throws(() => pasteCapturedRange({}, {}, { r: 1, c: 1 }, { ...payload, matrix: [[{ value: 2 }]] }), /không hợp lệ/);
});

test("vùng sao chép bao gồm ô trống có định dạng", () => {
  const payload = captureRange({}, { B2: { italic: true } }, { start: "B2", end: "B2" });
  const result = pasteCapturedRange({}, {}, { r: 3, c: 3 }, payload);
  assert.equal(result.cells.C3, undefined);
  assert.deepEqual(result.formats.C3, { italic: true });
});
