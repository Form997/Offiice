import test from "node:test";
import assert from "node:assert/strict";
import { expandGridCapacity } from "../engine/grid-capacity.js";
test("không đổi kích thước khi ô đích đã nằm trong lưới",()=>assert.deepEqual(expandGridCapacity({rows:1000,columns:100},{row:900,column:80}),{rows:1000,columns:100}));
test("mở rộng theo khối khi ô đích vượt mép dưới và mép phải",()=>{const n=expandGridCapacity({rows:1000,columns:100},{row:1001,column:101});assert.ok(n.rows>=1001&&n.columns>=101);});
test("mở rộng đến địa chỉ xa mà không cấp phát ma trận",()=>{const n=expandGridCapacity({rows:1000,columns:100},{row:50000,column:9000});assert.ok(n.rows>=50000&&n.columns>=9000);assert.ok(n.rows<=100000&&n.columns<=16384);});
test("kẹp đúng ngưỡng tối đa và từ chối vượt giới hạn",()=>{assert.deepEqual(expandGridCapacity({rows:99000,columns:16000},{row:100000,column:16384}),{rows:100000,columns:16384});assert.throws(()=>expandGridCapacity({rows:1000,columns:100},{row:100001,column:1}),RangeError);assert.throws(()=>expandGridCapacity({rows:1000,columns:100},{row:1,column:16385}),RangeError);});
test("dùng mốc mặc định an toàn và từ chối chỉ số không an toàn",()=>{assert.deepEqual(expandGridCapacity({},{}),{rows:1000,columns:100});assert.throws(()=>expandGridCapacity({rows:1000,columns:100},{row:Number.MAX_SAFE_INTEGER+1,column:1}),RangeError);});
