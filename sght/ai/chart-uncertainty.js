/**
 * SGHT Chart Studio — Giai đoạn 12
 * Nội suy đường đồng mức và tóm tắt độ bất định, không phụ thuộc thư viện ngoài.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);
function gridOf(surface){
 if(!Array.isArray(surface)||surface.length<2||surface.some(r=>!Array.isArray(r)||r.length<1))throw new RangeError("Lưới mặt đáp ứng phải có ít nhất 2 hàng.");
 const rows=surface.map(row=>row.map(p=>({x:Number(p.x1??p.x),y:Number(p.x2??p.y),z:Number(p.predicted??p.z)})));
 const cols=rows[0].length;
 if(cols<2||rows.some(r=>r.length!==cols))throw new RangeError("Lưới mặt đáp ứng phải là hình chữ nhật ít nhất 2×2.");
 if(rows.flat().some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw new TypeError("Mọi tọa độ và giá trị dự báo phải hữu hạn.");
 for(let i=1;i<rows.length;i++)if(rows[i].some((p,j)=>p.x!==rows[0][j].x))throw new Error("Tọa độ X phải nhất quán giữa các hàng.");
 for(let i=0;i<rows.length;i++)if(rows[i].some(p=>p.y!==rows[i][0].y))throw new Error("Tọa độ Y phải nhất quán giữa các cột.");
 return rows;
}
export function buildContourData(surface,levelCount=8){
 const g=gridOf(surface),values=g.flat().map(p=>p.z),lo=Math.min(...values),hi=Math.max(...values);
 const n=Math.max(2,Math.min(20,Math.floor(Number(levelCount)||8)));
 if(lo===hi)return {type:"contour",levels:[],range:[lo,hi],segments:[],warning:"Mặt đáp ứng không biến thiên; không có đường đồng mức phân biệt."};
 const levels=Array.from({length:n},(_,i)=>lo+(i+1)*(hi-lo)/(n+1)),segments=[];
 const edges=[[0,1],[1,2],[2,3],[3,0]];
 for(const level of levels){
  for(let r=0;r<g.length-1;r++)for(let c=0;c<g[0].length-1;c++){
   const p=[g[r][c],g[r][c+1],g[r+1][c+1],g[r+1][c]];
   const hits=[];
   for(const [a,b] of edges){const va=p[a].z-level,vb=p[b].z-level;if((va<0&&vb>=0)||(vb<0&&va>=0)){const t=(level-p[a].z)/(p[b].z-p[a].z);hits.push({x:p[a].x+t*(p[b].x-p[a].x),y:p[a].y+t*(p[b].y-p[a].y)});}}
   if(hits.length===2)segments.push({level,a:hits[0],b:hits[1]});
   else if(hits.length===4){segments.push({level,a:hits[0],b:hits[1]},{level,a:hits[2],b:hits[3]});}
  }
 }
 return {type:"contour",levels,range:[lo,hi],segments,warning:"Đường đồng mức được nội suy tuyến tính từng ô lưới từ mặt đáp ứng; độ mịn phụ thuộc mật độ lưới, không phải dữ liệu đo trực tiếp."};
}
function inverseNormal(p){
 const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];
 if(!(p>0&&p<1))throw new RangeError("Xác suất phải nằm giữa 0 và 1.");
 if(p<.02425){const q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
 if(p>1-.02425){const q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
 const q=p-.5,r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}
export function tCritical(level=.95,df=30){
 if(!(level>.5&&level<1)||!(df>0))throw new RangeError("Mức tin cậy hoặc bậc tự do không hợp lệ.");
 const z=inverseNormal((1+level)/2),v=1/df;
 return z+(z**3+z)*v/4+(5*z**5+16*z**3+3*z)*v*v/96+(3*z**7+19*z**5+17*z**3-15*z)*v**3/384;
}
export function summarizeErrorBars(groups,mode="ci95"){
 if(!Array.isArray(groups)||!groups.length)throw new RangeError("Cần ít nhất một nhóm dữ liệu.");
 if(!["sd","se","ci95"].includes(mode))throw new RangeError("Chọn SD, SE hoặc CI95.");
 return {type:"errorbar",mode,groups:groups.map(g=>{
  if(!Array.isArray(g.values)||g.values.length<2||g.values.some(v=>!Number.isFinite(Number(v))))throw new RangeError("Mỗi nhóm cần ít nhất hai quan sát số hợp lệ.");
  const a=g.values.map(Number),n=a.length,mean=a.reduce((s,v)=>s+v,0)/n,sd=Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/(n-1)),se=sd/Math.sqrt(n),half=mode==="sd"?sd:mode==="se"?se:tCritical(.95,n-1)*se;
  return {name:String(g.name),n,mean,sd,se,lower:mean-half,upper:mean+half,halfWidth:half};
 })};
}
export function regressionUncertainty(x,y,points=50,level=.95){
 if(!Array.isArray(x)||!Array.isArray(y)||x.length!==y.length||x.length<3||x.some(v=>!Number.isFinite(Number(v)))||y.some(v=>!Number.isFinite(Number(v))))throw new RangeError("Hồi quy cần ít nhất 3 cặp X/Y số hợp lệ.");
 const X=x.map(Number),Y=y.map(Number),n=X.length,mx=X.reduce((s,v)=>s+v,0)/n,my=Y.reduce((s,v)=>s+v,0)/n,Sxx=X.reduce((s,v)=>s+(v-mx)**2,0);
 if(Sxx<=0)throw new RangeError("X không biến thiên.");
 const slope=X.reduce((s,v,i)=>s+(v-mx)*(Y[i]-my),0)/Sxx,intercept=my-slope*mx,res=Y.map((v,i)=>v-intercept-slope*X[i]),mse=res.reduce((s,v)=>s+v*v,0)/(n-2),t=tCritical(level,n-2),count=Math.max(10,Math.min(200,Math.floor(points)||50)),min=Math.min(...X),max=Math.max(...X);
 return {type:"regression-band",level,n,intercept,slope,points:Array.from({length:count},(_,i)=>{const xv=min+(max-min)*i/(count-1),fit=intercept+slope*xv,seMean=Math.sqrt(mse*(1/n+(xv-mx)**2/Sxx)),sePred=Math.sqrt(mse*(1+1/n+(xv-mx)**2/Sxx));return {x:xv,fit,meanLower:fit-t*seMean,meanUpper:fit+t*seMean,predLower:fit-t*sePred,predUpper:fit+t*sePred};}),warning:"Dải trung bình là CI cho đường hồi quy; dải dự đoán dành cho một quan sát cá thể. Giả định OLS và mức tin cậy phải phù hợp."};
}
