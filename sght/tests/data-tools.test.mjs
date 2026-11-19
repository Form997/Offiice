import test from "node:test";
import {evaluateFormula} from "../engine/core.js";
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

import {uniqueColumnValues,summarizeByGroup,expandStructuredRange,structuredColumnRange,expandStructuredReferences} from "../engine/data-tools.js";
test("unique values are counted and sorted for filter checklist",()=>{
 const values=uniqueColumnValues({A1:"Group",A2:"B",A3:"A",A4:"B"},{startRow:1,endRow:4,startCol:1,endCol:1},1);
 assert.deepEqual(values,[{value:"A",count:1},{value:"B",count:2}]);
});
test("group summary supports sum average count min max",()=>{
 const cells={A1:"Group",B1:"Yield",A2:"AL1",B2:"2",A3:"AL1",B3:"4",A4:"AL2",B4:"5"};
 const b={startRow:1,endRow:4,startCol:1,endCol:2};
 assert.deepEqual(summarizeByGroup(cells,b,{groupColumn:1,valueColumn:2,operation:"sum"}),[{group:"AL1",count:2,value:6},{group:"AL2",count:1,value:5}]);
 assert.equal(summarizeByGroup(cells,b,{groupColumn:1,valueColumn:2,operation:"average"})[0].value,3);
 assert.equal(summarizeByGroup(cells,b,{groupColumn:1,valueColumn:2,operation:"count"})[0].value,2);
 assert.equal(summarizeByGroup(cells,b,{groupColumn:1,valueColumn:2,operation:"min"})[0].value,2);
 assert.equal(summarizeByGroup(cells,b,{groupColumn:1,valueColumn:2,operation:"max"})[0].value,4);
});
test("structured table expands only on adjacent row within table columns",()=>{
 const t={name:"Bang",bounds:{startRow:1,endRow:3,startCol:1,endCol:2},columns:["Crop","Yield"]};
 assert.equal(expandStructuredRange(t,4,2).range,"A1:B4");
 assert.equal(expandStructuredRange(t,5,2),t);
 assert.equal(expandStructuredRange(t,4,3),t);
});
test("structured column reference resolves data cells excluding header",()=>{
 const t={name:"Bang",bounds:{startRow:1,endRow:3,startCol:1,endCol:2},columns:["Crop","Yield"]};
 assert.equal(structuredColumnRange([t],"Bang[Yield]"),"B2:B3");
 assert.equal(structuredColumnRange([t],"Bang[Missing]"),null);
});

test("multi-column filter values are intersected and an empty selection hides every row",()=>{
 const cells={A1:"Crop",B1:"Zone",A2:"Cải",B2:"Bắc",A3:"Cải",B3:"Nam",A4:"Rau",B4:"Bắc"};
 const b={startRow:1,endRow:4,startCol:1,endCol:2};
 const r=filterRangeRows(cells,{},b,{rules:[{column:1,operator:"equals",value:"Cải"},{column:2,operator:"equals",value:"Bắc"}],join:"and",allowedValues:{1:["Cải","Rau"]}});
 assert.deepEqual(r.hiddenRows,[3,4]);
 const none=filterRangeRows(cells,{},b,{allowedValues:{1:[]}});
 assert.deepEqual(none.hiddenRows,[2,3,4]);
});

test("structured formulas expand references but leave quoted text intact",()=>{
 const table={name:"Bang",bounds:{startRow:1,endRow:3,startCol:1,endCol:2},columns:["Crop","Yield"]};
 const expanded=expandStructuredReferences("=SUM(Bang[Yield])",[table]);
 assert.equal(expanded,"=SUM(B2:B3)");
 assert.equal(evaluateFormula(expanded,{getRange:()=>[2,3]}),5);
 assert.equal(expandStructuredReferences('="Bang[Yield]"',[table]),'="Bang[Yield]"');
});


import {summarizeByGroups,buildPivotTable} from "../engine/data-tools.js";
test("nested subtotals aggregate each hierarchy level deterministically",()=>{
 const cells={A1:"Vùng",B1:"Cây",C1:"Kg",A2:"Bắc",B2:"Cải",C2:"2",A3:"Bắc",B3:"Cải",C3:"3",A4:"Bắc",B4:"Rau",C4:"4",A5:"Nam",B5:"Cải",C5:"6"};
 const rows=summarizeByGroups(cells,{startRow:1,endRow:5,startCol:1,endCol:3},{groupColumns:[1,2],valueColumn:3,operation:"sum"});
 assert.deepEqual(rows.map(r=>[r.path,r.depth,r.value]),[[["Bắc"],0,9],[["Bắc","Cải"],1,5],[["Bắc","Rau"],1,4],[["Nam"],0,6],[["Nam","Cải"],1,6]]);
});
test("pivot table creates cross-tab values and grand total",()=>{
 const cells={A1:"Vùng",B1:"Cây",C1:"Kg",A2:"Bắc",B2:"Cải",C2:"2",A3:"Bắc",B3:"Rau",C3:"4",A4:"Nam",B4:"Cải",C4:"6"};
 const p=buildPivotTable(cells,{startRow:1,endRow:4,startCol:1,endCol:3},{rowColumns:[1],columnField:2,valueColumn:3,operation:"sum"});
 assert.deepEqual(p.columns,["Cải","Rau"]);assert.deepEqual(p.rows.map(r=>[r.labels[0],r.values["Cải"],r.values["Rau"],r.total]),[["Bắc",2,4,6],["Nam",6,0,6]]);assert.equal(p.grandTotal,12);
});
test("filter supports inclusive numeric ranges, text prefix and strict ISO/Vietnamese dates",()=>{
 const cells={A1:"Kg",A2:"3",A3:"7",A4:"10",B2:"Cải xoăn",B3:"Rau muống",B4:"Cải xanh",C2:"2026-11-01",C3:"02/11/2026",C4:"31/02/2026"};
 const b={startRow:1,endRow:4,startCol:1,endCol:3};
 assert.deepEqual(filterRangeRows(cells,{},b,{rules:[{column:1,operator:"between",min:"5",max:"9"}]}).hiddenRows,[2,4]);
 assert.deepEqual(filterRangeRows(cells,{},b,{rules:[{column:2,operator:"startsWith",value:"cải"}]}).hiddenRows,[3]);
 assert.deepEqual(filterRangeRows(cells,{},b,{rules:[{column:3,operator:"dateBetween",min:"2026-11-01",max:"03/11/2026"}]}).hiddenRows,[4]);
});


test("pivot supports multiple measures with independent aggregations",()=>{
 const cells={A1:"Vùng",B1:"Cây",C1:"Kg",D1:"Doanh thu",A2:"Bắc",B2:"Cải",C2:"2",D2:"100",A3:"Bắc",B3:"Rau",C3:"4",D3:"250",A4:"Nam",B4:"Cải",C4:"6",D4:"300"};
 const p=buildPivotTable(cells,{startRow:1,endRow:4,startCol:1,endCol:4},{rowColumns:[1],columnField:2,measures:[{column:3,operation:"sum",label:"Kg"},{column:4,operation:"average",label:"Doanh thu"}]});
 assert.equal(p.measures.length,2);assert.equal(p.rows[0].metrics[0].values["Rau"],4);assert.equal(p.rows[0].metrics[1].values["Rau"],250);assert.equal(p.grandTotals[0].total,12);assert.equal(p.grandTotals[1].total,650);
});
test("pivot field filters constrain rows and recalculate totals",()=>{
 const cells={A1:"Vùng",B1:"Cây",C1:"Kg",A2:"Bắc",B2:"Cải",C2:"2",A3:"Bắc",B3:"Rau",C3:"4",A4:"Nam",B4:"Cải",C4:"6"};
 const p=buildPivotTable(cells,{startRow:1,endRow:4,startCol:1,endCol:3},{rowColumns:[1],columnField:2,valueColumn:3,operation:"sum",filters:{2:["Cải"]}});
 assert.equal(p.includedRows,2);assert.equal(p.grandTotal,8);assert.deepEqual(p.columns,["Cải"]);
});
