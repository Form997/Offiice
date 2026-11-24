import { normalizePivotChartStudio } from "./pivot-chart-studio.js";
const MAX_CHARTS=20, cleanName=value=>String(value??"").trim().replace(/\s+/g," ").slice(0,60);
function nextId(charts){let n=1;const used=new Set(charts.map(x=>x.id));while(used.has("pivot-chart-"+n))n++;return "pivot-chart-"+n;}
export function normalizePivotCharts(input,legacySettings={}){
 const source=Array.isArray(input)?input:[],seen=new Set(),charts=[];
 for(const item of source.slice(0,MAX_CHARTS)){if(!item||typeof item!=="object")continue;let id=typeof item.id==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(item.id)?item.id:nextId(charts);if(seen.has(id))id=nextId(charts);seen.add(id);charts.push({id,name:cleanName(item.name)||("Biểu đồ "+(charts.length+1)),settings:normalizePivotChartStudio(item.settings||{})});}
 if(!charts.length)charts.push({id:"pivot-chart-1",name:"Biểu đồ Pivot 1",settings:normalizePivotChartStudio(legacySettings)});
 return charts;
}
export function createPivotChart(charts,name="Biểu đồ mới",settings={}){
 const list=normalizePivotCharts(charts);if(list.length>=MAX_CHARTS)throw new RangeError("Tối đa 20 biểu đồ trong một Pivot.");const clean=cleanName(name)||("Biểu đồ "+(list.length+1));if(list.some(x=>x.name.toLocaleLowerCase()===clean.toLocaleLowerCase()))throw new RangeError("Tên biểu đồ đã tồn tại.");const chart={id:nextId(list),name:clean,settings:normalizePivotChartStudio(settings)};return [...list,chart];
}
export function duplicatePivotChart(charts,id){
 const list=normalizePivotCharts(charts),source=list.find(x=>x.id===id);if(!source)throw new RangeError("Không tìm thấy biểu đồ cần nhân bản.");if(list.length>=MAX_CHARTS)throw new RangeError("Tối đa 20 biểu đồ trong một Pivot.");let name=source.name+" - Bản sao",n=2;while(list.some(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))name=source.name+" - Bản sao "+n++;return [...list,{id:nextId(list),name,settings:normalizePivotChartStudio(source.settings)}];
}
export function renamePivotChart(charts,id,name){
 const list=normalizePivotCharts(charts),clean=cleanName(name);if(!clean)throw new TypeError("Tên biểu đồ không được để trống.");if(list.some(x=>x.id!==id&&x.name.toLocaleLowerCase()===clean.toLocaleLowerCase()))throw new RangeError("Tên biểu đồ đã tồn tại.");let found=false;const next=list.map(x=>x.id===id?(found=true,{...x,name:clean}):x);if(!found)throw new RangeError("Không tìm thấy biểu đồ.");return next;
}
export function removePivotChart(charts,id){
 const list=normalizePivotCharts(charts);if(list.length<=1)throw new RangeError("Phải giữ lại ít nhất một biểu đồ.");if(!list.some(x=>x.id===id))throw new RangeError("Không tìm thấy biểu đồ.");return list.filter(x=>x.id!==id);
}
export function movePivotChart(charts,id,direction){
 const list=normalizePivotCharts(charts),index=list.findIndex(x=>x.id===id);if(index<0)throw new RangeError("Không tìm thấy biểu đồ.");const target=index+(direction<0?-1:1);if(target<0||target>=list.length)return list;const next=list.slice();[next[index],next[target]]=[next[target],next[index]];return next;
}
export function updatePivotChartSettings(charts,id,settings){
 const list=normalizePivotCharts(charts);if(!list.some(x=>x.id===id))throw new RangeError("Không tìm thấy biểu đồ.");return list.map(x=>x.id===id?{...x,settings:normalizePivotChartStudio(settings)}:x);
}
export function getActivePivotChart(charts,id){const list=normalizePivotCharts(charts);return list.find(x=>x.id===id)||list[0];}
export const MAX_PIVOT_CHARTS=MAX_CHARTS;
