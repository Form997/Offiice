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
function matchesRule(value,rule){
 const text=String(value??""),target=String(rule.value??"");
 switch(rule.operator){case"equals":return text.toLocaleLowerCase()===target.toLocaleLowerCase();case"notEquals":return text.toLocaleLowerCase()!==target.toLocaleLowerCase();case"contains":return text.toLocaleLowerCase().includes(target.toLocaleLowerCase());case"greater":return text!==""&&Number.isFinite(Number(text))&&Number(text)>Number(target);case"less":return text!==""&&Number.isFinite(Number(text))&&Number(text)<Number(target);case"empty":return text==="";case"notEmpty":return text!=="";default:return true;}
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
