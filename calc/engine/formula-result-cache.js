/** SGHT 18.26 — bounded LRU formula-result cache with lightweight telemetry. */
function estimateValueBytes(value){
 if(value===null||value===undefined)return 8;
 if(typeof value==="number"||typeof value==="boolean")return 8;
 if(typeof value==="string")return 16+value.length*2;
 if(Array.isArray(value)){let n=24;for(const item of value)n+=estimateValueBytes(item);return n;}
 if(typeof value==="object")return 64;
 return 16;
}
export class FormulaResultCache {
 constructor({maxEntries=50000,maxBytes=16*1024*1024}={}){
  this.maxEntries=Math.max(1,Math.floor(maxEntries)||50000);this.maxBytes=Math.max(1024,Math.floor(maxBytes)||16*1024*1024);
  this.entries=new Map();this.weights=new Map();this.bytes=0;this.counters={hits:0,misses:0,sets:0,evictions:0,invalidations:0,oversizedSkips:0};
 }
 has(key){
  if(!this.entries.has(key)){this.counters.misses++;return false;}
  const value=this.entries.get(key);this.entries.delete(key);this.entries.set(key,value);this.counters.hits++;return true;
 }
 get(key){
  if(!this.entries.has(key))return undefined;
  const value=this.entries.get(key);this.entries.delete(key);this.entries.set(key,value);return value;
 }
 set(key,value){
  const weight=32+String(key).length*2+estimateValueBytes(value);
  if(weight>this.maxBytes){this.delete(key,false);this.counters.oversizedSkips++;return this;}
  this.delete(key,false);
  this.entries.set(key,value);this.weights.set(key,weight);this.bytes+=weight;this.counters.sets++;
  while(this.entries.size>this.maxEntries||this.bytes>this.maxBytes){
   const oldest=this.entries.keys().next().value;if(oldest===undefined)break;
   this.delete(oldest,false);this.counters.evictions++;
  }
  return this;
 }
 delete(key,countInvalidation=true){
  if(!this.entries.has(key))return false;
  this.entries.delete(key);this.bytes-=this.weights.get(key)||0;this.weights.delete(key);
  if(countInvalidation)this.counters.invalidations++;
  return true;
 }
 clear(){this.entries.clear();this.weights.clear();this.bytes=0;}
 stats(){
  const requests=this.counters.hits+this.counters.misses;
  return {...this.counters,entries:this.entries.size,maxEntries:this.maxEntries,estimatedBytes:this.bytes,maxBytes:this.maxBytes,hitRate:requests?this.counters.hits/requests:0};
 }
}
