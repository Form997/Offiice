const cleanName=value=>String(value??"").trim().replace(/\s+/g," ").slice(0,80);
const clone=value=>JSON.parse(JSON.stringify(value??{}));
function safeSheet(x,i){const id=typeof x?.id==="string"&&/^[\w-]{1,64}$/.test(x.id)?x.id:"sheet-"+(i+1);return{id,name:cleanName(x?.name)||"Trang tính "+(i+1),cells:x?.cells&&typeof x.cells==="object"?clone(x.cells):{},formats:x?.formats&&typeof x.formats==="object"?clone(x.formats):{},freeze:clone(x?.freeze||{rows:0,columns:0}),split:clone(x?.split||{mode:"none"}),dataTables:Array.isArray(x?.dataTables)?clone(x.dataTables):[],pivotConfig:x?.pivotConfig&&typeof x.pivotConfig==="object"?clone(x.pivotConfig):null,pivotCharts:Array.isArray(x?.pivotCharts)?clone(x.pivotCharts):[],activePivotChartId:typeof x?.activePivotChartId==="string"?x.activePivotChartId:null,pivotChart:clone(x?.pivotChart||{}),history:clone(x?.history||{undo:[],redo:[]})};}
export function normalizeWorkbookSheets(input){const source=Array.isArray(input)?input:[],seen=new Set(),sheets=[];for(let i=0;i<source.length;i++){const sheet=safeSheet(source[i],i);let id=sheet.id,n=1;while(seen.has(id))id="sheet-"+(++n);seen.add(id);sheet.id=id;sheets.push(sheet);}if(!sheets.length)sheets.push(safeSheet({},0));return sheets.slice(0,100);}
export function addWorkbookSheet(input,name="Trang tính mới"){const sheets=normalizeWorkbookSheets(input);if(sheets.length>=100)throw new RangeError("Một workbook tối đa 100 trang tính.");let n=sheets.length+1,id="sheet-"+n;while(sheets.some(x=>x.id===id))id="sheet-"+(++n);return [...sheets,safeSheet({id,name},sheets.length)];}
export function renameWorkbookSheet(input,id,name){const title=cleanName(name);if(!title)throw new TypeError("Tên trang tính không được để trống.");const sheets=Array.isArray(input)?input:normalizeWorkbookSheets(input);if(sheets.some(x=>x.id!==id&&x.name.toLocaleLowerCase()===title.toLocaleLowerCase()))throw new RangeError("Tên trang tính đã được dùng.");return sheets.map(x=>x.id===id?{...x,name:title}:x);}
export function removeWorkbookSheet(input,id){const sheets=normalizeWorkbookSheets(input);if(sheets.length<=1)throw new RangeError("Workbook phải còn ít nhất một trang tính.");if(!sheets.some(x=>x.id===id))return sheets;return sheets.filter(x=>x.id!==id);}
export function rewriteWorkbookSheetReferences(input,oldName,newName){
 const oldTitle=String(oldName??"").trim(),newTitle=String(newName??"").trim();
 if(!oldTitle||!newTitle||oldTitle===newTitle)return Array.isArray(input)?input:normalizeWorkbookSheets(input);
 const escape=value=>Array.from(value,ch=>[46,42,43,63,94,36,123,125,40,41,124,91,93,92].includes(ch.charCodeAt(0))?"\\"+ch:ch).join("");
 const quotedOld="'"+oldTitle.replace(/'/g,"''")+"'!";
 const quotedNext="'"+newTitle.replace(/'/g,"''")+"'!";
 const quotedPattern=new RegExp(escape(quotedOld),"giu");
 const plainPattern=/^[\p{L}_][\p{L}\p{N}_.]*$/u.test(oldTitle)?new RegExp("(^|[^\\p{L}\\p{N}_.])"+escape(oldTitle)+"!","giu"):null;
 return (Array.isArray(input)?input:normalizeWorkbookSheets(input)).map(sheet=>{
  let changed=false;const cells={...(sheet.cells||{})};
  for(const [address,value] of Object.entries(cells)){
   if(typeof value!=="string"||!value.startsWith("="))continue;
   let next=value.replace(quotedPattern,quotedNext);
   if(plainPattern)next=next.replace(plainPattern,(_,prefix)=>prefix+quotedNext);
   if(next!==value){cells[address]=next;changed=true;}
  }
  return changed?{...sheet,cells}:sheet;
 });
}
export function updateWorkbookSheet(input,id,patch){");
 const quotedOld="'"+oldTitle.replace(/'/g,"''")+"'"+"!";
 const quotedNext="'"+newTitle.replace(/'/g,"''")+"'"+"!";
 const quotedPattern=new RegExp(escape(quotedOld),"giu");
 const plainPattern=/^[\p{L}_][\p{L}\p{N}_.]*$/u.test(oldTitle)?new RegExp("(^|[^\\p{L}\\p{N}_.])"+escape(oldTitle)+"!","giu"):null;
 return (Array.isArray(input)?input:normalizeWorkbookSheets(input)).map(sheet=>{
  let changed=false;const cells={...(sheet.cells||{})};
  for(const [address,value] of Object.entries(cells)){
   if(typeof value!=="string"||!value.startsWith("="))continue;
   let next=value.replace(quotedPattern,quotedNext);
   if(plainPattern)next=next.replace(plainPattern,(_,prefix)=>prefix+quotedNext);
   if(next!==value){cells[address]=next;changed=true;}
  }
  return changed?{...sheet,cells}:sheet;
 });
}
export function updateWorkbookSheet(input,id,patch){const sheets=Array.isArray(input)?input:normalizeWorkbookSheets(input);return sheets.map(x=>x.id===id?{...x,...patch,id}:x);}
export function getWorkbookSheet(input,id){return(Array.isArray(input)?input:[]).find(x=>x.id===id)||null;}
export function workbookFieldKey(header,occurrence=1){const label=String(header??"").trim().normalize("NFKC").toLocaleLowerCase().replace(/\s+/g," ");return "field:"+encodeURIComponent(label||"(blank)")+":"+occurrence;}
export function findWorkbookFieldColumn(cells,bounds,fieldKey){if(!bounds||typeof fieldKey!=="string")return null;const counts=new Map();for(let c=bounds.startCol;c<=bounds.endCol;c++){const raw=String(cells[lettersFor(c)+bounds.startRow]??"").trim().normalize("NFKC").toLocaleLowerCase().replace(/\s+/g," "),count=(counts.get(raw)||0)+1;counts.set(raw,count);if(workbookFieldKey(raw,count)===fieldKey)return c;}return null;}
function lettersFor(n){let s="";while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
