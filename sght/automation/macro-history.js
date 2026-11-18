const STORAGE_KEY="haidat-sght-macro-history-v1";
const MAX_VERSIONS_PER_MACRO=30,MAX_TOTAL_BYTES=2*1024*1024;
const clone=x=>JSON.parse(JSON.stringify(x));
function cleanSnapshot(s){return {version:Number(s.version),name:String(s.name||""),description:String(s.description||""),source:String(s.source||""),createdAt:String(s.createdAt||""),action:String(s.action||"save"),note:String(s.note||"")};}
export class MacroHistory{
 constructor(storage=globalThis.localStorage,clock=()=>new Date().toISOString()){this.storage=storage;this.clock=clock;}
 #read(){try{const raw=this.storage.getItem(STORAGE_KEY);const data=raw?JSON.parse(raw):{};return data&&typeof data==="object"&&!Array.isArray(data)?data:{};}catch{return {};}}
 #write(data){let json=JSON.stringify(data);if(json.length>MAX_TOTAL_BYTES){for(const id of Object.keys(data)){data[id]=data[id].slice(-10);}json=JSON.stringify(data);}if(json.length>MAX_TOTAL_BYTES)throw new Error("Lịch sử phiên bản vượt giới hạn 2 MB.");this.storage.setItem(STORAGE_KEY,json);}
 record(macro,action="save",note=""){if(!macro||typeof macro.id!=="string"||!macro.id)throw new Error("Thiếu mã macro để ghi lịch sử.");const data=this.#read(),items=Array.isArray(data[macro.id])?data[macro.id]:[];const snapshot={version:Number(macro.version)||1,name:String(macro.name||""),description:String(macro.description||""),source:String(macro.source||""),createdAt:this.clock(),action:String(action),note:String(note||"").slice(0,180)};const last=items.at(-1);if(last&&last.version===snapshot.version&&last.source===snapshot.source&&last.name===snapshot.name&&last.description===snapshot.description)return clone(last);items.push(snapshot);data[macro.id]=items.slice(-MAX_VERSIONS_PER_MACRO);this.#write(data);return clone(snapshot);}
 list(id){return (this.#read()[id]||[]).map(cleanSnapshot).sort((a,b)=>a.version-b.version);}
 get(id,version){const item=this.list(id).find(x=>x.version===Number(version));return item?clone(item):null;}
 compare(id,fromVersion,toVersion){const from=this.get(id,fromVersion),to=this.get(id,toVersion);if(!from||!to)throw new Error("Không tìm thấy một trong hai phiên bản.");const a=from.source.split("\n"),b=to.source.split("\n"),rows=[],n=Math.max(a.length,b.length);for(let i=0;i<n;i++){if(a[i]===b[i])continue;rows.push({line:i+1,before:a[i]??null,after:b[i]??null,type:a[i]===undefined?"added":b[i]===undefined?"removed":"changed"});}return {macroId:id,fromVersion:from.version,toVersion:to.version,metadata:{nameChanged:from.name!==to.name,descriptionChanged:from.description!==to.description},changes:rows};}
 restore(id,version){const snapshot=this.get(id,version);if(!snapshot)throw new Error("Phiên bản cần khôi phục không tồn tại.");return {...snapshot,restoredFrom:snapshot.version};}
 delete(id){const data=this.#read();if(!Object.hasOwn(data,id))return false;delete data[id];this.#write(data);return true;}
 exportOne(id){return JSON.stringify({format:"SGHT-MACRO-HISTORY",schemaVersion:1,macroId:id,versions:this.list(id)},null,2);}
}
export const MACRO_HISTORY_LIMITS=Object.freeze({versionsPerMacro:MAX_VERSIONS_PER_MACRO,totalBytes:MAX_TOTAL_BYTES});
