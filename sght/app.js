import { evaluateFormula, FormulaError } from "./engine/core.js";

const COLS = 16, ROWS = 40, STORAGE_KEY = "haidat-sght-workbook-v1";
const letters = n => { let s=""; while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);} return s; };
const address = (r,c) => letters(c)+r;
const parseAddress = a => { const m=/^([A-Z]+)([1-9][0-9]*)$/i.exec(a); if(!m)return null; let c=0; for(const ch of m[1].toUpperCase())c=c*26+ch.charCodeAt(0)-64; return {r:Number(m[2]),c}; };
let cells = Object.create(null), selected = "A1", sheetTitle = "Bảng tính chưa đặt tên";
const grid = document.querySelector("#sheetGrid"), formulaInput = document.querySelector("#formulaInput");
const cellAddress = document.querySelector("#cellAddress"), selectionInfo = document.querySelector("#selectionInfo");
const saveStatus = document.querySelector("#saveStatus"), calcStatus = document.querySelector("#calcStatus");

function load() {
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); if(saved&&saved.cells&&typeof saved.cells==="object"){cells=saved.cells;sheetTitle=String(saved.title||sheetTitle);} } catch {}
  document.querySelector("#sheetName").value=sheetTitle;
}
function save() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify({cells,title:sheetTitle,updatedAt:new Date().toISOString()})); saveStatus.textContent="Đã lưu trên thiết bị"; }
  catch { saveStatus.textContent="Không đủ dung lượng lưu"; }
}
function raw(a){return Object.hasOwn(cells,a)?String(cells[a]):"";}
function calculate(a, stack=new Set()) {
  const value=raw(a); if(!value.startsWith("=")) return value===""?"":coerce(value);
  if(stack.has(a)) throw new FormulaError("#CYCLE!","Phát hiện công thức tham chiếu vòng.");
  stack.add(a);
  const ctx={
    getCell(ref){const key=ref.toUpperCase();return calculate(key,stack);},
    getRange(ref){const [start,end]=ref.toUpperCase().split(":").map(parseAddress);if(!start||!end)throw new FormulaError("#REF!","Vùng ô không hợp lệ.");const out=[];for(let r=Math.min(start.r,end.r);r<=Math.max(start.r,end.r);r++)for(let c=Math.min(start.c,end.c);c<=Math.max(start.c,end.c);c++)out.push(calculate(address(r,c),stack));return out;}
  };
  try { return evaluateFormula(value,ctx); } finally { stack.delete(a); }
}
function coerce(v){if(typeof v!=="string")return v; if(v.trim()!==""&&Number.isFinite(Number(v)))return Number(v);return v;}
function display(a){try{const v=calculate(a);return typeof v==="number"?String(Number(v.toPrecision(12))):String(v??"");}catch(e){return e.code||"#CALC!";}}
function render() {
  const thead=grid.querySelector("thead"), tbody=grid.querySelector("tbody");
  thead.innerHTML="<tr><th class='corner'></th>"+Array.from({length:COLS},(_,i)=>`<th>${letters(i+1)}</th>`).join("")+"</tr>";
  const rows=[];
  for(let r=1;r<=ROWS;r++){let cellsHtml=`<th class="row-head">${r}</th>`;for(let c=1;c<=COLS;c++){const a=address(r,c);cellsHtml+=`<td><button type="button" class="cell${a===selected?" selected":""}" data-cell="${a}" aria-label="Ô ${a}">${escapeHtml(display(a))}</button></td>`;}rows.push("<tr>"+cellsHtml+"</tr>");}
  tbody.innerHTML=rows.join("");
  updateSelection();
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function updateSelection(){
  cellAddress.textContent=selected;formulaInput.value=raw(selected);
  selectionInfo.textContent="Ô "+selected+" đang được chọn";
  grid.querySelectorAll(".cell.selected").forEach(x=>x.classList.remove("selected"));
  const current=grid.querySelector(`[data-cell="${selected}"]`);if(current)current.classList.add("selected");
}
function choose(a){selected=a;updateSelection();formulaInput.focus();formulaInput.select();}
function setValue(a,v){if(v==="")delete cells[a];else cells[a]=v;render();save();calcStatus.textContent="Đã tính lại các ô phụ thuộc";}
function apply(){setValue(selected,formulaInput.value.trim()===""?"":formulaInput.value);updateSelection();}
grid.addEventListener("click",e=>{const b=e.target.closest("[data-cell]");if(b)choose(b.dataset.cell);});
formulaInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply();const p=parseAddress(selected);if(p)choose(address(p.r+1,p.c));}if(e.key==="Escape")updateSelection();});
document.querySelector("#applyFormula").addEventListener("click",apply);
grid.addEventListener("keydown",e=>{const b=e.target.closest("[data-cell]");if(!b)return;const p=parseAddress(b.dataset.cell);let r=p.r,c=p.c;if(e.key==="Enter"){e.preventDefault();choose(address(Math.min(ROWS,r+1),c));}else if(e.key==="Tab"){e.preventDefault();choose(address(r,Math.min(COLS,c+1)));}else if(e.key==="ArrowDown"){e.preventDefault();choose(address(Math.min(ROWS,r+1),c));}else if(e.key==="ArrowUp"){e.preventDefault();choose(address(Math.max(1,r-1),c));}else if(e.key==="ArrowRight"){e.preventDefault();choose(address(r,Math.min(COLS,c+1)));}else if(e.key==="ArrowLeft"){e.preventDefault();choose(address(r,Math.max(1,c-1)));}else if(e.key==="F2"){e.preventDefault();formulaInput.focus();}});
grid.addEventListener("paste",e=>{
  const text=e.clipboardData?.getData("text/plain");if(!text)return;e.preventDefault();
  const start=parseAddress(selected);if(!start)return;
  text.replace(/\r/g,"").split("\n").filter((line,i,arr)=>line!==""||i<arr.length-1).forEach((line,ri)=>line.split("\t").forEach((v,ci)=>{const a=address(start.r+ri,start.c+ci);if(start.r+ri<=1000&&start.c+ci<=100) {if(v==="")delete cells[a];else cells[a]=v;}}));
  render();save();calcStatus.textContent="Đã dán vùng dữ liệu";
});
document.querySelector("#sheetName").addEventListener("change",e=>{sheetTitle=e.target.value.trim()||"Bảng tính chưa đặt tên";save();});
document.querySelector("#newSheet").addEventListener("click",()=>{if(!confirm("Tạo bảng tính mới? Dữ liệu hiện tại sẽ được thay thế trên thiết bị này."))return;cells=Object.create(null);sheetTitle="Bảng tính mới";document.querySelector("#sheetName").value=sheetTitle;selected="A1";render();save();});
document.querySelector("#downloadCsv").addEventListener("click",()=>{
  const used=Object.keys(cells).map(parseAddress).filter(Boolean);const maxR=Math.max(1,...used.map(x=>x.r)),maxC=Math.max(1,...used.map(x=>x.c));
  const lines=[];for(let r=1;r<=maxR;r++){const row=[];for(let c=1;c<=maxC;c++){const v=raw(address(r,c));row.push('"'+v.replace(/"/g,'""')+'"');}lines.push(row.join(","));}
  const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=(sheetTitle||"sght").replace(/[\\/:*?"<>|]/g,"_")+".csv";link.click();URL.revokeObjectURL(url);
});
load();render();