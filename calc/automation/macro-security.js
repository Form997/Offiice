/**
 * SGHT Macro Security Center.
 * Enforces per-command permissions, bounded execution and an auditable local log.
 * The macro language remains declarative; this is not an OS/browser sandbox.
 */
const KEY="haidat-sght-security-v1";
const TYPES=new Set(["SET","COPY","CLEAR","SUM"]);
const DEFAULT_POLICY={allowedTypes:["SET","COPY","CLEAR","SUM"],maxCommands:500,maxCells:5000};
function cleanPolicy(input={}) {
 const allowedTypes=[...new Set((input.allowedTypes||DEFAULT_POLICY.allowedTypes).map(x=>String(x).toUpperCase()))];
 if(allowedTypes.some(x=>!TYPES.has(x)))throw new Error("Nhóm lệnh không hợp lệ.");
 const maxCommands=Number(input.maxCommands??DEFAULT_POLICY.maxCommands),maxCells=Number(input.maxCells??DEFAULT_POLICY.maxCells);
 if(!Number.isInteger(maxCommands)||maxCommands<1||maxCommands>2000)throw new Error("Giới hạn lệnh phải từ 1 đến 2.000.");
 if(!Number.isInteger(maxCells)||maxCells<1||maxCells>10000)throw new Error("Giới hạn ô phải từ 1 đến 10.000.");
 return {allowedTypes,maxCommands,maxCells};
}
function commandCells(cmd){
 if(cmd.type==="SET")return [cmd.cell];
 if(cmd.type==="COPY"){
  const out=[];for(let r=cmd.from.top;r<=cmd.from.bottom;r++)for(let c=cmd.from.left;c<=cmd.from.right;c++){
   const col=n=>{let s="";while(n){const x=(n-1)%26;s=String.fromCharCode(65+x)+s;n=Math.floor((n-1)/26);}return s;};
   out.push(col(cmd.to.col+(c-cmd.from.left))+(cmd.to.row+(r-cmd.from.top)));
  }return out;
 }
 if(cmd.type==="CLEAR"||cmd.type==="SUM"){
  const b=cmd.bounds,out=[];const col=n=>{let s="";while(n){const x=(n-1)%26;s=String.fromCharCode(65+x)+s;n=Math.floor((n-1)/26);}return s;};
  for(let r=b.top;r<=b.bottom;r++)for(let c=b.left;c<=b.right;c++)out.push(col(c)+r);
  if(cmd.type==="SUM")out.push(cmd.target);
  return out;
 }
 return [];
}
export class MacroSecurityCenter{
 constructor({storage=globalThis.localStorage,clock=()=>new Date().toISOString()}={}){
  this.storage=storage;this.clock=clock;this.policy=DEFAULT_POLICY;this.audit=[];
  try{const saved=JSON.parse(storage?.getItem(KEY)||"null");if(saved){this.policy=cleanPolicy(saved.policy);this.audit=Array.isArray(saved.audit)?saved.audit.slice(-500):[];}}catch{}
  this.emergencyStopped=false;this.active=null;
 }
 persist(){try{this.storage?.setItem(KEY,JSON.stringify({policy:this.policy,audit:this.audit.slice(-500)}));}catch{}}
 setPolicy(policy){this.policy=cleanPolicy(policy);this.persist();return this.getPolicy();}
 getPolicy(){return {...this.policy,allowedTypes:[...this.policy.allowedTypes]};}
 preview(plan){
  const types={SET:0,COPY:0,CLEAR:0,SUM:0},cells=new Set(),commands=[];
  for(const cmd of plan){types[cmd.type]=(types[cmd.type]||0)+1;const affected=commandCells(cmd);affected.forEach(x=>cells.add(x));commands.push({line:cmd.line,type:cmd.type,cells:affected.length,addresses:affected.slice(0,20)});}
  return {commandCount:plan.length,uniqueCells:cells.size,commandTypes:types,commands,policy:this.getPolicy(),blockedTypes:Object.keys(types).filter(k=>types[k]&&!this.policy.allowedTypes.includes(k)),withinLimits:plan.length<=this.policy.maxCommands&&commands.every(x=>x.cells<=this.policy.maxCells)&&commands.reduce((n,x)=>n+x.cells,0)<=this.policy.maxCells};
 }
 begin(plan,{approved=false}={}){
  if(!approved)throw new Error("Cần người dùng phê duyệt phiên macro.");
  if(this.active)throw new Error("Đang có một phiên macro hoạt động.");
  if(this.emergencyStopped)throw new Error("Đã kích hoạt dừng khẩn cấp. Hãy đặt lại trước phiên mới.");
  const report=this.preview(plan);
  if(report.blockedTypes.length)throw new Error("Chính sách đang khóa nhóm lệnh: "+report.blockedTypes.join(", "));
  if(plan.length>this.policy.maxCommands)throw new Error("Macro vượt giới hạn số lệnh được cấp.");
  if(report.commands.some(x=>x.cells>this.policy.maxCells)||report.commands.reduce((n,x)=>n+x.cells,0)>this.policy.maxCells)throw new Error("Macro vượt giới hạn tổng số ô được phép tác động.");
  this.active={id:"SGHT-"+this.clock(),remaining:plan.length,executed:0,changedCells:0,stopped:false};
  this.log("approved",{commandCount:plan.length,uniqueCells:report.uniqueCells});
  return {...this.active};
 }
 beforeCommand(cmd){
  if(this.emergencyStopped||!this.active||this.active.stopped)throw new Error("Phiên macro đã bị dừng bởi trung tâm an toàn.");
  if(!this.policy.allowedTypes.includes(cmd.type))throw new Error("Nhóm lệnh "+cmd.type+" hiện không được cấp quyền.");
  if(this.active.executed>=this.policy.maxCommands)throw new Error("Đã chạm giới hạn lệnh của phiên.");
  const affected=commandCells(cmd);
  if(affected.length>this.policy.maxCells||this.active.changedCells+affected.length>this.policy.maxCells)throw new Error("Đã chạm giới hạn ô tác động của phiên.");
  return true;
 }
 afterCommand(cmd){if(!this.active)return;const count=commandCells(cmd).length;this.active.executed++;this.active.remaining=Math.max(0,this.active.remaining-1);this.active.changedCells+=count;this.log("command",{type:cmd.type,line:cmd.line,cells:count});}
 finish(status="completed"){if(!this.active)return;this.log(status,{executed:this.active.executed,changedCells:this.active.changedCells});this.active=null;}
 emergencyStop(reason="Người dùng yêu cầu dừng khẩn cấp"){this.emergencyStopped=true;if(this.active){this.active.stopped=true;this.log("emergency-stop",{reason,executed:this.active.executed});}else this.log("emergency-stop",{reason});return this.status();}
 resetEmergencyStop(){if(this.active)throw new Error("Không thể đặt lại khi phiên macro còn hoạt động.");this.emergencyStopped=false;this.log("emergency-reset",{});return this.status();}
 status(){return {emergencyStopped:this.emergencyStopped,active:this.active?{...this.active}:null,policy:this.getPolicy()};}
 log(event,details={}){this.audit.push({at:this.clock(),event,details});if(this.audit.length>500)this.audit=this.audit.slice(-500);this.persist();}
 listAudit(limit=100){return this.audit.slice(-Math.max(1,Math.min(500,Number(limit)||100))).reverse().map(x=>({...x,details:{...x.details}}));}
 clearAudit(){this.audit=[];this.persist();}
}
