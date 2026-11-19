/**
 * SGHT Chart Studio — Giai đoạn 11
 * Chuẩn hóa dữ liệu biểu đồ; không phụ thuộc thư viện ngoài.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);
function numeric(values,label="Dữ liệu"){
 if(!Array.isArray(values)||!values.length||values.some(v=>v===""||v==null||!finite(Number(v))))throw new TypeError(label+" phải là dãy số đầy đủ, hữu hạn.");
 return values.map(Number);
}
export function buildChartData(type,{x=[],y=[],labels=[],groups=[],surface=null,bins=10}={}){
 if(type==="histogram"){
  const values=numeric(y,"Dữ liệu Y");const count=Math.max(3,Math.min(40,Math.floor(Number(bins)||10)));
  const min=Math.min(...values),max=Math.max(...values),width=(max-min)/count||1;
  const bars=Array.from({length:count},(_,i)=>({from:min+i*width,to:i===count-1?max:min+(i+1)*width,count:0}));
  values.forEach(v=>{const i=Math.min(count-1,Math.floor((v-min)/width));bars[i].count++;});
  return {type,title:"Histogram · phân bố tần số",bars, n:values.length,mean:values.reduce((s,v)=>s+v,0)/values.length};
 }
 if(type==="boxplot"){
  if(!Array.isArray(groups)||groups.length<1)throw new RangeError("Biểu đồ hộp cần dữ liệu nhóm.");
  const quantile=(a,p)=>{const z=[...a].sort((m,n)=>m-n),h=(z.length-1)*p,i=Math.floor(h);return z[i]+(z[Math.min(i+1,z.length-1)]-z[i])*(h-i);};
  return {type,title:"Box plot · phân bố theo nhóm",groups:groups.map(g=>{const a=numeric(g.values,"Nhóm "+g.name).sort((m,n)=>m-n),q1=quantile(a,.25),med=quantile(a,.5),q3=quantile(a,.75),iqr=q3-q1,lo=q1-1.5*iqr,hi=q3+1.5*iqr;return {name:String(g.name),n:a.length,min:Math.min(...a.filter(v=>v>=lo)),q1,median:med,q3,max:Math.max(...a.filter(v=>v<=hi)),outliers:a.filter(v=>v<lo||v>hi)};})};
 }
 if(type==="heatmap"){
  if(!Array.isArray(surface)||surface.length<2||surface.some(r=>!Array.isArray(r)||r.length<2))throw new RangeError("Bản đồ nhiệt cần lưới ít nhất 2×2.");
  return {type,title:"Bản đồ nhiệt mặt đáp ứng",grid:surface.map(row=>row.map(p=>({x:Number(p.x1),y:Number(p.x2),z:Number(p.predicted)})))};
 }
 if(type==="bar"){
  const values=numeric(y,"Dữ liệu Y");if(labels.length&&labels.length!==values.length)throw new RangeError("Nhãn và Y phải cùng số phần tử.");
  return {type,title:"Biểu đồ cột",points:values.map((v,i)=>({x:i,y:v,label:String(labels[i]??i+1)}))};
 }
 if(type==="residual"){
  const fitted=numeric(x,"Giá trị dự báo"),residuals=numeric(y,"Phần dư");if(fitted.length!==residuals.length)throw new RangeError("Giá trị dự báo và phần dư phải cùng số dòng.");
  return {type,title:"Phần dư theo giá trị dự báo",points:fitted.map((v,i)=>({x:v,y:residuals[i]}))};
 }
 const xx=type==="line"||type==="scatter"?numeric(x,"Dữ liệu X"):null,yy=numeric(y,"Dữ liệu Y");
 if(xx&&xx.length!==yy.length)throw new RangeError("X và Y phải cùng số dòng.");
 if(!["line","scatter"].includes(type))throw new RangeError("Loại biểu đồ chưa được hỗ trợ.");
 return {type,title:type==="line"?"Biểu đồ đường":"Biểu đồ phân tán",points:yy.map((v,i)=>({x:xx[i],y:v}))};
}


/**
 * Chuẩn hóa nhiều chuỗi Y trên cùng hệ trục X.
 * Mỗi chuỗi phải có cùng số quan sát với X; không tự nội suy hay điền thiếu.
 */
export function buildMultiSeriesChart({x=[],series=[],type="line",title="Biểu đồ nhiều chuỗi"}={}){
 if(!["line","scatter"].includes(type))throw new RangeError("Nhiều chuỗi hiện hỗ trợ biểu đồ đường hoặc phân tán.");
 const xx=numeric(x,"Dữ liệu X");
 if(!Array.isArray(series)||series.length<2||series.length>12)throw new RangeError("Cần từ 2 đến 12 chuỗi Y.");
 const normalized=series.map((s,i)=>{
  const values=numeric(s.values,"Chuỗi "+(s.name||i+1));
  if(values.length!==xx.length)throw new RangeError("Mỗi chuỗi Y phải cùng số dòng với X.");
  return {name:String(s.name||("Chuỗi "+(i+1))).slice(0,60),points:values.map((y,j)=>({x:xx[j],y}))};
 });
 return {type,title:String(title||"Biểu đồ nhiều chuỗi"),series:normalized,n:xx.length,warning:"Các chuỗi dùng chung trục X và trục Y. Kiểm tra đơn vị đo và thang đo trước khi so sánh."};
}
