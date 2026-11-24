/**
 * SGHT Response Surface — Giai đoạn 10
 * Mô hình bậc hai hai yếu tố, biến mã hóa, tối ưu có chặn trong miền khảo sát.
 * Không phụ thuộc thư viện ngoài; không sửa dữ liệu bảng tính.
 */
const finite = v => typeof v === "number" && Number.isFinite(v);
function numbers(values,label){
 if(!Array.isArray(values)||values.some(v=>v===""||v==null||!finite(Number(v))))throw new TypeError(label+" phải là dãy số đầy đủ.");
 return values.map(Number);
}
function solve(A,b){
 const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){
  let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
  if(Math.abs(M[p][c])<1e-10)throw new RangeError("Thiết kế suy biến hoặc đa cộng tuyến hoàn hảo; không thể ước lượng mặt đáp ứng.");
  [M[c],M[p]]=[M[p],M[c]];const d=M[c][c];for(let j=c;j<=n;j++)M[c][j]/=d;
  for(let r=0;r<n;r++)if(r!==c){const f=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j];}
 }
 return M.map(r=>r[n]);
}
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
function design(u,v){return [1,u,v,u*u,v*v,u*v];}
function predict(b,u,v){return design(u,v).reduce((s,x,i)=>s+x*b[i],0);}
function unique(a){return [...new Set(a)].sort((x,y)=>x-y);}
function candidatesOnEdge(b,axis,fixed,lo,hi,out){
 const c=axis===0?{a:b[3],q:b[1]+b[5]*fixed,r:b[0]+b[2]*fixed+b[4]*fixed*fixed}:{a:b[4],q:b[2]+b[5]*fixed,r:b[0]+b[1]*fixed+b[3]*fixed*fixed};
 out.push(axis===0?[lo,fixed]:[fixed,lo],axis===0?[hi,fixed]:[fixed,hi]);
 if(Math.abs(c.a)>1e-12){const x=-c.q/(2*c.a);if(x>lo&&x<hi)out.push(axis===0?[x,fixed]:[fixed,x]);}
}
export function fitResponseSurface(x1,x2,y){
 const X1=numbers(x1,"Yếu tố X1"),X2=numbers(x2,"Yếu tố X2"),Y=numbers(y,"Kết quả Y");
 if(X1.length!==X2.length||X1.length!==Y.length)throw new RangeError("Ba vùng X1, X2 và Y phải cùng số dòng.");
 if(Y.length<8)throw new RangeError("Mô hình bậc hai hai yếu tố cần ít nhất 8 quan sát; thiết kế tốt nên có thêm lặp và điểm tâm.");
 const a=unique(X1),b=unique(X2);if(a.length<3||b.length<3)throw new RangeError("Mỗi yếu tố cần ít nhất 3 mức khác nhau.");
 const c1=(a[0]+a[a.length-1])/2,c2=(b[0]+b[b.length-1])/2,s1=(a[a.length-1]-a[0])/2,s2=(b[b.length-1]-b[0])/2;
 if(!(s1>0&&s2>0))throw new RangeError("Hai yếu tố phải có khoảng biến thiên dương.");
 const U=X1.map(v=>(v-c1)/s1),V=X2.map(v=>(v-c2)/s2),Z=U.map((u,i)=>design(u,V[i])),p=6,n=Y.length;
 const xtx=Array.from({length:p},(_,i)=>Array.from({length:p},(_,j)=>Z.reduce((s,r)=>s+r[i]*r[j],0)));
 const xty=Array.from({length:p},(_,i)=>Z.reduce((s,r,k)=>s+r[i]*Y[k],0));
 const beta=solve(xtx,xty),predicted=Z.map(r=>r.reduce((s,v,j)=>s+v*beta[j],0)),residuals=Y.map((v,i)=>v-predicted[i]);
 const sse=residuals.reduce((s,v)=>s+v*v,0),sst=Y.reduce((s,v)=>s+(v-avg(Y))**2,0),df=n-p;
 if(df<=0)throw new RangeError("Không còn bậc tự do phần dư.");
 const mse=sse/df,rmse=Math.sqrt(sse/n),rSquared=sst>0?1-sse/sst:null;
 const aic=n*Math.log(Math.max(sse/n,1e-300))+2*p,aicc=n-p-1>0?aic+2*p*(p+1)/(n-p-1):null;
 const [b0,b1,b2,b11,b22,b12]=beta;
 const det=4*b11*b22-b12*b12;
 let stationary=null,stationaryType="Không xác định";
 if(Math.abs(det)>1e-12){
  const u=(-2*b22*b1+b12*b2)/det,v=(b12*b1-2*b11*b2)/det;
  const eigTrace=2*(b11+b22),disc=Math.sqrt(Math.max(0,(2*b11-2*b22)**2+4*b12*b12));
  stationaryType=det<0?"Yên ngựa":eigTrace<0?"Cực đại":eigTrace>0?"Cực tiểu":"Điểm dừng suy biến";
  stationary={codedX1:u,codedX2:v,x1:c1+s1*u,x2:c2+s2*v,predicted:predict(beta,u,v),type:stationaryType,insideObservedDomain:u>=-1&&u<=1&&v>=-1&&v<=1};
 }
 const points=[];candidatesOnEdge(beta,0,-1,-1,1,points);candidatesOnEdge(beta,0,1,-1,1,points);candidatesOnEdge(beta,1,-1,-1,1,points);candidatesOnEdge(beta,1,1,-1,1,points);
 points.push([-1,-1],[-1,1],[1,-1],[1,1]);
 if(stationary?.insideObservedDomain&&stationaryType==="Cực đại")points.push([stationary.codedX1,stationary.codedX2]);
 const best=points.map(([u,v])=>({codedX1:u,codedX2:v,x1:c1+s1*u,x2:c2+s2*v,predicted:predict(beta,u,v)})).sort((q,r)=>r.predicted-q.predicted)[0];
 const grid=[];for(let i=0;i<=20;i++){const row=[];for(let j=0;j<=20;j++){const u=-1+i/10,v=-1+j/10;row.push({x1:c1+s1*u,x2:c2+s2*v,predicted:predict(beta,u,v)});}grid.push(row);}
 return {model:"quadratic-response-surface",n,p,coefficients:beta,coefficientNames:["b0","b1 · X1","b2 · X2","b11 · X1²","b22 · X2²","b12 · X1×X2"],coding:{centerX1:c1,centerX2:c2,scaleX1:s1,scaleX2:s2},bounds:{x1:[a[0],a.at(-1)],x2:[b[0],b.at(-1)]},predicted,residuals,sse,mse,rmse,rSquared,adjustedRSquared:sst>0?1-(1-rSquared)*(n-1)/df:null,aic,aicc,dfResidual:df,stationaryPoint:stationary,boundedMaximum:best,contourGrid:grid,warning:"Mô hình bậc hai mô tả mặt đáp ứng trong miền khảo sát; tối ưu là giá trị dự báo, không phải khuyến cáo canh tác. Cần thiết kế có điểm tâm/lặp, kiểm tra phần dư và xác nhận thực nghiệm. Không ngoại suy ngoài miền X1–X2 đã quan sát."};
}
