import test from "node:test";
import assert from "node:assert/strict";
import { buildFreezeLayout, normalizeFreezeSettings } from "../engine/freeze-panes.js";
import { createGridGeometry } from "../engine/grid-geometry.js";
const win=(rowStart,columnStart,topOffset,leftOffset)=>({rowStart,columnStart,topOffset,leftOffset});
test("mặc định không ghim và giữ nguyên khoảng đệm ảo",()=>assert.deepEqual(buildFreezeLayout(win(20,12,608,1188),{}),{activeRows:false,activeColumns:false,pinnedRows:[],pinnedColumns:[],topGap:608,leftGap:1188}));
test("ghim hàng đầu khi cuộn dọc qua vùng ghim",()=>{const x=buildFreezeLayout(win(30,1,928,0),{rows:2,columns:0});assert.deepEqual(x.pinnedRows,[1,2]);assert.equal(x.topGap,864);assert.equal(x.activeRows,true);});
test("ghim cột đầu khi cuộn ngang qua vùng ghim",()=>{const x=buildFreezeLayout(win(1,8,0,756),{rows:0,columns:2});assert.deepEqual(x.pinnedColumns,[1,2]);assert.equal(x.leftGap,540);});
test("ghim đồng thời hai chiều và giữ khoảng đệm còn lại",()=>{const x=buildFreezeLayout(win(40,15,1248,1512),{rows:3,columns:4});assert.deepEqual(x.pinnedRows,[1,2,3]);assert.deepEqual(x.pinnedColumns,[1,2,3,4]);assert.equal(x.topGap,1152);assert.equal(x.leftGap,1080);});
test("không nhân đôi hàng/cột ghim khi viewport còn ở vùng đầu",()=>{const x=buildFreezeLayout(win(1,1,0,0),{rows:3,columns:2});assert.deepEqual(x.pinnedRows,[]);assert.deepEqual(x.pinnedColumns,[]);assert.equal(x.topGap,0);assert.equal(x.leftGap,0);});
test("giới hạn cấu hình ghim an toàn",()=>{assert.deepEqual(normalizeFreezeSettings({rows:20,columns:10}),{rows:20,columns:10});assert.throws(()=>normalizeFreezeSettings({rows:21,columns:0}),RangeError);assert.throws(()=>normalizeFreezeSettings({rows:0,columns:11}),RangeError);assert.throws(()=>normalizeFreezeSettings({rows:-1,columns:0}),RangeError);});


test("freeze layout trừ đúng tổng kích thước hàng/cột tùy chỉnh",()=>{
 const gridGeometry=createGridGeometry({rowHeights:{1:40,2:60},columnWidths:{1:120,2:140}});
 const layout=buildFreezeLayout(win(5,5,164,476),{rows:2,columns:2},{gridGeometry});
 assert.equal(layout.topGap,64);
 assert.equal(layout.leftGap,216);
});
