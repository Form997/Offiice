import test from "node:test";
import assert from "node:assert/strict";
import {appendRepairAudit,exportRepairAudit,normalizeRepairAudit} from "../engine/repair-audit.js";
const event=(id,action="suggestion")=>({id,action,timestamp:"2026-11-20T00:00:00.000Z",address:"A1",before:"=SUMM(A1)",after:"=SUM(A1)"});
test("appends newest first and preserves event fields",()=>{const result=appendRepairAudit([event("old")],event("new","applied"),10);assert.deepEqual(result.map(x=>x.id),["new","old"]);assert.equal(result[0].before,"=SUMM(A1)");});
test("caps retained history and rejects unknown actions",()=>{const result=appendRepairAudit([event("a"),event("b")],event("c"),2);assert.deepEqual(result.map(x=>x.id),["c","a"]);assert.deepEqual(appendRepairAudit(result,{id:"x",action:"arbitrary"},10),result);});
test("bounds user-controlled fields",()=>{const result=appendRepairAudit([], {...event("long"),before:"x".repeat(5000)},10);assert.equal(result[0].before.length,2000);});
test("normalizes supported events and exports valid JSON",()=>{const normalized=normalizeRepairAudit({events:[event("ok"),{id:"bad",action:"not-valid"}]});assert.equal(normalized.length,1);const payload=JSON.parse(exportRepairAudit(normalized));assert.equal(payload.schema,"sght.formula-repair-audit");assert.equal(payload.count,1);});
