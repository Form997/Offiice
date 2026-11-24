import { planMacro } from "./macro-engine.js";
const STORAGE_KEY="haidat-sght-macro-library-v1";
const MAX_MACROS=100, MAX_SOURCE_CHARS=50000, MAX_LIBRARY_BYTES=1024*1024;
const clone=x=>JSON.parse(JSON.stringify(x));
function makeId(){return "mcr_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,10);}
function cleanText(value,max){return String(value??"").trim().slice(0,max);}
function validateSource(source){if(typeof source!=="string"||!source.trim())throw new Error("Mã macro đang trống.");if(source.length>MAX_SOURCE_CHARS)throw new Error("Mã macro vượt quá 50.000 ký tự.");planMacro(source);return source;}
export class MacroLibrary{
 constructor(storage=globalThis.localStorage,clock=()=>new Date().toISOString(),idFactory=makeId){this.storage=storage;this.clock=clock;this.idFactory=idFactory;}
 #read(){try{const raw=this.storage.getItem(STORAGE_KEY);if(!raw)return [];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return [];return parsed.filter(x=>x&&typeof x.id==="string"&&typeof x.name==="string"&&typeof x.source==="string");}catch{return [];}}
 #write(items){const json=JSON.stringify(items);if(json.length>MAX_LIBRARY_BYTES)throw new Error("Thư viện vượt dung lượng an toàn 1 MB.");this.storage.setItem(STORAGE_KEY,json);}
 list(){return this.#read().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).map(clone);}
 get(id){const item=this.#read().find(x=>x.id===id);return item?clone(item):null;}
 save({id=null,name,description="",source}){const valid=validateSource(source),items=this.#read(),now=this.clock();let item=id?items.find(x=>x.id===id):null;if(id&&!item)throw new Error("Không tìm thấy macro cần cập nhật.");const cleanName=cleanText(name,80);if(!cleanName)throw new Error("Hãy đặt tên cho macro.");const duplicate=items.find(x=>x.name.toLocaleLowerCase()===cleanName.toLocaleLowerCase()&&x.id!==id);if(duplicate)throw new Error("Tên macro đã tồn tại. Hãy chọn tên khác.");if(!item&&items.length>=MAX_MACROS)throw new Error("Thư viện đã đạt giới hạn 100 macro.");if(item){item.name=cleanName;item.description=cleanText(description,240);item.source=valid;item.updatedAt=now;item.version=(item.version||1)+1;}else{item={id:this.idFactory(),name:cleanName,description:cleanText(description,240),source:valid,createdAt:now,updatedAt:now,version:1};items.push(item);}this.#write(items);return clone(item);}
 delete(id){const items=this.#read(),next=items.filter(x=>x.id!==id);if(next.length===items.length)return false;this.#write(next);return true;}
 duplicate(id){const item=this.get(id);if(!item)throw new Error("Không tìm thấy macro.");let name=item.name+" (bản sao)",n=2,names=new Set(this.#read().map(x=>x.name.toLocaleLowerCase()));while(names.has(name.toLocaleLowerCase()))name=item.name+" (bản sao "+n+++ ")";return this.save({name,description:item.description,source:item.source});}
 exportOne(id){const item=this.get(id);if(!item)throw new Error("Không tìm thấy macro.");return JSON.stringify({format:"SGHT-MACRO",schemaVersion:1,macro:item},null,2);}
 importText(text){if(typeof text!=="string"||text.length>MAX_LIBRARY_BYTES)throw new Error("Tệp nhập vượt quá 1 MB.");let data;try{data=JSON.parse(text);}catch{throw new Error("Tệp macro không phải JSON hợp lệ.");}const incoming=data?.format==="SGHT-MACRO"?[data.macro]:data?.format==="SGHT-MACRO-LIBRARY"&&data.schemaVersion===1&&Array.isArray(data.macros)?data.macros:null;if(!incoming||!incoming.length)throw new Error("Không đúng định dạng SGHT Macro.");if(incoming.length>MAX_MACROS)throw new Error("Tệp chứa quá 100 macro.");let added=0;for(const m of incoming){if(!m||typeof m!=="object")throw new Error("Bản ghi macro không hợp lệ.");this.save({name:m.name,description:m.description,source:m.source});added++;}return added;}
 exportAll(){return JSON.stringify({format:"SGHT-MACRO-LIBRARY",schemaVersion:1,exportedAt:this.clock(),macros:this.list()},null,2);}
}
export const MACRO_LIBRARY_LIMITS=Object.freeze({macros:MAX_MACROS,sourceCharacters:MAX_SOURCE_CHARS,bytes:MAX_LIBRARY_BYTES});
