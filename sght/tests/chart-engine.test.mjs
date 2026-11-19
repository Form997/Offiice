import test from "node:test";
import assert from "node:assert/strict";
import {buildChartData} from "../ai/chart-engine.js";
test("builds line and scatter chart points with paired observations",()=>{
 const r=buildChartData("line",{x:[1,2,3],y:[2,4,5]});
 assert.equal(r.points.length,3);assert.deepEqual(r.points[1],{x:2,y:4});
 assert.throws(()=>buildChartData("scatter",{x:[1],y:[1,2]}),/cùng số dòng/);
});
test("builds frequency histogram with bounded bin count",()=>{
 const r=buildChartData("histogram",{y:[1,2,2,3,4],bins:3});
 assert.equal(r.bars.length,3);assert.equal(r.bars.reduce((s,b)=>s+b.count,0),5);
});
test("builds boxplot quartiles and flags Tukey outliers",()=>{
 const r=buildChartData("boxplot",{groups:[{name:"A",values:[1,2,3,4,5,100]}]});
 assert.equal(r.groups[0].median,3.5);assert.deepEqual(r.groups[0].outliers,[100]);
});
test("builds residual and heatmap chart data",()=>{
 const a=buildChartData("residual",{x:[2,3],y:[-1,1]});assert.equal(a.points[0].x,2);
 const h=buildChartData("heatmap",{surface:[[{x1:1,x2:2,predicted:3},{x1:2,x2:2,predicted:4}],[{x1:1,x2:3,predicted:5},{x1:2,x2:3,predicted:6}]]});
 assert.equal(h.grid.length,2);assert.equal(h.grid[1][1].z,6);
});
test("rejects missing or invalid chart data",()=>{
 assert.throws(()=>buildChartData("histogram",{y:[]}),/dãy số/);
 assert.throws(()=>buildChartData("unknown",{y:[1]}),/chưa được hỗ trợ/);
});

import {buildMultiSeriesChart} from "../ai/chart-engine.js";
test("builds aligned multi-series line chart without altering source order",()=>{
 const r=buildMultiSeriesChart({x:[1,2,3],series:[{name:"Đối chứng",values:[2,3,4]},{name:"Nghiệm thức",values:[3,5,7]}]});
 assert.equal(r.series.length,2);assert.deepEqual(r.series[1].points[2],{x:3,y:7});
});
test("rejects mismatched or excessive multi-series input",()=>{
 assert.throws(()=>buildMultiSeriesChart({x:[1,2],series:[{values:[1,2]},{values:[1]}]}),/cùng số dòng/);
 assert.throws(()=>buildMultiSeriesChart({x:[1],series:Array.from({length:13},()=>({values:[1]}))}),/2 đến 12/);
});
