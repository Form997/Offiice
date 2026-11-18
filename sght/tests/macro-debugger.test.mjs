import test from "node:test";
import assert from "node:assert/strict";
import { MacroDebugger } from "../automation/macro-debugger.js";
function adapter(seed={}){const data={...seed};return {data,get:a=>data[a]??"",set:(a,v)=>{data[a]=v;},clear:a=>{delete data[a];}};}
test("yêu cầu phê duyệt trước khi mở phiên",()=>{const d=new MacroDebugger("SET A1 1",adapter());assert.throws(()=>d.start(),/phê duyệt/);assert.equal(d.state().status,"ready");});
test("chạy từng lệnh và theo dõi thay đổi",()=>{const a=adapter({A1:"2",A2:"3"}),d=new MacroDebugger("SUM A1:A2 B1\nSET C1 \"xong\"",a);d.start({approved:true});let s=d.step();assert.equal(s.currentStep,1);assert.equal(a.get("B1"),"5");assert.equal(s.trace[0].changes[0].cell,"B1");s=d.step();assert.equal(s.status,"completed");assert.equal(a.get("C1"),"xong");});
test("tiếp tục chạy hết macro",()=>{const a=adapter(),d=new MacroDebugger("SET A1 1\nSET A2 2",a);d.start({approved:true});const s=d.continue();assert.equal(s.status,"completed");assert.equal(s.currentStep,2);});
test("dừng và hoàn tác toàn bộ thay đổi",()=>{const a=adapter({A1:"old"}),d=new MacroDebugger("SET A1 5\nSET B1 8",a);d.start({approved:true});d.step();d.stop();assert.equal(d.state().status,"stopped");d.rollback();assert.equal(a.get("A1"),"old");assert.equal(a.get("B1"),"");assert.equal(d.state().status,"rolled_back");});
test("ghi nhận nhiều ô trong lệnh vùng và phục hồi đúng",()=>{const a=adapter({A1:"a",A2:"b",B1:"old",B2:"old"}),d=new MacroDebugger("COPY A1:A2 B1\nCLEAR A1:A2",a);d.start({approved:true});d.continue();assert.equal(a.get("B1"),"a");assert.equal(a.get("B2"),"b");d.rollback();assert.equal(a.get("A1"),"a");assert.equal(a.get("A2"),"b");assert.equal(a.get("B1"),"old");assert.equal(a.get("B2"),"old");});
