import { parseCellAddress } from "./macro-engine.js";
export class MacroRecorder {
  constructor(limit=2000){this.limit=limit;this.commands=[];this.recording=false;this.startedAt=null;}
  start(){this.commands=[];this.recording=true;this.startedAt=new Date().toISOString();return this.commands.length;}
  stop(){this.recording=false;return this.commands.length;}
  recordSet(cell,value){if(!this.recording)return false;if(!parseCellAddress(cell))return false;this.#push("SET "+cell.toUpperCase()+" "+formatValue(value));return true;}
  recordClear(cell){if(!this.recording||!parseCellAddress(cell))return false;this.#push("CLEAR "+cell.toUpperCase());return true;}
  recordPaste(startRow,startCol,rows){if(!this.recording)return 0;let count=0;for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++){const cell=toAddress(startRow+r,startCol+c);this.#push(rows[r][c]===""?"CLEAR "+cell:"SET "+cell+" "+formatValue(rows[r][c]));count++;}return count;}
  #push(command){if(this.commands.length>=this.limit){this.recording=false;throw new Error("Đã chạm giới hạn "+this.limit+" thao tác ghi.");}this.commands.push(command);}
  source(){return this.commands.length?this.commands.join("\n"):"";}
  get count(){return this.commands.length;}
}
function formatValue(value){
  const s=String(value);
  if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)||/^(TRUE|FALSE)$/i.test(s))return s;
  return JSON.stringify(s);
}
function toAddress(row,col){let n=col,s="";while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s+row;}
