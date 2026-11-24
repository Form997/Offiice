/** SGHT 18.39 — Local identity registry and append-only key lifecycle ledger.
 * This is an operator-managed registry, not an authentication server or CA.
 */
export const IDENTITY_REGISTRY_SCHEMA="sght.identity-registry";
const STATUSES=["pending","active","rotated","revoked","expired"];
const canonical=v=>v===null||typeof v!=="object"?JSON.stringify(v):Array.isArray(v)?"["+v.map(canonical).join(",")+"]":"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}";
const clone=v=>JSON.parse(JSON.stringify(v));
const id=()=>globalThis.crypto?.randomUUID?.()||"id-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
async function fingerprint(spki,cryptoImpl=globalThis.crypto){const h=await cryptoImpl.subtle.digest("SHA-256",spki);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export async function getFormulaPublicKeyFingerprint(publicKey,cryptoImpl=globalThis.crypto){return fingerprint(await cryptoImpl.subtle.exportKey("spki",publicKey),cryptoImpl);}
export function createEmptyIdentityRegistry(now=new Date().toISOString()){return {schema:IDENTITY_REGISTRY_SCHEMA,version:1,createdAt:now,updatedAt:now,identities:[],keys:[],events:[]};}
export function validateIdentityRegistry(input){
 const errors=[],warnings=[];
 if(!input||input.schema!==IDENTITY_REGISTRY_SCHEMA||input.version!==1)return {valid:false,errors:["Schema hoặc phiên bản sổ danh tính không hợp lệ."],warnings};
 for(const field of ["identities","keys","events"])if(!Array.isArray(input[field]))errors.push("Trường "+field+" phải là mảng.");
 if(errors.length)return {valid:false,errors,warnings};
 const identityIds=new Set(),keyIds=new Set(),fingerprints=new Set(),eventIds=new Set();
 for(const person of input.identities){if(!person.id||identityIds.has(person.id))errors.push("Mã danh tính thiếu hoặc trùng.");identityIds.add(person.id);if(!person.displayName?.trim())errors.push("Danh tính "+(person.id||"?")+" thiếu tên hiển thị.");if(!["pending","active","suspended"].includes(person.status))errors.push("Trạng thái danh tính không hợp lệ: "+person.id);}
 for(const key of input.keys){if(!key.id||keyIds.has(key.id))errors.push("Mã khóa thiếu hoặc trùng.");keyIds.add(key.id);if(!identityIds.has(key.identityId))errors.push("Khóa "+(key.id||"?")+" tham chiếu danh tính không tồn tại.");if(!/^[a-f0-9]{64}$/.test(key.fingerprint||""))errors.push("Fingerprint không hợp lệ: "+(key.id||"?"));if(fingerprints.has(key.fingerprint))errors.push("Fingerprint khóa bị trùng: "+key.fingerprint);fingerprints.add(key.fingerprint);if(!STATUSES.includes(key.status))errors.push("Trạng thái khóa không hợp lệ: "+key.id);if(key.expiresAt&&!Number.isFinite(Date.parse(key.expiresAt)))errors.push("Ngày hết hạn khóa không hợp lệ: "+key.id);}
 for(const event of input.events){if(!event.id||eventIds.has(event.id))errors.push("Mã sự kiện thiếu hoặc trùng.");eventIds.add(event.id);if(!event.type||!event.timestamp)errors.push("Sự kiện thiếu loại hoặc thời điểm.");}
 if(!input.events.length)warnings.push("Sổ chưa có nhật ký vòng đời khóa.");
 return {valid:errors.length===0,errors,warnings,summary:{identities:input.identities.length,keys:input.keys.length,events:input.events.length}};
}
function assertRegistry(registry){const v=validateIdentityRegistry(registry);if(!v.valid)throw new Error("Sổ danh tính lỗi: "+v.errors.join(" "));}
function appendEvent(registry,type,actorId,targetId,details={},now=new Date().toISOString()){registry.events.push({id:id(),type,actorId:actorId||null,targetId,timestamp:now,details:clone(details)});registry.updatedAt=now;}
export function registerFormulaIdentity(registry,{displayName,organization="",contact="",actorId=null,verificationNote=""},now=new Date().toISOString()){
 assertRegistry(registry);if(!displayName?.trim())throw new Error("Tên danh tính không được để trống.");
 const person={id:id(),displayName:displayName.trim(),organization:organization.trim(),contact:contact.trim(),status:"pending",createdAt:now,verificationNote:verificationNote.trim()};
 registry.identities.push(person);appendEvent(registry,"identity_registered",actorId,person.id,{status:"pending",verificationNote:person.verificationNote},now);return clone(person);
}
export function approveFormulaIdentity(registry,identityId,{actorId,verificationNote},now=new Date().toISOString()){
 assertRegistry(registry);const person=registry.identities.find(x=>x.id===identityId);if(!person)throw new Error("Không tìm thấy danh tính.");if(person.status!=="pending")throw new Error("Chỉ danh tính đang chờ mới được phê duyệt.");if(!actorId||actorId===identityId)throw new Error("Cần mã người phê duyệt khác người được phê duyệt.");if(!verificationNote?.trim())throw new Error("Phải ghi căn cứ xác minh danh tính.");
 person.status="active";person.verifiedAt=now;person.verifiedBy=actorId;person.verificationNote=verificationNote.trim();appendEvent(registry,"identity_approved",actorId,identityId,{verificationNote:person.verificationNote},now);return clone(person);
}
export async function registerFormulaIdentityKey(registry,identityId,publicKey,{actorId,expiresAt=null,label="",now=new Date().toISOString(),crypto=globalThis.crypto}={}){
 assertRegistry(registry);const person=registry.identities.find(x=>x.id===identityId);if(!person||person.status!=="active")throw new Error("Chỉ danh tính đã được phê duyệt mới được đăng ký khóa.");if(!actorId)throw new Error("Cần ghi người thực hiện đăng ký khóa.");if(expiresAt&&(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.parse(now)))throw new Error("Ngày hết hạn phải nằm sau thời điểm đăng ký.");
 const fp=await getFormulaPublicKeyFingerprint(publicKey,crypto);if(registry.keys.some(x=>x.fingerprint===fp))throw new Error("Fingerprint này đã có trong sổ.");
 const key={id:id(),identityId,fingerprint:fp,algorithm:"ECDSA-P256-SHA256",publicKeySpki: btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("spki",publicKey)))),label:label.trim(),status:"active",registeredAt:now,expiresAt,registeredBy:actorId};
 registry.keys.push(key);appendEvent(registry,"key_registered",actorId,key.id,{identityId,fingerprint:fp,expiresAt,label:key.label},now);return clone(key);
}
function transitionKey(registry,keyId,nextStatus,{actorId,reason,replacementKeyId=null},now=new Date().toISOString()){
 assertRegistry(registry);const key=registry.keys.find(x=>x.id===keyId);if(!key)throw new Error("Không tìm thấy khóa.");if(key.status!=="active")throw new Error("Chỉ khóa đang hiệu lực mới được thay đổi trạng thái.");if(!actorId||!reason?.trim())throw new Error("Cần người thực hiện và lý do.");key.status=nextStatus;key.endedAt=now;key.endedBy=actorId;key.endReason=reason.trim();if(replacementKeyId)key.replacementKeyId=replacementKeyId;appendEvent(registry,nextStatus==="revoked"?"key_revoked":"key_rotated",actorId,key.id,{reason:key.endReason,replacementKeyId},now);return clone(key);
}
export function revokeFormulaIdentityKey(registry,keyId,options,now){return transitionKey(registry,keyId,"revoked",options,now);}
export function rotateFormulaIdentityKey(registry,oldKeyId,newKeyId,options,now=new Date().toISOString()){
 const oldKey=registry.keys.find(x=>x.id===oldKeyId),newKey=registry.keys.find(x=>x.id===newKeyId);if(!oldKey||!newKey||oldKey.identityId!==newKey.identityId||oldKeyId===newKeyId)throw new Error("Khóa thay thế phải thuộc cùng một danh tính.");if(newKey.status!=="active")throw new Error("Khóa mới phải đang hiệu lực.");return transitionKey(registry,oldKeyId,"rotated",options,now);
}
export function expireFormulaIdentityKeys(registry,now=new Date().toISOString()){
 assertRegistry(registry);const expired=[];for(const key of registry.keys)if(key.status==="active"&&key.expiresAt&&Date.parse(key.expiresAt)<=Date.parse(now)){key.status="expired";key.endedAt=now;key.endReason="Hết hạn theo thời gian";appendEvent(registry,"key_expired","system",key.id,{expiresAt:key.expiresAt},now);expired.push(key.id);}return expired;
}
export function evaluateFormulaIdentityKey(registry,fingerprintValue,at=new Date().toISOString()){
 const check=validateIdentityRegistry(registry);if(!check.valid)return {valid:false,reason:"invalid_registry"};const key=registry.keys.find(x=>x.fingerprint===fingerprintValue);if(!key)return {valid:false,reason:"unknown_key"};const person=registry.identities.find(x=>x.id===key.identityId);if(key.status!=="active")return {valid:false,reason:key.status,identity:clone(person),key:clone(key)};if(person.status!=="active")return {valid:false,reason:"identity_"+person.status,identity:clone(person),key:clone(key)};if(key.expiresAt&&Date.parse(key.expiresAt)<=Date.parse(at))return {valid:false,reason:"expired",identity:clone(person),key:clone(key)};return {valid:true,reason:"active",identity:clone(person),key:clone(key)};
}
export function exportFormulaIdentityRegistry(registry){assertRegistry(registry);return JSON.stringify({schema:"sght.identity-registry-bundle",version:1,registry},null,2);}
export function importFormulaIdentityRegistry(value){const parsed=typeof value==="string"?JSON.parse(value):value;if(!parsed||parsed.schema!=="sght.identity-registry-bundle"||parsed.version!==1)throw new Error("Gói sổ danh tính không hợp lệ.");const registry=clone(parsed.registry),check=validateIdentityRegistry(registry);if(!check.valid)throw new Error(check.errors.join(" "));return registry;}
