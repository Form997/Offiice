/** SGHT 18.33 — derive formula version events from a workbook history transition. */
const isFormula=value=>typeof value==="string"&&value.trimStart().startsWith("=");
export function collectFormulaVersionChanges(beforeCells={},afterCells={}){
 const before=beforeCells&&typeof beforeCells==="object"?beforeCells:{};
 const after=afterCells&&typeof afterCells==="object"?afterCells:{};
 const keys=new Set([...Object.keys(before),...Object.keys(after)]);
 const changes=[];
 for(const address of keys){
  const prior=Object.hasOwn(before,address)?String(before[address]??""):"";
  const next=Object.hasOwn(after,address)?String(after[address]??""):"";
  if(prior===next||(!isFormula(prior)&&!isFormula(next)))continue;
  changes.push({address,before:prior,after:next});
 }
 return changes.sort((a,b)=>a.address.localeCompare(b.address,undefined,{numeric:true}));
}
