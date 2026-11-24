import { createHmac, createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function generateTotpSecret(bytes = 20) {
  const input=randomBytes(bytes);let bits=0,value=0,out="";
  for(const byte of input){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=ALPHABET[(value>>>(bits-5))&31];bits-=5;}}
  if(bits)out+=ALPHABET[(value<<(5-bits))&31];return out;
}
function decodeBase32(value){
  const clean=String(value||"").toUpperCase().replace(/=+$/,"").replace(/\s/g,"");
  if(!clean||/[^A-Z2-7]/.test(clean))throw new Error("Invalid TOTP secret.");
  let bits=0,buffer=0;const out=[];
  for(const char of clean){buffer=(buffer<<5)|ALPHABET.indexOf(char);bits+=5;if(bits>=8){out.push((buffer>>>(bits-8))&255);bits-=8;}}
  return Buffer.from(out);
}
export function totpCodeAt(secret,timestampMs=Date.now(),digits=6){
  const counter=Math.floor(timestampMs/30000),msg=Buffer.alloc(8);msg.writeBigUInt64BE(BigInt(counter));
  const digest=createHmac("sha1",decodeBase32(secret)).update(msg).digest(),offset=digest[digest.length-1]&15;
  const binary=((digest[offset]&127)<<24)|((digest[offset+1]&255)<<16)|((digest[offset+2]&255)<<8)|(digest[offset+3]&255);
  return String(binary%(10**digits)).padStart(digits,"0");
}
export function verifyTotp(secret,code,timestampMs=Date.now(),window=1){
  const candidate=String(code||"").trim();
  if(!/^\d{6}$/.test(candidate)||!Number.isFinite(timestampMs)||!Number.isInteger(window)||window<0||window>2)return null;
  const current=Math.floor(timestampMs/30000);
  for(let offset=-window;offset<=window;offset++){const step=current+offset;if(step>=0&&totpCodeAt(secret,step*30000)===candidate)return step;}
  return null;
}
function deriveKey(masterKey){
  if(typeof masterKey!=="string"||Buffer.byteLength(masterKey,"utf8")<32)throw new Error("SGHT_MFA_ENCRYPTION_KEY must contain at least 32 UTF-8 bytes.");
  return createHash("sha256").update(masterKey,"utf8").digest();
}
export function encryptTotpSecret(secret,masterKey){
  const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",deriveKey(masterKey),nonce);
  const encrypted=Buffer.concat([cipher.update(String(secret),"utf8"),cipher.final()]);
  return [nonce.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".");
}
export function decryptTotpSecret(payload,masterKey){
  const parts=String(payload||"").split(".");if(parts.length!==3)throw new Error("Invalid encrypted TOTP secret.");
  const [nonce,tag,encrypted]=parts.map(x=>Buffer.from(x,"base64url"));
  if(nonce.length!==12||tag.length!==16||!encrypted.length)throw new Error("Invalid encrypted TOTP secret.");
  const decipher=createDecipheriv("aes-256-gcm",deriveKey(masterKey),nonce);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted),decipher.final()]).toString("utf8");
}
export function normalizeRecoveryCode(value){return String(value||"").toUpperCase().replace(/[^A-F0-9]/g,"");}
export function formatRecoveryCode(value){const raw=String(value||"").toUpperCase().replace(/[^A-F0-9]/g,"");return raw.length===16?raw.match(/.{4}/g).join("-"):"";}
export function makeRecoveryCode(){return formatRecoveryCode(randomBytes(8).toString("hex"));}
export function buildOtpAuthUri(secret,account,issuer="SGHT"){
  const label=encodeURIComponent(issuer+":"+String(account||"account"));
  const query=new URLSearchParams({secret,issuer,algorithm:"SHA1",digits:"6",period:"30"});
  return "otpauth://totp/"+label+"?"+query.toString();
}
