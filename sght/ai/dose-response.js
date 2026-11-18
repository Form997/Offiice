/**
 * SGHT Dose Response — Giai đoạn 9.3
 * Các mô hình đáp ứng liều lượng, tự triển khai, chạy ngoại tuyến.
 */
const finite = x => typeof x === "number" && Number.isFinite(x);
function vector(values, label) {
  if (!Array.isArray(values) || values.some(v => v === "" || v == null || !finite(Number(v))))
    throw new TypeError(label + " phải là dãy số đầy đủ, không có ô trống.");
  return values.map(Number);
}
function mean(a) { return a.reduce((s,v)=>s+v,0)/a.length; }
function solve(A,b) {
  const n=b.length, M=A.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){
    let p=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r;
    if(Math.abs(M[p][c])<1e-11) throw new RangeError("Mô hình không xác định: dữ liệu liều lượng thiếu mức biến thiên.");
    [M[c],M[p]]=[M[p],M[c]];
    const d=M[c][c]; for(let j=c;j<=n;j++) M[c][j]/=d;
    for(let r=0;r<n;r++) if(r!==c){const f=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j];}
  }
  return M.map(r=>r[n]);
}
function ols(X,y) {
  const p=X[0].length;
  if(y.length<=p) throw new RangeError("Cần nhiều quan sát hơn số hệ số của mô hình.");
  const xtx=Array.from({length:p},(_,i)=>Array.from({length:p},(_,j)=>X.reduce((s,r)=>s+r[i]*r[j],0)));
  const xty=Array.from({length:p},(_,i)=>X.reduce((s,r,k)=>s+r[i]*y[k],0));
  const beta=solve(xtx,xty), predicted=X.map(r=>r.reduce((s,v,j)=>s+v*beta[j],0));
  const residuals=y.map((v,i)=>v-predicted[i]), sse=residuals.reduce((s,v)=>s+v*v,0);
  return {beta,predicted,residuals,sse};
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function evaluateModel(X,Y,model,params,description,breakpoint=null) {
  const fit=ols(X,Y), n=Y.length, p=params, sst=Y.reduce((s,v)=>s+(v-mean(Y))**2,0);
  const rSquared=sst===0?null:1-fit.sse/sst, df=n-p, mse=fit.sse/df;
  const aic=n*Math.log(Math.max(fit.sse/n,1e-300))+2*p;
  const aicc=n-p-1>0?aic+2*p*(p+1)/(n-p-1):null;
  return {model,description,n,parameters:fit.beta,breakpoint,predicted:fit.predicted,residuals:fit.residuals,sse:fit.sse,rmse:Math.sqrt(fit.sse/n),rSquared,adjustedRSquared:sst>0?1-(1-rSquared)*(n-1)/df:null,aic,aicc,dfResidual:df};
}
export function fitDoseResponse(doses,y,model="quadratic") {
  const X=vector(doses,"Liều lượng"), Y=vector(y,"Năng suất");
  if(X.length!==Y.length||X.length<5) throw new RangeError("Hai vùng phải cùng số dòng và cần ít nhất 5 quan sát.");
  const unique=[...new Set(X)].sort((a,b)=>a-b);
  if(unique.length<3) throw new RangeError("Cần ít nhất 3 mức liều lượng khác nhau.");
  const min=unique[0],max=unique[unique.length-1], candidates=[];
  if(model==="quadratic") {
    const fit=evaluateModel(X.map(x=>[1,x,x*x]),Y,"quadratic",3,"Bậc hai: Y = a + bD + cD²");
    const [a,b,c]=fit.parameters;
    const stationary=c<0?-b/(2*c):null;
    const optimum=stationary==null?null:clamp(stationary,min,max);
    return {...fit,optimumDose:optimum,optimumYield:optimum==null?null:a+b*optimum+c*optimum*optimum,optimumType:optimum==null?"Không có cực đại nội tại (hệ số bậc hai không âm).":stationary<min||stationary>max?"Cực đại ngoại suy được chặn về biên quan sát.":"Cực đại nội tại",warning:"Mô hình bậc hai có thể tạo cực đại giả khi ngoại suy. Chỉ diễn giải trong khoảng liều lượng đã khảo sát; kiểm tra đồ thị và thiết kế thí nghiệm."};
  }
  if(model!=="linear-plateau"&&model!=="quadratic-plateau") throw new RangeError("Mô hình chưa hỗ trợ: "+model);
  const p=model==="linear-plateau"?2:3;
  for(let i=1;i<unique.length-1;i++){
    const k=unique[i],z=X.map(x=>Math.min(x,k));
    const design=model==="linear-plateau"?z.map(v=>[1,v]):z.map(v=>[1,v,v*v]);
    try { candidates.push({...evaluateModel(design,Y,model,p+1,model==="linear-plateau"?"Tuyến tính–bão hòa: Y = a + b·min(D,k)":"Bậc hai–bão hòa: Y = a + b·min(D,k) + c·min(D,k)²",k)}); } catch {}
  }
  if(!candidates.length) throw new RangeError("Không đủ mức liều lượng để ước lượng điểm bão hòa.");
  candidates.sort((a,b)=>a.sse-b.sse);
  const best=candidates[0], [a,b,c=0]=best.parameters, k=best.breakpoint;
  const plateau=a+b*k+c*k*k;
  return {...best,optimumDose:k,optimumYield:plateau,optimumType:"Điểm bắt đầu bão hòa trong khoảng khảo sát",candidateCount:candidates.length,warning:"Điểm gãy được tìm bằng lưới các mức liều lượng quan sát; không phải khoảng tin cậy. Mô hình bão hòa giả định đáp ứng không tăng thêm sau điểm gãy. Cần thêm nghiệm thức quanh điểm gãy để xác nhận."};
}
export function compareDoseResponse(doses,y) {
  const models=["quadratic","linear-plateau","quadratic-plateau"].map(model=>fitDoseResponse(doses,y,model));
  try{models.push(fitMitscherlich(vector(doses,"Liều lượng"),vector(y,"Năng suất")));}catch(error){models.push({model:"mitscherlich",unavailable:true,error:error.message,aicc:null});}
  return {models:models.sort((a,b)=>(a.aicc??Infinity)-(b.aicc??Infinity)),selection:"AICc nhỏ hơn biểu thị cân bằng độ khớp và độ phức tạp tốt hơn; không thay thế kiểm tra phần dư, cơ chế sinh học và xác nhận thực nghiệm.",warning:"Chỉ so sánh mô hình được khớp trên cùng bộ quan sát. AICc không chứng minh mô hình đúng và mức liều tối ưu không nên ngoại suy ngoài miền khảo sát."};
}

/** Mitscherlich: Y = A - B exp(-kD), A>B>0, k>0. */
function linearForK(D,Y,k){
 const z=D.map(d=>Math.exp(-k*d)), mz=mean(z), my=mean(Y);
 let szz=0,szy=0;for(let i=0;i<z.length;i++){szz+=(z[i]-mz)**2;szy+=(z[i]-mz)*(Y[i]-my);}
 if(szz<1e-18)throw new RangeError("Không đủ biến thiên để ước lượng Mitscherlich.");
 const slope=szy/szz, intercept=my-slope*mz;
 if(!(slope<0))return null;
 const predicted=z.map(v=>intercept+slope*v),residuals=Y.map((v,i)=>v-predicted[i]);
 return {A:intercept,B:-slope,k,predicted,residuals,sse:residuals.reduce((s,v)=>s+v*v,0)};
}
function invertMatrix(A){
 const n=A.length,M=A.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
 for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
 if(Math.abs(M[p][c])<1e-12)throw new RangeError("Ma trận thông tin suy biến; không thể tính sai số chuẩn.");
 [M[c],M[p]]=[M[p],M[c]];const d=M[c][c];for(let j=0;j<2*n;j++)M[c][j]/=d;
 for(let r=0;r<n;r++)if(r!==c){const q=M[r][c];for(let j=0;j<2*n;j++)M[r][j]-=q*M[c][j];}}
 return M.map(r=>r.slice(n));
}
function nonlinearCovariance(D,fit){
 const {A,B,k}=fit,n=D.length,p=3, J=D.map(d=>{const e=Math.exp(-k*d);return [1,-e,B*d*e];});
 const jt=Array.from({length:p},(_,i)=>Array.from({length:p},(_,j)=>J.reduce((s,r)=>s+r[i]*r[j],0)));
 const inv=invertMatrix(jt),mse=fit.sse/(n-p),cov=inv.map(row=>row.map(v=>v*mse));
 return {covariance:cov,standardErrors:cov.map((r,i)=>Math.sqrt(Math.max(0,r[i])))};
}
function diagnostics(y,fit,p){
 const n=y.length,res=fit.residuals,rm=mean(res),sd=Math.sqrt(res.reduce((s,v)=>s+(v-rm)**2,0)/n);
 const skew=sd?res.reduce((s,v)=>s+((v-rm)/sd)**3,0)/n:null;
 const kurtosis=sd?res.reduce((s,v)=>s+((v-rm)/sd)**4,0)/n-3:null;
 const dw=res.slice(1).reduce((s,v,i)=>s+(v-res[i])**2,0)/(res.reduce((s,v)=>s+v*v,0)||NaN);
 return {residualMean:rm,residualSD:sd,residualSkewness:skew,residualExcessKurtosis:kurt,durbinWatson:dw,dfResidual:n-p,warning:"Skewness, kurtosis và Durbin–Watson chỉ là chỉ báo mô tả; không thay thế kiểm định giả định, đồ thị phần dư hoặc thiết kế lấy mẫu."};
}
function fitMitscherlich(D,Y){
 if(D.some(v=>v<0))throw new RangeError("Mitscherlich phiên bản này yêu cầu liều lượng D không âm.");
 const span=Math.max(...D)-Math.min(...D);if(!(span>0))throw new RangeError("Liều lượng phải có độ biến thiên.");
 const lo=Math.log(1e-4/span),hi=Math.log(1000/span),N=500;
 let best=null,bestI=-1;
 for(let i=0;i<=N;i++){const lk=lo+(hi-lo)*i/N;try{const f=linearForK(D,Y,Math.exp(lk));if(f&&(!best||f.sse<best.sse)){best=f;bestI=i;}}catch{}}
 if(!best)throw new RangeError("Không tìm được nghiệm Mitscherlich phù hợp. Kiểm tra dữ liệu có xu hướng tăng dần và đủ mức liều.");
 let left=lo+(hi-lo)*Math.max(0,bestI-1)/N,right=lo+(hi-lo)*Math.min(N,bestI+1)/N;
 const phi=(Math.sqrt(5)-1)/2;let x1=right-phi*(right-left),x2=left+phi*(right-left);
 const obj=x=>{const f=linearForK(D,Y,Math.exp(x));return f?f.sse:Infinity;};
 for(let i=0;i<100;i++){if(obj(x1)<obj(x2)){right=x2;x2=x1;x1=right-phi*(right-left);}else{left=x1;x1=x2;x2=left+phi*(right-left);}}
 const k=Math.exp((left+right)/2),fit=linearForK(D,Y,k);
 if(!(fit.A>0&&fit.B>0&&fit.A-fit.B>=0))throw new RangeError("Nghiệm Mitscherlich không thỏa điều kiện tiệm cận dương và năng suất tại liều 0 không âm.");
 const n=Y.length,p=3,sst=Y.reduce((s,v)=>s+(v-mean(Y))**2,0),df=n-p;
 if(df<=0)throw new RangeError("Cần nhiều hơn 3 quan sát để ước lượng sai số Mitscherlich.");
 const aic=n*Math.log(Math.max(fit.sse/n,1e-300))+2*p,aicc=n-p-1>0?aic+2*p*(p+1)/(n-p-1):null;
 const unc=nonlinearCovariance(D,fit),diag=diagnostics(Y,fit,p);
 const marginalAtZero=fit.B*k;
 return {model:"mitscherlich",description:"Mitscherlich: Y = A − B·exp(−kD)",n,parameters:[fit.A,fit.B,k],parameterNames:["A · tiệm cận năng suất","B · biên độ đáp ứng","k · hệ số hiệu lực"],parameterStandardErrors:unc.standardErrors,parameterCovariance:unc.covariance,asymptote:fit.A,zeroDoseYield:fit.A-fit.B,halfResponseDose:Math.log(2)/k, marginalResponseAtZero:marginalAtZero, optimumDose:null,optimumYield:null,optimumType:"Không có cực đại hữu hạn; mô hình tiến dần tới tiệm cận A.",predicted:fit.predicted,residuals:fit.residuals,sse:fit.sse,rmse:Math.sqrt(fit.sse/n),rSquared:sst?1-fit.sse/sst:null,adjustedRSquared:sst?1-(1-(1-fit.sse/sst))*(n-1)/df:null,aic,aicc,dfResidual:df,diagnostics:diag,warning:"Mitscherlich biểu diễn đáp ứng tăng dần với lợi ích biên giảm và tiệm cận; nó không có liều cực đại hữu hạn. Sai số chuẩn dùng xấp xỉ tuyến tính hóa Jacobian; khoảng tin cậy tham số cần thận trọng với mẫu nhỏ, thiết kế thiếu mức liều hoặc nghiệm gần biên."};
}
export function fitMitscherlichDoseResponse(doses,y){const D=vector(doses,"Liều lượng"),Y=vector(y,"Năng suất");if(D.length!==Y.length||D.length<6)throw new RangeError("Mitscherlich cần hai vùng cùng số dòng và ít nhất 6 quan sát.");if(new Set(D).size<4)throw new RangeError("Cần ít nhất 4 mức liều lượng khác nhau.");return fitMitscherlich(D,Y);}
export function doseResponseDiagnostics(doses,y,fit){
 const D=vector(doses,"Liều lượng"),Y=vector(y,"Năng suất");if(D.length!==Y.length||fit.predicted.length!==Y.length)throw new RangeError("Số quan sát không khớp mô hình.");
 const groups=new Map();D.forEach((d,i)=>{if(!groups.has(d))groups.set(d,[]);groups.get(d).push(Y[i]);});
 const pureError=[...groups.values()].reduce((s,a)=>s+a.reduce((q,v)=>q+(v-mean(a))**2,0),0);
 const dfPure=Y.length-groups.size,dfLack=groups.size-fit.parameters.length-(fit.model==="linear-plateau"||fit.model==="quadratic-plateau"?1:0);
 const lackSSE=Math.max(0,fit.sse-pureError),lackF=dfLack>0&&dfPure>0&&pureError>0?(lackSSE/dfLack)/(pureError/dfPure):null;
 const leverage=fit.model==="mitscherlich"?null:(()=>{const X=D.map(d=>fit.model==="quadratic"?[1,d,d*d]:fit.model==="linear-plateau"?[1,Math.min(d,fit.breakpoint)]:[1,Math.min(d,fit.breakpoint),Math.min(d,fit.breakpoint)**2]);const inv=invertMatrix(Array.from({length:X[0].length},(_,i)=>Array.from({length:X[0].length},(_,j)=>X.reduce((s,r)=>s+r[i]*r[j],0))));return X.map(r=>r.reduce((s,v,i)=>s+v*X.reduce((q,row)=>q+row[i]*row.reduce((z,w,j)=>z+w*inv[j][i],0),0),0));})();
 return {replicatedDoseLevels:groups.size,pureErrorSSE:pureError,dfPureError:dfPure,lackOfFitSSE:lackSSE,dfLackOfFit:dfLack,lackOfFitF:lackF,leverage,diagnostics:fit.diagnostics??diagnostics(Y,fit,fit.parameters.length),warning:"Phân rã lack-of-fit chỉ tính được khi có lặp ở cùng mức liều và đủ bậc tự do. F được báo như thống kê mô tả, chưa kèm p-value; cần kiểm định F với phân phối tham chiếu và xem xét độc lập, phương sai không đổi."};
}
