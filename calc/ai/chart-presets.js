const KEY="haidat-sght-chart-presets-v1";
const cleanName=v=>String(v??"").trim().slice(0,60);
export function validateChartPreset(input){
 if(!input||typeof input!=="object")throw new TypeError("Mẫu biểu đồ không hợp lệ.");
 const name=cleanName(input.name);if(!name)throw new TypeError("Tên mẫu không được để trống.");
 const config=input.config;if(!config||typeof config!=="object")throw new TypeError("Thiếu cấu hình mẫu.");
 const allowed=["line","scatter","bar","histogram","boxplot","residual","heatmap","contour","errorbar","regression-band","surface3d"];
 if(!allowed.includes(config.type))throw new RangeError("Loại biểu đồ trong mẫu không được hỗ trợ.");
 const fields=["title","x","y","multiY","seriesNames","secondarySeries","seriesColors","seriesStyles","bins","errorMode","contourLevels"];
 const safe={type:config.type};for(const k of fields)if(config[k]!==undefined)safe[k]=String(config[k]).slice(0,500);
 return {name,config:safe,updatedAt:Number.isFinite(input.updatedAt)?input.updatedAt:Date.now()};
}
export class ChartPresetStore{
 constructor(storage=globalThis.localStorage){this.storage=storage;}
 list(){try{const a=JSON.parse(this.storage?.getItem(KEY)||"[]");return Array.isArray(a)?a.map(validateChartPreset):[];}catch{return [];}}
 save(input){const p=validateChartPreset(input),all=this.list(),i=all.findIndex(x=>x.name.toLocaleLowerCase()===p.name.toLocaleLowerCase());if(i>=0)all[i]=p;else if(all.length>=30)throw new RangeError("Thư viện đã đủ 30 mẫu.");else all.push(p);this.storage?.setItem(KEY,JSON.stringify(all));return p;}
 delete(name){const all=this.list().filter(x=>x.name!==name);this.storage?.setItem(KEY,JSON.stringify(all));return all.length;}
 get(name){return this.list().find(x=>x.name===name)||null;}
}
