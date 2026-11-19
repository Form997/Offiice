import test from "node:test";
import assert from "node:assert/strict";
import { buildPivotChartModel } from "../ai/pivot-chart.js";
const pivot={columns:["Đông","Tây"],rows:[{labels:["A"],metrics:[{total:30,values:{Đông:10,Tây:20}},{total:300,values:{Đông:100,Tây:200}}]},{labels:["B"],metrics:[{total:12,values:{Đông:5,Tây:7}},{total:120,values:{Đông:50,Tây:70}}]}],measures:[{label:"Sản lượng",operation:"sum"},{label:"Diện tích",operation:"average"}],includedRows:8,rowCount:2};
test("creates series for each Pivot column",()=>{const m=buildPivotChartModel(pivot);assert.deepEqual(m.categories,["A","B"]);assert.deepEqual(m.series.map(s=>s.values),[[10,5],[20,7]]);assert.equal(m.title,"Sản lượng");});
test("selects another Pivot measure",()=>{const m=buildPivotChartModel(pivot,{measureIndex:1});assert.deepEqual(m.series.map(s=>s.values),[[100,50],[200,70]]);assert.equal(m.title,"Diện tích");});
test("limits categories and marks truncation",()=>{const m=buildPivotChartModel(pivot,{limit:1});assert.equal(m.categories.length,1);assert.equal(m.truncated,true);});
test("rejects invalid inputs",()=>{assert.throws(()=>buildPivotChartModel(pivot,{measureIndex:4}),RangeError);assert.throws(()=>buildPivotChartModel(pivot,{limit:101}),RangeError);assert.throws(()=>buildPivotChartModel(null),TypeError);});
