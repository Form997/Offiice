function parseAddress(address){const m=/^([A-Z]+)([1-9][0-9]*)$/i.exec(String(address||""));if(!m)return null;let c=0;for(const ch of m[1].toUpperCase())c=c*26+ch.charCodeAt(0)-64;return{row:Number(m[2]),column:c};}
function cellKey(row,column){let s="",n=column;while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s+row;}
function boundsOf(b){if(!b||![b.startRow,b.endRow,b.startCol,b.endCol].every(Number.isInteger)||b.startRow<1||b.startCol<1||b.endRow<b.startRow||b.endCol<b.startCol)throw new TypeError("Vùng dữ liệu không hợp lệ.");return b;}
function valueFor(cells,row,col){return String(cells[cellKey(row,col)]??"");}
function compareValues(a,b,type){
 const emptyA=a==="",emptyB=b==="";if(emptyA||emptyB)return emptyA===emptyB?0:emptyA?1:-1;
 if(type==="number"||(type==="auto"&&Number.isFinite(Number(a))&&Number.isFinite(Number(b)))){const x=Number(a),y=Number(b);if(Number.isFinite(x)&&Number.isFinite(y))return x-y;if(type==="number")return Number.isFinite(x)?-1:Number.isFinite(y)?1:0;}
 return a.localeCompare(b,"vi",{numeric:true,sensitivity:"base"});
}
export function sortRangeRows(cells,formats,bounds,options={}){
 const b=boundsOf(bounds),keyColumn=options.keyColumn,direction=options.direction==="desc"?-1:1,type=options.type||"auto";
 if(!Number.isInteger(keyColumn)||keyColumn<b.startCol||keyColumn>b.endCol)throw new RangeError("Cột khóa nằm ngoài vùng sắp xếp.");
 if(!["auto","text","number"].includes(type))throw new RangeError("Kiểu sắp xếp không hợp lệ.");
 const rows=[];for(let row=b.startRow+1;row<=b.endRow;row++){const values=[],styles=[];for(let col=b.startCol;col<=b.endCol;col++){const key=cellKey(row,col);values.push(cells[key]);styles.push(formats[key]);}rows.push({row,key:valueFor(cells,row,keyColumn),values,styles,order:row});}
 rows.sort((a,b)=>{const emptyA=a.key==="",emptyB=b.key==="";const compared=compareValues(a.key,b.key,type);return (emptyA||emptyB?compared:compared*direction)||a.order-b.order;});
 const next={...cells},nextFormats={...formats};for(let i=0;i<rows.length;i++)for(let col=b.startCol;col<=b.endCol;col++){const key=cellKey(b.startRow+1+i,col),idx=col-b.startCol,v=rows[i].values[idx],f=rows[i].styles[idx];if(v===undefined)delete next[key];else next[key]=v;if(f===undefined)delete nextFormats[key];else nextFormats[key]=f;}
 return{cells:next,formats:nextFormats,changed:rows.some((r,i)=>r.row!==b.startRow+1+i),rowCount:rows.length};
}
function parseFilterDate(value){
 const s=String(value??"").trim();
 let parts;
 if(s.includes("-")){parts=s.split("-").map(Number);if(parts.length!==3)return null;}
 else if(s.includes("/")){const p=s.split("/").map(Number);if(p.length!==3)return null;parts=[p[2],p[1],p[0]];}
 else return null;
 const [y,mo,d]=parts;if(!Number.isInteger(y)||!Number.isInteger(mo)||!Number.isInteger(d))return null;
 const t=Date.UTC(y,mo-1,d),x=new Date(t);
 return x.getUTCFullYear()===y&&x.getUTCMonth()===mo-1&&x.getUTCDate()===d?t:null;
}
function matchesRule(value,rule){
 const text=String(value??""),target=String(rule.value??"");
 switch(rule.operator){case"equals":return text.toLocaleLowerCase()===target.toLocaleLowerCase();case"notEquals":return text.toLocaleLowerCase()!==target.toLocaleLowerCase();case"contains":return text.toLocaleLowerCase().includes(target.toLocaleLowerCase());case"greater":return text!==""&&Number.isFinite(Number(text))&&Number(text)>Number(target);case"less":return text!==""&&Number.isFinite(Number(text))&&Number(text)<Number(target);case"greaterOrEqual":return text!==""&&Number.isFinite(Number(text))&&Number(text)>=Number(target);case"lessOrEqual":return text!==""&&Number.isFinite(Number(text))&&Number(text)<=Number(target);case"between":{const n=Number(text),lo=Number(rule.min),hi=Number(rule.max);return text!==""&&Number.isFinite(n)&&Number.isFinite(lo)&&Number.isFinite(hi)&&n>=Math.min(lo,hi)&&n<=Math.max(lo,hi);}case"startsWith":return text.toLocaleLowerCase().startsWith(target.toLocaleLowerCase());case"endsWith":return text.toLocaleLowerCase().endsWith(target.toLocaleLowerCase());case"notContains":return !text.toLocaleLowerCase().includes(target.toLocaleLowerCase());case"dateBefore":{const d=parseFilterDate(text),t=parseFilterDate(target);return d!==null&&t!==null&&d<t;}case"dateAfter":{const d=parseFilterDate(text),t=parseFilterDate(target);return d!==null&&t!==null&&d>t;}case"dateBetween":{const d=parseFilterDate(text),lo=parseFilterDate(rule.min),hi=parseFilterDate(rule.max);return d!==null&&lo!==null&&hi!==null&&d>=Math.min(lo,hi)&&d<=Math.max(lo,hi);}case"empty":return text==="";case"notEmpty":return text!=="";default:return true;}
}
export function filterRangeRows(cells,formats,bounds,options={}){
 const b=boundsOf(bounds),rules=options.rules||[],join=options.join==="or"?"or":"and",color=options.fillColor?.toLowerCase()||null;
 if(rules.some(r=>!Number.isInteger(r.column)||r.column<b.startCol||r.column>b.endCol))throw new RangeError("Cột điều kiện nằm ngoài vùng lọc.");
 const allowed=options.allowedValues||{};const hiddenRows=[];let visibleRows=0,totalRows=Math.max(0,b.endRow-b.startRow);
 for(let row=b.startRow+1;row<=b.endRow;row++){
  const rulePass=rules.length===0?true:join==="and"?rules.every(rule=>matchesRule(valueFor(cells,row,rule.column),rule)):rules.some(rule=>matchesRule(valueFor(cells,row,rule.column),rule));
  const valuePass=Object.entries(allowed).every(([column,values])=>!Array.isArray(values)||values.includes(valueFor(cells,row,Number(column))));
  const colorPass=!color||Array.from({length:b.endCol-b.startCol+1},(_,i)=>formats[cellKey(row,b.startCol+i)]?.background?.toLowerCase()).includes(color);
  if(rulePass&&valuePass&&colorPass)visibleRows++;else hiddenRows.push(row);
 }
 return{hiddenRows,visibleRows,totalRows};
}
export function removeDuplicateRows(cells,formats,bounds){
 const b=boundsOf(bounds),seen=new Set(),duplicates=[];
 for(let row=b.startRow+1;row<=b.endRow;row++){
  const signature=JSON.stringify(Array.from({length:b.endCol-b.startCol+1},(_,i)=>String(cells[cellKey(row,b.startCol+i)]??"").normalize("NFC")));
  if(seen.has(signature))duplicates.push(row);else seen.add(signature);
 }
 const next={...cells},nextFormats={...formats},keep=[];
 for(let row=b.startRow+1;row<=b.endRow;row++)if(!duplicates.includes(row)){const values=[],styles=[];for(let col=b.startCol;col<=b.endCol;col++){const k=cellKey(row,col);values.push(cells[k]);styles.push(formats[k]);}keep.push({values,styles});}
 for(let i=0;i<b.endRow-b.startRow;i++)for(let col=b.startCol;col<=b.endCol;col++){const k=cellKey(b.startRow+1+i,col),idx=col-b.startCol,v=keep[i]?.values[idx],f=keep[i]?.styles[idx];if(v===undefined)delete next[k];else next[k]=v;if(f===undefined)delete nextFormats[k];else nextFormats[k]=f;}
 return{cells:next,formats:nextFormats,removed:duplicates.length,removedRows:duplicates};
}
export function defineStructuredRange(cells,bounds,name){
 const b=boundsOf(bounds),safe=String(name||"").trim();
 if(!/^[A-Za-z_][A-Za-z0-9_]{0,59}$/.test(safe))throw new TypeError("Tên vùng phải bắt đầu bằng chữ hoặc dấu gạch dưới, tối đa 60 ký tự và không có khoảng trắng.");
 if(b.endRow-b.startRow<1)throw new RangeError("Vùng cần ít nhất một hàng tiêu đề và một hàng dữ liệu.");
 const columns=[],used=new Set();
 for(let col=b.startCol;col<=b.endCol;col++){const header=valueFor(cells,b.startRow,col).trim();if(!header)throw new Error("Tiêu đề cột "+col+" đang trống.");const key=header.toLocaleLowerCase();if(used.has(key))throw new Error("Tên cột bị trùng: "+header);used.add(key);columns.push(header);}
 const range=cellKey(b.startRow,b.startCol)+":"+cellKey(b.endRow,b.endCol);
 return{name:safe,range,bounds:{...b},columns,headerRow:b.startRow,createdAt:new Date().toISOString()};
}

export function uniqueColumnValues(cells,bounds,column){
 const b=boundsOf(bounds);if(!Number.isInteger(column)||column<b.startCol||column>b.endCol)throw new RangeError("Cột lấy danh sách giá trị nằm ngoài vùng.");
 const seen=new Map();for(let row=b.startRow+1;row<=b.endRow;row++){const value=valueFor(cells,row,column);if(!seen.has(value))seen.set(value,{value,count:0});seen.get(value).count++;}
 return [...seen.values()].sort((a,b)=>compareValues(a.value,b.value,"auto"));
}
export function summarizeByGroup(cells,bounds,{groupColumn,valueColumn,operation="sum"}={}){
 const b=boundsOf(bounds);for(const c of [groupColumn,valueColumn])if(!Number.isInteger(c)||c<b.startCol||c>b.endCol)throw new RangeError("Cột tổng hợp nằm ngoài vùng.");
 if(!["sum","average","count","min","max"].includes(operation))throw new RangeError("Phép tổng hợp không hợp lệ.");
 const groups=new Map();for(let row=b.startRow+1;row<=b.endRow;row++){const key=valueFor(cells,row,groupColumn);if(!groups.has(key))groups.set(key,[]);const raw=valueFor(cells,row,valueColumn);if(raw.trim()!==""&&Number.isFinite(Number(raw)))groups.get(key).push(Number(raw));}
 return [...groups.entries()].map(([group,values])=>({group,count:values.length,value:!values.length?0:operation==="sum"?values.reduce((a,b)=>a+b,0):operation==="average"?values.reduce((a,b)=>a+b,0)/values.length:operation==="count"?values.length:operation==="min"?Math.min(...values):Math.max(...values)}));
}
export function expandStructuredRange(table,row,column){
 if(!table?.bounds)return table;const b=boundsOf(table.bounds);
 if(row!==b.endRow+1||column<b.startCol||column>b.endCol)return table;
 const nextBounds={...b,endRow:row};return{...table,bounds:nextBounds,range:cellKey(b.startRow,b.startCol)+":"+cellKey(row,b.endCol),updatedAt:new Date().toISOString()};
}
export function structuredColumnRange(tables,reference){
 const match=/^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]$/.exec(String(reference||"").trim());if(!match)return null;
 const table=(tables||[]).find(t=>t.name.toLocaleLowerCase()===match[1].toLocaleLowerCase());if(!table)return null;
 const index=table.columns.findIndex(c=>c.toLocaleLowerCase()===match[2].trim().toLocaleLowerCase());if(index<0)return null;
 const b=boundsOf(table.bounds),column=b.startCol+index,start=b.startRow+1,end=b.endRow;
 if(end<start)return null;return cellKey(start,column)+":"+cellKey(end,column);
}

export function expandStructuredReferences(formula,tables){
 const refs=[];for(const table of tables||[])for(const column of table.columns||[]){const range=structuredColumnRange(tables,table.name+"["+column+"]");if(range)refs.push({source:table.name+"["+column+"]",range});}
 let out="",i=0,quoted=false;
 while(i<formula.length){
  const ch=formula[i];
  if(ch==='"'){out+=ch;if(quoted&&formula[i+1]==='"'){out+='"';i+=2;continue;}quoted=!quoted;i++;continue;}
  if(!quoted){const hit=refs.find(r=>formula.slice(i,i+r.source.length).toLocaleLowerCase()===r.source.toLocaleLowerCase()&&!/[A-Za-z0-9_]/.test(formula[i-1]||"")&&!/[A-Za-z0-9_]/.test(formula[i+r.source.length]||""));if(hit){out+=hit.range;i+=hit.source.length;continue;}}
  out+=ch;i++;
 }
 return out;
}


export function summarizeByGroups(cells,bounds,{groupColumns=[],valueColumn,operation="sum"}={}){
 const b=boundsOf(bounds);
 if(!Array.isArray(groupColumns)||!groupColumns.length||groupColumns.length>5)throw new RangeError("Chọn từ 1 đến 5 cấp nhóm.");
 for(const c of [...groupColumns,valueColumn])if(!Number.isInteger(c)||c<b.startCol||c>b.endCol)throw new RangeError("Cột nhóm hoặc cột số liệu nằm ngoài vùng.");
 if(!["sum","average","count","min","max"].includes(operation))throw new RangeError("Phép tổng hợp không hợp lệ.");
 const numeric=row=>{const raw=valueFor(cells,row,valueColumn);return raw.trim()!==""&&Number.isFinite(Number(raw))?Number(raw):null;};
 const aggregate=rows=>{const vals=rows.map(numeric).filter(v=>v!==null);return{count:vals.length,value:!vals.length?0:operation==="sum"?vals.reduce((a,v)=>a+v,0):operation==="average"?vals.reduce((a,v)=>a+v,0)/vals.length:operation==="count"?vals.length:operation==="min"?Math.min(...vals):Math.max(...vals)};};
 const output=[];
 const walk=(rows,level,path)=>{const groups=new Map();for(const row of rows){const key=valueFor(cells,row,groupColumns[level]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}for(const [key,childRows] of [...groups].sort((a,b)=>compareValues(a[0],b[0],"auto"))){const nextPath=[...path,key],summary=aggregate(childRows);output.push({path:nextPath,group:key,depth:level,count:summary.count,value:summary.value,isSubtotal:true});if(level+1<groupColumns.length)walk(childRows,level+1,nextPath);}};
 walk(Array.from({length:b.endRow-b.startRow},(_,i)=>b.startRow+1+i),0,[]);
 return output;
}
export function buildPivotTable(cells,bounds,{rowColumns=[],columnField=null,valueColumn,operation="sum"}={}){
 const b=boundsOf(bounds);
 if(!Array.isArray(rowColumns)||rowColumns.length<1||rowColumns.length>4)throw new RangeError("Pivot cần từ 1 đến 4 trường hàng.");
 for(const c of [...rowColumns,...(columnField?[columnField]:[]),valueColumn])if(!Number.isInteger(c)||c<b.startCol||c>b.endCol)throw new RangeError("Trường Pivot nằm ngoài vùng dữ liệu.");
 if(new Set([...rowColumns,...(columnField?[columnField]:[])]).size!==rowColumns.length+(columnField?1:0))throw new Error("Không dùng trùng một cột cho nhiều trường Pivot.");
 if(!["sum","average","count","min","max"].includes(operation))throw new RangeError("Phép tổng hợp Pivot không hợp lệ.");
 const rowMap=new Map(),colSet=new Set(),all=[];
 for(let row=b.startRow+1;row<=b.endRow;row++){const rowKey=JSON.stringify(rowColumns.map(c=>valueFor(cells,row,c))),colKey=columnField?valueFor(cells,row,columnField):"Tổng",raw=valueFor(cells,row,valueColumn),value=raw.trim()!==""&&Number.isFinite(Number(raw))?Number(raw):null;if(!rowMap.has(rowKey))rowMap.set(rowKey,{labels:rowColumns.map(c=>valueFor(cells,row,c)),values:new Map()});const item=rowMap.get(rowKey);if(!item.values.has(colKey))item.values.set(colKey,[]);if(value!==null)item.values.get(colKey).push(value);colSet.add(colKey);all.push(value);}
 const columns=[...colSet].sort((a,b)=>compareValues(a,b,"auto"));
 const calc=values=>{const v=values||[];return !v.length?0:operation==="sum"?v.reduce((a,x)=>a+x,0):operation==="average"?v.reduce((a,x)=>a+x,0)/v.length:operation==="count"?v.length:operation==="min"?Math.min(...v):Math.max(...v);};
 const rows=[...rowMap.values()].sort((a,b)=>{for(let i=0;i<a.labels.length;i++){const d=compareValues(a.labels[i],b.labels[i],"auto");if(d)return d;}return 0;}).map(item=>({labels:item.labels,values:Object.fromEntries(columns.map(col=>[col,calc(item.values.get(col))])),total:calc([...item.values.values()].flat())}));
 return{rowColumns:rowColumns.slice(),columnField,columns,rows,grandTotal:calc(all),operation,rowCount:rows.length};
}
