import test from "node:test";
import assert from "node:assert/strict";
import {fitResponseSurface} from "../ai/response-surface.js";

test("fits a two-factor quadratic surface and locates an interior maximum",()=>{
 const x1=[],x2=[],y=[];
 for(const a of [-1,0,1])for(const b of [-1,0,1]){x1.push(a);x2.push(b);y.push(20-2*a*a-3*b*b+0.5*a*b);}
 const r=fitResponseSurface(x1,x2,y);
 assert.ok(r.rSquared>0.999999999);
 assert.equal(r.stationaryPoint.type,"Cực đại");
 assert.ok(Math.abs(r.stationaryPoint.x1)<1e-8);
 assert.ok(Math.abs(r.stationaryPoint.x2)<1e-8);
 assert.ok(Math.abs(r.boundedMaximum.predicted-20)<1e-8);
 assert.equal(r.contourGrid.length,21);
});
test("reports a boundary optimum when the unconstrained peak is outside the tested region",()=>{
 const x1=[],x2=[],y=[];
 for(const a of [0,1,2])for(const b of [0,1,2]){x1.push(a);x2.push(b);y.push(5+3*a-2*a*a-b*b);}
 const r=fitResponseSurface(x1,x2,y);
 assert.ok(r.boundedMaximum.x1>=0&&r.boundedMaximum.x1<=2);
 assert.ok(r.boundedMaximum.x2>=0&&r.boundedMaximum.x2<=2);
 assert.ok(r.boundedMaximum.x1>0);
});
test("rejects incomplete, mismatched and singular designs",()=>{
 assert.throws(()=>fitResponseSurface([1,2],[1,2,3],[1,2]),/cùng số dòng/);
 assert.throws(()=>fitResponseSurface([1,2,3],[1,2,3],[1,2,3]),/ít nhất 8/);
 const x1=[0,1,2,0,1,2,0,1,2],x2=[0,1,2,0,1,2,0,1,2],y=[1,2,3,2,3,4,3,4,5];
 assert.throws(()=>fitResponseSurface(x1,x2,y),/suy biến|đa cộng tuyến/);
});
