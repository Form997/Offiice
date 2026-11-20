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


test("MOD giữ dấu của số chia như quy ước bảng tính",()=>{
  assert.equal(evaluateFormula("=MOD(7,3)"),1);
  assert.equal(evaluateFormula("=MOD(7,-3)"),-2);
  assert.equal(evaluateFormula("=MOD(-7,3)"),2);
  assert.equal(evaluateFormula("=MOD(-7,-3)"),-1);
});
test("phép toán tràn miền số trả mã #NUM!",()=>{
  assert.throws(()=>evaluateFormula("=1e308*1e308"),e=>e.code==="#NUM!");
  assert.throws(()=>evaluateFormula("=1e308/1e-308"),e=>e.code==="#NUM!");
});

test("tham chiếu ô ở trang tính khác",()=>{
 const ctx={getSheetCell:(name,ref)=>({A1:12,B1:8}[ref]??"")};
 assert.equal(evaluateFormula("=VatTu!A1+vatTU!B1",ctx),20);
});
test("tham chiếu vùng ở trang khác dùng được trong hàm tổng hợp",()=>{
 const ctx={getSheetRange:(name,ref)=>{assert.equal(name,"Vat Tu");assert.equal(ref,"B2:B4");return [2,3,5];}};
 assert.equal(evaluateFormula("=SUM('Vat Tu'!B2:B4)",ctx),10);
 assert.equal(evaluateFormula("=AVERAGE('Vat Tu'!B2:B4)",ctx),10/3);
});
test("tên trang tiếng Việt, khoảng trắng và dấu nháy đơn",()=>{
 const ctx={getSheetCell:(name,ref)=>{assert.equal(name,"Vật tư O'Brien");assert.equal(ref,"C3");return 17;}};
 assert.equal(evaluateFormula("='Vật tư O''Brien'!C3*2",ctx),34);
});
test("tham chiếu tuyệt đối",()=>{
 const ctx={getSheetCell:(name,ref)=>{assert.equal(ref,"B2");return 9;}};
 assert.equal(evaluateFormula("='Kho'!$B$2",ctx),9);
});
test("thiếu bộ đọc trang tính trả #REF!",()=>assert.throws(()=>evaluateFormula("=Kho!A1"),e=>e.code==="#REF!"));
test("công thức nội trang cũ vẫn hoạt động",()=>{
 const ctx={getCell:r=>({A1:4,A2:6}[r]),getRange:r=>[4,6]};
 assert.equal(evaluateFormula("=SUM(A1:A2)+A1",ctx),14);
});

import { extractFormulaReferences, buildDependencyGraph, updateDependencyNode, invalidateDependents, planRecalculation, dependencyGraphStats } from "../engine/dependency-engine.js";
test("dependency scanner finds local and cross-sheet refs, skips quoted strings",()=>{
 const sheets=[{id:"s1",name:"TongHop",cells:{}},{id:"s2",name:"Vật tư",cells:{}}];
 assert.deepEqual(extractFormulaReferences('=SUM(A1:A3)+\'Vật tư\'!$B$2+'Vật tư'!C4+"D9 is text"',"s1",sheets),[{sheetId:"s1",ref:"A1:A3"},{sheetId:"s2",ref:"B2"},{sheetId:"s2",ref:"C4"}]);
});
test("dependency graph computes transitive topological recalculation across sheets",()=>{
 const sheets=[{id:"s1",name:"Data",cells:{A1:2,B1:"=A1*2",C1:"=B1+1"}},{id:"s2",name:"Summary",cells:{A1:"=Data!C1*10"}}];
 const p=planRecalculation(buildDependencyGraph(sheets),["s1!A1"]);
 assert.deepEqual(p.order,["s1!A1","s1!B1","s1!C1","s2!A1"]);assert.equal(p.cycles.length,0);
});
test("dependency graph distinguishes cycle members from downstream blocked cells",()=>{
 const g=buildDependencyGraph([{id:"s1",name:"Data",cells:{A1:"=B1+1",B1:"=A1+1",C1:"=A1+2"}}]),p=planRecalculation(g,["s1!A1"]);
 assert.deepEqual(p.cycles,["s1!A1","s1!B1"]);assert.deepEqual(p.blocked,["s1!C1"]);
});
test("incremental dependency update removes old edges and installs new edges",()=>{
 const sheets=[{id:"s1",name:"Data",cells:{A1:"=B1+1",B1:2,C1:"=A1*2"}}],g=buildDependencyGraph(sheets);
 sheets[0].cells.A1="=B1+C1";updateDependencyNode(g,sheets,"s1","A1");
 assert.deepEqual([...invalidateDependents(g,["s1!B1"])].sort(),["s1!A1","s1!B1","s1!C1"].sort());assert.equal(dependencyGraphStats(g).formulaCount,2);
});
test("dependency scanner handles Vietnamese sheet names with apostrophes",()=>{
 const sheets=[{id:"s1",name:"Tong hop",cells:{}},{id:"s2",name:"Vật tư O'Brien",cells:{}}];
 assert.deepEqual(extractFormulaReferences("='Vật tư O''Brien'!C3","s1",sheets),[{sheetId:"s2",ref:"C3"}]);
});
test("dependency scanner ignores LOG10 function name as a cell",()=>{
 const sheets=[{id:"s1",name:"Data",cells:{}}];
 assert.deepEqual(extractFormulaReferences("=LOG10(A1)+ROUND(B2,0)","s1",sheets),[{sheetId:"s1",ref:"A1"},{sheetId:"s1",ref:"B2"}]);
});
test("dependency graph does not expand oversized ranges",()=>{
 const g=buildDependencyGraph([{id:"s1",name:"Data",cells:{A1:"=SUM(A1:XFD1048576)"}}]);
 assert.equal(g.dependencies.get("s1!A1").size,0);assert.equal(g.unresolved[0].reason,"range-limit-or-invalid");
});
