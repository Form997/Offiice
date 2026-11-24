/**
 * SGHT AI Intelligence — offline-first, deterministic assistant layer.
 * Provides transparent statistics, formula hints and safe declarative macro drafts.
 * It does not call a remote LLM and never executes generated macros.
 */
const ADDRESS=/^([A-Z]+)([1-9][0-9]*)$/;
function parseAddress(a){const m=ADDRESS.exec(String(a).toUpperCase());if(!m)return null;let c=0;for(const ch of m[1])c=c*26+ch.charCodeAt(0)-64;return {row:Number(m[2]),col:c};}
function column(n){let s="";while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
function address(row,col){return column(col)+row;}
function quantile(sorted,q){if(!sorted.length)return null;const p=(sorted.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);return sorted[lo]+(sorted[hi]-sorted[lo])*(p-lo);}
export function analyzeWorkbook(cells={},getValue=a=>cells[a]){
 const entries=Object.entries(cells).filter(([a,v])=>parseAddress(a)&&v!==""&&v!=null).sort((a,b)=>{const x=parseAddress(a[0]),y=parseAddress(b[0]);return x.row-y.row||x.col-y.col;});
 const numeric=[],text=[],formula=[],errors=[];
 for(const [a,raw] of entries){if(typeof raw==="string"&&raw.startsWith("="))formula.push(a);let value;try{value=getValue(a);}catch(e){errors.push({cell:a,error:e.code||e.message||"Lỗi tính toán"});continue;}if(typeof value==="number"&&Number.isFinite(value))numeric.push({cell:a,value});else if(typeof value==="string"&&value.trim()!==""&&Number.isFinite(Number(value)))numeric.push({cell:a,value:Number(value)});else if(value!==""&&value!=null)text.push(a);}
 const values=numeric.map(x=>x.value).sort((a,b)=>a-b),sum=values.reduce((a,b)=>a+b,0),mean=values.length?sum/values.length:null,median=quantile(values,.5),q1=quantile(values,.25),q3=quantile(values,.75),iqr=q3===null?null:q3-q1;
 const outliers=iqr===null?[]:numeric.filter(x=>x.value<q1-1.5*iqr||x.value>q3+1.5*iqr).map(x=>({...x}));
 const used=entries.map(x=>parseAddress(x[0])),bounds=used.length?{top:Math.min(...used.map(x=>x.row)),bottom:Math.max(...used.map(x=>x.row)),left:Math.min(...used.map(x=>x.col)),right:Math.max(...used.map(x=>x.col))}:null;
 return {cellCount:entries.length,numericCount:numeric.length,textCount:text.length,formulaCount:formula.length,errorCount:errors.length,errors, bounds,statistics:values.length?{count:values.length,sum,mean,median,min:values[0],max:values[values.length-1],q1,q3,iqr}:null,outliers};
}
export function suggestFormulas(cells={},selected="A1",getValue=a=>cells[a]){
 const p=parseAddress(selected);if(!p)return [];
 const suggestions=[],aboveStart=Math.max(1,p.row-5),aboveEnd=p.row-1;
 if(aboveEnd>=aboveStart){const vals=[];for(let r=aboveStart;r<=aboveEnd;r++){const a=address(r,p.col);let v;try{v=getValue(a);}catch{continue;}if(v!==""&&v!=null)vals.push(v);}if(vals.length){const range=address(aboveStart,p.col)+":"+address(aboveEnd,p.col);suggestions.push({formula:"=SUM("+range+")",reason:"Cộng các ô có dữ liệu phía trên ô đang chọn."},{formula:"=AVERAGE("+range+")",reason:"Tính trung bình các ô phía trên."},{formula:"=COUNT("+range+")",reason:"Đếm số giá trị số phía trên."});}}
 const leftCol=p.col-1;if(leftCol>0){const a=address(p.row,leftCol);let v;try{v=getValue(a);}catch{}if(v!==""&&v!=null)suggestions.push({formula:"="+a+"*1",reason:"Tham chiếu giá trị ở ô liền bên trái (nhân 1 để minh họa công thức)."});}
 if(!suggestions.length)suggestions.push({formula:"=SUM(A1:A5)",reason:"Ví dụ mẫu; hãy thay vùng tham chiếu cho đúng dữ liệu."});
 return suggestions;
}
export function draftMacroFromVietnamese(prompt){
 if(typeof prompt!=="string"||!prompt.trim())throw new Error("Hãy mô tả thao tác cần tạo macro.");
 const s=prompt.trim();
 let m;
 if((m=/^(?:nhập|ghi|điền)\s+(.+?)\s+(?:vào|tại|cho ô)\s+([A-Z]+[1-9]\d*)[.!]?$/i.exec(s))){
  const raw=m[1].trim(),cell=m[2].toUpperCase();let value;
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))value=raw;
  else if(/^(true|false)$/i.test(raw))value=raw.toUpperCase();
  else value=JSON.stringify(raw.replace(/^["']|["']$/g,""));
  return {source:"SET "+cell+" "+value,explanation:"Ghi một giá trị vào ô "+cell+".",commands:1};
 }
 if((m=/^(?:xóa|làm trống)\s+(?:ô\s+)?([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)[.!]?$/i.exec(s)))return {source:"CLEAR "+m[1].toUpperCase(),explanation:"Xóa nội dung vùng "+m[1].toUpperCase()+".",commands:1};
 if((m=/^(?:tính\s+)?(?:tổng|sum)\s+(?:vùng\s+)?([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)\s+(?:vào|ghi\s+vào|tại)\s+([A-Z]+[1-9]\d*)[.!]?$/i.exec(s)))return {source:"SUM "+m[1].toUpperCase()+" "+m[2].toUpperCase(),explanation:"Tính tổng vùng "+m[1].toUpperCase()+" và ghi kết quả vào "+m[2].toUpperCase()+".",commands:1};
 if((m=/^(?:sao chép|chép)\s+([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)\s+(?:sang|đến|vào)\s+([A-Z]+[1-9]\d*)[.!]?$/i.exec(s)))return {source:"COPY "+m[1].toUpperCase()+" "+m[2].toUpperCase(),explanation:"Sao chép vùng "+m[1].toUpperCase()+" bắt đầu từ ô "+m[2].toUpperCase()+".",commands:1};
 throw new Error("Chưa hiểu yêu cầu. Hiện hỗ trợ: nhập giá trị vào ô; xóa vùng; tính tổng vùng vào ô; sao chép vùng sang ô. Hãy viết rõ địa chỉ ô.");
}
