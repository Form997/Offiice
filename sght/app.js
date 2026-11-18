import { evaluateFormula, FormulaError } from "./engine/core.js";
import { planMacro, executeMacro } from "./automation/macro-engine.js";
import { MacroRecorder } from "./automation/macro-recorder.js";
import { MacroLibrary } from "./automation/macro-library.js";
import { MacroHistory } from "./automation/macro-history.js";
import { MacroDebugger } from "./automation/macro-debugger.js";

const COLS = 16, ROWS = 40, STORAGE_KEY = "haidat-sght-workbook-v1";
const letters = n => { let s=""; while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);} return s; };
const address = (r,c) => letters(c)+r;
const parseAddress = a => { const m=/^([A-Z]+)([1-9][0-9]*)$/i.exec(a); if(!m)return null; let c=0; for(const ch of m[1].toUpperCase())c=c*26+ch.charCodeAt(0)-64; return {r:Number(m[2]),c}; };
let cells = Object.create(null), selected = "A1", sheetTitle = "Bảng tính chưa đặt tên", zoom=100, undoStack=[], redoStack=[];
const macroRecorder=new MacroRecorder();
const macroLibrary=new MacroLibrary();
const macroHistory=new MacroHistory();
let editingMacroId=null;
let macroExecution=false;
const grid=document.querySelector("#sheetGrid"),formulaInput=document.querySelector("#formulaInput"),cellAddress=document.querySelector("#cellAddress"),selectionInfo=document.querySelector("#selectionInfo"),saveStatus=document.querySelector("#saveStatus"),calcStatus=document.querySelector("#calcStatus");
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved&&saved.cells&&typeof saved.cells==="object"){cells=saved.cells;sheetTitle=String(saved.title||sheetTitle);}}catch{}document.querySelector("#sheetName").value=sheetTitle;}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({cells,title:sheetTitle,updatedAt:new Date().toISOString()}));saveStatus.textContent="Đã lưu trên thiết bị";}catch{saveStatus.textContent="Không đủ dung lượng lưu";}}
function snapshot(){undoStack.push(JSON.stringify(cells));if(undoStack.length>80)undoStack.shift();redoStack=[];}
function historyMove(from,to){if(!from.length)return;to.push(JSON.stringify(cells));cells=JSON.parse(from.pop());render();save();calcStatus.textContent="Đã khôi phục dữ liệu";}
function raw(a){return Object.hasOwn(cells,a)?String(cells[a]):"";}
function calculate(a,stack=new Set()){const value=raw(a);if(!value.startsWith("="))return value===""?"":coerce(value);if(stack.has(a))throw new FormulaError("#CYCLE!","Phát hiện công thức tham chiếu vòng.");stack.add(a);const ctx={getCell(ref){return calculate(ref.toUpperCase(),stack);},getRange(ref){const [s,e]=ref.toUpperCase().split(":").map(parseAddress);if(!s||!e)throw new FormulaError("#REF!","Vùng ô không hợp lệ.");const out=[];for(let r=Math.min(s.r,e.r);r<=Math.max(s.r,e.r);r++)for(let c=Math.min(s.c,e.c);c<=Math.max(s.c,e.c);c++)out.push(calculate(address(r,c),stack));return out;}};try{return evaluateFormula(value,ctx);}finally{stack.delete(a);}}
function coerce(v){if(typeof v!=="string")return v;if(v.trim()!==""&&Number.isFinite(Number(v)))return Number(v);return v;}
function display(a){try{const v=calculate(a);return typeof v==="number"?String(Number(v.toPrecision(12))):String(v??"");}catch(e){return e.code||"#CALC!";}}
function render(){const thead=grid.querySelector("thead"),tbody=grid.querySelector("tbody");thead.innerHTML="<tr><th class='corner'></th>"+Array.from({length:COLS},(_,i)=>"<th>"+letters(i+1)+"</th>").join("")+"</tr>";const rows=[];for(let r=1;r<=ROWS;r++){let html="<th class='row-head'>"+r+"</th>";for(let c=1;c<=COLS;c++){const a=address(r,c);html+="<td><button type='button' class='cell"+(a===selected?" selected":"")+"' data-cell='"+a+"' aria-label='Ô "+a+"'>"+escapeHtml(display(a))+"</button></td>";}rows.push("<tr>"+html+"</tr>");}tbody.innerHTML=rows.join("");updateSelection();}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function updateSelection(){cellAddress.textContent=selected;formulaInput.value=raw(selected);selectionInfo.textContent="Ô "+selected+" đang được chọn";grid.querySelectorAll(".cell.selected").forEach(x=>x.classList.remove("selected"));const cur=grid.querySelector("[data-cell='"+selected+"']");if(cur)cur.classList.add("selected");}
function choose(a){selected=a;updateSelection();formulaInput.focus();formulaInput.select();}
function setValue(a,v){snapshot();if(v===""){delete cells[a];if(!macroExecution)try{macroRecorder.recordClear(a);}catch(e){calcStatus.textContent=e.message;}}else{cells[a]=v;if(!macroExecution)try{macroRecorder.recordSet(a,v);}catch(e){calcStatus.textContent=e.message;}}render();save();calcStatus.textContent="Đã tính lại các ô phụ thuộc";}
function apply(){setValue(selected,formulaInput.value.trim()===""?"":formulaInput.value);updateSelection();}
function exportCsv(){const used=Object.keys(cells).map(parseAddress).filter(Boolean);const maxR=Math.max(1,...used.map(x=>x.r)),maxC=Math.max(1,...used.map(x=>x.c));const lines=[];for(let r=1;r<=maxR;r++){const row=[];for(let c=1;c<=maxC;c++){const v=raw(address(r,c));row.push('"'+v.replace(/"/g,'""')+'"');}lines.push(row.join(","));}const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=(sheetTitle||"sght").replace(/[\\/:*?"<>|]/g,"_")+".csv";link.click();URL.revokeObjectURL(url);}
function pasteRange(text){const start=parseAddress(selected);if(!start)return;snapshot();text.replace(/\r/g,"").split("\n").filter((line,i,arr)=>line!==""||i<arr.length-1).forEach((line,ri)=>line.split("\t").forEach((v,ci)=>{const a=address(start.r+ri,start.c+ci);if(start.r+ri<=1000&&start.c+ci<=100){if(v==="")delete cells[a];else cells[a]=v;}}));render();save();calcStatus.textContent="Đã dán vùng dữ liệu";}
function handlePaste(e){const text=e.clipboardData?.getData("text/plain");if(!text||!/[\t\n\r]/.test(text))return;e.preventDefault();pasteRange(text);}
grid.addEventListener("click",e=>{const b=e.target.closest("[data-cell]");if(b)choose(b.dataset.cell);});
formulaInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply();const p=parseAddress(selected);if(p)choose(address(p.r+1,p.c));}if(e.key==="Escape")updateSelection();});
document.querySelector("#applyFormula").addEventListener("click",apply);
grid.addEventListener("keydown",e=>{const b=e.target.closest("[data-cell]");if(!b)return;const p=parseAddress(b.dataset.cell);let r=p.r,c=p.c;if(e.key==="Enter"||e.key==="ArrowDown"){e.preventDefault();choose(address(Math.min(ROWS,r+1),c));}else if(e.key==="Tab"||e.key==="ArrowRight"){e.preventDefault();choose(address(r,Math.min(COLS,c+1)));}else if(e.key==="ArrowUp"){e.preventDefault();choose(address(Math.max(1,r-1),c));}else if(e.key==="ArrowLeft"){e.preventDefault();choose(address(r,Math.max(1,c-1)));}else if(e.key==="F2"){e.preventDefault();formulaInput.focus();}});
grid.addEventListener("paste",handlePaste);formulaInput.addEventListener("paste",handlePaste);
document.querySelector("#sheetName").addEventListener("change",e=>{sheetTitle=e.target.value.trim()||"Bảng tính chưa đặt tên";save();});
document.querySelector("#newSheet").addEventListener("click",()=>{if(!confirm("Tạo bảng tính mới? Dữ liệu hiện tại sẽ được thay thế trên thiết bị này."))return;snapshot();cells=Object.create(null);sheetTitle="Bảng tính mới";document.querySelector("#sheetName").value=sheetTitle;selected="A1";render();save();});
document.querySelector("#downloadCsv").addEventListener("click",exportCsv);
document.querySelector("#saveAction").addEventListener("click",()=>{save();calcStatus.textContent="Đã lưu bảng tính";});
document.querySelector("#undoAction").addEventListener("click",()=>historyMove(undoStack,redoStack));
document.querySelector("#redoAction").addEventListener("click",()=>historyMove(redoStack,undoStack));
document.querySelector("#clearAction").addEventListener("click",()=>setValue(selected,""));
document.querySelector("#copyAction").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(raw(selected));calcStatus.textContent="Đã sao chép ô "+selected;}catch{formulaInput.focus();formulaInput.select();calcStatus.textContent="Hãy sao chép nội dung đang chọn";}});
document.querySelector("#cutAction").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(raw(selected));setValue(selected,"");}catch{calcStatus.textContent="Không thể truy cập bảng tạm";}});
document.querySelector("#pasteAction").addEventListener("click",async()=>{try{const t=await navigator.clipboard.readText();if(t)pasteRange(t);}catch{calcStatus.textContent="Hãy dùng thao tác Dán của thiết bị";}});
for(const [id,fn] of [["sumAction","SUM"],["averageAction","AVERAGE"],["countAction","COUNT"]])document.querySelector("#"+id).addEventListener("click",()=>{const p=parseAddress(selected),range=p?address(Math.max(1,p.r-4),p.c)+":"+address(p.r,p.c):"A1:A5";formulaInput.value="="+fn+"("+range+")";formulaInput.focus();});
document.querySelector("#zoomIn").addEventListener("click",()=>setZoom(zoom+10));document.querySelector("#zoomOut").addEventListener("click",()=>setZoom(zoom-10));document.querySelector("#zoomReset").addEventListener("click",()=>setZoom(100));
function setZoom(v){zoom=Math.max(60,Math.min(160,v));document.querySelector("#zoomValue").textContent=zoom+"%";grid.style.zoom=String(zoom/100);}
document.querySelectorAll(".ribbon-tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".ribbon-tab").forEach(x=>x.classList.toggle("active",x===tab));calcStatus.textContent="Nhóm công cụ: "+tab.textContent;}));
document.querySelector("#addSheet").addEventListener("click",()=>{calcStatus.textContent="Tính năng nhiều trang tính sẽ được bổ sung ở phiên bản kế tiếp.";});
const macroSource=document.querySelector("#macroSource"),macroPreview=document.querySelector("#macroPreview"),macroResult=document.querySelector("#macroResult"),macroPanel=document.querySelector("#macroPanel");
document.querySelector("#openMacro").addEventListener("click",()=>{macroPanel.hidden=false;macroSource.focus();});
const recordButton=document.querySelector("#recordMacro"),stopRecordButton=document.querySelector("#stopMacro"),recordStatus=document.querySelector("#recordStatus");
recordButton.addEventListener("click",()=>{macroRecorder.start();recordButton.disabled=true;stopRecordButton.disabled=false;recordStatus.textContent="Đang ghi thao tác…";macroResult.textContent="Bắt đầu ghi. Chọn ô, nhập dữ liệu hoặc dán vùng; thao tác sẽ được ghi thành lệnh.";});
stopRecordButton.addEventListener("click",()=>{macroRecorder.stop();recordButton.disabled=false;stopRecordButton.disabled=true;macroSource.value=macroRecorder.source();macroPreview.textContent=macroRecorder.count?macroRecorder.source():"Chưa ghi nhận thao tác nào.";recordStatus.textContent="Đã dừng · "+macroRecorder.count+" thao tác";macroResult.textContent="Đã chuyển thao tác thành mã macro. Hãy kiểm tra trước khi chạy.";});
document.querySelector("#closeMacro").addEventListener("click",()=>{macroPanel.hidden=true;});
const macroName=document.querySelector("#macroName"),macroDescription=document.querySelector("#macroDescription"),macroList=document.querySelector("#macroList"),macroLibraryStatus=document.querySelector("#macroLibraryStatus"),macroFile=document.querySelector("#macroFile");
const historyPanel=document.querySelector("#macroHistoryPanel"),historyTitle=document.querySelector("#macroHistoryTitle"),historyList=document.querySelector("#macroHistoryList"),historyCompare=document.querySelector("#historyCompare"),historyFrom=document.querySelector("#historyFrom"),historyTo=document.querySelector("#historyTo"),historyDiff=document.querySelector("#historyDiff");
let historyMacroId=null;
function renderMacroLibrary(){
  const items=macroLibrary.list();macroList.replaceChildren();
  if(!items.length){const empty=document.createElement("p");empty.className="macro-empty";empty.textContent="Thư viện chưa có macro. Hãy lưu macro đầu tiên.";macroList.append(empty);return;}
  for(const item of items){
    const card=document.createElement("article");card.className="macro-card";
    const info=document.createElement("div");info.className="macro-card-info";
    const title=document.createElement("b");title.textContent=item.name;
    const desc=document.createElement("small");desc.textContent=(item.description||"Chưa có mô tả")+" · v"+item.version;
    info.append(title,desc);
    const actions=document.createElement("div");actions.className="macro-card-actions";
    for(const [action,label] of [["load","Mở"],["history","Lịch sử"],["duplicate","Nhân bản"],["export","Xuất"],["delete","Xóa"]]){
      const btn=document.createElement("button");btn.type="button";btn.className="quiet";btn.dataset.action=action;btn.dataset.id=item.id;btn.textContent=label;actions.append(btn);
    }
    card.append(info,actions);macroList.append(card);
  }
}
function saveMacroToLibrary(asNew=false){
  try{
    const item=macroLibrary.save({id:asNew?null:editingMacroId,name:macroName.value,description:macroDescription.value,source:macroSource.value});
    editingMacroId=item.id;macroName.value=item.name;macroDescription.value=item.description;macroHistory.record(item,asNew?"create":"save",asNew?"Tạo macro mới":"Lưu từ trình soạn thảo");renderMacroLibrary();macroLibraryStatus.textContent="Đã lưu “"+item.name+"” · phiên bản "+item.version; 
  }catch(e){macroLibraryStatus.textContent="Không lưu được: "+e.message;}
}
document.querySelector("#saveMacroLibrary").addEventListener("click",()=>saveMacroToLibrary(false));
document.querySelector("#saveMacroAsNew").addEventListener("click",()=>saveMacroToLibrary(true));
document.querySelector("#exportMacroLibrary").addEventListener("click",()=>{
  try{downloadText("sght-macro-library.json",macroLibrary.exportAll(),"application/json");macroLibraryStatus.textContent="Đã xuất toàn bộ thư viện.";}catch(e){macroLibraryStatus.textContent=e.message;}
});
document.querySelector("#importMacroLibrary").addEventListener("click",()=>macroFile.click());
macroFile.addEventListener("change",async()=>{
  const file=macroFile.files?.[0];if(!file)return;
  try{const count=macroLibrary.importText(await file.text());for(const item of macroLibrary.list())if(!macroHistory.list(item.id).length)macroHistory.record(item,"import","Nhập từ tệp thư viện");renderMacroLibrary();macroLibraryStatus.textContent="Đã nhập "+count+" macro.";}catch(e){macroLibraryStatus.textContent="Nhập thất bại: "+e.message;}finally{macroFile.value="";}
});
macroList.addEventListener("click",e=>{
  const btn=e.target.closest("button[data-action]");if(!btn)return;
  const {action,id}=btn.dataset;
  try{
    if(action==="load"){
      const item=macroLibrary.get(id);if(!item)throw new Error("Macro không còn tồn tại.");
      editingMacroId=item.id;macroName.value=item.name;macroDescription.value=item.description;macroSource.value=item.source;macroPreview.textContent="Đã nạp macro vào trình soạn thảo. Hãy kiểm tra trước khi chạy.";macroLibraryStatus.textContent="Đang chỉnh sửa: "+item.name;
    }else if(action==="history"){
      openMacroHistory(id);
    }else if(action==="duplicate"){
      const item=macroLibrary.duplicate(id);macroHistory.record(item,"duplicate","Nhân bản từ macro khác");renderMacroLibrary();macroLibraryStatus.textContent="Đã nhân bản thành “"+item.name+"”.";
    }else if(action==="export"){
      const item=macroLibrary.get(id);downloadText((item?.name||"macro").replace(/[^a-z0-9_-]+/gi,"_")+".sghtmacro.json",macroLibrary.exportOne(id),"application/json");macroLibraryStatus.textContent="Đã xuất macro.";
    }else if(action==="delete"){
      const item=macroLibrary.get(id);if(!item)return;if(!confirm("Xóa macro “"+item.name+"” khỏi thư viện trên thiết bị này?"))return;
      macroLibrary.delete(id);macroHistory.delete(id);if(editingMacroId===id){editingMacroId=null;macroName.value="";macroDescription.value="";}renderMacroLibrary();macroLibraryStatus.textContent="Đã xóa macro.";
    }
  }catch(err){macroLibraryStatus.textContent=err.message;}
});
function openMacroHistory(id){
 const item=macroLibrary.get(id);if(!item)throw new Error("Macro không còn tồn tại.");
 historyMacroId=id;if(!macroHistory.list(id).length)macroHistory.record(item,"baseline","Tạo mốc ban đầu từ macro hiện có");historyTitle.textContent="Lịch sử · "+item.name;const versions=macroHistory.list(id);historyList.replaceChildren();historyFrom.replaceChildren();historyTo.replaceChildren();
 if(!versions.length){const p=document.createElement("p");p.textContent="Macro này chưa có lịch sử. Hãy lưu lại để tạo phiên bản đầu tiên.";historyList.append(p);historyPanel.hidden=false;return;}
 for(const v of versions){const row=document.createElement("div");row.className="history-row";const info=document.createElement("div");const title=document.createElement("b");title.textContent="Phiên bản "+v.version+" · "+v.action;const meta=document.createElement("small");meta.textContent=new Date(v.createdAt).toLocaleString()+" · "+v.source.split("\\n").length+" dòng"+(v.note?" · "+v.note:"");info.append(title,meta);const view=document.createElement("button");view.type="button";view.className="quiet";view.textContent="Xem";view.addEventListener("click",()=>{historyDiff.textContent=v.source;});const restore=document.createElement("button");restore.type="button";restore.className="quiet";restore.textContent="Khôi phục";restore.addEventListener("click",()=>restoreMacroVersion(id,v.version));row.append(info,view,restore);historyList.append(row);}
 for(const v of versions){for(const select of [historyFrom,historyTo]){const option=document.createElement("option");option.value=String(v.version);option.textContent="Phiên bản "+v.version;select.append(option);}}
 historyFrom.value=String(versions.length>1?versions[versions.length-2].version:versions[0].version);historyTo.value=String(versions[versions.length-1].version);historyDiff.textContent="Chọn hai phiên bản rồi bấm So sánh để xem khác biệt.";historyPanel.hidden=false;
}
function restoreMacroVersion(id,version){
 const current=macroLibrary.get(id),target=macroHistory.restore(id,version);if(!current)throw new Error("Macro không còn tồn tại.");
 if(!confirm("Khôi phục nội dung phiên bản "+version+"? Nội dung hiện tại sẽ được lưu thành một phiên bản mới, không bị ghi đè trong lịch sử."))return;
 try{const restored=macroLibrary.save({id,name:target.name,description:target.description,source:target.source});macroHistory.record(restored,"restore","Khôi phục từ phiên bản "+version);editingMacroId=restored.id;macroName.value=restored.name;macroDescription.value=restored.description;macroSource.value=restored.source;renderMacroLibrary();openMacroHistory(id);macroLibraryStatus.textContent="Đã tạo phiên bản "+restored.version+" từ bản "+version+"."; }catch(e){macroLibraryStatus.textContent="Khôi phục thất bại: "+e.message;}
}
document.querySelector("#closeMacroHistory").addEventListener("click",()=>{historyPanel.hidden=true;});
historyCompare.addEventListener("click",()=>{try{const diff=macroHistory.compare(historyMacroId,historyFrom.value,historyTo.value);historyDiff.replaceChildren();if(!diff.changes.length){historyDiff.textContent="Hai phiên bản không có khác biệt về mã lệnh.";return;}for(const change of diff.changes){const line=document.createElement("div");line.className="diff-line "+change.type;const label=document.createElement("b");label.textContent="Dòng "+change.line+" · "+(change.type==="added"?"Thêm":change.type==="removed"?"Xóa":"Sửa");const before=document.createElement("pre");before.textContent=change.before===null?"(không có)":change.before;const after=document.createElement("pre");after.textContent=change.after===null?"(không có)":change.after;line.append(label,before,after);historyDiff.append(line);}}catch(e){historyDiff.textContent=e.message;}});
document.querySelector("#exportMacroHistory").addEventListener("click",()=>{try{downloadText("sght-macro-history.json",macroHistory.exportOne(historyMacroId),"application/json");}catch(e){macroLibraryStatus.textContent=e.message;}});
function downloadText(filename,content,type){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.querySelector("#openMacro").addEventListener("click",renderMacroLibrary);
renderMacroLibrary();

let activeMacroDebugger=null,macroSnapshotOpen=false;
const debugStatus=document.querySelector("#debugStatus"),debugTrace=document.querySelector("#debugTrace");
const debugStepButton=document.querySelector("#debugStep"),debugContinueButton=document.querySelector("#debugContinue"),debugStopButton=document.querySelector("#debugStop"),debugRollbackButton=document.querySelector("#debugRollback");
const breakpointInput=document.querySelector("#breakpointLines"),watchInput=document.querySelector("#watchCells"),watchOutput=document.querySelector("#watchOutput");
function parseNumberList(value){return [...new Set(String(value||"").split(/[;,\\s]+/).map(x=>x.trim()).filter(Boolean).map(Number))];}
function parseWatchList(value){return [...new Set(String(value||"").split(/[;,\\s]+/).map(x=>x.trim().toUpperCase()).filter(Boolean))];}
function paintDebug(state){
 const hit=state.breakpointHit?" · DỪNG tại breakpoint dòng "+state.breakpointHit.line:"";
 debugStatus.textContent="Trạng thái: "+state.status+" · Bước "+state.currentStep+"/"+state.totalSteps+" · "+state.changedCells+" lượt ô"+hit;
 debugTrace.replaceChildren();const entries=state.trace.slice(-30);
 if(!entries.length){const p=document.createElement("p");p.textContent="Chưa có bước thực thi.";debugTrace.append(p);}
 for(const item of entries){const row=document.createElement("div");row.className="debug-trace-row";const head=document.createElement("b");head.textContent="Bước "+item.step+" · dòng "+item.line+" · "+item.type;row.append(head);for(const change of item.changes){const detail=document.createElement("small");detail.textContent=change.cell+": "+String(change.before)+" → "+String(change.after);row.append(detail);}debugTrace.append(row);}
 watchOutput.replaceChildren();if(!state.watches.length){const p=document.createElement("small");p.textContent="Chưa có ô nào được theo dõi.";watchOutput.append(p);}for(const item of state.watches){const line=document.createElement("div");line.className="watch-value";const name=document.createElement("b");name.textContent=item.cell;const value=document.createElement("span");value.textContent=String(item.value);line.append(name,value);watchOutput.append(line);}
 const active=state.status==="paused";debugStepButton.disabled=!active;debugContinueButton.disabled=!active;debugStopButton.disabled=!active;debugRollbackButton.disabled=!(state.trace.length&&["paused","completed","stopped","error"].includes(state.status));
}
function macroAdapter(){return {get:a=>raw(a),set:(a,v)=>{cells[a]=v;},clear:a=>{delete cells[a];}};}
function applyDebugConfiguration(){
 if(!activeMacroDebugger)return;
 try{activeMacroDebugger.setBreakpoints(parseNumberList(breakpointInput.value));activeMacroDebugger.setWatches(parseWatchList(watchInput.value));paintDebug(activeMacroDebugger.state());macroResult.textContent="Đã cập nhật breakpoint và danh sách ô theo dõi.";}
 catch(e){macroResult.textContent="Cấu hình debugger chưa hợp lệ: "+e.message;}
}
document.querySelector("#applyDebugConfig").addEventListener("click",applyDebugConfiguration);
function finishMacroRun(state){if(["completed","stopped","error","rolled_back"].includes(state.status)){macroExecution=false;render();save();}paintDebug(state);if(state.status==="completed")macroResult.textContent="Hoàn tất "+state.totalSteps+" lệnh. Có thể dùng Hoàn tác để phục hồi toàn phiên.";else if(state.status==="stopped")macroResult.textContent="Đã dừng tại bước "+state.currentStep+". Có thể hoàn tác toàn phiên ngay.";else if(state.status==="rolled_back"){macroResult.textContent="Đã hoàn tác toàn bộ thay đổi của phiên gỡ lỗi.";if(macroSnapshotOpen){undoStack.pop();macroSnapshotOpen=false;}}else if(state.status==="error")macroResult.textContent="Lỗi khi thực thi. Có thể hoàn tác các bước trước đó.";}
function startDebugSession(){const plan=planMacro(macroSource.value);if(!confirm("Phê duyệt phiên Macro Debugger gồm "+plan.length+" lệnh? Chưa có thay đổi nào được thực hiện."))return false;snapshot();macroSnapshotOpen=true;activeMacroDebugger=new MacroDebugger(macroSource.value,macroAdapter());activeMacroDebugger.setBreakpoints(parseNumberList(breakpointInput.value));activeMacroDebugger.setWatches(parseWatchList(watchInput.value));activeMacroDebugger.start({approved:true});macroExecution=true;paintDebug(activeMacroDebugger.state());macroResult.textContent="Đã phê duyệt. Chạy từng bước hoặc tiếp tục đến breakpoint.";return true;}
document.querySelector("#previewMacro").addEventListener("click",()=>{try{const plan=planMacro(macroSource.value);macroPreview.textContent=plan.map((x,i)=>(i+1)+". Dòng "+x.line+" · "+(x.type==="SET"?"Ghi "+x.cell+" = "+String(x.value):x.type==="COPY"?"Chép "+x.source+" → "+x.target:x.type==="CLEAR"?"Xóa "+x.range:"Tính tổng "+x.range+" → "+x.target)).join("\n");macroResult.textContent="Đã kiểm tra "+plan.length+" lệnh. Chưa thay đổi dữ liệu.";}catch(e){macroPreview.textContent="";macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
document.querySelector("#runMacro").addEventListener("click",()=>{try{if(!activeMacroDebugger||activeMacroDebugger.state().status!=="paused"){if(!startDebugSession())return;}finishMacroRun(activeMacroDebugger.continue());}catch(e){macroExecution=false;const state=activeMacroDebugger?.state();if(state)finishMacroRun(state);macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
document.querySelector("#debugStart").addEventListener("click",()=>{try{activeMacroDebugger=null;if(startDebugSession())macroResult.textContent="Phiên đã sẵn sàng. Nhấn “Chạy 1 bước” hoặc “Tiếp tục”.";}catch(e){macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
debugStepButton.addEventListener("click",()=>{try{const state=activeMacroDebugger.step();render();save();if(state.status==="completed")finishMacroRun(state);else paintDebug(state);}catch(e){finishMacroRun(activeMacroDebugger.state());macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
debugContinueButton.addEventListener("click",()=>{try{const state=activeMacroDebugger.continue();if(state.breakpointHit)macroResult.textContent="Đã chạm breakpoint ở dòng "+state.breakpointHit.line+". Kiểm tra giá trị Watch, rồi bấm Tiếp tục để đi qua điểm dừng.";finishMacroRun(state);}catch(e){finishMacroRun(activeMacroDebugger.state());macroResult.textContent=(e.code||"LỖI")+" · "+e.message;}});
debugStopButton.addEventListener("click",()=>finishMacroRun(activeMacroDebugger.stop()));
debugRollbackButton.addEventListener("click",()=>{if(!activeMacroDebugger||!confirm("Hoàn tác toàn bộ thay đổi do phiên gỡ lỗi này tạo ra?"))return;finishMacroRun(activeMacroDebugger.rollback());activeMacroDebugger=null;});
paintDebug({status:"ready",currentStep:0,totalSteps:0,changedCells:0,trace:[],watches:[]});

load();render();