import test from "node:test";
import assert from "node:assert/strict";
import {pearsonCorrelation,simpleLinearRegression,oneWayAnova} from "../ai/data-science.js";
test("tương quan Pearson nhận biết quan hệ tuyến tính hoàn hảo",()=>{const r=pearsonCorrelation([1,2,3,4],[2,4,6,8]);assert.ok(Math.abs(r.r-1)<1e-12);assert.equal(r.n,4);});
test("hồi quy tuyến tính ước lượng hệ số và R bình phương",()=>{const r=simpleLinearRegression([1,2,3,4],[3,5,7,9]);assert.ok(Math.abs(r.slope-2)<1e-12);assert.ok(Math.abs(r.intercept-1)<1e-12);assert.ok(Math.abs(r.rSquared-1)<1e-12);});
test("hồi quy từ chối cỡ mẫu thiếu và biến X không biến thiên",()=>{assert.throws(()=>simpleLinearRegression([1,2],[2,4]),/ít nhất 3/);assert.throws(()=>simpleLinearRegression([2,2,2],[1,2,3]),/không biến thiên/);});
test("ANOVA một nhân tố phát hiện khác biệt rõ giữa nhóm",()=>{const r=oneWayAnova([{name:"A",values:[1,2,1,2]},{name:"B",values:[8,9,8,9]},{name:"C",values:[4,5,4,5]}]);assert.ok(r.F>100);assert.ok(r.pValue<.05);assert.equal(r.k,3);});
test("ANOVA từ chối nhóm thiếu lặp",()=>assert.throws(()=>oneWayAnova([{values:[1]},{values:[2,3]}]),/ít nhất 2/));
