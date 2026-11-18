import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFormula, FormulaError, listFormulaFunctions } from "../engine/core.js";

test("toán tử và thứ tự ưu tiên",()=>{
  assert.equal(evaluateFormula("=2+3*4"),14);
  assert.equal(evaluateFormula("=(2+3)*4"),20);
  assert.equal(evaluateFormula("=2^3^2"),512);
  assert.equal(evaluateFormula("=-5+8"),3);
});
test("hàm tổng hợp",()=>{
  assert.equal(evaluateFormula("=SUM(1,2,3,4)"),10);
  assert.equal(evaluateFormula("=AVERAGE(2,4,6)"),4);
  assert.equal(evaluateFormula("=MIN(8,3,5)"),3);
  assert.equal(evaluateFormula("=MAX(8,3,5)"),8);
  assert.equal(evaluateFormula("=COUNT(8, \"x\", 2)"),2);
  assert.equal(evaluateFormula("=COUNTA(8, \"x\", 2)"),3);
});
test("hàm toán học",()=>{
  assert.equal(evaluateFormula("=ABS(-7)"),7);
  assert.equal(evaluateFormula("=SQRT(81)"),9);
  assert.equal(evaluateFormula("=ROUND(3.14159,2)"),3.14);
  assert.equal(evaluateFormula("=ROUNDUP(2.341,2)"),2.35);
  assert.equal(evaluateFormula("=ROUNDDOWN(2.349,2)"),2.34);
  assert.equal(evaluateFormula("=MOD(-7,3)"),2);
  assert.equal(evaluateFormula("=POWER(2,5)"),32);
  assert.equal(evaluateFormula("=SIN(30)"),0.49999999999999994);
});
test("đọc ô và vùng thông qua adapter",()=>{
  const ctx={getCell:r=>({A1:5,B1:7}[r]),getRange:r=>r==="A1:B1"?[5,7]:[]};
  assert.equal(evaluateFormula("=A1+B1",ctx),12);
  assert.equal(evaluateFormula("=SUM(A1:B1)",ctx),12);
});
test("lỗi có mã rõ ràng",()=>{
  assert.throws(()=>evaluateFormula("=1/0"),e=>e instanceof FormulaError && e.code==="#DIV/0!");
  assert.throws(()=>evaluateFormula("=SQRT(-1)"),e=>e.code==="#NUM!");
  assert.throws(()=>evaluateFormula("=NOT_A_FUNCTION(1)"),e=>e.code==="#NAME?");
  assert.throws(()=>evaluateFormula("=ABS()"),e=>e instanceof FormulaError && e.code==="#ARGS!");
});
test("danh mục hàm được công bố",()=>assert.ok(listFormulaFunctions().length>=20));

test("LOG10 được nhận diện là tên hàm, không nhầm thành địa chỉ ô",()=>{
  assert.equal(evaluateFormula("=LOG10(100)"),2);
  assert.equal(evaluateFormula("=LOG10(1000)+1"),4);
});
test("tham chiếu ô và vùng tính được kết quả theo dữ liệu",()=>{
  const values={A1:12,A2:18,B1:2,B2:3};
  const ctx={getCell:r=>values[r]??"",getRange:r=>r==="A1:A2"?[values.A1,values.A2]:[]};
  assert.equal(evaluateFormula("=A1*B1",ctx),24);
  assert.equal(evaluateFormula("=SUM(A1:A2)",ctx),30);
});
