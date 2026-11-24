import test from "node:test";
import assert from "node:assert/strict";
import {normalizeWorkbookSheets,addWorkbookSheet,renameWorkbookSheet,rewriteWorkbookSheetReferences,removeWorkbookSheet,updateWorkbookSheet,getWorkbookSheet,workbookFieldKey,findWorkbookFieldColumn} from "../engine/workbook-sheets.js";
test("migrates a legacy single-sheet workbook without losing cells or formats",()=>{const sheets=normalizeWorkbookSheets([{id:"sheet-1",name:"Ruộng",cells:{A1:"Mã"},formats:{A1:{bold:true}}}]);assert.equal(sheets.length,1);assert.equal(sheets[0].cells.A1,"Mã");assert.equal(sheets[0].formats.A1.bold,true);});
test("creates isolated sheets and enforces the 100-sheet ceiling",()=>{let sheets=addWorkbookSheet([],"Vụ Đông");sheets=addWorkbookSheet(sheets,"Vụ Xuân");assert.equal(sheets.length,3);assert.deepEqual(sheets[1].cells,{});assert.notEqual(sheets[1].id,sheets[2].id);assert.throws(()=>addWorkbookSheet(Array.from({length:100},(_,i)=>({id:"s"+i}))),RangeError);});
test("renames without changing stable sheet id and rejects duplicate names",()=>{const sheets=addWorkbookSheet([],"A"),id=sheets[0].id;const renamed=renameWorkbookSheet(sheets,id,"Thí nghiệm");assert.equal(renamed[0].id,id);assert.equal(renamed[0].name,"Thí nghiệm");assert.throws(()=>renameWorkbookSheet([...renamed,{...renamed[0],id:"other"}],id,"Thí nghiệm"),RangeError);});
test("refuses deleting the final sheet and preserves other sheet states",()=>{const sheets=normalizeWorkbookSheets([{id:"one",name:"Hai"}]);assert.throws(()=>removeWorkbookSheet(sheets,sheets[0].id),RangeError);const two=addWorkbookSheet(sheets,"Ba");assert.equal(removeWorkbookSheet(two,two[1].id).length,1);});
test("field keys are normalized and distinguish duplicate header occurrences",()=>{assert.equal(workbookFieldKey("Sản lượng"),workbookFieldKey("  SẢN LƯỢNG "));assert.notEqual(workbookFieldKey("Mã",1),workbookFieldKey("Mã",2));});

test("finds the matching field identity in another sheet despite column movement",()=>{const cells={B1:"Mã",C1:"Sản lượng",D1:"Sản lượng"};assert.equal(findWorkbookFieldColumn(cells,{startRow:1,startCol:2,endCol:4},workbookFieldKey("Sản lượng",2)),4);});

test("rewrites quoted and unquoted formula references when a source sheet is renamed",()=>{
 const sheets=[{id:"s1",name:"Tong hop",cells:{A1:"=VatTu!B2",A2:"=SUM('VatTu'!B2:B8)",A3:"=Other!A1"}},{id:"s2",name:"VatTu",cells:{B2:12}}];
 const renamed=renameWorkbookSheet(sheets,"s2","Vật tư mới");
 const rewritten=rewriteWorkbookSheetReferences(renamed,"VatTu","Vật tư mới");
 assert.equal(rewritten[0].cells.A1,"='Vật tư mới'!B2");
 assert.equal(rewritten[0].cells.A2,"=SUM('Vật tư mới'!B2:B8)");
 assert.equal(rewritten[0].cells.A3,"=Other!A1");
 assert.equal(rewritten[1].id,"s2");
});


test("giữ metadata hình học lưới riêng theo từng trang tính",()=>{
 const sheets=normalizeWorkbookSheets([{id:"a",geometry:{rowHeights:{"8":48},columnWidths:{"3":160}}},{id:"b"}]);
 assert.equal(sheets[0].geometry.rowHeights["8"],48);
 assert.equal(sheets[0].geometry.columnWidths["3"],160);
 assert.deepEqual(sheets[1].geometry,{});
});
