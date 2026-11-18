import test from "node:test";
import assert from "node:assert/strict";
import {fitDoseResponse,compareDoseResponse} from "../ai/dose-response.js";

test("quadratic dose response estimates interior optimum",()=>{
 const x=[0,1,2,3,4,5,6],y=x.map(v=>10+8*v-1*v*v);
 const r=fitDoseResponse(x,y,"quadratic");
 assert.ok(Math.abs(r.optimumDose-4)<1e-8);
 assert.ok(Math.abs(r.optimumYield-26)<1e-8);
 assert.ok(r.rSquared>.999999);
});
test("linear plateau locates saturation breakpoint",()=>{
 const x=[0,1,2,3,4,5,6,7],y=x.map(v=>Math.min(v,4)*3+5);
 const r=fitDoseResponse(x,y,"linear-plateau");
 assert.equal(r.breakpoint,4);
 assert.ok(Math.abs(r.optimumYield-17)<1e-8);
});
test("quadratic plateau fits continuous plateau response",()=>{
 const x=[0,1,2,3,4,5,6,7],y=x.map(v=>{const d=Math.min(v,4);return 2+5*d-.5*d*d;});
 const r=fitDoseResponse(x,y,"quadratic-plateau");
 assert.equal(r.breakpoint,4);
 assert.ok(r.rmse<1e-8);
});
test("model comparison returns ranked candidates",()=>{
 const r=compareDoseResponse([0,1,2,3,4,5,6],[10,17,22,25,26,26,26]);
 assert.equal(r.models.length,3);
 assert.ok(r.models[0].aicc<=r.models[1].aicc);
});
test("dose response rejects malformed ranges and unsupported model",()=>{
 assert.throws(()=>fitDoseResponse([1,2,3],[2,3,4],"quadratic"),/5 quan sát/);
 assert.throws(()=>fitDoseResponse([1,2,3,4,5],[2,3,4,5,6],"unknown"),/chưa hỗ trợ/);
 assert.throws(()=>fitDoseResponse([1,2,3,4,5],[2,"",4,5,6]),/đầy đủ/);
});
