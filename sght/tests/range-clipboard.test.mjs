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
  assert.throws(() => pasteCapturedRange({}, {}, { r: 1001, c: 1 }, payload), /vượt giới hạn/);
  assert.throws(() => pasteCapturedRange({}, {}, { r: 1, c: 1 }, { ...payload, matrix: [[{ value: 2 }]] }), /không hợp lệ/);
});

test("vùng sao chép bao gồm ô trống có định dạng", () => {
  const payload = captureRange({}, { B2: { italic: true } }, { start: "B2", end: "B2" });
  const result = pasteCapturedRange({}, {}, { r: 3, c: 3 }, payload);
  assert.equal(result.cells.C3, undefined);
  assert.deepEqual(result.formats.C3, { italic: true });
});

import { fillRange, translateFormulaReferences } from "../engine/fill-series.js";
test("fill down copies values and formats",()=>{const r=fillRange({A1:"rau"},{A1:{bold:true}},{start:"A1",end:"A1"},{start:"A1",end:"A4"});assert.equal(r.cells.A4,"rau");assert.deepEqual(r.formats.A3,{bold:true});assert.equal(r.changed,3);});
test("fill down extrapolates numeric series",()=>{const r=fillRange({A1:"2",A2:"4",A3:"6"},{},{start:"A1",end:"A3"},{start:"A1",end:"A6"});assert.deepEqual([r.cells.A4,r.cells.A5,r.cells.A6],["8","10","12"]);});
test("fill right extrapolates numeric series",()=>{const r=fillRange({A1:"3",B1:"6"},{},{start:"A1",end:"B1"},{start:"A1",end:"E1"});assert.deepEqual([r.cells.C1,r.cells.D1,r.cells.E1],["9","12","15"]);});
test("formula fill adjusts relative and absolute references",()=>assert.equal(translateFormulaReferences("=A1+$B$2+C$3+$D4",1,2),"=C2+$B$2+E$3+$D5"));
test("formula fill does not rewrite quoted text",()=>assert.equal(translateFormulaReferences('="A1"&A1',1,0),'="A1"&A2'));
test("fill rejects excessive and invalid target ranges",()=>{assert.throws(()=>fillRange({}, {}, {start:"A1",end:"A1"},{start:"A1",end:"A100001"}),/vượt giới hạn/);assert.throws(()=>fillRange({}, {}, {start:"A1",end:"A2"},{start:"A2",end:"A3"}),/bao trùm/);});

test("fill upward and leftward extrapolates the same numeric pattern",()=>{const up=fillRange({A3:"6",A4:"8"},{},{start:"A3",end:"A4"},{start:"A1",end:"A4"});assert.deepEqual([up.cells.A1,up.cells.A2],["2","4"]);const left=fillRange({C1:"6",D1:"8"},{},{start:"C1",end:"D1"},{start:"A1",end:"D1"});assert.deepEqual([left.cells.A1,left.cells.B1],["2","4"]);});
