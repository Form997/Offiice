/**
 * SGHT Data Science — Giai đoạn 8
 * Thống kê suy luận ngoại tuyến, không phụ thuộc thư viện ngoài.
 */
const finite = x => typeof x === "number" && Number.isFinite(x);
function clean(values, label) {
  if (!Array.isArray(values)) throw new TypeError(label+" phải là mảng.");
  const out=values.map(Number);
  if(out.some(x=>!finite(x))) throw new TypeError(label+" có giá trị không phải số hoặc ô trống.");
  return out;
}
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}
function variance(a,m=mean(a)){return a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1);}
function paired(x,y){
  const X=clean(x,"X"),Y=clean(y,"Y");
  if(X.length!==Y.length)throw new RangeError("Hai dãy X và Y phải có cùng số quan sát.");
  if(X.length<3)throw new RangeError("Hồi quy cần ít nhất 3 cặp quan sát.");
  return [X,Y];
}
export function pearsonCorrelation(x,y){
  const [X,Y]=paired(x,y),mx=mean(X),my=mean(Y);
  const sx=Math.sqrt(X.reduce((s,v)=>s+(v-mx)**2,0)),sy=Math.sqrt(Y.reduce((s,v)=>s+(v-my)**2,0));
  if(!sx||!sy)throw new RangeError("Không thể tính tương quan khi một dãy không biến thiên.");
  const r=X.reduce((s,v,i)=>s+(v-mx)*(Y[i]-my),0)/(sx*sy);
  return {r,rSquared:r*r,n:X.length,interpretation:Math.abs(r)<.3?"yếu":Math.abs(r)<.7?"vừa":"mạnh"};
}
export function simpleLinearRegression(x,y){
  const [X,Y]=paired(x,y),mx=mean(X),my=mean(Y);
  const ssx=X.reduce((s,v)=>s+(v-mx)**2,0);
  if(!ssx)throw new RangeError("Dãy X không biến thiên; không thể ước lượng hệ số góc.");
  const slope=X.reduce((s,v,i)=>s+(v-mx)*(Y[i]-my),0)/ssx;
  const intercept=my-slope*mx;
  const predicted=X.map(v=>intercept+slope*v);
  const sse=Y.reduce((s,v,i)=>s+(v-predicted[i])**2,0),sst=Y.reduce((s,v)=>s+(v-my)**2,0);
  const rSquared=sst===0?0:1-sse/sst;
  const residualDf=X.length-2;
  const standardError=residualDf>0?Math.sqrt((sse/residualDf)/ssx):null;
  return {n:X.length,intercept,slope,rSquared,adjustedRSquared:1-(1-rSquared)*(X.length-1)/residualDf,standardError,predicted,residuals:Y.map((v,i)=>v-predicted[i]),equation:"Y = "+intercept+" + "+slope+" × X"};
}
function logGamma(z){
  const p=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
  if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
  z-=1;let x=.99999999999980993;for(let i=0;i<p.length;i++)x+=p[i]/(z+i+1);
  const t=z+p.length-.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
}
function betaFraction(a,b,x){
  const max=200,eps=3e-14,fp=1e-300;let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;
  if(Math.abs(d)<fp)d=fp;d=1/d;let h=d;
  for(let m=1;m<=max;m++){let m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<fp)d=fp;c=1+aa/c;if(Math.abs(c)<fp)c=fp;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<fp)d=fp;c=1+aa/c;if(Math.abs(c)<fp)c=fp;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<eps)break;}
  return h;
}
function regularizedBeta(x,a,b){
  if(x<=0)return 0;if(x>=1)return 1;
  const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
  return x<(a+1)/(a+b+2)?bt*betaFraction(a,b,x)/a:1-bt*betaFraction(b,a,1-x)/b;
}
export function oneWayAnova(groups){
  if(!Array.isArray(groups)||groups.length<2)throw new RangeError("ANOVA cần ít nhất 2 nghiệm thức.");
  const G=groups.map((g,i)=>({name:String(g.name??("Nhóm "+(i+1))),values:clean(g.values,"Nhóm "+(i+1))}));
  if(G.some(g=>g.values.length<2))throw new RangeError("Mỗi nhóm cần ít nhất 2 quan sát.");
  const all=G.flatMap(g=>g.values),N=all.length,k=G.length,grand=mean(all);
  const ssBetween=G.reduce((s,g)=>s+g.values.length*(mean(g.values)-grand)**2,0);
  const ssWithin=G.reduce((s,g)=>s+g.values.reduce((q,v)=>q+(v-mean(g.values))**2,0),0);
  const dfBetween=k-1,dfWithin=N-k,msBetween=ssBetween/dfBetween,msWithin=ssWithin/dfWithin;
  if(msWithin===0)throw new RangeError("Phương sai trong nhóm bằng 0; không thể tính thống kê F.");
  const F=msBetween/msWithin,pValue=1-regularizedBeta((dfBetween*F)/(dfBetween*F+dfWithin),dfBetween/2,dfWithin/2);
  return {groups:G.map(g=>({name:g.name,n:g.values.length,mean:mean(g.values),sd:Math.sqrt(variance(g.values))})),N,k,grandMean:grand,ssBetween,ssWithin,dfBetween,dfWithin,msBetween,msWithin,F,pValue,significantAt05:pValue<.05};
}
