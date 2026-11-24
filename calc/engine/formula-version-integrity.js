/** SGHT 18.36 — read-only integrity audit for locally stored formula history. */
const str=(v,max=4000)=>typeof v==="string"?v.slice(0,max):"";
const formula=v=>typeof v==="string"&&v.trimStart().startsWith("=");
const issue=(code,severity,message,details={})=>({code,severity,message,...details});
export function auditFormulaVersionIntegrity(input){
 const raw=Array.isArray(input)?input:Array.isArray(input?.versions)?input.versions:null;
 const findings=[];
 if(!raw){return {schema:"sght.formula-history-integrity",version:1,checkedAt:new Date().toISOString(),status:"invalid",summary:{records:0,validRecords:0,errors:1,warnings:0,legacyRecords:0},findings:[issue("INVALID_CONTAINER","error","Lịch sử không phải mảng phiên bản hợp lệ.")]};}
 const ids=new Map(),transactions=new Map(),cells=new Map();let validRecords=0,legacyRecords=0;
 raw.forEach((x,index)=>{
  const row=index+1;
  if(!x||typeof x!=="object"||Array.isArray(x)){findings.push(issue("INVALID_RECORD","error","Bản ghi không phải đối tượng.",{row}));return;}
  let valid=true;
  for(const field of ["id","sheetId","address","timestamp"]){if(typeof x[field]!=="string"||!x[field].trim()){findings.push(issue("MISSING_FIELD","error","Thiếu trường bắt buộc: "+field+".",{row,field,id:str(x.id,120)}));valid=false;}}
  if(typeof x.beforeFormula!=="string"&&x.beforeFormula!==null){findings.push(issue("INVALID_BEFORE_FORMULA","error","beforeFormula phải là chuỗi hoặc null.",{row,id:str(x.id,120)}));valid=false;}
  if(typeof x.afterFormula!=="string"&&x.afterFormula!==null){findings.push(issue("INVALID_AFTER_FORMULA","error","afterFormula phải là chuỗi hoặc null.",{row,id:str(x.id,120)}));valid=false;}
  if(!formula(x.beforeFormula)&&!formula(x.afterFormula)){findings.push(issue("NOT_FORMULA_EVENT","warning","Bản ghi không thể hiện thay đổi có liên quan đến công thức.",{row,id:str(x.id,120)}));}
  if(typeof x.timestamp==="string"&&(!Number.isFinite(Date.parse(x.timestamp)))){findings.push(issue("INVALID_TIMESTAMP","error","Thời điểm không phân tích được.",{row,id:str(x.id,120),timestamp:str(x.timestamp,80)}));valid=false;}
  if(typeof x.id==="string"&&x.id){if(ids.has(x.id))findings.push(issue("DUPLICATE_ID","error","Mã phiên bản bị trùng.",{row,id:x.id,firstRow:ids.get(x.id)}));else ids.set(x.id,row);}
  if(!x.transactionId){findings.push(issue("MISSING_TRANSACTION_ID","warning","Bản ghi cũ thiếu transactionId; được xem như giao dịch độc lập.",{row,id:str(x.id,120)}));}
  const tx=str(x.transactionId||x.id,160);
  if(tx){if(!transactions.has(tx))transactions.set(tx,{sheetId:x.sheetId,source:x.source,rows:[],addresses:new Set()});const g=transactions.get(tx);g.rows.push(row);if(g.sheetId!==x.sheetId)findings.push(issue("MIXED_SHEETS_IN_TRANSACTION","error","Một giao dịch chứa nhiều trang tính.",{row,transactionId:tx}));if(g.source!==x.source)findings.push(issue("MIXED_SOURCES_IN_TRANSACTION","warning","Nguồn thao tác không đồng nhất trong cùng giao dịch.",{row,transactionId:tx}));const addr=str(x.address,32);if(g.addresses.has(addr))findings.push(issue("DUPLICATE_CELL_IN_TRANSACTION","error","Một ô xuất hiện nhiều lần trong cùng giao dịch.",{row,transactionId:tx,address:addr}));g.addresses.add(addr);}
  const hasRaw=typeof x.beforeValue==="string"&&typeof x.afterValue==="string";
  if(!hasRaw){legacyRecords++;findings.push(issue("LEGACY_VALUE_GAP","warning","Bản ghi thiếu giá trị thô trước/sau; không thể xác minh đầy đủ hằng số và ô trống.",{row,id:str(x.id,120)}));}
  else{
   if(x.beforeFormula!==null&&x.beforeValue!==x.beforeFormula)findings.push(issue("BEFORE_FORMULA_VALUE_MISMATCH","error","beforeFormula không khớp beforeValue.",{row,id:str(x.id,120)}));
   if(x.afterFormula!==null&&x.afterValue!==x.afterFormula)findings.push(issue("AFTER_FORMULA_VALUE_MISMATCH","error","afterFormula không khớp afterValue.",{row,id:str(x.id,120)}));
   if((x.beforeFormula===null&&formula(x.beforeValue))||(x.afterFormula===null&&formula(x.afterValue)))findings.push(issue("FORMULA_FLAG_MISMATCH","error","Giá trị thô có dạng công thức nhưng trường công thức lại là null.",{row,id:str(x.id,120)}));
  }
  if(valid)validRecords++;
  const key=str(x.sheetId,120)+"!"+str(x.address,32);
  if(!cells.has(key))cells.set(key,[]);
  cells.get(key).push({row,id:str(x.id,120),timestamp:str(x.timestamp,40),beforeValue:hasRaw?x.beforeValue:null,afterValue:hasRaw?x.afterValue:null,hasRaw});
 });
 for(const [key,versions] of cells){
  const ordered=versions.filter(v=>v.hasRaw&&Number.isFinite(Date.parse(v.timestamp))).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)||a.row-b.row);
  for(let i=1;i<ordered.length;i++){const prev=ordered[i-1],next=ordered[i];if(prev.afterValue!==next.beforeValue)findings.push(issue("CELL_CHAIN_GAP","warning","Hai phiên bản liên tiếp có điểm nối giá trị không khớp; có thể thiếu mốc hoặc đã có thay đổi ngoài lịch sử.",{cell:key,previousId:prev.id,nextId:next.id,previousRow:prev.row,nextRow:next.row}));}
 }
 const errors=findings.filter(x=>x.severity==="error").length,warnings=findings.filter(x=>x.severity==="warning").length;
 return {schema:"sght.formula-history-integrity",version:1,checkedAt:new Date().toISOString(),status:errors?"issues":warnings?"warnings":"clean",summary:{records:raw.length,validRecords,errors,warnings,legacyRecords,transactions:transactions.size,cells:cells.size},findings};
}
export function exportFormulaVersionIntegrityReport(report){
 return JSON.stringify({schema:"sght.formula-history-integrity-report",version:1,report},null,2);
}
