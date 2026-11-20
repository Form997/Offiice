import test from "node:test";
import assert from "node:assert/strict";
import {buildContourData,summarizeErrorBars,tCritical,regressionUncertainty} from "../ai/chart-uncertainty.js";
test("marching-squares contour interpolates a monotone grid",()=>{
 const grid=Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>({x1:r,x2:c,predicted:c+r})));
 const out=buildContourData(grid,3);assert.equal(out.levels.length,3);assert.ok(out.segments.length>0);assert.equal(out.type,"contour");
});
test("contour rejects ragged and invalid grids",()=>{
 assert.throws(()=>buildContourData([[{x:0,y:0,z:1},{x:0,y:1,z:2}],[{x:1,y:0,z:2}]]),/chữ nhật/);
 assert.equal(buildContourData([[{x:0,y:0,z:2},{x:0,y:1,z:2}],[{x:1,y:0,z:2},{x:1,y:1,z:2}]]).segments.length,0);
});
test("error bars distinguish SD, SE and confidence interval",()=>{
 const g=[{name:"A",values:[1,2,3,4,5]}],sd=summarizeErrorBars(g,"sd").groups[0],se=summarizeErrorBars(g,"se").groups[0],ci=summarizeErrorBars(g,"ci95").groups[0];
 assert.ok(sd.halfWidth>se.halfWidth);assert.ok(ci.halfWidth>se.halfWidth);assert.equal(sd.mean,3);assert.equal(sd.n,5);assert.ok(tCritical(.95,4)>2);
});
test("regression uncertainty separates mean CI and individual prediction interval",()=>{
 const r=regressionUncertainty([1,2,3,4,5],[2,4,5,4,6],21);
 assert.equal(r.points.length,21);assert.ok(r.points[10].predLower<r.points[10].meanLower);assert.ok(r.points[10].predUpper>r.points[10].meanUpper);
 assert.throws(()=>regressionUncertainty([1,1,1],[2,3,4]),/không biến thiên/);
});
