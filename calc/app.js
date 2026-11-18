(() => {
'use strict';
const $ = s => document.querySelector(s);
const expr = $('#expr'), history = $('#history'), result = $('#result');
const STORAGE = 'haidat-calc-v2';
let angleMode = localStorage.getItem('haidat-calc-angle') || 'DEG';
let memory = Number(localStorage.getItem('haidat-calc-memory') || 0);
let answer = 0;
const format = n => Number(n.toPrecision(12)).toLocaleString('vi-VN', {maximumFractionDigits:12});
const insert = value => { const a=expr.selectionStart ?? expr.value.length, b=expr.selectionEnd ?? a; expr.setRangeText(value,a,b,'end'); expr.focus(); };
const keyRows = [
 ['7','8','9','÷','AC'],['4','5','6','×','⌫'],['1','2','3','−','('],['0','.','=', '+',')'],
 ['sin(','cos(','tan(','sqrt(','^'],['log(','ln(','abs(','π','e'],['!','%','x²','1/x','Ans']
];
keyRows.flat().forEach(k=>{
 const b=document.createElement('button'); b.type='button'; b.textContent=k;
 b.className = k==='=' ? 'key-equal' : '';
 b.addEventListener('click',()=>{
  if(k==='='){run();return;} if(k==='AC'){expr.value='';result.textContent='0';expr.focus();return;}
  if(k==='⌫'){const a=expr.selectionStart??expr.value.length,bx=expr.selectionEnd??a;if(a===bx&&a>0)expr.setRangeText('',a-1,a,'end');else expr.setRangeText('',a,bx,'end');expr.focus();return;}
  if(k==='x²'){insert('^2');return;} if(k==='1/x'){insert('^-1');return;}
  insert(({ '÷':'/','×':'*','−':'-','π':'pi','Ans':'Ans'}[k]||k));
 }); $('#keys').append(b);
});
const controls = [
 ['mode',()=>{angleMode=angleMode==='DEG'?'RAD':'DEG';localStorage.setItem('haidat-calc-angle',angleMode);$('#angle-mode').textContent=angleMode;}],
 ['mplus',()=>memory+=lastValue()],['mminus',()=>memory-=lastValue()],
 ['mr',()=>insert(String(memory))],['mc',()=>memory=0],
 ['copy',async()=>{try{await navigator.clipboard.writeText(String(lastValue()));$('#copy').textContent='Đã chép';setTimeout(()=>$('#copy').textContent='Chép kết quả',1200);}catch{result.textContent='Trình duyệt chưa cho phép sao chép';}}],
 ['use-answer',()=>insert('Ans')]
];
function lastValue(){return Number.isFinite(answer)?answer:0;}
controls.forEach(([id,fn])=>$('#'+id).addEventListener('click',()=>{fn();$('#memory-value').textContent='M = '+format(memory);localStorage.setItem('haidat-calc-memory',String(memory));}));
$('#angle-mode').textContent=angleMode;$('#memory-value').textContent='M = '+format(memory);
function tokenize(source){
 const s=source.replace(/π/g,'pi').replace(/\s+/g,'');
 const re=/\d+(?:\.\d*)?|\.\d+|(?:asin|acos|atan|sin|cos|tan|sqrt|log|ln|abs|fact|pi|ans|e)|[()+\-*/^%!]/igy;
 const tokens=[];let pos=0,m;
 while(pos<s.length){re.lastIndex=pos;m=re.exec(s);if(!m)throw Error('Ký tự không hợp lệ tại vị trí '+(pos+1));tokens.push(m[0]);pos=re.lastIndex;}
 return tokens;
}
function evaluate(source){
 const t=tokenize(source);let i=0;
 const peek=()=>t[i], take=()=>t[i++];
 const factorial=n=>{if(n<0||!Number.isInteger(n)||n>170)throw Error('Giai thừa cần số nguyên từ 0 đến 170');let v=1;for(let j=2;j<=n;j++)v*=j;return v;};
 function primary(){
  const x=take();if(x===undefined)throw Error('Thiếu toán hạng');
  if(x==='('){const v=add();if(take()!==')')throw Error('Thiếu dấu )');return v;}
  if(x==='pi')return Math.PI;if(x==='e')return Math.E;if(x.toLowerCase()==='ans')return answer;
  if(/^\d/.test(x)||x[0]==='.')return Number(x);
  const name=x.toLowerCase();
  const funcs=['sin','cos','tan','asin','acos','atan','sqrt','log','ln','abs','fact'];
  if(funcs.includes(name)){
   if(take()!=='(')throw Error('Hàm '+name+' cần dấu (');
   const v=add();if(take()!==')')throw Error('Thiếu dấu )');
   const rad=angleMode==='DEG'?Math.PI/180:1;
   const f={sin:x=>Math.sin(x*rad),cos:x=>Math.cos(x*rad),tan:x=>Math.tan(x*rad),
    asin:x=>Math.asin(x)/rad,acos:x=>Math.acos(x)/rad,atan:x=>Math.atan(x)/rad,
    sqrt:Math.sqrt,log:Math.log10,ln:Math.log,abs:Math.abs,fact:factorial};
   return f[name](v);
  }
  throw Error('Không hiểu ký hiệu: '+x);
 }
 function postfix(){let v=primary();while(peek()==='!'||peek()==='%'){const op=take();v=op==='!'?factorial(v):v/100;}return v;}
 function power(){let sign=1;while(peek()==='+'||peek()==='-'){if(take()==='-')sign=-sign;}let v=postfix();if(peek()==='^'){take();v=Math.pow(v,power());}return sign*v;}
 function mul(){let v=power();while(peek()==='*'||peek()==='/'){const op=take(),r=power();v=op==='*'?v*r:v/r;}return v;}
 function add(){let v=mul();while(peek()==='+'||peek()==='-'){const op=take(),r=mul();v=op==='+'?v+r:v-r;}return v;}
 const value=add();if(i<t.length)throw Error('Còn ký hiệu chưa xử lý: '+peek());
 if(!Number.isFinite(value))throw Error('Kết quả không xác định (kiểm tra chia 0 hoặc miền hàm).');
 return value;
}
function saveHistory(item){
 let items=[];try{items=JSON.parse(localStorage.getItem(STORAGE)||'[]');}catch{}
 items.unshift(item);items=items.slice(0,50);localStorage.setItem(STORAGE,JSON.stringify(items));renderHistory(items);
}
function renderHistory(items){
 history.replaceChildren();
 items.forEach(item=>{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.className='history-item';b.textContent=item.expression+' = '+format(item.value);b.title='Chạm để dùng lại biểu thức';b.addEventListener('click',()=>{expr.value=item.expression;expr.focus();});li.append(b);history.append(li);});
}
function run(){
 try{const expression=expr.value.trim();if(!expression)throw Error('Hãy nhập biểu thức trước đã.');const value=evaluate(expression);answer=value;result.textContent=format(value);result.dataset.raw=String(value);saveHistory({expression,value,at:Date.now()});$('#result-note').textContent='Đã tính · '+angleMode;}
 catch(e){result.textContent='Lỗi';$('#result-note').textContent=e.message;}
}
$('#equal').addEventListener('click',run);
expr.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
$('#clear').addEventListener('click',()=>{localStorage.removeItem(STORAGE);history.replaceChildren();});
try{renderHistory(JSON.parse(localStorage.getItem(STORAGE)||'[]'));}catch{renderHistory([]);}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
let deferred;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#install').hidden=false;});
$('#install').addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;});
})();