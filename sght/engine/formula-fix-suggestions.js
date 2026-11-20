/** SGHT 18.29 — conservative, explainable formula repair suggestions. */
function editDistance(a,b){
 const row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}
 return row[b.length];
}
export function suggestFormulaRepairs({formula,errorCode,availableFunctions=[]}={}){
 const source=String(formula||"").trim(),code=String(errorCode||"").toUpperCase();
 if(code!=="#NAME?")return {available:false,reason:"no-safe-rule-for-error",suggestions:[]};
 const match=source.match(/^=\s*([A-Z_][A-Z0-9_.]*)\s*(?=\()/i);
 if(!match)return {available:false,reason:"not-a-function-name-error",suggestions:[]};
 const unknown=match[1].toUpperCase(),names=[...new Set((availableFunctions||[]).map(item=>String(typeof item==="string"?item:item?.name||"").toUpperCase()).filter(Boolean))];
 if(names.includes(unknown))return {available:false,reason:"function-already-supported",suggestions:[]};
 const ranked=names.map(name=>({name,distance:editDistance(unknown,name)})).sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name));
 if(!ranked.length||ranked[0].distance>2)return {available:false,reason:"no-close-supported-function",suggestions:[]};
 if(ranked[1]&&ranked[1].distance===ranked[0].distance)return {available:false,reason:"ambiguous-function-name",suggestions:ranked.filter(x=>x.distance===ranked[0].distance).map(x=>({name:x.name,distance:x.distance}))};
 const best=ranked[0],formulaSuggestion=source.replace(/^(\s*=\s*)[A-Z_][A-Z0-9_.]*/i,(_,prefix)=>prefix+best.name);
 return {available:true,reason:"unique-function-name-match",suggestions:[{kind:"function-name-correction",name:best.name,distance:best.distance,formula:formulaSuggestion,explanation:"Tên hàm chưa được nhận diện; tên đề xuất gần nhất và duy nhất trong danh mục hàm SGHT hiện hỗ trợ."}]};
}
export function validateRepairApproval({currentFormula,expectedFormula,candidateFormula,previewSucceeded=false}={}){
 return Boolean(previewSucceeded)&&String(currentFormula??"")===String(expectedFormula??"")&&typeof candidateFormula==="string"&&candidateFormula.startsWith("=");
}
