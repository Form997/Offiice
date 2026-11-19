const DEFAULT_COLORS=["#2563eb","#0f766e","#d97706","#9333ea","#dc2626","#0891b2","#65a30d","#be185d"];
const FORMATS=["auto","integer","decimal1","decimal2","percent"];
export function normalizePivotChartStudio(input={}){
 const source=input&&typeof input==="object"?input:{};
 const colors=Array.isArray(source.colors)?source.colors.filter(isHexColor).slice(0,8):[];
 return {type:["bar","line","donut"].includes(source.type)?source.type:"bar",measureIndex:Number.isInteger(source.measureIndex)&&source.measureIndex>=0?source.measureIndex:0,title:cleanText(source.title,100),xAxisTitle:cleanText(source.xAxisTitle,60),yAxisTitle:cleanText(source.yAxisTitle,60),showLegend:source.showLegend!==false,showLabels:source.showLabels===true,numberFormat:FORMATS.includes(source.numberFormat)?source.numberFormat:"auto",colors:colors.length?colors:DEFAULT_COLORS.slice()};
}
export function isHexColor(value){return typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value);}
export function parsePivotChartColors(value){
 const colors=String(value??"").split(/[;,\s]+/).map(x=>x.trim()).filter(Boolean);
 if(!colors.length)throw new TypeError("Nhập ít nhất một mã màu HEX dạng #RRGGBB.");
 if(colors.length>8)throw new RangeError("Tối đa 8 màu cho một biểu đồ.");
 if(colors.some(x=>!isHexColor(x)))throw new TypeError("Mã màu phải có dạng #RRGGBB.");
 return colors.map(x=>x.toLowerCase());
}
export function formatPivotChartNumber(value,format="auto"){
 const n=Number(value);if(!Number.isFinite(n))return "—";
 const opts={maximumFractionDigits:format==="integer"?0:format==="decimal1"?1:format==="decimal2"?2:format==="percent"?1:3};
 if(format==="percent")return new Intl.NumberFormat("vi-VN",{style:"percent",...opts}).format(n);
 return new Intl.NumberFormat("vi-VN",opts).format(n);
}
function cleanText(value,max){return typeof value==="string"?value.trim().slice(0,max):"";}
export const DEFAULT_PIVOT_CHART_COLORS=DEFAULT_COLORS;
