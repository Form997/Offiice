import test from "node:test";
import assert from "node:assert/strict";
import {collectFormulaVersionChanges} from "../engine/history-version-sync.js";
test("undo transition records formula restored from newer formula",()=>{
 const changes=collectFormulaVersionChanges({A1:"=A2+1",B1:"plain"},{A1:"=A2",B1:"plain"});
 assert.deepEqual(changes,[{address:"A1",before:"=A2+1",after:"=A2"}]);
});
test("redo transition records formula removal and restoration",()=>{
 const removed=collectFormulaVersionChanges({A1:"=SUM(B1:B3)",C1:"7"},{C1:"7"});
 assert.deepEqual(removed,[{address:"A1",before:"=SUM(B1:B3)",after:""}]);
 const restored=collectFormulaVersionChanges({},{A1:"=SUM(B1:B3)"});
 assert.deepEqual(restored,[{address:"A1",before:"",after:"=SUM(B1:B3)"}]);
});
test("ignores ordinary values and unchanged formulas",()=>{
 assert.deepEqual(collectFormulaVersionChanges({A1:"=1+1",B1:"3"},{A1:"=1+1",B1:"4",C1:"text"}),[]);
});
test("handles missing or malformed cell maps safely",()=>{
 assert.deepEqual(collectFormulaVersionChanges(null,{A1:"=1"}),[{address:"A1",before:"",after:"=1"}]);
});
