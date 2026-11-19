import test from "node:test";
import assert from "node:assert/strict";
import {buildSurface3DData,projectSurface3D} from "../ai/chart-surface-3d.js";
import {ChartPresetStore} from "../ai/chart-presets.js";
test("validates and projects a rectangular response surface",()=>{
 const g=[[{x1:0,x2:0,predicted:1},{x1:1,x2:0,predicted:2}],[{x1:0,x2:1,predicted:3},{x1:1,x2:1,predicted:4}]];
 const d=buildSurface3DData(g);assert.equal(d.rows,2);assert.equal(projectSurface3D(d).length,1);
});
test("rejects ragged and non-finite surface grids",()=>{
 assert.throws(()=>buildSurface3DData([[{x:0,y:0,z:1},{x:1,y:0,z:2}],[{x:0,y:1,z:3}]]),/chữ nhật/);
 assert.throws(()=>buildSurface3DData([[{x:0,y:0,z:NaN},{x:1,y:0,z:2}],[{x:0,y:1,z:3},{x:1,y:1,z:4}]]),/không hữu hạn/);
});
test("stores chart presets with validation and a bounded count",()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const store=new ChartPresetStore(storage);store.save({name:"Năng suất",config:{type:"line",title:"Yield",x:"A1:A4"}});
 assert.equal(store.get("Năng suất").config.x,"A1:A4");store.delete("Năng suất");assert.equal(store.list().length,0);
 assert.throws(()=>store.save({name:"Sai",config:{type:"script"}}),/không được hỗ trợ/);
});
