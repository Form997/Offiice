/**
 * HAI ĐẤT SGHT — Formula Engine
 * First foundation release: tokenizer, parser, safe evaluator and original function registry.
 * No eval(), Function(), or third-party calculation engine is used.
 */
export class FormulaError extends Error {
  constructor(code, message) { super(message); this.name = "FormulaError"; this.code = code; }
}
const fail = (code, message) => { throw new FormulaError(code, message); };
const isCell = s => /^[A-Z]{1,3}[1-9][0-9]*$/i.test(s);
const cellKey = s => s.toUpperCase();

function tokenize(source) {
  const out = []; let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    if (/^\s+/.test(rest)) { i += rest.match(/^\s+/)[0].length; continue; }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) { out.push({type:"number", value:Number(number[0])}); i += number[0].length; continue; }
    const string = rest.match(/^"(?:""|[^"])*"/);
    if (string) { out.push({type:"string", value:string[0].slice(1,-1).replace(/""/g,'"')}); i += string[0].length; continue; }
    const range = rest.match(/^[A-Z]{1,3}[1-9][0-9]*:[A-Z]{1,3}[1-9][0-9]*/i);
    if (range) { out.push({type:"range", value:range[0].toUpperCase()}); i += range[0].length; continue; }
    const cell = rest.match(/^[A-Z]{1,3}[1-9][0-9]*/i);
    if (cell) { out.push({type:"cell", value:cell[0].toUpperCase()}); i += cell[0].length; continue; }
    const ident = rest.match(/^[A-Z_][A-Z0-9_.]*/i);
    if (ident) { out.push({type:"ident", value:ident[0].toUpperCase()}); i += ident[0].length; continue; }
    const op = rest.match(/^(<=|>=|<>|[+\-*/^%(),=<>])/);
    if (op) { out.push({type:"op", value:op[0]}); i += op[0].length; continue; }
    fail("#PARSE!", `Ký tự không hợp lệ tại vị trí ${i+1}.`);
  }
  out.push({type:"eof"}); return out;
}

const PRECEDENCE = {"=":1,"<>":1,"<":1,">":1,"<=":1,">=":1,"+":2,"-":2,"*":3,"/":3,"%":4,"^":5};
class Parser {
  constructor(tokens) { this.t=tokens; this.i=0; }
  peek() { return this.t[this.i]; }
  take() { return this.t[this.i++]; }
  expect(v) { const t=this.take(); if (!t || t.value!==v) fail("#PARSE!", `Thiếu ký hiệu '${v}'.`); return t; }
  parse() { const node=this.expression(0); if(this.peek().type!=="eof") fail("#PARSE!","Còn dữ liệu chưa được phân tích."); return node; }
  expression(min) {
    let t=this.take(), left;
    if(t.type==="number" || t.type==="string") left={kind:"literal",value:t.value};
    else if(t.type==="cell") left={kind:"cell",ref:t.value};
    else if(t.type==="range") left={kind:"range",ref:t.value};
    else if(t.type==="ident") {
      if(this.peek().value==="(") {
        this.take(); const args=[];
        if(this.peek().value!==")") { do { args.push(this.expression(0)); if(this.peek().value!==",") break; this.take(); } while(true); }
        this.expect(")"); left={kind:"call",name:t.value,args};
      } else if(t.value==="TRUE" || t.value==="FALSE") left={kind:"literal",value:t.value==="TRUE"};
      else fail("#NAME?",`Không nhận diện được tên '${t.value}'.`);
    } else if(t.value==="(") { left=this.expression(0); this.expect(")"); }
    else if(t.value==="+" || t.value==="-") left={kind:"unary",op:t.value,arg:this.expression(5)};
    else fail("#PARSE!","Thiếu toán hạng hoặc dấu ngoặc không hợp lệ.");
    while(true) {
      const op=this.peek().value, p=PRECEDENCE[op];
      if(p===undefined || p<min) break;
      this.take(); const right=this.expression(p+(op==="^"?0:1)); left={kind:"binary",op,left,right};
    }
    return left;
  }
}
const flatten = values => values.flatMap(v => v && v.__range === true ? v.values : [v]);
const numeric = v => typeof v==="number" && Number.isFinite(v);
function numberArg(v, name) { if(!numeric(v)) fail("#VALUE!",`${name} cần giá trị số.`); return v; }
const registry = new Map();
export function registerFormulaFunction(name, spec) {
  const key=String(name).toUpperCase();
  if(!/^[A-Z][A-Z0-9_]*$/.test(key) || registry.has(key)) throw new Error("Tên hàm không hợp lệ hoặc đã tồn tại: "+key);
  if(typeof spec?.run!=="function") throw new TypeError("Hàm phải có run().");
  registry.set(key,Object.freeze({...spec,name:key}));
}
function valuesOf(args) { return flatten(args); }
function registerBuiltins() {
  const add=(name,min,max,run,description)=>registerFormulaFunction(name,{min,max,run,description});
  add("SUM",0,Infinity,a=>valuesOf(a).filter(numeric).reduce((s,n)=>s+n,0),"Cộng các giá trị số.");
  add("AVERAGE",1,Infinity,a=>{const v=valuesOf(a).filter(numeric); if(!v.length) fail("#DIV/0!","Không có số để tính trung bình."); return v.reduce((s,n)=>s+n,0)/v.length;},"Trung bình cộng.");
  add("MIN",1,Infinity,a=>{const v=valuesOf(a).filter(numeric); return v.length?Math.min(...v):0;},"Giá trị nhỏ nhất.");
  add("MAX",1,Infinity,a=>{const v=valuesOf(a).filter(numeric); return v.length?Math.max(...v):0;},"Giá trị lớn nhất.");
  add("COUNT",0,Infinity,a=>valuesOf(a).filter(numeric).length,"Đếm giá trị số.");
  add("COUNTA",0,Infinity,a=>valuesOf(a).filter(v=>v!==null && v!==undefined && v!=="").length,"Đếm ô không rỗng.");
  add("ABS",1,1,a=>Math.abs(numberArg(a[0],"ABS")),"Giá trị tuyệt đối.");
  add("SQRT",1,1,a=>{const n=numberArg(a[0],"SQRT"); if(n<0) fail("#NUM!","Không lấy căn bậc hai số âm."); return Math.sqrt(n);},"Căn bậc hai.");
  add("POWER",2,2,a=>Math.pow(numberArg(a[0],"POWER"),numberArg(a[1],"POWER")),"Lũy thừa.");
  add("MOD",2,2,a=>{const x=numberArg(a[0],"MOD"),y=numberArg(a[1],"MOD"); if(y===0) fail("#DIV/0!","Không thể chia cho 0."); return ((x%y)+y)%y;},"Phần dư không âm theo trị tuyệt đối số chia.");
  add("INT",1,1,a=>Math.floor(numberArg(a[0],"INT")),"Làm tròn xuống số nguyên.");
  add("TRUNC",1,2,a=>{const n=numberArg(a[0],"TRUNC"),d=a.length>1?numberArg(a[1],"TRUNC"):0; const p=10**d; return Math.trunc(n*p)/p;},"Cắt phần thập phân.");
  add("ROUND",1,2,a=>{const n=numberArg(a[0],"ROUND"),d=a.length>1?numberArg(a[1],"ROUND"):0; const p=10**d; return Math.sign(n)*Math.round((Math.abs(n)+Number.EPSILON)*p)/p;},"Làm tròn gần nhất.");
  add("ROUNDUP",1,2,a=>{const n=numberArg(a[0],"ROUNDUP"),d=a.length>1?numberArg(a[1],"ROUNDUP"):0,p=10**d; return Math.sign(n)*Math.ceil(Math.abs(n)*p)/p;},"Làm tròn xa số 0.");
  add("ROUNDDOWN",1,2,a=>{const n=numberArg(a[0],"ROUNDDOWN"),d=a.length>1?numberArg(a[1],"ROUNDDOWN"):0,p=10**d; return Math.sign(n)*Math.floor(Math.abs(n)*p)/p;},"Làm tròn về 0.");
  add("PI",0,0,()=>Math.PI,"Hằng số pi.");
  add("EXP",1,1,a=>Math.exp(numberArg(a[0],"EXP")),"Số e mũ x.");
  add("LN",1,1,a=>{const n=numberArg(a[0],"LN"); if(n<=0) fail("#NUM!","LN chỉ nhận số dương."); return Math.log(n);},"Logarit tự nhiên.");
  add("LOG10",1,1,a=>{const n=numberArg(a[0],"LOG10"); if(n<=0) fail("#NUM!","LOG10 chỉ nhận số dương."); return Math.log10(n);},"Logarit cơ số 10.");
  add("SIN",1,1,a=>Math.sin(numberArg(a[0],"SIN")*Math.PI/180),"Sin theo độ.");
  add("COS",1,1,a=>Math.cos(numberArg(a[0],"COS")*Math.PI/180),"Cos theo độ.");
  add("TAN",1,1,a=>Math.tan(numberArg(a[0],"TAN")*Math.PI/180),"Tan theo độ.");
  add("RADIANS",1,1,a=>numberArg(a[0],"RADIANS")*Math.PI/180,"Đổi độ sang radian.");
  add("DEGREES",1,1,a=>numberArg(a[0],"DEGREES")*180/Math.PI,"Đổi radian sang độ.");
}
registerBuiltins();

function evaluate(node, context) {
  switch(node.kind) {
    case "literal": return node.value;
    case "cell": if(typeof context.getCell!=="function") fail("#REF!","Chưa có bảng dữ liệu để đọc ô "+node.ref+"."); return context.getCell(node.ref);
    case "range": {
      if(typeof context.getRange!=="function") fail("#REF!","Chưa có bảng dữ liệu để đọc vùng "+node.ref+".");
      return {__range:true,values:context.getRange(node.ref)};
    }
    case "unary": { const n=numberArg(evaluate(node.arg,context),"Toán tử"); return node.op==="-"?-n:n; }
    case "binary": {
      const a=evaluate(node.left,context), b=evaluate(node.right,context);
      if(["=","<>","<",">","<=",">="].includes(node.op)) {
        switch(node.op) { case "=":return a===b; case "<>":return a!==b; case "<":return a<b; case ">":return a>b; case "<=":return a<=b; default:return a>=b; }
      }
      const x=numberArg(a,"Phép toán"), y=numberArg(b,"Phép toán");
      switch(node.op) {
        case "+":return x+y; case "-":return x-y; case "*":return x*y;
        case "/":if(y===0) fail("#DIV/0!","Không thể chia cho 0."); return x/y;
        case "%":if(y===0) fail("#DIV/0!","Không thể chia cho 0."); return x%y;
        case "^":return x**y;
      }
      fail("#OP!","Toán tử chưa được hỗ trợ.");
    }
    case "call": {
      const spec=registry.get(node.name); if(!spec) fail("#NAME?",`Hàm ${node.name} chưa được đăng ký.`);
      if(node.args.length<spec.min || node.args.length>spec.max) fail("#ARGS!",`${node.name} nhận ${spec.min===spec.max?spec.min:`từ ${spec.min} đến ${spec.max===Infinity?"nhiều":spec.max}`} tham số.`);
      const args=node.args.map(arg=>evaluate(arg,context));
      const result=spec.run(args,context);
      if(typeof result==="number" && !Number.isFinite(result)) fail("#NUM!","Kết quả vượt miền số hợp lệ.");
      return result;
    }
  }
  fail("#PARSE!","Cấu trúc công thức không hợp lệ.");
}
export function evaluateFormula(formula, context={}) {
  if(typeof formula!=="string" || !formula.trim().startsWith("=")) fail("#PARSE!","Công thức phải bắt đầu bằng dấu =.");
  try { return evaluate(new Parser(tokenize(formula.trim().slice(1))).parse(),context); }
  catch(error) { if(error instanceof FormulaError) throw error; throw new FormulaError("#CALC!",error?.message||"Lỗi tính toán."); }
}
export function listFormulaFunctions() {
  return [...registry.values()].map(({name,min,max,description})=>({name,min,max,description}));
}
