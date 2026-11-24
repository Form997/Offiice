/** SGHT 18.38 — ECDSA signatures and externally verifiable trust fingerprints. */
import {verifyFormulaAuditArchiveChain} from "./formula-audit-archive.js";
const SCHEMA="sght.formula-audit-signature";
const enc=new TextEncoder(),dec=new TextDecoder();
const canonical=value=>value===null||typeof value!=="object"?JSON.stringify(value):Array.isArray(value)?"["+value.map(canonical).join(",")+"]":"{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
const bytesToBase64=bytes=>{let binary="";for(const b of new Uint8Array(bytes))binary+=String.fromCharCode(b);return btoa(binary);};
const base64ToBytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function digest(data,cryptoImpl=globalThis.crypto){return cryptoImpl.subtle.digest("SHA-256",data);}
async function fingerprint(publicKey,cryptoImpl=globalThis.crypto){return hex(await digest(publicKey,cryptoImpl));}
function signatureBody(pkg){return {schema:pkg.schema,version:pkg.version,archiveSchema:pkg.archiveSchema,archiveCount:pkg.archiveCount,headHash:pkg.headHash,signedAt:pkg.signedAt,publicKeySpki:pkg.publicKeySpki,keyFingerprint:pkg.keyFingerprint};}
export async function generateFormulaAuditSigningKeys(cryptoImpl=globalThis.crypto){return cryptoImpl.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);}
export async function exportEncryptedFormulaAuditPrivateKey(privateKey,publicKey,password,options={}){
 if(typeof password!=="string"||password.length<12)throw new Error("Mật khẩu bảo vệ khóa phải có ít nhất 12 ký tự.");
 const c=options.crypto||globalThis.crypto,iterations=options.iterations||310000;
 const salt=c.getRandomValues(new Uint8Array(16)),iv=c.getRandomValues(new Uint8Array(12));
 const material=await c.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveKey"]);
 const aes=await c.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt"]);
 const pkcs8=await c.subtle.exportKey("pkcs8",privateKey),spki=await c.subtle.exportKey("spki",publicKey);
 const encrypted=await c.subtle.encrypt({name:"AES-GCM",iv},aes,pkcs8);
 return {schema:"sght.encrypted-signing-key",version:1,algorithm:"ECDSA-P256-SHA256",kdf:"PBKDF2-SHA256",iterations,salt:bytesToBase64(salt),iv:bytesToBase64(iv),ciphertext:bytesToBase64(encrypted),publicKeySpki:bytesToBase64(spki),keyFingerprint:await fingerprint(spki,c)};
}
export async function importEncryptedFormulaAuditPrivateKey(bundle,password,cryptoImpl=globalThis.crypto){
 if(!bundle||bundle.schema!=="sght.encrypted-signing-key"||bundle.version!==1||bundle.algorithm!=="ECDSA-P256-SHA256")throw new Error("Tệp khóa không đúng định dạng SGHT.");
 if(!Number.isInteger(bundle.iterations)||bundle.iterations<100000||bundle.iterations>2000000)throw new Error("Thông số PBKDF2 không hợp lệ.");
 const salt=base64ToBytes(bundle.salt),iv=base64ToBytes(bundle.iv),cipher=base64ToBytes(bundle.ciphertext);
 const material=await cryptoImpl.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveKey"]);
 const aes=await cryptoImpl.subtle.deriveKey({name:"PBKDF2",salt,iterations:bundle.iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
 let pkcs8;try{pkcs8=await cryptoImpl.subtle.decrypt({name:"AES-GCM",iv},aes,cipher);}catch{throw new Error("Không mở được khóa: mật khẩu sai hoặc tệp đã bị sửa.");}
 const privateKey=await cryptoImpl.subtle.importKey("pkcs8",pkcs8,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
 const publicKey=await cryptoImpl.subtle.importKey("spki",base64ToBytes(bundle.publicKeySpki),{name:"ECDSA",namedCurve:"P-256"},true,["verify"]);
 const fp=await fingerprint(base64ToBytes(bundle.publicKeySpki),cryptoImpl);
 if(fp!==bundle.keyFingerprint)throw new Error("Fingerprint khóa công khai không khớp.");
 const challenge=enc.encode("SGHT signing-key-pair-check-v1");
 const proof=await cryptoImpl.subtle.sign({name:"ECDSA",hash:"SHA-256"},privateKey,challenge);
 if(!await cryptoImpl.subtle.verify({name:"ECDSA",hash:"SHA-256"},publicKey,proof,challenge))throw new Error("Khóa riêng và khóa công khai trong tệp không thuộc cùng một cặp.");
 return {privateKey,publicKey,keyFingerprint:fp};
}
export async function signFormulaAuditArchive(chain,privateKey,publicKey,options={}){
 const c=options.crypto||globalThis.crypto,check=await verifyFormulaAuditArchiveChain(chain,c);
 if(!check.valid||!chain.length)throw new Error("Chỉ ký được kho lưu trữ không rỗng và đã vượt qua kiểm định SHA-256.");
 const spki=await c.subtle.exportKey("spki",publicKey),pkg={schema:SCHEMA,version:1,archiveSchema:"sght.formula-audit-archive-bundle",archiveCount:chain.length,headHash:check.lastHash,signedAt:(options.now?new Date(options.now):new Date()).toISOString(),publicKeySpki:bytesToBase64(spki),keyFingerprint:await fingerprint(spki,c)};
 const signature=await c.subtle.sign({name:"ECDSA",hash:"SHA-256"},privateKey,enc.encode(canonical(signatureBody(pkg))));
 return {...pkg,signature:bytesToBase64(signature),chain};
}
export async function verifyFormulaAuditSignature(pkg,options={}){
 const c=options.crypto||globalThis.crypto,findings=[];
 if(!pkg||pkg.schema!==SCHEMA||pkg.version!==1||!Array.isArray(pkg.chain))return {valid:false,trusted:false,status:"invalid",findings:[{code:"INVALID_SIGNATURE_PACKAGE",message:"Gói chữ ký không hợp lệ."}]};
 const chain=await verifyFormulaAuditArchiveChain(pkg.chain,c);
 if(!chain.valid)findings.push({code:"ARCHIVE_CHAIN_INVALID",message:"Chuỗi SHA-256 bên trong gói không toàn vẹn.",details:chain.findings});
 const spki=base64ToBytes(pkg.publicKeySpki||"");
 const actualFingerprint=await fingerprint(spki,c);
 if(actualFingerprint!==pkg.keyFingerprint)findings.push({code:"FINGERPRINT_MISMATCH",message:"Fingerprint khóa công khai không khớp."});
 if(pkg.archiveCount!==pkg.chain.length||pkg.headHash!==chain.lastHash)findings.push({code:"SIGNED_ARCHIVE_METADATA_MISMATCH",message:"Số lượng hoặc hash đầu chuỗi không khớp nội dung đã ký."});
 let signatureValid=false;
 try{const pub=await c.subtle.importKey("spki",spki,{name:"ECDSA",namedCurve:"P-256"},true,["verify"]);signatureValid=await c.subtle.verify({name:"ECDSA",hash:"SHA-256"},pub,base64ToBytes(pkg.signature),enc.encode(canonical(signatureBody(pkg))));}catch{}
 if(!signatureValid)findings.push({code:"SIGNATURE_INVALID",message:"Chữ ký ECDSA không hợp lệ."});
 const valid=chain.valid&&findings.length===0;
 const trusted=valid&&typeof options.trustedFingerprint==="string"&&options.trustedFingerprint.trim().toLowerCase()===actualFingerprint;
 return {valid,trusted,status:!valid?"invalid":trusted?"trusted":"valid-untrusted-key",keyFingerprint:actualFingerprint,archiveCount:pkg.archiveCount,headHash:pkg.headHash,findings};
}
export function exportFormulaAuditSignaturePackage(pkg){return JSON.stringify({schema:"sght.formula-audit-signed-bundle",version:1,signature:pkg},null,2);}
export function parseFormulaAuditSignaturePackage(value){
 const parsed=typeof value==="string"?JSON.parse(value):value;
 if(!parsed||parsed.schema!=="sght.formula-audit-signed-bundle"||parsed.version!==1||!parsed.signature)throw new Error("Tệp không phải gói SGHT Audit Archive đã ký.");
 return parsed.signature;
}
