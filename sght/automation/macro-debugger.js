import { planMacro } from "./macro-engine.js";
function colLabel(n){let s="";while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
function address(r,c){return colLabel(c)+r;}
function each(bounds,fn){for(let r=bounds.top;r<=bounds.bottom;r++)for(let c=bounds.left;c<=bounds.right;c++)fn(address(r,c),r,c);}
const CELL=/^([A-Z]+)([1-9][0-9]*)$/;
function normalizeCell(value){const cell=String(value||"").trim().toUpperCase();if(!CELL.test(cell))throw new Error("Địa chỉ ô theo dõi không hợp lệ: "+value);return cell;}
export class MacroDebugger{
 constructor(source,adapter){
  if(!adapter||typeof adapter.get!=="function"||typeof adapter.set!=="function"||typeof adapter.clear!=="function")throw new Error("Bộ kết nối bảng tính không hợp lệ.");
  this.plan=planMacro(source);this.adapter=adapter;this.index=0;this.status="ready";this.trace=[];this.undo=[];this.breakpoints=new Set();this.watches=[];this.breakpointHit=null;this.skipBreakpointIndex=null;
 }
 setBreakpoints(lines=[]){
  if(!Array.isArray(lines))throw new Error("Danh sách breakpoint phải là một mảng.");
  const validLines=new Set(this.plan.map(x=>x.line)),next=new Set();
  for(const raw of lines){const line=Number(raw);if(!Number.isInteger(line)||!validLines.has(line))throw new Error("Breakpoint phải trỏ tới dòng lệnh hợp lệ: "+raw);next.add(line);}
  this.breakpoints=next;this.breakpointHit=null;return this.state();
 }
 setWatches(cells=[]){
  if(!Array.isArray(cells))throw new Error("Danh sách watch phải là một mảng.");
  const next=[...new Set(cells.map(normalizeCell))];if(next.length>50)throw new Error("Tối đa 50 ô theo dõi trong một phiên.");
  this.watches=next;return this.state();
 }
 start({approved=false}={}){if(!approved)throw new Error("Cần phê duyệt trước khi bắt đầu gỡ lỗi.");if(this.status!=="ready")throw new Error("Phiên gỡ lỗi đã được khởi tạo.");this.status="paused";return this.state();}
 step(){
  if(this.status!=="paused")throw new Error("Phiên gỡ lỗi chưa sẵn sàng hoặc đã kết thúc.");
  if(this.index>=this.plan.length){this.status="completed";return this.state();}
  const cmd=this.plan[this.index],before=new Map();
  const write=(cell,value)=>{if(!before.has(cell))before.set(cell,this.adapter.get(cell));if(value==null||value==="")this.adapter.clear(cell);else this.adapter.set(cell,String(value));};
  try{
   if(cmd.type==="SET")write(cmd.cell,cmd.value);
   else if(cmd.type==="CLEAR")each(cmd.bounds,a=>write(a,""));
   else if(cmd.type==="COPY"){const values=[];each(cmd.from,(a,r,c)=>values.push([cmd.to.row+(r-cmd.from.top),cmd.to.col+(c-cmd.from.left),this.adapter.get(a)]));for(const [r,c,v] of values)write(address(r,c),v);}
   else if(cmd.type==="SUM"){let total=0;each(cmd.bounds,a=>{const v=this.adapter.get(a),n=Number(v);if(v!==""&&v!=null&&Number.isFinite(n))total+=n;});write(cmd.target,total);}
   const changes=[...before].map(([cell,oldValue])=>({cell,before:oldValue??"",after:this.adapter.get(cell)??""}));
   this.undo.push(before);this.index++;this.breakpointHit=null;this.skipBreakpointIndex=null;
   this.trace.push({step:this.index,line:cmd.line,type:cmd.type,changes,watches:this.watchValues()});
   if(this.index===this.plan.length)this.status="completed";
   return this.state();
  }catch(error){for(const [cell,value] of [...before].reverse()){if(value==null||value==="")this.adapter.clear(cell);else this.adapter.set(cell,String(value));}this.status="error";this.error={message:error.message,line:cmd.line,code:error.code||"#MACRO_RUNTIME!"};throw error;}
 }
 continue(){
  while(this.status==="paused"){
   const next=this.plan[this.index];
   if(!next){this.status="completed";break;}
   if(this.breakpoints.has(next.line)&&this.skipBreakpointIndex!==this.index){this.breakpointHit={line:next.line,step:this.index+1};this.skipBreakpointIndex=this.index;return this.state();}
   this.step();
  }
  return this.state();
 }
 stop(){if(this.status==="paused")this.status="stopped";return this.state();}
 rollback(){if(this.status==="ready")return this.state();for(const changes of [...this.undo].reverse())for(const [cell,value] of [...changes].reverse()){if(value==null||value==="")this.adapter.clear(cell);else this.adapter.set(cell,String(value));}this.undo=[];this.trace=[];this.index=0;this.status="rolled_back";this.breakpointHit=null;return this.state();}
 watchValues(){return this.watches.map(cell=>({cell,value:this.adapter.get(cell)??""}));}
 state(){return {status:this.status,currentStep:this.index,totalSteps:this.plan.length,nextCommand:this.plan[this.index]||null,trace:this.trace.slice(),error:this.error||null,changedCells:this.trace.reduce((n,x)=>n+x.changes.length,0),breakpoints:[...this.breakpoints].sort((a,b)=>a-b),watches:this.watchValues(),breakpointHit:this.breakpointHit};}
}
