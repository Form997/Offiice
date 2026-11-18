import test from "node:test";
import assert from "node:assert/strict";
import { MacroRecorder } from "../automation/macro-recorder.js";
test("chỉ ghi thao tác khi đang bật ghi",()=>{const r=new MacroRecorder();r.recordSet("A1","5");assert.equal(r.count,0);r.start();r.recordSet("A1","5");r.recordSet("B1","xin");r.stop();assert.equal(r.source(),'SET A1 5\nSET B1 "xin"');});
test("ghi xóa và dừng ghi",()=>{const r=new MacroRecorder();r.start();r.recordClear("C2");r.stop();r.recordClear("C3");assert.equal(r.source(),"CLEAR C2");});
test("ghi dán vùng thành các lệnh có thứ tự",()=>{const r=new MacroRecorder();r.start();assert.equal(r.recordPaste(1,1,[["1","rau"],["","3"]]),4);assert.equal(r.source(),'SET A1 1\nSET B1 "rau"\nCLEAR A2\nSET B2 3');});
test("tự dừng khi chạm giới hạn",()=>{const r=new MacroRecorder(1);r.start();r.recordSet("A1","1");assert.throws(()=>r.recordSet("A2","2"),/giới hạn/);assert.equal(r.recording,false);});
