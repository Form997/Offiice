/** SGHT 18.30 — bounded, local formula repair audit log. */
const ACTIONS=new Set(["suggestion","no_safe_suggestion","preview_success","preview_failed","applied","declined","stale","undo","redo"]);
const clean=(value,max=1200)=>String(value??"").slice(0,max);
export function appendRepairAudit(events,event,limit=1000){
 const safeLimit=Math.max(1,Math.min(10000,Math.trunc(Number(limit)||1000))),list=Array.isArray(events)?events:[];
 if(!event||!ACTIONS.has(event.action))return list.slice(0,safeLimit);
 const entry={id:clean(event.id||"",100),timestamp:clean(event.timestamp||new Date().toISOString(),40),action:event.action,sheetId:clean(event.sheetId||"",120),sheetName:clean(event.sheetName||"",160),address:clean(event.address||"",32),before:clean(event.before||"",2000),after:clean(event.after||"",2000),result:clean(event.result||"",500),note:clean(event.note||"",1000)};
 return [entry,...list.filter(item=>item&&item.id!==entry.id)].slice(0,safeLimit);
}
export function exportRepairAudit(events){const safe=(Array.isArray(events)?events:[]).slice(0,10000);return JSON.stringify({schema:"sght.formula-repair-audit",version:1,exportedAt:new Date().toISOString(),count:safe.length,events:safe},null,2);}
export function normalizeRepairAudit(payload,limit=1000){const events=Array.isArray(payload)?payload:Array.isArray(payload?.events)?payload.events:[];return events.filter(event=>event&&ACTIONS.has(event.action)).slice(0,Math.max(1,Math.min(10000,Math.trunc(Number(limit)||1000))));}
