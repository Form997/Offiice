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
    try { candidates.push({...evaluateModel(design,Y,model,p,model==="linear-plateau"?"Tuyến tính–bão hòa: Y = a + b·min(D,k)":"Bậc hai–bão hòa: Y = a + b·min(D,k) + c·min(D,k)²",k)}); } catch {}
  }
  if(!candidates.length) throw new RangeError("Không đủ mức liều lượng để ước lượng điểm bão hòa.");
  candidates.sort((a,b)=>a.sse-b.sse);
  const best=candidates[0], [a,b,c=0]=best.parameters, k=best.breakpoint;
  const plateau=a+b*k+c*k*k;
  return {...best,optimumDose:k,optimumYield:plateau,optimumType:"Điểm bắt đầu bão hòa trong khoảng khảo sát",candidateCount:candidates.length,warning:"Điểm gãy được tìm bằng lưới các mức liều lượng quan sát; không phải khoảng tin cậy. Mô hình bão hòa giả định đáp ứng không tăng thêm sau điểm gãy. Cần thêm nghiệm thức quanh điểm gãy để xác nhận."};
}
export function compareDoseResponse(doses,y) {
  const models=["quadratic","linear-plateau","quadratic-plateau"].map(model=>fitDoseResponse(doses,y,model));
  return {models:models.sort((a,b)=>(a.aicc??Infinity)-(b.aicc??Infinity)),selection:"AICc nhỏ hơn biểu thị cân bằng độ khớp và độ phức tạp tốt hơn; không thay thế kiểm tra phần dư, cơ chế sinh học và xác nhận thực nghiệm.",warning:"Chỉ so sánh mô hình được khớp trên cùng bộ quan sát. AICc không chứng minh mô hình đúng và mức liều tối ưu không nên ngoại suy ngoài miền khảo sát."};
}
