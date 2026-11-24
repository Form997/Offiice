import { getRangeBounds } from "./cell-format.js";
const colNum=s=>{let n=0;for(const c of s.toUpperCase())n=n*26+c.charCodeAt(0)-64;return n;};
const colName=n=>{let s="";while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;};
const addr=(r,c)=>colName(c)+r;
export function translateFormulaReferences(formula,rowDelta=0,colDelta=0){
 if(typeof formula!=="string"||!formula.startsWith("="))return formula;
 let out="",quoted=false;
 for(let i=0;i<formula.length;){
  const ch=formula[i];
  if(ch==='"'){out+=ch;if(quoted&&formula[i+1]==='"'){out+='"';i+=2;continue;}quoted=!quoted;i++;continue;}
  if(quoted){out+=ch;i++;continue;}
  const m=/^(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)/i.exec(formula.slice(i));
  if(m){
   const before=i?formula[i-1]:"",after=formula[i+m[0].length]||"";
   if(!/[A-Z0-9_.]/i.test(before)&&!/[A-Z0-9_]/i.test(after)&&!(/^\s*\(/.test(formula.slice(i+m[0].length)))){
    const c=colNum(m[2])+(m[1]?0:colDelta),r=Number(m[4])+(m[3]?0:rowDelta);
    out+=c<1||r<1?"#REF!":m[1]+colName(c)+m[3]+r;i+=m[0].length;continue;
   }
  }
  out+=ch;i++;
 }
 return out;
}
export function fillRange(cells={},formats={},sourceBounds,targetBounds,options={}){
 const s=getRangeBounds(sourceBounds.start,sourceBounds.end),t=getRangeBounds(targetBounds.start,targetBounds.end);
 const limit=Number.isInteger(options.maxCells)?options.maxCells:100000;
 const count=(t.endRow-t.startRow+1)*(t.endCol-t.startCol+1);
 if(count>limit)throw new Error("Vùng điền vượt giới hạn "+limit+" ô.");
 if(t.startRow>s.startRow||t.startCol>s.startCol||t.endRow<s.endRow||t.endCol<s.endCol)throw new Error("Vùng đích phải bao trùm toàn bộ vùng nguồn.");
 const h=s.endRow-s.startRow+1,w=s.endCol-s.startCol+1;
 const vertical=(t.startRow!==s.startRow||t.endRow!==s.endRow)&&t.startCol===s.startCol&&t.endCol===s.endCol;
 const horizontal=(t.startCol!==s.startCol||t.endCol!==s.endCol)&&t.startRow===s.startRow&&t.endRow===s.endRow;
 const vSeries=vertical&&w===1&&h>1&&Array.from({length:h},(_,i)=>Number(cells[addr(s.startRow+i,s.startCol)])).every(Number.isFinite);
 const hSeries=horizontal&&h===1&&w>1&&Array.from({length:w},(_,i)=>Number(cells[addr(s.startRow,s.startCol+i)])).every(Number.isFinite);
 const nextCells={...cells},nextFormats={...formats};let changed=0;
 for(let r=t.startRow;r<=t.endRow;r++)for(let c=t.startCol;c<=t.endCol;c++){
  if(r>=s.startRow&&r<=s.endRow&&c>=s.startCol&&c<=s.endCol)continue;
  const sr=s.startRow+(((r-s.startRow)%h)+h)%h,sc=s.startCol+(((c-s.startCol)%w)+w)%w,src=addr(sr,sc),dst=addr(r,c);
  let value=Object.hasOwn(cells,src)?String(cells[src]):"";
  if(value.startsWith("="))value=translateFormulaReferences(value,r-sr,c-sc);
  else if(vSeries&&c===s.startCol){
   if(r<s.startRow){const a=Number(cells[addr(s.startRow,s.startCol)]),b=Number(cells[addr(s.startRow+1,s.startCol)]);value=String(a-(b-a)*(s.startRow-r));}
   else{const a=Number(cells[addr(s.endRow-1,s.startCol)]),b=Number(cells[addr(s.endRow,s.startCol)]);value=String(b+(b-a)*(r-s.endRow));}
  }else if(hSeries&&r===s.startRow){
   if(c<s.startCol){const a=Number(cells[addr(s.startRow,s.startCol)]),b=Number(cells[addr(s.startRow,s.startCol+1)]);value=String(a-(b-a)*(s.startCol-c));}
   else{const a=Number(cells[addr(s.startRow,s.endCol-1)]),b=Number(cells[addr(s.startRow,s.endCol)]);value=String(b+(b-a)*(c-s.endCol));}
  }
  if(value==="")delete nextCells[dst];else nextCells[dst]=value;
  if(formats[src]&&typeof formats[src]==="object")nextFormats[dst]={...formats[src]};else delete nextFormats[dst];
  changed++;
 }
 return {cells:nextCells,formats:nextFormats,changed,range:{start:addr(t.startRow,t.startCol),end:addr(t.endRow,t.endCol)}};
}
