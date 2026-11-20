/** SGHT 18.31 — bounded per-cell formula version history. Local history is not tamper-proof. */
const MAX_TOTAL=5000,MAX_PER_CELL=50,MAX_FIELD=4000;
const clean=(v,n=MAX_FIELD)=>String(v??"").slice(0,n);
const isFormula=v=>typeof v==="string"&&v.trimStart().startsWith("=");
export function normalizeFormulaVersions(input,limits={}){
 const maxTotal=Math.max(1,Math.min(20000,Number(limits.maxTotal)||MAX_TOTAL));
 const items=Array.isArray(input)?input:Array.isArray(input?.versions)?input.versions:[];
 return items.filter(x=>x&&typeof x==="object"&&x.id&&x.sheetId&&x.address&&
  (x.beforeFormula===null||typeof x.beforeFormula==="string")&&
  (x.afterFormula===null||typeof x.afterFormula==="string")&&
  (isFormula(x.beforeFormula)||isFormula(x.afterFormula)))
 .slice(0,maxTotal).map(x=>({id:clean(x.id,120),timestamp:clean(x.timestamp,40),sheetId:clean(x.sheetId,120),sheetName:clean(x.sheetName,160),address:clean(x.address,32),beforeFormula:x.beforeFormula===null?null:clean(x.beforeFormula),afterFormula:x.afterFormula===null?null:clean(x.afterFormula),source:clean(x.source||"edit",40),transactionId:clean(x.transactionId||x.id,160)}));
}
export function recordFormulaVersion(history,change,limits={}){
 const items=normalizeFormulaVersions(history,{maxTotal:limits.maxTotal||MAX_TOTAL});
 const before=change?.beforeFormula??null,after=change?.afterFormula??null;
 if(before===after||(!isFormula(before)&&!isFormula(after)))return items;
 const entry={id:clean(change.id||"fv-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),120),timestamp:clean(change.timestamp||new Date().toISOString(),40),sheetId:clean(change.sheetId,120),sheetName:clean(change.sheetName,160),address:clean(change.address,32),beforeFormula:isFormula(before)?clean(before):null,afterFormula:isFormula(after)?clean(after):null,source:clean(change.source||"edit",40),transactionId:clean(change.transactionId||change.id||("tx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)),160)};
 if(!entry.sheetId||!entry.address)return items;
 const next=[entry,...items.filter(x=>x.id!==entry.id)];
 const perCell=next.filter(x=>x.sheetId===entry.sheetId&&x.address===entry.address);
 const keepIds=new Set(perCell.slice(0,Math.max(1,Math.min(200,Number(limits.maxPerCell)||MAX_PER_CELL))).map(x=>x.id));
 const bounded=next.filter(x=>x.sheetId!==entry.sheetId||x.address!==entry.address||keepIds.has(x.id));
 return bounded.slice(0,Math.max(1,Math.min(20000,Number(limits.maxTotal)||MAX_TOTAL)));
}
export function getFormulaCellVersions(history,sheetId,address){
 return normalizeFormulaVersions(history).filter(x=>x.sheetId===sheetId&&x.address===address).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)||b.id.localeCompare(a.id));
}
export function compareFormulaVersions(history,idA,idB){
 const items=normalizeFormulaVersions(history),a=items.find(x=>x.id===idA),b=items.find(x=>x.id===idB);
 if(!a||!b)throw new Error("Không tìm thấy một trong hai phiên bản.");
 if(a.sheetId!==b.sheetId||a.address!==b.address)throw new Error("Chỉ so sánh phiên bản của cùng một ô.");
 return {sheetId:a.sheetId,address:a.address,versionA:a,versionB:b,equal:a.afterFormula===b.afterFormula,from:a.afterFormula,to:b.afterFormula};
}
export function exportFormulaVersions(history){
 const versions=normalizeFormulaVersions(history);
 return JSON.stringify({schema:"sght.formula-version-history",version:1,exportedAt:new Date().toISOString(),count:versions.length,versions},null,2);
}

export function groupFormulaVersionTransactions(history){const groups=new Map();for(const item of normalizeFormulaVersions(history)){const key=item.transactionId||item.id;if(!groups.has(key))groups.set(key,{id:key,timestamp:item.timestamp,source:item.source,sheetId:item.sheetId,sheetName:item.sheetName,changes:[]});const g=groups.get(key);g.changes.push(item);if(item.timestamp>g.timestamp)g.timestamp=item.timestamp;}return [...groups.values()].map(g=>({...g,cellCount:g.changes.length,changes:g.changes.sort((a,b)=>a.address.localeCompare(b.address,undefined,{numeric:true}))})).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)||b.id.localeCompare(a.id));}
