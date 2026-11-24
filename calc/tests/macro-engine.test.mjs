import test from "node:test";
import assert from "node:assert/strict";
import { planMacro, executeMacro, MacroError } from "../automation/macro-engine.js";

function adapter(seed={}) {
  const data={...seed};
  return {data,get:a=>data[a]??"",set:(a,v)=>{data[a]=v;},clear:a=>{delete data[a];}};
}
test("phân tích và xem trước lệnh macro",()=>{
  const plan=planMacro('# ghi chú\nSET A1 "rau cải"\nSET B1 12\nSUM B1:B2 C1');
  assert.equal(plan.length,3);
  assert.equal(plan[0].value,"rau cải");
  assert.equal(plan[2].type,"SUM");
});
test("không thực thi nếu chưa được phê duyệt",()=>{
  const a=adapter();
  assert.throws(()=>executeMacro('SET A1 5',a),e=>e instanceof MacroError && e.code==="#MACRO_PERMISSION!");
  assert.equal(a.get("A1"),"");
});
test("thực thi SET, COPY, CLEAR và SUM",()=>{
  const a=adapter({A1:"2",A2:"3",B1:"old",B2:"old"});
  const result=executeMacro('SUM A1:A2 A3\nCOPY A1:A2 C1\nCLEAR B1:B2\nSET D1 "xong"',a,{approved:true});
  assert.equal(a.get("A3"),"5");
  assert.equal(a.get("C1"),"2");
  assert.equal(a.get("C2"),"3");
  assert.equal(a.get("B1"),"");
  assert.equal(a.get("D1"),"xong");
  assert.equal(result.commandCount,4);
});
test("từ chối lệnh lạ và vùng quá lớn",()=>{
  assert.throws(()=>planMacro('RUN rm -rf'),e=>e.code==="#MACRO_SYNTAX!");
  assert.throws(()=>planMacro('CLEAR A1:ZZZ999999'),e=>e.code==="#MACRO_LIMIT!");
});
test("từ chối chuỗi không an toàn hoặc sai cú pháp",()=>{
  assert.throws(()=>planMacro('SET A1 alert(1)'),e=>e.code==="#MACRO_VALUE!");
  assert.throws(()=>planMacro('SET A1 "chưa đóng'),e=>e.code==="#MACRO_VALUE!");
});
