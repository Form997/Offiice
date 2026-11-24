import test from "node:test";
import assert from "node:assert/strict";
import { MacroLibrary, MACRO_LIBRARY_LIMITS } from "../automation/macro-library.js";
class Store{data=new Map();getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,v);}removeItem(k){this.data.delete(k);}}
const setup=()=>{let n=0;return new MacroLibrary(new Store(),()=>"2026-11-19T00:00:00.000Z",()=> "id"+(++n));};
test("lưu, liệt kê, đọc và cập nhật macro",()=>{const l=setup();const a=l.save({name:"Báo cáo",description:"Tổng hợp",source:"SET A1 3"});assert.equal(l.list().length,1);assert.equal(l.get(a.id).source,"SET A1 3");const b=l.save({id:a.id,name:"Báo cáo tháng",source:"SET A1 4"});assert.equal(b.version,2);assert.equal(l.get(a.id).name,"Báo cáo tháng");});
test("không cho tên trùng hoặc mã sai",()=>{const l=setup();l.save({name:"Một",source:"SET A1 1"});assert.throws(()=>l.save({name:"mỘt",source:"SET A2 2"}),/tồn tại/);assert.throws(()=>l.save({name:"Sai",source:"RUN x"}),/Không hiểu lệnh/);});
test("sao chép và xóa macro",()=>{const l=setup();const a=l.save({name:"Gốc",source:"SET A1 1"});const b=l.duplicate(a.id);assert.equal(b.name,"Gốc (bản sao)");assert.equal(l.delete(a.id),true);assert.equal(l.delete(a.id),false);assert.equal(l.list().length,1);});
test("xuất và nhập lại macro đơn",()=>{const l=setup();const a=l.save({name:"Xuất",source:"SET A1 1"});const json=l.exportOne(a.id);const l2=setup();assert.equal(l2.importText(json),1);assert.equal(l2.list()[0].source,"SET A1 1");});
test("xuất và nhập thư viện; chặn định dạng sai",()=>{const l=setup();l.save({name:"A",source:"SET A1 1"});l.save({name:"B",source:"SET B1 2"});const l2=setup();assert.equal(l2.importText(l.exportAll()),2);assert.throws(()=>l2.importText('{"format":"other"}'),/định dạng/);});
test("áp giới hạn số lượng và độ dài",()=>{assert.equal(MACRO_LIBRARY_LIMITS.macros,100);const l=setup();assert.throws(()=>l.save({name:"Rỗng",source:""}),/trống/);});
