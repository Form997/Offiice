/** SGHT 18.24 workbook dependency graph. */
const ADDRESS=/^\$?([A-Z]{1,3})\$?([1-9][0-9]*)/i;
const norm=s=>String(s??"").normalize("NFKC").toLocaleLowerCase();
const col=s=>{let n=0;for(const c of s.toUpperCase())n=n*26+c.charCodeAt(0)-64;return n;};
const label=n=>{let s="";while(n>0){s=String.fromCharCode(65+(n-1)%26)+s;n=Math.floor((n-1)/26);}return s;};
const point=s=>{const m=String(s).match(/^\$?([A-Z]{1,3})\$?([1-9][0-9]*)$/i);return m?{r:Number(m[2]),c:col(m[1])}:null;};
function at(src,i){const m=src.slice(i).match(ADDRESS);if(!m)return null;const end=i+m[0].length,prev=src[i-1]||"",next=src[end]||"";if((prev&&/[\p{L}\p{N}_]/u.test(prev))||(next&&/[\p{L}\p{N}_]/u.test(next)))return null;return {text:m[0],end};}
function quoted(src,i){let j=i+1,name="";while(j<src.length){if(src[j]==="'"){if(src[j+1]==="'"){name+="'";j+=2;continue;}return src[j+1]==="!"?{name,end:j+2}:null;}name+=src[j++];}return null;}
function reference(src,i){
 let sheet=null,start=i;
 if(src[i]==="'"){const q=quoted(src,i);if(q){sheet=q.name;start=q.end;}}
 else{let j=i;while(j<src.length&&/[\p{L}\p{N}_.]/u.test(src[j]))j++;if(j>i&&src[j]==="!"){sheet=src.slice(i,j);start=j+1;}}
 const first=at(src,start);
 if(first&&!(sheet===null&&src[first.end]==="(")){let end=first.end,ref=first.text.toUpperCase().replace(/\$/g,"");if(src[end]===":"){const second=at(src,end+1);if(second){ref+=":"+second.text.toUpperCase().replace(/\$/g,"");end=second.end;}}return {sheet,ref,end};}
 if(sheet!==null)return null;
 const local=at(src,i);if(!local||src[local.end]==="(")return null;
 let end=local.end,ref=local.text.toUpperCase().replace(/\$/g,"");if(src[end]===":"){const second=at(src,end+1);if(second){ref+=":"+second.text.toUpperCase().replace(/\$/g,"");end=second.end;}}return {sheet:null,ref,end};
}
export function extractFormulaReferences(formula,currentSheetId,sheets){
 const src=String(formula??"");if(!src.startsWith("="))return [];
 const byName=new Map((sheets||[]).map(s=>[norm(s.name),s.id])),out=[],seen=new Set();let i=1,inString=false;
 while(i<src.length){const ch=src[i];if(ch==='"'){if(inString&&src[i+1]==='"'){i+=2;continue;}inString=!inString;i++;continue;}if(inString){i++;continue;}
  if(ch==="'"||/[\p{L}_$]/u.test(ch)){const r=reference(src,i);if(r){const sheetId=r.sheet===null?currentSheetId:byName.get(norm(r.sheet));if(sheetId!==undefined){const key=sheetId+"!"+r.ref;if(!seen.has(key)){seen.add(key);out.push({sheetId,ref:r.ref});}}i=r.end;continue;}}i++;
 }
 return out;
}
function expand(ref,limit=100000){const [aText,bText]=ref.split(":"),a=point(aText),b=point(bText||aText);if(!a||!b)return [];const count=(Math.abs(b.r-a.r)+1)*(Math.abs(b.c-a.c)+1);if(!Number.isSafeInteger(count)||count>limit)return [];const out=[];for(let r=Math.min(a.r,b.r);r<=Math.max(a.r,b.r);r++)for(let c=Math.min(a.c,b.c);c<=Math.max(a.c,b.c);c++)out.push(label(c)+r);return out;}
export function buildDependencyGraph(sheets){
 const g={dependencies:new Map(),dependents:new Map(),formulaNodes:new Set(),unresolved:[]},list=Array.isArray(sheets)?sheets:[],ids=new Set(list.map(s=>s.id));
 for(const sheet of list)for(const [address,value] of Object.entries(sheet.cells||{})){if(typeof value!=="string"||!value.startsWith("="))continue;const node=sheet.id+"!"+address.toUpperCase(),deps=new Set();g.formulaNodes.add(node);
  for(const ref of extractFormulaReferences(value,sheet.id,list)){if(!ids.has(ref.sheetId)){g.unresolved.push({node,ref});continue;}const cells=expand(ref.ref);if(!cells.length){g.unresolved.push({node,ref,reason:"range-limit-or-invalid"});continue;}for(const cell of cells)deps.add(ref.sheetId+"!"+cell);}
  g.dependencies.set(node,deps);for(const dep of deps){if(!g.dependents.has(dep))g.dependents.set(dep,new Set());g.dependents.get(dep).add(node);}
 }return g;
}
export function updateDependencyNode(g,sheets,sheetId,address){
 const node=sheetId+"!"+String(address).toUpperCase();for(const dep of g.dependencies.get(node)||[]){const set=g.dependents.get(dep);if(set){set.delete(node);if(!set.size)g.dependents.delete(dep);}}
 g.dependencies.delete(node);g.formulaNodes.delete(node);g.unresolved=g.unresolved.filter(x=>x.node!==node);
 const sheet=(sheets||[]).find(s=>s.id===sheetId),value=sheet?.cells?.[address];
 if(typeof value==="string"&&value.startsWith("=")){g.formulaNodes.add(node);const deps=new Set(),ids=new Set((sheets||[]).map(s=>s.id));for(const ref of extractFormulaReferences(value,sheetId,sheets)){if(!ids.has(ref.sheetId)){g.unresolved.push({node,ref});continue;}const cells=expand(ref.ref);if(!cells.length){g.unresolved.push({node,ref,reason:"range-limit-or-invalid"});continue;}for(const cell of cells)deps.add(ref.sheetId+"!"+cell);}g.dependencies.set(node,deps);for(const dep of deps){if(!g.dependents.has(dep))g.dependents.set(dep,new Set());g.dependents.get(dep).add(node);}}
 return g;
}
export function invalidateDependents(g,changed){const out=new Set(),queue=[...(changed||[])];while(queue.length){const node=queue.shift();if(out.has(node))continue;out.add(node);for(const next of g?.dependents?.get(node)||[])if(!out.has(next))queue.push(next);}return out;}
export function planRecalculation(g,changed){
 const affected=invalidateDependents(g,changed),indegree=new Map();for(const n of affected){let count=0;for(const d of g.dependencies.get(n)||[])if(affected.has(d))count++;indegree.set(n,count);}
 const ready=[...indegree].filter(([,n])=>n===0).map(([k])=>k).sort(),order=[];while(ready.length){const n=ready.shift();order.push(n);for(const d of g.dependents.get(n)||[]){if(!indegree.has(d))continue;const v=indegree.get(d)-1;indegree.set(d,v);if(v===0){ready.push(d);ready.sort();}}}
 const idx=new Map(),low=new Map(),stack=[],on=new Set(),cycles=new Set();let seq=0;
 const visit=n=>{idx.set(n,seq);low.set(n,seq++);stack.push(n);on.add(n);for(const d of g.dependencies.get(n)||[]){if(!affected.has(d))continue;if(!idx.has(d)){visit(d);low.set(n,Math.min(low.get(n),low.get(d)));}else if(on.has(d))low.set(n,Math.min(low.get(n),idx.get(d)));}if(low.get(n)===idx.get(n)){const group=[];let x;do{x=stack.pop();on.delete(x);group.push(x);}while(x!==n);if(group.length>1||(g.dependencies.get(n)||new Set()).has(n))for(const x of group)cycles.add(x);}};
 for(const n of affected)if(!idx.has(n))visit(n);
 return {affected,order,cycles:[...cycles].sort(),blocked:[...affected].filter(n=>!order.includes(n)&&!cycles.has(n)).sort()};
}
export function dependencyGraphStats(g){return {formulaCount:g?.formulaNodes?.size||0,dependencyCount:[...(g?.dependencies?.values()||[])].reduce((n,s)=>n+s.size,0),unresolvedCount:g?.unresolved?.length||0};}
