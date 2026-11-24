import test from "node:test";
import assert from "node:assert/strict";
import {MacroSecurityCenter} from "../automation/macro-security.js";
const plan=[{type:"SET",cell:"A1",line:1},{type:"CLEAR",bounds:{top:1,bottom:2,left:1,right:2},line:2}];
function memory(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
test("requires explicit approval and reports affected cells",()=>{const s=new MacroSecurityCenter({storage:memory()});assert.throws(()=>s.begin(plan),/phê duyệt/i);const p=s.preview(plan);assert.equal(p.commandCount,2);assert.equal(p.uniqueCells,4);});
test("blocks disallowed command groups and policy limits",()=>{const s=new MacroSecurityCenter({storage:memory()});s.setPolicy({allowedTypes:["SET"],maxCommands:4,maxCells:10});assert.throws(()=>s.begin(plan,{approved:true}),/khóa nhóm/i);s.setPolicy({allowedTypes:["SET","CLEAR"],maxCommands:1,maxCells:10});assert.throws(()=>s.begin(plan,{approved:true}),/số lệnh/i);});
test("authorizes each command and audits execution",()=>{const s=new MacroSecurityCenter({storage:memory()});s.begin(plan,{approved:true});assert.equal(s.beforeCommand(plan[0]),true);s.afterCommand(plan[0]);s.finish();const log=s.listAudit();assert.deepEqual(log.map(x=>x.event),["completed","command","approved"]);});
test("emergency stop blocks further commands until reset",()=>{const s=new MacroSecurityCenter({storage:memory()});s.begin(plan,{approved:true});s.emergencyStop();assert.throws(()=>s.beforeCommand(plan[0]),/dừng/i);s.finish("stopped");s.resetEmergencyStop();s.begin(plan,{approved:true});});
test("persists policy and bounded audit log",()=>{const storage=memory(),a=new MacroSecurityCenter({storage});a.setPolicy({allowedTypes:["SUM"],maxCommands:9,maxCells:20});const b=new MacroSecurityCenter({storage});assert.deepEqual(b.getPolicy(),{allowedTypes:["SUM"],maxCommands:9,maxCells:20});});
