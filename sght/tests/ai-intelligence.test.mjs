import test from "node:test";
import assert from "node:assert/strict";
import {analyzeWorkbook,suggestFormulas,draftMacroFromVietnamese} from "../ai/ai-intelligence.js";
test("summarizes values and flags IQR outliers",()=>{const cells={A1:"1",A2:"2",A3:"3",A4:"4",A5:"100",B1:"văn bản",C1:"=A1+A2"};const r=analyzeWorkbook(cells,a=>a==="C1"?3:Number(cells[a]));assert.equal(r.cellCount,7);assert.equal(r.numericCount,5);assert.equal(r.formulaCount,1);assert.equal(r.statistics.mean,22);assert.deepEqual(r.outliers.map(x=>x.cell),["A5"]);});
test("reports formula errors separately",()=>{const r=analyzeWorkbook({A1:"=1/0"},()=>{throw Object.assign(new Error("division"),{code:"#DIV/0!"});});assert.equal(r.errorCount,1);assert.equal(r.errors[0].error,"#DIV/0!");});
test("suggests formulas from nearby populated cells",()=>{const s=suggestFormulas({A1:"2",A2:"3",A3:"4"},"A4",a=>({A1:2,A2:3,A3:4}[a]??""));assert.equal(s[0].formula,"=SUM(A1:A3)");});
test("drafts constrained macro commands without execution",()=>{assert.equal(draftMacroFromVietnamese("nhập 25 vào A1").source,"SET A1 25");assert.equal(draftMacroFromVietnamese("xóa A1:B4").source,"CLEAR A1:B4");assert.equal(draftMacroFromVietnamese("tính tổng A1:A5 vào B1").source,"SUM A1:A5 B1");assert.equal(draftMacroFromVietnamese("sao chép A1:B2 sang D1").source,"COPY A1:B2 D1");});
test("rejects unsupported natural language and unsafe script requests",()=>{assert.throws(()=>draftMacroFromVietnamese("chạy JavaScript và gửi dữ liệu lên mạng"),/Chưa hiểu/);});
