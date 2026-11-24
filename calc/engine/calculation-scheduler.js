/** SGHT 18.25 — chunked, revision-safe calculation scheduler. */
export class CalculationScheduler {
 constructor({schedule=fn=>setTimeout(fn,0),cancelSchedule=id=>clearTimeout(id),chunkSize=64,onProgress=()=>{},onError=()=>{},onComplete=()=>{}}={}){
  this.schedule=schedule;this.cancelSchedule=cancelSchedule;this.chunkSize=Math.max(1,Math.floor(chunkSize)||64);this.onProgress=onProgress;this.onError=onError;this.onComplete=onComplete;
  this.pending=new Map();this.handle=null;this.revision=0;this.running=false;this.stats={queued:0,completed:0,failed:0,stale:0,chunks:0};this.startedAt=0;
 }
 cancel(reason="cancelled"){
  this.revision++;if(this.handle!==null){this.cancelSchedule(this.handle);this.handle=null;}
  const discarded=this.pending.size;this.pending.clear();this.running=false;this.lastCancelReason=reason;return discarded;
 }
 enqueue(plan,{revision=this.revision+1,getRevision=()=>revision,priority=()=>0,run=()=>{}}={}){
  this.cancel("superseded");const token=this.revision;this.getRevision=getRevision;this.pending.clear();
  const order=Array.isArray(plan?.order)?plan.order:[],unique=[...new Set(order)];
  const ranked=unique.map((key,index)=>({key,index,priority:Number(priority(key))||0})).sort((a,b)=>b.priority-a.priority||a.index-b.index);
  for(const item of ranked)this.pending.set(item.key,{...item,run});
  this.stats={queued:ranked.length,completed:0,failed:0,stale:0,chunks:0};this.startedAt=Date.now();this.running=ranked.length>0;
  if(!this.running){this.onComplete({...this.stats,elapsedMs:0,revision:token});return token;}
  this._schedule(token);return token;
 }
 _schedule(token){if(this.handle!==null||!this.running)return;this.handle=this.schedule(()=>{this.handle=null;this._runChunk(token);});}
 _runChunk(token){
  if(token!==this.revision)return;
  if(this.getRevision&&this.getRevision()!==token){this.stats.stale+=this.pending.size;this.pending.clear();this.running=false;this.onProgress({...this.stats,staleRevision:true,revision:token});return;}
  let count=0;
  while(this.pending.size&&count<this.chunkSize){
   const [key,job]=this.pending.entries().next().value;this.pending.delete(key);count++;
   try{job.run(key);this.stats.completed++;}catch(error){this.stats.failed++;this.onError(error,key);}
  }
  this.stats.chunks++;const snapshot={...this.stats,remaining:this.pending.size,revision:token,elapsedMs:Date.now()-this.startedAt};
  this.onProgress(snapshot);
  if(this.pending.size)this._schedule(token);else{this.running=false;this.onComplete(snapshot);}
 }
 getState(){return {...this.stats,remaining:this.pending.size,running:this.running,revision:this.revision,lastCancelReason:this.lastCancelReason||null};}
}
