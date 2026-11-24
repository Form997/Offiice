/** SGHT 18.37 — SHA-256 chained, portable audit archive. */
export const FORMULA_AUDIT_ARCHIVE_SCHEMA="sght.formula-audit-archive";
const GENESIS="GENESIS";
function canonical(value){
 if(value===null||typeof value!=="object")return JSON.stringify(value);
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
}
async function sha256(value,cryptoImpl=globalThis.crypto){
 if(!cryptoImpl?.subtle)throw new Error("Trình duyệt không hỗ trợ Web Crypto SHA-256 trong ngữ cảnh hiện tại.");
 const bytes=new TextEncoder().encode(typeof value==="string"?value:canonical(value));
 const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function bodyOf(item){return {schema:item.schema,version:item.version,sequence:item.sequence,createdAt:item.createdAt,previousHash:item.previousHash,payload:item.payload,payloadHash:item.payloadHash};}
export async function verifyFormulaAuditArchiveChain(chain,cryptoImpl=globalThis.crypto){
 const findings=[];
 if(!Array.isArray(chain))return {valid:false,checked:0,findings:[{code:"INVALID_CHAIN",message:"Kho lưu trữ phải là một mảng."}],lastHash:null};
 let previous=GENESIS;
 for(let i=0;i<chain.length;i++){
  const item=chain[i],sequence=i+1;
  if(!item||typeof item!=="object"){findings.push({code:"INVALID_ARCHIVE",sequence,message:"Gói lưu trữ không hợp lệ."});continue;}
  if(item.schema!==FORMULA_AUDIT_ARCHIVE_SCHEMA||item.version!==1)findings.push({code:"SCHEMA_MISMATCH",sequence,message:"Schema hoặc phiên bản gói không được hỗ trợ."});
  if(item.sequence!==sequence)findings.push({code:"SEQUENCE_GAP",sequence,actual:item.sequence,message:"Số thứ tự không liên tục."});
  if(item.previousHash!==previous)findings.push({code:"CHAIN_LINK_MISMATCH",sequence,expected:previous,actual:item.previousHash,message:"Liên kết với bản lưu trước không khớp."});
  if(!item.payload||typeof item.payload!=="object"||!Array.isArray(item.payload.history))findings.push({code:"INVALID_PAYLOAD",sequence,message:"Payload thiếu lịch sử phiên bản."});
  try{
   const payloadHash=await sha256(item.payload,cryptoImpl);
   if(payloadHash!==item.payloadHash)findings.push({code:"PAYLOAD_HASH_MISMATCH",sequence,message:"Nội dung payload không khớp SHA-256."});
   const hash=await sha256(bodyOf(item),cryptoImpl);
   if(hash!==item.hash)findings.push({code:"ARCHIVE_HASH_MISMATCH",sequence,message:"Dấu SHA-256 của gói lưu trữ không khớp."});
  }catch(error){findings.push({code:"HASH_UNAVAILABLE",sequence,message:error.message});}
  if(typeof item.hash==="string")previous=item.hash;
 }
 return {valid:findings.length===0,checked:chain.length,findings,lastHash:chain.length?chain[chain.length-1]?.hash||null:null};
}
export async function createFormulaAuditArchive(history,chain=[],options={}){
 const cryptoImpl=options.crypto||globalThis.crypto;
 const verified=await verifyFormulaAuditArchiveChain(chain,cryptoImpl);
 if(!verified.valid)throw new Error("Kho lưu trữ hiện tại không toàn vẹn; không thể nối thêm bản mới.");
 if(!Array.isArray(history))throw new Error("Lịch sử phiên bản không hợp lệ.");
 const payload={history:JSON.parse(JSON.stringify(history)),recordCount:history.length,...(options.metadata?JSON.parse(JSON.stringify(options.metadata)):{})};
 const item={schema:FORMULA_AUDIT_ARCHIVE_SCHEMA,version:1,sequence:chain.length+1,createdAt:(options.now?new Date(options.now):new Date()).toISOString(),previousHash:chain.length?chain[chain.length-1].hash:GENESIS,payload,payloadHash:await sha256(payload,cryptoImpl)};
 item.hash=await sha256(bodyOf(item),cryptoImpl);
 return item;
}
export async function verifyAndAppendFormulaAuditArchive(currentChain,incomingChain,cryptoImpl=globalThis.crypto){
 const incoming=await verifyFormulaAuditArchiveChain(incomingChain,cryptoImpl);
 if(!incoming.valid)return {accepted:false,reason:"Gói nhập không vượt qua kiểm định SHA-256 hoặc chuỗi liên kết.",verification:incoming,chain:currentChain};
 const current=await verifyFormulaAuditArchiveChain(currentChain,cryptoImpl);
 if(!current.valid)return {accepted:false,reason:"Kho lưu trữ hiện tại không toàn vẹn; từ chối ghi đè.",verification:current,chain:currentChain};
 if(incomingChain.length<currentChain.length)return {accepted:false,reason:"Bản nhập cũ hơn kho hiện tại; không cho phép hạ cấp.",verification:incoming,chain:currentChain};
 for(let i=0;i<currentChain.length;i++)if(currentChain[i].hash!==incomingChain[i].hash)return {accepted:false,reason:"Bản nhập không cùng nhánh lịch sử với kho hiện tại.",verification:incoming,chain:currentChain};
 if(incomingChain.length===currentChain.length)return {accepted:false,reason:"Bản nhập không có bản lưu mới hơn.",verification:incoming,chain:currentChain};
 return {accepted:true,reason:"Chuỗi hợp lệ và nối tiếp đúng kho hiện tại.",verification:incoming,chain:incomingChain};
}
export function exportFormulaAuditArchive(chain){
 return JSON.stringify({schema:"sght.formula-audit-archive-bundle",version:1,exportedAt:new Date().toISOString(),chain},null,2);
}
export function parseFormulaAuditArchiveBundle(value){
 const parsed=typeof value==="string"?JSON.parse(value):value;
 if(!parsed||parsed.schema!=="sght.formula-audit-archive-bundle"||parsed.version!==1||!Array.isArray(parsed.chain))throw new Error("Tệp không phải gói SGHT Audit Archive phiên bản 1.");
 return parsed.chain;
}
