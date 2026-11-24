import test from "node:test";
import assert from "node:assert/strict";
import { MacroHistory, MACRO_HISTORY_LIMITS } from "../automation/macro-history.js";
class Store{data=new Map();getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}}
const setup=()=>{let t=0;return new MacroHistory(new Store(),()=>new Date(1763500000000+(t++)*1000).toISOString());};
const macro=(version,source,name="Báo cáo")=>({id:"m1",version,source,name,description:"Tổng hợp"});
test("ghi và liệt kê snapshot theo thứ tự phiên bản",()=>{const h=setup();h.record(macro(1,"SET A1 1"),"create");h.record(macro(2,"SET A1 2"),"save");assert.deepEqual(h.list("m1").map(x=>x.version),[1,2]);assert.equal(h.get("m1",2).source,"SET A1 2");});
test("không tạo bản trùng nếu cùng phiên bản và nội dung",()=>{const h=setup();h.record(macro(1,"SET A1 1"));h.record(macro(1,"SET A1 1"));assert.equal(h.list("m1").length,1);});
test("so sánh các dòng thêm sửa xóa",()=>{const h=setup();h.record(macro(1,"SET A1 1\nSET A2 2"));h.record(macro(2,"SET A1 9\nSET A3 3"));const d=h.compare("m1",1,2);assert.deepEqual(d.changes.map(x=>x.type),["changed","removed","added"]);});
test("khôi phục trả snapshot cũ nhưng không tự ghi đè lịch sử",()=>{const h=setup();h.record(macro(1,"SET A1 1"));h.record(macro(2,"SET A1 2"));const s=h.restore("m1",1);assert.equal(s.source,"SET A1 1");assert.equal(h.list("m1").length,2);});
test("giới hạn 30 phiên bản và xuất lịch sử",()=>{const h=setup();for(let i=1;i<=35;i++)h.record(macro(i,"SET A1 "+i));assert.equal(h.list("m1").length,30);assert.equal(h.list("m1")[0].version,6);assert.equal(JSON.parse(h.exportOne("m1")).format,"SGHT-MACRO-HISTORY");assert.equal(MACRO_HISTORY_LIMITS.versionsPerMacro,30);});
test("xóa lịch sử độc lập",()=>{const h=setup();h.record(macro(1,"SET A1 1"));assert.equal(h.delete("m1"),true);assert.equal(h.list("m1").length,0);assert.equal(h.delete("m1"),false);});
