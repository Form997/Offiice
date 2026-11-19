import test from "node:test";
import assert from "node:assert/strict";
import { serializeWorkbook, restoreWorkbook, pushHistoryEntry, moveHistory } from "../engine/history.js";
import { searchCells } from "../engine/search.js";

test("history snapshots restore cell values, formulas and formats",()=>{
  const cells={A1:"12",B1:"=A1*2"},formats={A1:{bold:true}};
  const snapshot=serializeWorkbook(cells,formats);
  cells.A1="99";formats.A1={italic:true};
  const restored=restoreWorkbook(snapshot);
  assert.equal(restored.cells.A1,"12");
  assert.equal(restored.cells.B1,"=A1*2");
  assert.deepEqual(restored.formats.A1,{bold:true});
});
test("undo and redo move matching workbook snapshots between stacks",()=>{
  const undo=[serializeWorkbook({A1:"before"},{})],redo=[];
  const restored=moveHistory(undo,redo,serializeWorkbook({A1:"after"},{B1:{italic:true}}));
  assert.equal(restored.cells.A1,"before");
  assert.equal(undo.length,0);assert.equal(redo.length,1);
  const redone=moveHistory(redo,undo,serializeWorkbook(restored.cells,restored.formats));
  assert.equal(redone.cells.A1,"after");
  assert.deepEqual(redone.formats.B1,{italic:true});
});
test("history stack is bounded and ignores duplicate adjacent snapshots",()=>{
  const stack=[];
  assert.equal(pushHistoryEntry(stack,"one",{maxEntries:2,maxBytes:100}),true);
  assert.equal(pushHistoryEntry(stack,"one",{maxEntries:2,maxBytes:100}),false);
  pushHistoryEntry(stack,"two",{maxEntries:2,maxBytes:100});
  pushHistoryEntry(stack,"three",{maxEntries:2,maxBytes:100});
  assert.deepEqual(stack,["two","three"]);
});
test("sparse search returns matches in row-major order",()=>{
  const result=searchCells({B2:"rau",A1:"Rau",C1:"cải" },"rau",{mode:"raw"});
  assert.deepEqual(result.matches.map(x=>x.address),["A1","B2"]);
});
test("search can match calculated display values separately from formulas",()=>{
  const cells={A1:"=1+2",A2:"3"};
  const shown=searchCells(cells,"3",{mode:"display",displayValue:(_a,v)=>v.startsWith("=")?"3":v});
  assert.deepEqual(shown.matches.map(x=>x.address),["A1","A2"]);
  const raw=searchCells(cells,"=1+2",{mode:"raw"});
  assert.deepEqual(raw.matches.map(x=>x.address),["A1"]);
});
test("search supports case-sensitive and whole-cell matching",()=>{
  const cells={A1:"Xà lách",A2:"xà lách xoăn"};
  assert.equal(searchCells(cells,"xà",{mode:"raw"}).total,2);
  assert.equal(searchCells(cells,"xà",{mode:"raw",caseSensitive:true}).total,1);
  assert.equal(searchCells(cells,"xà lách",{mode:"raw",wholeCell:true}).total,1);
});
test("search caps stored navigation addresses but reports total matches",()=>{
  const cells={A1:"x",A2:"x",A3:"x"};
  const result=searchCells(cells,"x",{mode:"raw",maxResults:2});
  assert.equal(result.total,3);assert.equal(result.matches.length,2);assert.equal(result.truncated,true);
});
