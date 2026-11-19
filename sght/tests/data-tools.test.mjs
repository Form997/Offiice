import test from "node:test";
import assert from "node:assert/strict";
import {sortRangeRows,filterRangeRows,removeDuplicateRows,defineStructuredRange} from "../engine/data-tools.js";
const bounds={startRow:1,endRow:4,startCol:1,endCol:2};
test("sort rows keeps full row values and formats aligned",()=>{
 const cells={A1:"Name",B1:"Score",A2:"An",B2:"4",A3:"Bình",B3:"2",A4:"Chi",B4:"10"};
 const formats={A2:{bold:true},A3:{italic:true}};
 const r=sortRangeRows(cells,formats,bounds,{keyColumn:2,direction:"asc",type:"number"});
 assert.deepEqual([r.cells.A2,r.cells.A3,r.cells.A4],["Bình","An","Chi"]);
 assert.deepEqual(r.formats.A3,{bold:true});assert.deepEqual(r.formats.A2,{italic:true});
});
test("sort is stable and puts empty keys last",()=>{
 const r=sortRangeRows({A1:"x",A2:"b",A3:"a",A4:"a",B2:"2"},{},bounds,{keyColumn:1,direction:"asc"});
 assert.equal(r.cells.A2,"a");assert.equal(r.cells.A3,"a");assert.equal(r.cells.A4,"b");
});
test("filter combines two rules with AND or OR and optional fill color",()=>{
 const cells={A1:"crop",A2:"Cải",A3:"Rau",A4:"Cải",B2:"4",B3:"8",B4:"2"};
 const formats={A2:{background:"#fff2cc"},A3:{background:"#ffffff"}};
 const and=filterRangeRows(cells,formats,bounds,{rules:[{column:1,operator:"contains",value:"cải"},{column:2,operator:"greater",value:"3"}],join:"and"});
 assert.deepEqual(and.hiddenRows,[3,4]);
 const color=filterRangeRows(cells,formats,bounds,{fillColor:"#fff2cc"});
 assert.deepEqual(color.hiddenRows,[3,4]);
});
test("remove duplicates preserves first occurrence and shifts row formats",()=>{
 const cells={A1:"h",A2:"one",B2:"1",A3:"one",B3:"1",A4:"two",B4:"2"};
 const formats={A2:{bold:true},A3:{italic:true}};
 const r=removeDuplicateRows(cells,formats,bounds);
 assert.equal(r.removed,1);assert.deepEqual([r.cells.A2,r.cells.A3,r.cells.A4],["one","two",undefined]);
 assert.deepEqual(r.formats.A2,{bold:true});assert.equal(r.formats.A3,undefined);
});
test("structured range validates unique headers and stable name",()=>{
 const t=defineStructuredRange({A1:"Nghiệm thức",B1:"Năng suất",A2:"AL1",B2:"4"},{startRow:1,endRow:2,startCol:1,endCol:2},"BangNangSuat");
 assert.equal(t.range,"A1:B2");assert.deepEqual(t.columns,["Nghiệm thức","Năng suất"]);
 assert.throws(()=>defineStructuredRange({A1:"x",B1:"X",A2:"1",B2:"2"},{startRow:1,endRow:2,startCol:1,endCol:2},"Bang1"),/trùng/);
});
