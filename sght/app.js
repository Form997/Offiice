import { registerBrowserPasskey, authenticateBrowserPasskey } from "./engine/webauthn-browser.js";
import { runFormulaBenchmark, collectFormulaDiagnostics, formatFormulaDiagnostics } from "./engine/formula-diagnostics.js";
import { analyzeFormulaError, scanWorkbookFormulaErrors, formatFormulaErrorReport } from "./engine/formula-error-intelligence.js";
import { suggestFormulaRepairs, validateRepairApproval } from "./engine/formula-fix-suggestions.js";
import { appendRepairAudit, exportRepairAudit } from "./engine/repair-audit.js";
import { normalizeFormulaVersions, recordFormulaVersion, getFormulaCellVersions, compareFormulaVersions, exportFormulaVersions, groupFormulaVersionTransactions } from "./engine/formula-version-history.js";
import { collectFormulaVersionChanges } from "./engine/history-version-sync.js";
import { buildFormulaTransactionRestorePlan } from "./engine/formula-version-history.js";
import { auditFormulaVersionIntegrity, exportFormulaVersionIntegrityReport } from "./engine/formula-version-integrity.js";
import { createFormulaAuditArchive, verifyFormulaAuditArchiveChain, verifyAndAppendFormulaAuditArchive, exportFormulaAuditArchive, parseFormulaAuditArchiveBundle } from "./engine/formula-audit-archive.js";
import { generateFormulaAuditSigningKeys, exportEncryptedFormulaAuditPrivateKey, importEncryptedFormulaAuditPrivateKey, signFormulaAuditArchive, verifyFormulaAuditSignature, exportFormulaAuditSignaturePackage, parseFormulaAuditSignaturePackage } from "./engine/formula-audit-signature.js";
import { createEmptyIdentityRegistry, validateIdentityRegistry, registerFormulaIdentity, approveFormulaIdentity, registerFormulaIdentityKey, revokeFormulaIdentityKey, rotateFormulaIdentityKey, expireFormulaIdentityKeys, evaluateFormulaIdentityKey, exportFormulaIdentityRegistry, importFormulaIdentityRegistry } from "./engine/identity-registry.js";
import { createEmptyAuthStore, validateAuthStore, createAuthUser, loginAuthUser, logoutAuthUser, assignAuthRole, setAuthUserStatus, authorize, exportAuthAudit, ROLES } from "./engine/auth-rbac.js";
import { SghtAuthApiClient } from "./engine/auth-api-client.js";
import { consumeAccountAction, validateNewPassword } from "./engine/account-lifecycle.js";
import { evaluateFormula, FormulaError, listFormulaFunctions } from "./engine/core.js";
import { buildDependencyGraph, updateDependencyNode, planRecalculation } from "./engine/dependency-engine.js";
import { CalculationScheduler } from "./engine/calculation-scheduler.js";
import { FormulaResultCache } from "./engine/formula-result-cache.js";
import { normalizeCellFormat, cellFormatStyle, getRangeBounds, expandRange, encodeTSV, parseTSV } from "./engine/cell-format.js";
import { captureRange, pasteCapturedRange } from "./engine/range-clipboard.js";
import { fillRange } from "./engine/fill-series.js";
import { serializeWorkbook, restoreWorkbook, pushHistoryEntry, moveHistory } from "./engine/history.js";
import { searchCells, replaceCells } from "./engine/search.js";
import { sortRangeRows, filterRangeRows, removeDuplicateRows, defineStructuredRange, uniqueColumnValues, summarizeByGroup, summarizeByGroups, buildPivotTable, expandStructuredRange, structuredColumnRange, expandStructuredReferences } from "./engine/data-tools.js";
import { getVirtualWindow } from "./engine/sparse-grid.js";
import { GRID_GEOMETRY_DEFAULTS, createGridGeometry, getAxisOffset, getAxisSize, findAxisIndexAtOffset, setAxisSize, setAxisSizes, setAxisSizeMap, resetAxisSize, serializeGridGeometry } from "./engine/grid-geometry.js";
import { copyAxisDimension, applyCopiedAxisDimension } from "./engine/axis-dimension-clipboard.js";
import { calculateAxisResizeGuidePosition } from "./engine/axis-resize-guide.js";
import { expandGridCapacity } from "./engine/grid-capacity.js";
import { buildFreezeLayout, normalizeFreezeSettings } from "./engine/freeze-panes.js";
import { normalizeSplitSettings, synchronizedAxis, splitRatioFromPointer, normalizeQuadrantPositions, synchronizeQuadrantPositions, quadrantScrollTargets } from "./engine/split-panes.js";
import { planMacro, executeMacro } from "./automation/macro-engine.js";
import { MacroRecorder } from "./automation/macro-recorder.js";
import { MacroLibrary } from "./automation/macro-library.js";
import { MacroHistory } from "./automation/macro-history.js";
import { MacroDebugger } from "./automation/macro-debugger.js";
import { MacroSecurityCenter } from "./automation/macro-security.js";
import { analyzeWorkbook, suggestFormulas, draftMacroFromVietnamese } from "./ai/ai-intelligence.js";
import { fitDoseResponse, compareDoseResponse, fitMitscherlichDoseResponse, doseResponseDiagnostics } from "./ai/dose-response.js";
import { fitResponseSurface } from "./ai/response-surface.js";
import { buildChartData, buildMultiSeriesChart } from "./ai/chart-engine.js";
import { buildPivotChartModel } from "./ai/pivot-chart.js";
import { normalizePivotChartStudio, parsePivotChartColors, formatPivotChartNumber, DEFAULT_PIVOT_CHART_COLORS } from "./ai/pivot-chart-studio.js";
import { normalizePivotCharts, createPivotChart, duplicatePivotChart, renamePivotChart, removePivotChart, movePivotChart, updatePivotChartSettings, getActivePivotChart } from "./ai/pivot-chart-manager.js";
import { normalizeWorkbookSheets, addWorkbookSheet, renameWorkbookSheet, rewriteWorkbookSheetReferences, removeWorkbookSheet, updateWorkbookSheet, getWorkbookSheet, workbookFieldKey } from "./engine/workbook-sheets.js";
import { normalizeDashboard, createDashboardWidget, removeDashboardWidget, moveDashboardWidget, resizeDashboardWidget, updateDashboardWidget, setDashboardSharedFilter, setDashboardCrossFilter, clearDashboardCrossFilters, removeDashboardCrossFilter, setDashboardPresentation, moveDashboardWidgetToIndex, saveDashboardTemplate, loadDashboardTemplate } from "./ai/dashboard-layout.js";
import { ChartPresetStore } from "./ai/chart-presets.js";
import { buildSurface3DData, projectSurface3D } from "./ai/chart-surface-3d.js";
import { buildContourData, summarizeErrorBars, regressionUncertainty } from "./ai/chart-uncertainty.js";
import { pearsonCorrelation, simpleLinearRegression, oneWayAnova, multipleLinearRegression, fisherLSD, twoWayAnovaBalanced, leveneTest, brownForsytheTest, linearTrendForecast, tukeyHSD, gamesHowell, varianceInflationFactors, descriptiveStatistics, ancova, kruskalWallis, dunnPostHoc, oneWayEffectSizes, anovaPower, requiredAnovaSampleSize } from "./ai/data-science.js";

let COLS = 100, ROWS = 1000;
const MAX_COLS = 16384, MAX_ROWS = 100000, STORAGE_KEY = "haidat-sght-workbook-v1";
const REPAIR_AUDIT_KEY = "haidat-sght-repair-audit-v1";
const FORMULA_VERSION_KEY = "haidat-sght-formula-versions-v1";
const FORMULA_AUDIT_ARCHIVE_KEY = "haidat-sght-formula-audit-archive-v1";
const ROW_HEIGHT = 32, COLUMN_WIDTH = 108, OVERSCAN_ROWS = 5, OVERSCAN_COLUMNS = 2;
const sheetScroll = document.querySelector("#sheetScroll");
const splitScroll = document.querySelector("#splitScroll");
const splitGrid = document.querySelector("#splitGrid");
const quadrantPanes = {topLeft:{scroll:sheetScroll,grid:document.querySelector("#sheetGrid")},topRight:{scroll:document.querySelector("#topRightScroll"),grid:document.querySelector("#topRightGrid")},bottomLeft:{scroll:document.querySelector("#bottomLeftScroll"),grid:document.querySelector("#bottomLeftGrid")},bottomRight:{scroll:splitScroll,grid:splitGrid}};
let quadrantPositions = normalizeQuadrantPositions();
let splitMode = "none", splitRatio = 0.5, splitPositions = {primary:{top:0,left:0},secondary:{top:0,left:0}}, syncingSplitScroll = false, splitSaveTimer = null, resizingSplit = false;
let virtualWindow = null;
const letters = n => { let s=""; while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);} return s; };
const address = (r,c) => letters(c)+r;
const parseAddress = a => { const m=/^([A-Z]+)([1-9][0-9]*)$/i.exec(a); if(!m)return null; let c=0; for(const ch of m[1].toUpperCase())c=c*26+ch.charCodeAt(0)-64; return {r:Number(m[2]),c}; };
let gridGeometry=createGridGeometry();
let cells = Object.create(null), cellFormats=Object.create(null), selected="A1", selectionRange={start:"A1",end:"A1"}, sheetTitle="Bảng tính chưa đặt tên", zoom=100, undoStack=[], redoStack=[], internalClipboard=null, pointerSelecting=false, frozenRows=0, frozenColumns=0;
let dataTables=[], filteredRows=new Set(), activeFilter=null, pivotConfig=null, pivotFields=[], pivotChartSettings=normalizePivotChartStudio({}), pivotCharts=normalizePivotCharts([]), activePivotChartId="pivot-chart-1";
let dashboard=normalizeDashboard({}),dashboardTemplates=[],workbookSheets=normalizeWorkbookSheets([]),activeSheetId="sheet-1";
const macroRecorder=new MacroRecorder();
const macroLibrary=new MacroLibrary();
const macroHistory=new MacroHistory();
const macroSecurity=new MacroSecurityCenter();
let editingMacroId=null;
let macroExecution=false;
const grid=document.querySelector("#sheetGrid"),formulaInput=document.querySelector("#formulaInput"),cellAddress=document.querySelector("#cellAddress"),selectionInfo=document.querySelector("#selectionInfo"),saveStatus=document.querySelector("#saveStatus"),calcStatus=document.querySelector("#calcStatus");
const searchInput=document.querySelector("#searchQuery"),searchModeInput=document.querySelector("#searchMode"),searchCaseInput=document.querySelector("#searchCase"),searchWholeInput=document.querySelector("#searchWhole"),searchCount=document.querySelector("#searchCount"),searchSelectionOnly=document.querySelector("#searchSelectionOnly"),replaceInput=document.querySelector("#replaceQuery"),replaceOneButton=document.querySelector("#replaceOne"),replaceAllButton=document.querySelector("#replaceAll"),replaceStatus=document.querySelector("#replaceStatus");
let searchResults=[],searchIndex=-1,searchMatchAddresses=new Set(),currentSearchAddress=null,searchDirty=false,historyCaptureAvailable=true;
let geometryUndoStack=[],geometryRedoStack=[],axisDimensionClipboard=null;
function applySheetState(sheet){if(!sheet)return;cancelAxisResize();activeSheetId=sheet.id;cells=sheet.cells;cellFormats=sheet.formats;gridGeometry=createGridGeometry(sheet.geometry||{});sheetTitle=sheet.name;const freeze=normalizeFreezeSettings(sheet.freeze||{});frozenRows=freeze.rows;frozenColumns=freeze.columns;const split=normalizeSplitSettings(sheet.split);splitMode=split.mode;splitRatio=split.ratio;splitPositions=split.positions;quadrantPositions=normalizeQuadrantPositions(sheet.split?.quadrants);dataTables=sheet.dataTables||[];pivotConfig=sheet.pivotConfig||null;pivotCharts=normalizePivotCharts(sheet.pivotCharts,sheet.pivotChart||{});activePivotChartId=pivotCharts.some(x=>x.id===sheet.activePivotChartId)?sheet.activePivotChartId:pivotCharts[0].id;pivotChartSettings={...getActivePivotChart(pivotCharts,activePivotChartId).settings};pivotFields=[];searchResults=[];searchIndex=-1;searchDirty=true;searchMatchAddresses.clear();undoStack=Array.isArray(sheet.history?.undo)?sheet.history.undo.slice(-40):[];redoStack=Array.isArray(sheet.history?.redo)?sheet.history.redo.slice(-40):[];geometryUndoStack=Array.isArray(sheet.history?.geometryUndo)?sheet.history.geometryUndo.slice(-40):[];geometryRedoStack=Array.isArray(sheet.history?.geometryRedo)?sheet.history.geometryRedo.slice(-40):[];filteredRows=new Set();activeFilter=null;document.querySelector("#sheetName").value=sheetTitle;document.querySelector("#freezeRowsInput").value=frozenRows;document.querySelector("#freezeColumnsInput").value=frozenColumns;document.querySelector("#splitMode").value=splitMode;applySplitMode(false);renderDataTables();updateHistoryControls();updateGeometryHistoryControls();renderSheetTabs();}
function storeActiveSheet(){if(!activeSheetId)return;syncActivePivotChart();workbookSheets=updateWorkbookSheet(workbookSheets,activeSheetId,{name:sheetTitle,cells,formats:cellFormats,geometry:serializeGridGeometry(gridGeometry),freeze:{rows:frozenRows,columns:frozenColumns},split:{mode:splitMode,ratio:splitRatio,positions:readSplitPositions(),quadrants:readQuadrantPositions()},dataTables,pivotConfig,pivotCharts,activePivotChartId,pivotChart:pivotChartSettings,history:{undo:undoStack,redo:redoStack,geometryUndo:geometryUndoStack,geometryRedo:geometryRedoStack}});}
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved){dashboard=normalizeDashboard(saved.dashboard);dashboardTemplates=Array.isArray(saved.dashboardTemplates)?saved.dashboardTemplates:[];if(Array.isArray(saved.sheets)){workbookSheets=normalizeWorkbookSheets(saved.sheets);activeSheetId=workbookSheets.some(x=>x.id===saved.activeSheetId)?saved.activeSheetId:workbookSheets[0].id;}else{const legacy={id:"sheet-1",name:String(saved.title||"Bảng tính chưa đặt tên"),cells:saved.cells||{},formats:saved.formats||{},freeze:saved.freeze,split:saved.split,dataTables:saved.dataTables,pivotConfig:saved.pivotConfig,pivotCharts:saved.pivotCharts,activePivotChartId:saved.activePivotChartId,pivotChart:saved.pivotChart,history:saved.history};workbookSheets=normalizeWorkbookSheets([legacy]);activeSheetId="sheet-1";}dashboard=normalizeDashboard({...dashboard,widgets:dashboard.widgets.map(w=>w.pivotConfig&&!w.pivotConfig.sheetId?{...w,pivotConfig:{...w.pivotConfig,sheetId:workbookSheets[0].id}}:w)});applySheetState(getWorkbookSheet(workbookSheets,activeSheetId));if(saved.history&&Array.isArray(saved.history.undo)&&Array.isArray(saved.history.redo)){undoStack=saved.history.undo.filter(x=>typeof x==="string").slice(-40);redoStack=saved.history.redo.filter(x=>typeof x==="string").slice(-40);}}else{workbookSheets=normalizeWorkbookSheets([]);applySheetState(workbookSheets[0]);}}catch{workbookSheets=normalizeWorkbookSheets([]);applySheetState(workbookSheets[0]);}renderSheetTabs();}
function save(){try{storeActiveSheet();localStorage.setItem(STORAGE_KEY,JSON.stringify({version:2,sheets:workbookSheets,activeSheetId,dashboard,dashboardTemplates,updatedAt:new Date().toISOString()}));saveStatus.textContent="Đã lưu trên thiết bị";}catch{saveStatus.textContent="Không đủ dung lượng lưu · lịch sử có thể chưa được ghi";}}
function updateHistoryControls(){document.querySelector("#undoAction").disabled=undoStack.length===0;document.querySelector("#redoAction").disabled=redoStack.length===0;}
function snapshot(){const current=serializeWorkbook(cells,cellFormats);historyCaptureAvailable=pushHistoryEntry(undoStack,current);redoStack=[];activeFormulaTransactionId=createFormulaTransactionId();searchDirty=true;updateHistoryControls();save();return historyCaptureAvailable;}
function historyMove(from,to){if(!from.length)return;const source=from===undoStack?"undo":"redo";const beforeCells={...cells};const state=moveHistory(from,to,serializeWorkbook(cells,cellFormats));if(!state)return;cells=state.cells;cellFormats=state.formats;activeFormulaTransactionId=createFormulaTransactionId();for(const change of collectFormulaVersionChanges(beforeCells,cells)){recordFormulaCellVersion(change.address,change.before,change.after,source,activeSheetId);}rebuildDependencyEngine();reconcileStructuredTables();searchDirty=true;updateHistoryControls();render();save();if(typeof renderFormulaVersions==="function")renderFormulaVersions();calcStatus.textContent=source==="undo"?"Đã hoàn tác dữ liệu, định dạng và đồng bộ lịch sử công thức":"Đã làm lại dữ liệu, định dạng và đồng bộ lịch sử công thức";}


function reconcileStructuredTables(){
 dataTables=dataTables.map(table=>{
  const b=table.bounds;if(!b)return table;let last=b.startRow+1;
  for(const key of Object.keys(cells)){const p=parseAddress(key);if(p&&p.r>b.startRow&&p.c>=b.startCol&&p.c<=b.endCol&&String(cells[key]).trim()!=="")last=Math.max(last,p.r);}
  const endRow=Math.min(b.endRow,Math.max(b.startRow+1,last));
  if(endRow===b.endRow)return table;
  return {...table,bounds:{...b,endRow},range:address(b.startRow,b.startCol)+":"+address(endRow,b.endCol)};
 });
 renderDataTables();
}

function paintSearchState(){
  searchMatchAddresses=new Set(searchResults.map(item=>item.address));
  currentSearchAddress=searchIndex>=0?searchResults[searchIndex]?.address||null:null;
  updateSelection();
}
function runSearch(reset=true){
  const query=searchInput.value;
  if(reset)searchIndex=-1;
  const result=searchCells(cells,query,{
    caseSensitive:searchCaseInput.checked,
    wholeCell:searchWholeInput.checked,
    mode:searchModeInput.value,
    displayValue:(address)=>display(address),
    maxResults:10000,
    scope:searchSelectionOnly.checked?getRangeBounds(selectionRange.start,selectionRange.end):null
  });
  searchResults=result.matches;
  if(reset&&searchResults.length)searchIndex=0;
  else if(searchIndex>=searchResults.length)searchIndex=searchResults.length-1;
  if(!reset&&searchResults.length&&searchIndex<0)searchIndex=0;
  searchCount.textContent=!query?"Nhập từ khóa để tìm":result.total===0?"Không tìm thấy":(searchIndex+1)+" / "+result.total+(result.truncated?" · hiển thị 10.000 kết quả đầu":"");
  document.querySelector("#searchPrevious").disabled=searchResults.length===0;
  document.querySelector("#searchNext").disabled=searchResults.length===0;
  paintSearchState();
  updateReplaceControls();
  if(result.total===0&&query)calcStatus.textContent="Không tìm thấy “"+query+"” trong dữ liệu đang lưu.";
  return result;
}

function updateReplaceControls(){
  const allowed=searchModeInput.value!=="display"&&searchInput.value.length>0;
  replaceOneButton.disabled=!allowed||!searchResults.length;
  replaceAllButton.disabled=!allowed;
}
function replaceOptions(){
  return {caseSensitive:searchCaseInput.checked,wholeCell:searchWholeInput.checked,scope:searchSelectionOnly.checked?getRangeBounds(selectionRange.start,selectionRange.end):null};
}
function replaceCurrent(){
  if(searchModeInput.value==="display"){replaceStatus.textContent="Không thể thay thế kết quả tính toán; hãy chọn Nội dung gốc hoặc Cả hai.";return;}
  if(!searchResults.length)runSearch(true);
  if(!searchResults.length)return;
  const item=searchResults[Math.max(0,searchIndex)],result=replaceCells(cells,searchInput.value,replaceInput.value,{...replaceOptions(),onlyAddress:item.address});
  if(!result.changed){replaceStatus.textContent="Ô hiện hành không có nội dung gốc phù hợp để thay thế.";return;}
  snapshot();recordFormulaCellVersion(item.address,raw(item.address),result.cells[item.address]??"", "replace");cells=result.cells;invalidateFormulaCells([item.address]);render();save();replaceStatus.textContent="Đã thay thế ô "+item.address+".";
  searchDirty=true;runSearch(false);
}
function replaceAllMatches(){
  if(searchModeInput.value==="display"){replaceStatus.textContent="Không thể thay thế kết quả tính toán; hãy chọn Nội dung gốc hoặc Cả hai.";return;}
  const query=searchInput.value;
  if(!query){replaceStatus.textContent="Nhập nội dung cần tìm trước.";return;}
  const result=replaceCells(cells,query,replaceInput.value,replaceOptions());
  if(!result.changed){replaceStatus.textContent="Không có ô nào cần thay thế trong phạm vi đã chọn.";return;}
  if(!confirm("Thay thế "+result.changed.toLocaleString("vi-VN")+" ô? Toàn bộ thay đổi sẽ là một giao dịch có thể hoàn tác."))return;
  snapshot();const changedAddresses=Object.keys(result.cells).filter(a=>cells[a]!==result.cells[a]);for(const a of changedAddresses)recordFormulaCellVersion(a,raw(a),result.cells[a]??"", "replace-all");cells=result.cells;invalidateFormulaCells(changedAddresses);render();save();searchDirty=true;runSearch(true);
  replaceStatus.textContent="Đã thay thế "+result.changed.toLocaleString("vi-VN")+" ô trong một giao dịch. Có thể Hoàn tác một lần.";
}
replaceOneButton.addEventListener("click",replaceCurrent);
replaceAllButton.addEventListener("click",replaceAllMatches);
searchSelectionOnly.addEventListener("change",()=>{if(searchInput.value){runSearch(true);updateReplaceControls();}});
replaceInput.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();replaceCurrent();}});

function navigateSearch(direction){
  if(!searchResults.length){runSearch(true);if(!searchResults.length)return;const first=searchResults[0];choose(first.address,false,sheetScroll);searchInput.focus();return;}
  searchIndex=(searchIndex+direction+searchResults.length)%searchResults.length;
  const item=searchResults[searchIndex];
  choose(item.address,false,sheetScroll);
  searchCount.textContent=(searchIndex+1)+" / "+searchResults.length;
  paintSearchState();
  searchInput.focus();
}
function clearSearch(){
  searchInput.value="";searchResults=[];searchIndex=-1;searchMatchAddresses.clear();currentSearchAddress=null;
  searchCount.textContent="Chưa tìm kiếm";
  document.querySelector("#searchPrevious").disabled=true;
  document.querySelector("#searchNext").disabled=true;
  updateSelection();updateReplaceControls();searchInput.focus();
}
searchInput.addEventListener("keydown",event=>{
  if(event.key==="Enter"){event.preventDefault();navigateSearch(event.shiftKey?-1:1);}
  else if(event.key==="Escape"){event.preventDefault();clearSearch();}
});
document.querySelector("#searchRun").addEventListener("click",()=>{runSearch(true);if(searchResults.length)navigateSearch(0);});
document.querySelector("#searchPrevious").addEventListener("click",()=>navigateSearch(-1));
document.querySelector("#searchNext").addEventListener("click",()=>navigateSearch(1));
document.querySelector("#searchClear").addEventListener("click",clearSearch);
for(const control of [searchModeInput,searchCaseInput,searchWholeInput])control.addEventListener("change",()=>{if(searchInput.value){runSearch(true);if(searchResults.length)navigateSearch(0);}updateReplaceControls();});
window.addEventListener("keydown",event=>{
  const key=event.key.toLowerCase(),target=event.target;
  if((event.ctrlKey||event.metaKey)&&key==="f"){event.preventDefault();searchInput.focus();searchInput.select();return;}
  if(target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))return;
  if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
  if(key==="z"&&event.shiftKey){event.preventDefault();historyMove(redoStack,undoStack);}
  else if(key==="z"){event.preventDefault();historyMove(undoStack,redoStack);}
  else if(key==="y"){event.preventDefault();historyMove(redoStack,undoStack);}
});

let dependencyGraph=buildDependencyGraph(workbookSheets),formulaValueCache=new FormulaResultCache({maxEntries:50000,maxBytes:16*1024*1024}),lastRecalculationPlan=null,workbookRevision=0;
const calculationScheduler=new CalculationScheduler({chunkSize:64,onProgress:state=>{if(state.remaining)calcStatus.textContent="Đang tính lại "+state.completed+"/"+state.queued+" công thức · còn "+state.remaining+" · đợt "+state.chunks;},onError:(error,key)=>{calcStatus.textContent="Lỗi tính toán "+key+": "+(error.code||error.message);},onComplete:state=>{if(state.queued){const cache=formulaValueCache.stats(),rate=Math.round(cache.hitRate*100);calcStatus.textContent="Đã tính lại "+state.completed+"/"+state.queued+" công thức trong "+state.chunks+" đợt"+(state.failed?" · lỗi "+state.failed:"")+". "+state.elapsedMs+" ms · cache "+cache.entries.toLocaleString("vi-VN")+"/"+cache.maxEntries.toLocaleString("vi-VN")+" · trúng "+rate+"%";}}});
function rebuildDependencyEngine(){calculationScheduler.cancel("workbook-rebuilt");workbookRevision++;storeActiveSheet();dependencyGraph=buildDependencyGraph(workbookSheets);formulaValueCache.clear();lastRecalculationPlan=null;}
function scheduleRecalculation(plan){const revision=++workbookRevision;const visible=new Set([...document.querySelectorAll("#sheetGrid [data-cell],#splitGrid [data-cell]")].map(el=>activeSheetId+"!"+el.dataset.cell));calculationScheduler.enqueue(plan,{revision,getRevision:()=>workbookRevision,priority:key=>key.startsWith(activeSheetId+"!")?(visible.has(key)?3:2):1,run:key=>{const split=key.indexOf("!");if(split<1)return;calculate(key.slice(split+1),new Set(),key.slice(0,split));}});}
function invalidateFormulaCells(addresses){storeActiveSheet();const changed=[...new Set(addresses)].map(a=>activeSheetId+"!"+String(a).toUpperCase());for(const a of addresses)updateDependencyNode(dependencyGraph,workbookSheets,activeSheetId,a);const plan=planRecalculation(dependencyGraph,changed);lastRecalculationPlan=plan;for(const key of plan.affected)formulaValueCache.delete(key);scheduleRecalculation(plan);return plan;}
function raw(a){return Object.hasOwn(cells,a)?String(cells[a]):"";}
function calculate(a,stack=new Set(),sourceSheetId=activeSheetId){
 const sourceSheet=getWorkbookSheet(workbookSheets,sourceSheetId);
 const sourceCells=sourceSheetId===activeSheetId?cells:(sourceSheet?.cells||{});
 const value=Object.hasOwn(sourceCells,a)?String(sourceCells[a]):"";
 if(!value.startsWith("="))return value===""?"":coerce(value);
 const cycleKey=sourceSheetId+"!"+a;
 if(stack.has(cycleKey))throw new FormulaError("#CYCLE!","Phát hiện công thức tham chiếu vòng giữa các trang tính.");
 if(formulaValueCache.has(cycleKey))return formulaValueCache.get(cycleKey);
 stack.add(cycleKey);
 const readRange=(ref,readCell)=>{const [s,e]=ref.toUpperCase().split(":").map(parseAddress);if(!s||!e)throw new FormulaError("#REF!","Vùng ô không hợp lệ.");const area=(Math.abs(e.r-s.r)+1)*(Math.abs(e.c-s.c)+1);if(!Number.isSafeInteger(area)||area>100000)throw new FormulaError("#REF!","Vùng công thức vượt giới hạn an toàn 100.000 ô.");const out=[];for(let r=Math.min(s.r,e.r);r<=Math.max(s.r,e.r);r++)for(let c=Math.min(s.c,e.c);c<=Math.max(s.c,e.c);c++)out.push(readCell(address(r,c)));return out;};
 const findSheet=name=>workbookSheets.find(x=>String(x.name).normalize("NFKC").toLocaleLowerCase()===String(name).normalize("NFKC").toLocaleLowerCase());
 const ctx={
  getCell:ref=>calculate(ref.toUpperCase(),stack,sourceSheetId),
  getRange:ref=>readRange(ref,cell=>calculate(cell,stack,sourceSheetId)),
  getSheetCell:(name,ref)=>{const target=findSheet(name);if(!target)throw new FormulaError("#REF!","Không tìm thấy trang tính '"+name+"'.");return calculate(ref.toUpperCase(),stack,target.id);},
  getSheetRange:(name,ref)=>{const target=findSheet(name);if(!target)throw new FormulaError("#REF!","Không tìm thấy trang tính '"+name+"'.");return readRange(ref,cell=>calculate(cell,stack,target.id));}
 };
 try{const result=evaluateFormula(expandStructuredFormula(value),ctx);formulaValueCache.set(cycleKey,result);return result;}finally{stack.delete(cycleKey);}
}

function expandStructuredFormula(formula){return expandStructuredReferences(formula,dataTables);}
function expandTablesAfterWrite(startRow,endRow,startCol,endCol){
 let changed=false;
 dataTables=dataTables.map(table=>{let next=table;for(let row=startRow;row<=endRow;row++)for(let col=startCol;col<=endCol;col++){const expanded=expandStructuredRange(next,row,col);if(expanded!==next){next=expanded;changed=true;}}return next;});
 if(changed)renderDataTables();
}

function coerce(v){if(typeof v!=="string")return v;if(v.trim()!==""&&Number.isFinite(Number(v)))return Number(v);return v;}
function display(a){try{const v=calculate(a);if(typeof v!=="number")return String(v??"");const f=normalizeCellFormat(cellFormats[a]||{});if(f.numberFormat==="integer")return new Intl.NumberFormat("vi-VN",{maximumFractionDigits:0}).format(v);if(f.numberFormat==="number2")return new Intl.NumberFormat("vi-VN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);if(f.numberFormat==="percent")return new Intl.NumberFormat("vi-VN",{style:"percent",maximumFractionDigits:2}).format(v);if(f.numberFormat==="currency")return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(v);return String(Number(v.toPrecision(12)));}catch(e){return e.code||"#CALC!";}}
function render(){
  if(searchDirty){searchDirty=false;if(searchInput.value)runSearch(false);}
  if(splitMode==="quadrant"){for(const pane of Object.values(quadrantPanes))renderGrid(pane.grid,pane.scroll);renderPivotReport();return;}
  renderGrid(grid,sheetScroll);
  if(splitMode!=="none")renderGrid(splitGrid,splitScroll);
  renderPivotBuilder();
  renderPivotReport();
}
function renderGrid(targetGrid,targetScroll){
  const thead=targetGrid.querySelector("thead"),tbody=targetGrid.querySelector("tbody");
  const w=getVirtualWindow({scrollTop:targetScroll.scrollTop,scrollLeft:targetScroll.scrollLeft,viewportHeight:targetScroll.clientHeight||480,viewportWidth:targetScroll.clientWidth||900,rowHeight:ROW_HEIGHT,columnWidth:COLUMN_WIDTH,overscanRows:OVERSCAN_ROWS,overscanColumns:OVERSCAN_COLUMNS,maxRow:ROWS,maxColumn:COLS,geometry:gridGeometry});
  const layout=buildFreezeLayout(w,{rows:frozenRows,columns:frozenColumns,rowHeight:ROW_HEIGHT,columnWidth:COLUMN_WIDTH,rowHeaderWidth:48,gridGeometry});
  const pinnedColumns=layout.pinnedColumns,pinnedRows=layout.pinnedRows;
  const colHeaders=pinnedColumns.map(c=>"<th data-column='"+c+"' class='freeze-col freeze-col-head' style='left:"+(48+getAxisOffset(gridGeometry,"column",c))+"px;width:"+getAxisSize(gridGeometry,"column",c)+"px;min-width:"+getAxisSize(gridGeometry,"column",c)+"px'>"+letters(c)+"<button type='button' class='axis-resize-handle axis-resize-column' data-resize-axis='column' data-resize-index='"+c+"' aria-label='Thay đổi độ rộng cột "+letters(c)+"' title='Kéo để đổi độ rộng cột'></button></th>").join("");
  const visibleHeaders=Array.from({length:w.renderedColumns},(_,i)=>{const c=w.columnStart+i,size=getAxisSize(gridGeometry,"column",c);return "<th data-column='"+c+"' style='width:"+size+"px;min-width:"+size+"px'>"+letters(c)+"<button type='button' class='axis-resize-handle axis-resize-column' data-resize-axis='column' data-resize-index='"+c+"' aria-label='Thay đổi độ rộng cột "+letters(c)+"' title='Kéo để đổi độ rộng cột'></button></th>";}).join("");
  const leftGap=layout.leftGap? "<th class='virtual-spacer' style='width:"+layout.leftGap+"px;min-width:"+layout.leftGap+"px'></th>":"";
  const rightGap=w.rightOffset?"<th class='virtual-spacer' style='width:"+w.rightOffset+"px;min-width:"+w.rightOffset+"px'></th>":"";
  thead.innerHTML="<tr><th class='corner'></th>"+colHeaders+leftGap+visibleHeaders+rightGap+"</tr>";
  const rows=[],span=1+pinnedColumns.length+(layout.leftGap?1:0)+w.renderedColumns+(w.rightOffset?1:0);
  if(layout.topGap)rows.push("<tr class='virtual-gap'><td colspan='"+span+"' style='height:"+layout.topGap+"px'></td></tr>");
  const activeBounds=getRangeBounds(selectionRange.start,selectionRange.end),fillAt=address(activeBounds.endRow,activeBounds.endCol);
  const renderRow=(r,isFrozen)=>{
    const rowHeight=getAxisSize(gridGeometry,"row",r),rowTop=32+getAxisOffset(gridGeometry,"row",r);
    let rowHtml="<th data-row='"+r+"' class='row-head"+(isFrozen?" freeze-row-head":"")+"' aria-label='Hàng "+r+"' style='height:"+rowHeight+"px;"+(isFrozen?"top:"+rowTop+"px;":"")+"'>"+r+"<button type='button' class='axis-resize-handle axis-resize-row' data-resize-axis='row' data-resize-index='"+r+"' aria-label='Thay đổi chiều cao hàng "+r+"' title='Kéo để đổi chiều cao hàng'></button></th>";
    for(const c of pinnedColumns){const a=address(r,c),width=getAxisSize(gridGeometry,"column",c);rowHtml+="<td class='freeze-col"+(isFrozen?" freeze-intersection":"")+"' style='left:"+(48+getAxisOffset(gridGeometry,"column",c))+"px;width:"+width+"px;min-width:"+width+"px;height:"+rowHeight+"px;"+(isFrozen?"top:"+rowTop+"px;":"")+"'><button type='button' class='cell' draggable='true' data-cell='"+a+"' style='min-height:31px' aria-label='Ô "+a+"'>"+escapeHtml(display(a))+(a===fillAt?"<span class='fill-handle' data-fill-handle='"+a+"' title='Kéo để điền dữ liệu' aria-label='Kéo để điền dữ liệu'></span>":"")+"</button></td>";}
    if(layout.leftGap)rowHtml+="<td class='virtual-spacer' style='width:"+layout.leftGap+"px;min-width:"+layout.leftGap+"px'></td>";
    for(let c=w.columnStart;c<=w.columnEnd;c++){const a=address(r,c),width=getAxisSize(gridGeometry,"column",c);rowHtml+="<td"+(isFrozen?" class='freeze-row-cell'":"")+" style='width:"+width+"px;min-width:"+width+"px;height:"+rowHeight+"px;"+(isFrozen?"top:"+rowTop+"px;":"")+"'><button type='button' class='cell' draggable='true' data-cell='"+a+"' style='min-height:31px' aria-label='Ô "+a+"'>"+escapeHtml(display(a))+"</button></td>";}
    if(w.rightOffset)rowHtml+="<td class='virtual-spacer' style='width:"+w.rightOffset+"px;min-width:"+w.rightOffset+"px'></td>";
    return "<tr"+(isFrozen?" class='freeze-row'":"")+" data-grid-row='"+r+"' style='height:"+rowHeight+"px'>"+rowHtml+"</tr>";
  };
  for(const r of pinnedRows)rows.push(renderRow(r,true));
  if(layout.activeRows)rows.push("<tr class='virtual-gap freeze-gap'><td colspan='"+span+"' style='height:"+layout.topGap+"px'></td></tr>");
  for(let r=w.rowStart;r<=w.rowEnd;r++)if(!filteredRows.has(r))rows.push(renderRow(r,false));
  if(w.bottomOffset)rows.push("<tr class='virtual-gap'><td colspan='"+span+"' style='height:"+w.bottomOffset+"px'></td></tr>");
  tbody.innerHTML=rows.join("");
  for(const b of tbody.querySelectorAll("[data-cell]"))for(const [k,v] of Object.entries(cellFormatStyle(cellFormats[b.dataset.cell]||{})))b.style[k]=v;
  updateSelection();
}
 
// SGHT B5.5.3 — kéo đổi kích thước hàng/cột, dùng chung cho mọi pane.
const sheetPanesElement=document.querySelector("#sheetPanes");
const resizeGuide=document.createElement("div");
resizeGuide.className="axis-resize-guide";
resizeGuide.hidden=true;
const resizeGuideLabel=document.createElement("span");
resizeGuideLabel.className="axis-resize-guide-label";
resizeGuide.append(resizeGuideLabel);
sheetPanesElement.append(resizeGuide);
let axisResizeDrag=null;

function geometrySnapshot(){return serializeGridGeometry(gridGeometry);}
function recordGeometryChange(before,after,label){
 if(JSON.stringify(before)===JSON.stringify(after))return;
 geometryUndoStack.push({before,after,label:String(label||"Đổi kích thước"),at:Date.now()});
 if(geometryUndoStack.length>40)geometryUndoStack.shift();
 geometryRedoStack=[];
 updateGeometryHistoryControls();
}
function updateGeometryHistoryControls(){
 const undo=document.querySelector("#geometryUndoAction"),redo=document.querySelector("#geometryRedoAction");
 if(undo)undo.disabled=geometryUndoStack.length===0;
 if(redo)redo.disabled=geometryRedoStack.length===0;
}
function moveGeometryHistory(from,to){
 if(!from.length)return;
 const isUndo=from===geometryUndoStack,entry=from.pop();to.push(entry);if(to.length>40)to.shift();
 gridGeometry=createGridGeometry(isUndo?entry.before:entry.after);
 render();save();updateGeometryHistoryControls();
 calcStatus.textContent=(isUndo?"Đã hoàn tác: ":"Đã làm lại: ")+entry.label+".";
}
function undoGeometry(){moveGeometryHistory(geometryUndoStack,geometryRedoStack);}
function redoGeometry(){moveGeometryHistory(geometryRedoStack,geometryUndoStack);}
function axisResizeTargets(axis,index){
 const bounds=getRangeBounds(selectionRange.start,selectionRange.end);
 const start=axis==="row"?bounds.startRow:bounds.startCol,end=axis==="row"?bounds.endRow:bounds.endCol;
 if(index<start||index>end||start===end)return [index];
 const count=end-start+1;
 if(count>5000)throw new RangeError("Vùng chọn vượt giới hạn 5.000 "+(axis==="row"?"hàng":"cột")+" cho một lần đổi kích thước.");
 return Array.from({length:count},(_,offset)=>start+offset);
}
const autoFitCanvas=document.createElement("canvas"),autoFitContext=autoFitCanvas.getContext("2d");
function measureAutoFitText(value){
 const text=String(value??"");
 if(autoFitContext){autoFitContext.font="12px Arial";return autoFitContext.measureText(text).width;}
 return text.length*7;
}
function autoFitSelection(axis){
 const bounds=getRangeBounds(selectionRange.start,selectionRange.end);
 const first=axis==="column"?bounds.startCol:bounds.startRow,last=axis==="column"?bounds.endCol:bounds.endRow;
 const count=last-first+1;
 if(count>5000)throw new RangeError("AutoFit chỉ xử lý tối đa 5.000 "+(axis==="column"?"cột":"hàng")+" trong một lần.");
 const area=(bounds.endRow-bounds.startRow+1)*(bounds.endCol-bounds.startCol+1);
 if(area>100000)throw new RangeError("Vùng AutoFit vượt giới hạn 100.000 ô. Hãy thu nhỏ vùng chọn.");
 const sizes=new Map();
 for(const key of Object.keys(cells)){
  const point=parseAddress(key);
  if(!point||point.r<bounds.startRow||point.r>bounds.endRow||point.c<bounds.startCol||point.c>bounds.endCol)continue;
  const text=display(key);
  if(!text)continue;
  if(axis==="column"){
   const width=measureAutoFitText(text);
   sizes.set(point.c,Math.max(sizes.get(point.c)||0,width));
  }else{
   const available=Math.max(24,getAxisSize(gridGeometry,"column",point.c)-16);
   const lines=Math.max(1,Math.ceil(measureAutoFitText(text)/available));
   sizes.set(point.r,Math.max(sizes.get(point.r)||1,lines));
  }
 }
 const updates={};
 for(let index=first;index<=last;index++){
  if(axis==="column")updates[index]=Math.max(GRID_GEOMETRY_DEFAULTS.minColumnWidth,Math.min(GRID_GEOMETRY_DEFAULTS.maxColumnWidth,Math.ceil((sizes.get(index)||0)+20)));
  else updates[index]=Math.max(GRID_GEOMETRY_DEFAULTS.minRowHeight,Math.min(GRID_GEOMETRY_DEFAULTS.maxRowHeight,Math.ceil((sizes.get(index)||1)*16+8)));
 }
 const before=geometrySnapshot();
 gridGeometry=setAxisSizeMap(gridGeometry,axis,updates);
 const after=geometrySnapshot();
 recordGeometryChange(before,after,"AutoFit "+(axis==="column"?"cột ":"hàng ")+first+":"+last);
 render();save();
 calcStatus.textContent="Đã AutoFit "+count+" "+(axis==="column"?"cột":"hàng")+" trong vùng chọn. Có thể hoàn tác bằng lịch sử kích thước.";
}
function applyAxisSize(axis,index,size,label,targetsOverride=null){
 const targets=targetsOverride||axisResizeTargets(axis,index),before=geometrySnapshot();
 gridGeometry=targets.length===1?setAxisSize(gridGeometry,axis,index,size):setAxisSizes(gridGeometry,axis,targets,size);
 const after=geometrySnapshot(),axisName=axis==="column"?"cột":"hàng";
 const rangeLabel=targets.length===1?(axis==="column"?letters(index):String(index)):(axis==="column"?letters(targets[0])+":"+letters(targets.at(-1)):"Hàng "+targets[0]+":"+targets.at(-1));
 recordGeometryChange(before,after,label||("Đổi kích thước "+targets.length+" "+axisName+" · "+rangeLabel));
 render();save();
 if(targets.length>1)calcStatus.textContent="Đã đổi đồng loạt "+targets.length+" "+axisName+" thành "+size+" px.";
}
function resetAxisDimension(axis,index,targetsOverride=null){
 const targets=targetsOverride||[index],before=geometrySnapshot();
 if(targets.length===1)gridGeometry=resetAxisSize(gridGeometry,axis,index);
 else gridGeometry=setAxisSizes(gridGeometry,axis,targets,axis==="column"?GRID_GEOMETRY_DEFAULTS.columnWidth:GRID_GEOMETRY_DEFAULTS.rowHeight);
 const after=geometrySnapshot(),axisName=axis==="column"?"cột":"hàng";
 const rangeLabel=targets.length===1?(axis==="column"?letters(index):String(index)):(axis==="column"?letters(targets[0])+":"+letters(targets.at(-1)):"Hàng "+targets[0]+":"+targets.at(-1));
 recordGeometryChange(before,after,"Khôi phục kích thước "+targets.length+" "+axisName+" · "+rangeLabel);
 render();save();
 if(targets.length>1)calcStatus.textContent="Đã khôi phục mặc định cho "+targets.length+" "+axisName+".";
}
function clampAxisSize(axis,value){
 const min=axis==="row"?GRID_GEOMETRY_DEFAULTS.minRowHeight:GRID_GEOMETRY_DEFAULTS.minColumnWidth;
 const max=axis==="row"?GRID_GEOMETRY_DEFAULTS.maxRowHeight:GRID_GEOMETRY_DEFAULTS.maxColumnWidth;
 return Math.max(min,Math.min(max,value));
}
function updateResizeGuide(event){
 if(!axisResizeDrag)return;
 const drag=axisResizeDrag,rect=sheetPanesElement.getBoundingClientRect();
 const pointerCoordinate=drag.axis==="column"?event.clientX:event.clientY;
 const origin=drag.axis==="column"?rect.left:rect.top;
 const extent=drag.axis==="column"?rect.width:rect.height;
 const position=calculateAxisResizeGuidePosition({axis:drag.axis,startGuideCoordinate:drag.startGuideCoordinate,pointerCoordinate,startCoordinate:drag.startCoordinate,origin,extent});
 resizeGuide.hidden=false;
 resizeGuide.className="axis-resize-guide "+(drag.axis==="column"?"is-column":"is-row");
 if(drag.axis==="column"){resizeGuide.style.left=position+"px";resizeGuide.style.top="0";resizeGuide.style.height="100%";resizeGuide.style.width="2px";}
 else{resizeGuide.style.top=position+"px";resizeGuide.style.left="0";resizeGuide.style.width="100%";resizeGuide.style.height="2px";}
 const count=drag.targets.length;resizeGuideLabel.textContent=(count>1?count+" "+(drag.axis==="column"?"cột":"hàng"):drag.axis==="column"?letters(drag.index):"Hàng "+drag.index)+" · "+drag.previewSize+" px";
}
function beginAxisResize(event){
 const handle=event.target.closest?.("[data-resize-axis][data-resize-index]");
 if(!handle)return false;
 if(axisResizeDrag){event.preventDefault();event.stopPropagation();return true;}
 if(event.isPrimary===false){event.preventDefault();event.stopPropagation();return true;}
 if(event.button!==undefined&&event.button!==0)return false;
 const axis=handle.dataset.resizeAxis,index=Number(handle.dataset.resizeIndex);
 if(!["row","column"].includes(axis)||!Number.isSafeInteger(index)||index<1)return false;
 event.preventDefault();event.stopPropagation();
 let targets;try{targets=axisResizeTargets(axis,index);}catch(error){calcStatus.textContent=error?.message||String(error);return true;}
 const startSize=getAxisSize(gridGeometry,axis,index);
 const handleRect=handle.getBoundingClientRect();
 const startCoordinate=axis==="column"?event.clientX:event.clientY;
 const startGuideCoordinate=axis==="column"?(handleRect.left+handleRect.right)/2:(handleRect.top+handleRect.bottom)/2;
 axisResizeDrag={pointerId:event.pointerId,axis,index,targets,startSize,previewSize:startSize,startCoordinate,startGuideCoordinate,sheetId:activeSheetId,handle};
 try{handle.setPointerCapture(event.pointerId);}catch{}
 updateResizeGuide(event);
 return true;
}
function moveAxisResize(event){
 const drag=axisResizeDrag;if(!drag||event.pointerId!==drag.pointerId)return;
 event.preventDefault();
 const coordinate=drag.axis==="column"?event.clientX:event.clientY;
 drag.previewSize=clampAxisSize(drag.axis,Math.round(drag.startSize+coordinate-drag.startCoordinate));
 updateResizeGuide(event);
}
function finishAxisResize(event,commit=true){
 const drag=axisResizeDrag;if(!drag||event.pointerId!==drag.pointerId)return;
 axisResizeDrag=null;resizeGuide.hidden=true;
 if(!commit||drag.sheetId!==activeSheetId||drag.previewSize===drag.startSize)return;
 try{
  applyAxisSize(drag.axis,drag.index,drag.previewSize,null,drag.targets);
  calcStatus.textContent=(drag.axis==="column"?"Độ rộng cột ":"Chiều cao hàng ")+(drag.axis==="column"?letters(drag.index):drag.index)+" đã đổi thành "+drag.previewSize+" px.";
 }catch(error){calcStatus.textContent="Không thể đổi kích thước: "+(error?.message||String(error));}
}
function cancelAxisResize(){
 const drag=axisResizeDrag;if(!drag)return;
 axisResizeDrag=null;resizeGuide.hidden=true;
 try{if(drag.handle?.hasPointerCapture?.(drag.pointerId))drag.handle.releasePointerCapture(drag.pointerId);}catch{}
}
function installAxisResize(gridElement){
 gridElement.addEventListener("dblclick",event=>{
  const handle=event.target.closest?.("[data-resize-axis][data-resize-index]");if(!handle)return;
  const axis=handle.dataset.resizeAxis,index=Number(handle.dataset.resizeIndex),current=getAxisSize(gridGeometry,axis,index);
  const answer=window.prompt("Nhập "+(axis==="column"?"độ rộng cột":"chiều cao hàng")+" (px), giới hạn "+(axis==="column"?"40–500":"20–240")+".",String(current));
  if(answer===null)return;
  const value=Number(answer.trim());
  try{if(!Number.isFinite(value))throw new TypeError("Kích thước phải là số.");const next=clampAxisSize(axis,Math.round(value));applyAxisSize(axis,index,next);calcStatus.textContent="Đã đặt kích thước "+(axis==="column"?"cột "+letters(index):"hàng "+index)+" = "+next+" px.";}
  catch(error){calcStatus.textContent="Không thể đổi kích thước: "+(error?.message||String(error));}
 });
 gridElement.addEventListener("pointerdown",beginAxisResize);
 gridElement.addEventListener("lostpointercapture",event=>finishAxisResize(event,false));
 gridElement.addEventListener("keydown",event=>{
  const handle=event.target.closest?.("[data-resize-axis][data-resize-index]");
  if(!handle)return;
  const axis=handle.dataset.resizeAxis,index=Number(handle.dataset.resizeIndex);
  let next=null;
  const step=event.shiftKey?20:5;
  if(axis==="column"&&event.key==="ArrowRight")next=getAxisSize(gridGeometry,axis,index)+step;
  else if(axis==="column"&&event.key==="ArrowLeft")next=getAxisSize(gridGeometry,axis,index)-step;
  else if(axis==="row"&&event.key==="ArrowDown")next=getAxisSize(gridGeometry,axis,index)+step;
  else if(axis==="row"&&event.key==="ArrowUp")next=getAxisSize(gridGeometry,axis,index)-step;
  else if(event.key==="Home"){
   event.preventDefault();
   try{
    const targets=axisResizeTargets(axis,index);
    resetAxisDimension(axis,index,targets);
    if(targets.length===1)calcStatus.textContent="Đã khôi phục kích thước mặc định cho "+(axis==="column"?"cột "+letters(index):"hàng "+index)+".";
   }catch(error){calcStatus.textContent="Không thể khôi phục kích thước: "+(error?.message||String(error));}
   requestAnimationFrame(()=>document.querySelector('[data-resize-axis="'+axis+'"][data-resize-index="'+index+'"]')?.focus());return;
  }else return;
  event.preventDefault();
  try{
   const targets=axisResizeTargets(axis,index);
   applyAxisSize(axis,index,clampAxisSize(axis,next),null,targets);
   requestAnimationFrame(()=>document.querySelector('[data-resize-axis="'+axis+'"][data-resize-index="'+index+'"]')?.focus());
  }catch(error){calcStatus.textContent="Không thể đổi kích thước: "+(error?.message||String(error));}
 });
}
document.querySelector("#autoFitColumns")?.addEventListener("click",()=>{try{autoFitSelection("column");}catch(error){calcStatus.textContent="Không thể AutoFit cột: "+(error?.message||String(error));}});
document.querySelector("#autoFitRows")?.addEventListener("click",()=>{try{autoFitSelection("row");}catch(error){calcStatus.textContent="Không thể AutoFit hàng: "+(error?.message||String(error));}});
function updateAxisDimensionClipboardControl(){
 const button=document.querySelector("#applyAxisDimension");
 if(button)button.disabled=!axisDimensionClipboard;
}
function copySelectedAxisDimension(axis){
 try{
  const point=parseAddress(selected);
  if(!point)throw new TypeError("Ô đang chọn không hợp lệ.");
  axisDimensionClipboard=copyAxisDimension(gridGeometry,axis,axis==="row"?point.r:point.c);
  updateAxisDimensionClipboardControl();
  calcStatus.textContent="Đã chép "+(axis==="row"?"chiều cao hàng "+point.r:"độ rộng cột "+letters(point.c))+" · "+axisDimensionClipboard.size+" px. Có thể chuyển trang tính rồi áp dụng.";
 }catch(error){calcStatus.textContent="Không thể chép kích thước: "+(error?.message||String(error));}
}
function applySelectedAxisDimension(){
 try{
  if(!axisDimensionClipboard)throw new TypeError("Hãy chép kích thước hàng hoặc cột trước.");
  const bounds=getRangeBounds(selectionRange.start,selectionRange.end);
  const first=axisDimensionClipboard.axis==="row"?bounds.startRow:bounds.startCol;
  const last=axisDimensionClipboard.axis==="row"?bounds.endRow:bounds.endCol;
  const count=last-first+1;
  if(count>5000)throw new RangeError("Chỉ áp dụng tối đa 5.000 hàng hoặc cột mỗi lần.");
  const targets=Array.from({length:count},(_,offset)=>first+offset);
  const before=geometrySnapshot();
  gridGeometry=applyCopiedAxisDimension(gridGeometry,axisDimensionClipboard,targets);
  const after=geometrySnapshot();
  recordGeometryChange(before,after,"Áp dụng kích thước "+(axisDimensionClipboard.axis==="row"?"hàng ":"cột ")+first+":"+last);
  render();save();
  calcStatus.textContent="Đã áp dụng "+axisDimensionClipboard.size+" px cho "+count+" "+(axisDimensionClipboard.axis==="row"?"hàng":"cột")+". Có thể hoàn tác trong lịch sử kích thước.";
 }catch(error){calcStatus.textContent="Không thể áp dụng kích thước: "+(error?.message||String(error));}
}
document.querySelector("#copyRowDimension")?.addEventListener("click",()=>copySelectedAxisDimension("row"));
document.querySelector("#copyColumnDimension")?.addEventListener("click",()=>copySelectedAxisDimension("column"));
document.querySelector("#applyAxisDimension")?.addEventListener("click",applySelectedAxisDimension);
updateAxisDimensionClipboardControl();
[grid,splitGrid,quadrantPanes.topRight.grid,quadrantPanes.bottomLeft.grid].forEach(installAxisResize);
window.addEventListener("pointermove",moveAxisResize,{passive:false});
window.addEventListener("pointerup",event=>finishAxisResize(event,true));
window.addEventListener("pointercancel",event=>finishAxisResize(event,false));
window.addEventListener("blur",cancelAxisResize);
window.addEventListener("pagehide",cancelAxisResize);
window.addEventListener("keydown",event=>{
 if(event.key!=="Escape"||!axisResizeDrag)return;
 event.preventDefault();cancelAxisResize();
 calcStatus.textContent="Đã hủy thao tác thay đổi kích thước hàng/cột.";
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAxisResize();});

function escapeHtml(v){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function updateSelection(){
  cellAddress.value=selected;formulaInput.value=raw(selected);
  const x=getRangeBounds(selectionRange.start,selectionRange.end),count=(x.endRow-x.startRow+1)*(x.endCol-x.startCol+1);
  selectionInfo.textContent=count===1?"Ô "+selected+" đang được chọn":"Vùng "+x.start+":"+x.end+" · "+count.toLocaleString("vi-VN")+" ô";
  const visibleGrids=[grid,...(splitMode==="quadrant"?[quadrantPanes.topRight.grid,quadrantPanes.bottomLeft.grid,splitGrid]:splitMode!=="none"?[splitGrid]:[])];
  const activeCell=parseAddress(selected);
  for(const currentGrid of visibleGrids){
    for(const header of currentGrid.querySelectorAll("thead [data-column]"))header.classList.toggle("axis-selected",Number(header.dataset.column)===activeCell.c);
    for(const header of currentGrid.querySelectorAll("tbody [data-row]"))header.classList.toggle("axis-selected",Number(header.dataset.row)===activeCell.r);
  }
  for(const el of visibleGrids.flatMap(g=>[...g.querySelectorAll(".cell")])){
    const p=parseAddress(el.dataset.cell);if(!p)continue;
    const inside=p.r>=x.startRow&&p.r<=x.endRow&&p.c>=x.startCol&&p.c<=x.endCol;
    el.classList.toggle("selected",el.dataset.cell===selected);
    el.classList.toggle("in-range",inside&&el.dataset.cell!==selected);
    el.classList.toggle("search-match",searchMatchAddresses.has(el.dataset.cell));
    el.classList.toggle("search-current",el.dataset.cell===currentSearchAddress);
  }
  for(const handle of document.querySelectorAll("[data-fill-handle]"))handle.remove();
  const fillAddress=address(x.endRow,x.endCol);
  const visibleCell=[grid,...(splitMode==="quadrant"?[quadrantPanes.topRight.grid,quadrantPanes.bottomLeft.grid,splitGrid]:splitMode!=="none"?[splitGrid]:[])].map(g=>g.querySelector("[data-cell='"+fillAddress+"']")).find(Boolean);
  if(visibleCell){const handle=document.createElement("span");handle.className="fill-handle";handle.dataset.fillHandle=fillAddress;handle.title="Kéo để điền dữ liệu";handle.setAttribute("aria-label","Kéo để điền dữ liệu");visibleCell.append(handle);}
}
function growGridTo(row,column){
  const next=expandGridCapacity({rows:ROWS,columns:COLS},{row,column},{maxRows:MAX_ROWS,maxColumns:MAX_COLS});
  if(next.rows!==ROWS||next.columns!==COLS){ROWS=next.rows;COLS=next.columns;const meta=document.querySelector(".sheet-meta");if(meta)meta.textContent="Tự động lưu cục bộ · Lưới đang mở rộng "+COLS.toLocaleString("vi-VN")+" cột × "+ROWS.toLocaleString("vi-VN")+" hàng";return true;}
  return false;
}
function choose(a,extend=false,scrollElement=sheetScroll){
  const p=parseAddress(a);if(!p||p.r>MAX_ROWS||p.c>MAX_COLS)return;
  growGridTo(p.r,p.c);
  selected=a;if(extend)selectionRange.end=a;else selectionRange={start:a,end:a};
  const top=getAxisOffset(gridGeometry,"row",p.r),bottom=top+getAxisSize(gridGeometry,"row",p.r),left=getAxisOffset(gridGeometry,"column",p.c),right=left+getAxisSize(gridGeometry,"column",p.c);
  if(top<scrollElement.scrollTop)scrollElement.scrollTop=top;
  else if(bottom>scrollElement.scrollTop+scrollElement.clientHeight)scrollElement.scrollTop=bottom-scrollElement.clientHeight;
  if(left<scrollElement.scrollLeft)scrollElement.scrollLeft=left;
  else if(right>scrollElement.scrollLeft+scrollElement.clientWidth)scrollElement.scrollLeft=right-scrollElement.clientWidth;
  updateSelection();if(typeof renderFormulaVersions==="function")renderFormulaVersions();requestAnimationFrame(()=>{const active=[grid,quadrantPanes.topRight.grid,quadrantPanes.bottomLeft.grid,splitGrid].map(g=>g.querySelector("[data-cell=\'"+selected+"\']")).find(Boolean);if(active)active.focus({preventScroll:true});});
}
function navigateToAddress(){
  const candidate=cellAddress.value.trim().toUpperCase();
  const point=parseAddress(candidate);
  if(!point||point.r>MAX_ROWS||point.c>MAX_COLS){
    cellAddress.value=selected;
    calcStatus.textContent="Địa chỉ ô không hợp lệ hoặc vượt giới hạn lưới.";
    return false;
  }
  choose(candidate,false,sheetScroll);
  calcStatus.textContent="Đã chuyển tới ô "+candidate+".";
  return true;
}
cellAddress.addEventListener("keydown",event=>{
  if(event.key==="Enter"){event.preventDefault();navigateToAddress();}
  else if(event.key==="Escape"){event.preventDefault();cellAddress.value=selected;cellAddress.blur();}
});
cellAddress.addEventListener("change",navigateToAddress);
cellAddress.addEventListener("focus",()=>cellAddress.select());
function handlePaneScroll(source,peer){
  if(splitMode==="quadrant"){handleQuadrantScroll(source);return;}
  if(splitMode!=="none"&&!syncingSplitScroll){
    syncingSplitScroll=true;
    const axis=synchronizedAxis(splitMode);
    if(axis==="x")peer.scrollLeft=source.scrollLeft;
    if(axis==="y")peer.scrollTop=source.scrollTop;
    syncingSplitScroll=false;
  }
  if(source===sheetScroll){splitPositions.primary={top:source.scrollTop,left:source.scrollLeft};if(splitMode!=="none")splitPositions.secondary={top:splitScroll.scrollTop,left:splitScroll.scrollLeft};}
  else{splitPositions.secondary={top:source.scrollTop,left:source.scrollLeft};splitPositions.primary={top:sheetScroll.scrollTop,left:sheetScroll.scrollLeft};}
  scheduleSplitSave();
  const nearBottom=source.scrollTop+source.clientHeight>=source.scrollHeight-Math.max(getAxisSize(gridGeometry,"row",1)*24,source.clientHeight*2);
  const nearRight=source.scrollLeft+source.clientWidth>=source.scrollWidth-Math.max(getAxisSize(gridGeometry,"column",1)*8,source.clientWidth*2);
  let grew=false;
  if(nearBottom&&ROWS<MAX_ROWS){const next=expandGridCapacity({rows:ROWS,columns:COLS},{row:ROWS+1,column:1},{maxRows:MAX_ROWS,maxColumns:MAX_COLS});ROWS=next.rows;grew=true;}
  if(nearRight&&COLS<MAX_COLS){const next=expandGridCapacity({rows:ROWS,columns:COLS},{row:1,column:COLS+1},{maxRows:MAX_ROWS,maxColumns:MAX_COLS});COLS=next.columns;grew=true;}
  if(grew){const meta=document.querySelector(".sheet-meta");if(meta)meta.textContent="Tự động lưu cục bộ · Lưới đang mở rộng "+COLS.toLocaleString("vi-VN")+" cột × "+ROWS.toLocaleString("vi-VN")+" hàng";}
  render();
}
function readQuadrantPositions(){const out={};for(const [key,pane] of Object.entries(quadrantPanes))out[key]={top:pane.scroll.scrollTop,left:pane.scroll.scrollLeft};return out;}
function handleQuadrantScroll(source){
 if(syncingSplitScroll)return;
 const key=Object.keys(quadrantPanes).find(k=>quadrantPanes[k].scroll===source);if(!key)return;
 syncingSplitScroll=true;const next=synchronizeQuadrantPositions(key,readQuadrantPositions());
 for(const target of quadrantScrollTargets(key)){const pane=quadrantPanes[target];pane.scroll.scrollTop=next[target].top;pane.scroll.scrollLeft=next[target].left;}
 quadrantPositions=readQuadrantPositions();syncingSplitScroll=false;scheduleSplitSave();
 const nearBottom=source.scrollTop+source.clientHeight>=source.scrollHeight-Math.max(ROW_HEIGHT*24,source.clientHeight*2);
 const nearRight=source.scrollLeft+source.clientWidth>=source.scrollWidth-Math.max(COLUMN_WIDTH*8,source.clientWidth*2);
 let grew=false;
 if(nearBottom&&ROWS<MAX_ROWS){ROWS=expandGridCapacity({rows:ROWS,columns:COLS},{row:ROWS+1,column:1},{maxRows:MAX_ROWS,maxColumns:MAX_COLS}).rows;grew=true;}
 if(nearRight&&COLS<MAX_COLS){COLS=expandGridCapacity({rows:ROWS,columns:COLS},{row:1,column:COLS+1},{maxRows:MAX_ROWS,maxColumns:MAX_COLS}).columns;grew=true;}
 if(grew){const meta=document.querySelector(".sheet-meta");if(meta)meta.textContent="Tự động lưu cục bộ · Lưới đang mở rộng "+COLS.toLocaleString("vi-VN")+" cột × "+ROWS.toLocaleString("vi-VN")+" hàng";}
 render();
}
for(const key of ["topRight","bottomLeft"]){const pane=quadrantPanes[key];pane.scroll.addEventListener("scroll",()=>{if(splitMode==="quadrant")handleQuadrantScroll(pane.scroll);},{passive:true});}
sheetScroll.addEventListener("scroll",()=>handlePaneScroll(sheetScroll,splitScroll),{passive:true});
splitScroll.addEventListener("scroll",()=>{if(splitMode!=="none")handlePaneScroll(splitScroll,sheetScroll);},{passive:true});
function readSplitPositions(){
  return {primary:{top:sheetScroll.scrollTop,left:sheetScroll.scrollLeft},secondary:{top:splitScroll.scrollTop,left:splitScroll.scrollLeft},quadrants:readQuadrantPositions()};
}
function restoreSplitPositions(){
  requestAnimationFrame(()=>{
    sheetScroll.scrollTop=splitPositions.primary.top;sheetScroll.scrollLeft=splitPositions.primary.left;
    splitScroll.scrollTop=splitPositions.secondary.top;splitScroll.scrollLeft=splitPositions.secondary.left;
    if(splitMode==="quadrant"){quadrantPositions=normalizeQuadrantPositions(splitPositions.quadrants);for(const [key,pane] of Object.entries(quadrantPanes)){pane.scroll.scrollTop=quadrantPositions[key].top;pane.scroll.scrollLeft=quadrantPositions[key].left;}}
    render();
  });
}
function scheduleSplitSave(){
  if(splitSaveTimer!==null)clearTimeout(splitSaveTimer);
  splitSaveTimer=setTimeout(()=>{splitSaveTimer=null;save();},300);
}
function setSplitRatio(value,persist=true){
  splitRatio=Number.isFinite(Number(value))?Math.max(0.2,Math.min(0.8,Number(value))):0.5;
  document.querySelector("#sheetPanes").style.setProperty("--split-ratio",String(splitRatio));
  document.querySelector("#sheetPanes").style.setProperty("--split-percent",(splitRatio*100)+"%");
  if(persist)save();
}
function applySplitMode(persist=true){
  const panes=document.querySelector("#sheetPanes");
  panes.dataset.mode=splitMode;
  splitScroll.hidden=splitMode==="none"||splitMode==="quadrant";
  document.querySelector("#topRightScroll").hidden=splitMode!=="quadrant";document.querySelector("#bottomLeftScroll").hidden=splitMode!=="quadrant";
  panes.classList.toggle("quadrant-mode",splitMode==="quadrant");
  const separator=panes.querySelector("#splitSeparator");
  separator.hidden=splitMode==="none"||splitMode==="quadrant";
  panes.style.setProperty("--split-ratio",String(splitRatio));
  panes.style.setProperty("--split-percent",(splitRatio*100)+"%");
  separator.setAttribute("aria-orientation",splitMode==="horizontal"?"horizontal":"vertical");
  separator.setAttribute("aria-label",splitMode==="horizontal"?"Thanh chia ngang":"Thanh chia dọc");
  if(persist)save();
  restoreSplitPositions();
}
const splitSeparator=document.querySelector("#splitSeparator");
splitSeparator.addEventListener("pointerdown",event=>{
  if(splitMode==="none")return;
  event.preventDefault();resizingSplit=true;splitSeparator.setPointerCapture(event.pointerId);
});
splitSeparator.addEventListener("pointermove",event=>{
  if(!resizingSplit)return;
  const rect=document.querySelector("#sheetPanes").getBoundingClientRect();
  const point=splitMode==="horizontal"?event.clientY:event.clientX;
  setSplitRatio(splitRatioFromPointer(splitMode,point,rect),false);
});
function stopSplitResize(){if(!resizingSplit)return;resizingSplit=false;save();}
splitSeparator.addEventListener("pointerup",stopSplitResize);
splitSeparator.addEventListener("pointercancel",stopSplitResize);
splitSeparator.addEventListener("lostpointercapture",stopSplitResize);
splitSeparator.addEventListener("keydown",event=>{
  if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
  event.preventDefault();
  const positive=splitMode==="horizontal"?event.key==="ArrowDown":event.key==="ArrowRight";
  const negative=splitMode==="horizontal"?event.key==="ArrowUp":event.key==="ArrowLeft";
  if(event.key==="Home")setSplitRatio(0.2);
  else if(event.key==="End")setSplitRatio(0.8);
  else if(positive)setSplitRatio(splitRatio+0.02);
  else if(negative)setSplitRatio(splitRatio-0.02);
});
document.querySelector("#applySplit").addEventListener("click",()=>{
  const next=document.querySelector("#splitMode").value;
  if(!["none","horizontal","vertical","quadrant"].includes(next))return;
  splitMode=next;applySplitMode();
  calcStatus.textContent=splitMode==="none"?"Đã tắt chia vùng.":splitMode==="quadrant"?"Đã chia bốn góc phần tư; các trục cuộn liên kết được đồng bộ.":splitMode==="horizontal"?"Đã chia ngang: cuộn dọc độc lập, cuộn ngang đồng bộ.":"Đã chia dọc: cuộn ngang độc lập, cuộn dọc đồng bộ.";
});
document.querySelector("#clearSplit").addEventListener("click",()=>{splitMode="none";document.querySelector("#splitMode").value="none";applySplitMode();calcStatus.textContent="Đã tắt chia vùng.";});
splitGrid.addEventListener("pointerdown",e=>{if(beginFillDrag(e))return;const b=e.target.closest("[data-cell]");if(!b)return;pointerSelecting=true;choose(b.dataset.cell,e.shiftKey,splitScroll);});
splitGrid.addEventListener("pointerover",e=>{if(!pointerSelecting)return;const b=e.target.closest("[data-cell]");if(b)choose(b.dataset.cell,true,splitScroll);});
splitGrid.addEventListener("click",e=>{const b=e.target.closest("[data-cell]");if(b&&!pointerSelecting&&selected!==b.dataset.cell)choose(b.dataset.cell,false,splitScroll);});
splitGrid.addEventListener("keydown",e=>{const b=e.target.closest("[data-cell]");if(!b)return;const p=parseAddress(b.dataset.cell);if(e.key==="Enter"||e.key==="ArrowDown"){e.preventDefault();choose(address(Math.min(ROWS,p.r+1),p.c),e.shiftKey,splitScroll);}else if(e.key==="Tab"||e.key==="ArrowRight"){e.preventDefault();choose(address(p.r,Math.min(COLS,p.c+1)),e.shiftKey,splitScroll);}else if(e.key==="ArrowUp"){e.preventDefault();choose(address(Math.max(1,p.r-1),p.c),e.shiftKey,splitScroll);}else if(e.key==="ArrowLeft"){e.preventDefault();choose(address(p.r,Math.max(1,p.c-1)),e.shiftKey,splitScroll);}});
splitGrid.addEventListener("paste",e=>{const text=e.clipboardData?.getData("text/plain");if(text){e.preventDefault();pasteRange(text);}});
for(const key of ["topRight","bottomLeft"]){const pane=quadrantPanes[key];pane.grid.addEventListener("pointerdown",e=>{if(beginFillDrag(e))return;const b=e.target.closest("[data-cell]");if(!b)return;pointerSelecting=true;choose(b.dataset.cell,e.shiftKey,pane.scroll);});pane.grid.addEventListener("pointerover",e=>{if(!pointerSelecting)return;const b=e.target.closest("[data-cell]");if(b)choose(b.dataset.cell,true,pane.scroll);});pane.grid.addEventListener("click",e=>{const b=e.target.closest("[data-cell]");if(b&&!pointerSelecting&&selected!==b.dataset.cell)choose(b.dataset.cell,false,pane.scroll);});pane.grid.addEventListener("keydown",e=>{const b=e.target.closest("[data-cell]");if(!b)return;const p=parseAddress(b.dataset.cell);if(e.key==="Enter"||e.key==="ArrowDown"){e.preventDefault();choose(address(Math.min(ROWS,p.r+1),p.c),e.shiftKey,pane.scroll);}else if(e.key==="Tab"||e.key==="ArrowRight"){e.preventDefault();choose(address(p.r,Math.min(COLS,p.c+1)),e.shiftKey,pane.scroll);}else if(e.key==="ArrowUp"){e.preventDefault();choose(address(Math.max(1,p.r-1),p.c),e.shiftKey,pane.scroll);}else if(e.key==="ArrowLeft"){e.preventDefault();choose(address(p.r,Math.max(1,p.c-1)),e.shiftKey,pane.scroll);}});pane.grid.addEventListener("paste",e=>{const value=e.clipboardData?.getData("text/plain");if(value){e.preventDefault();pasteRange(value);}});}
window.addEventListener("pointerup",()=>{pointerSelecting=false;});

let fillDrag=null;
function beginFillDrag(e){const handle=e.target.closest("[data-fill-handle]");if(!handle)return false;e.preventDefault();e.stopPropagation();fillDrag={pointerId:e.pointerId,source:getRangeBounds(selectionRange.start,selectionRange.end),last:handle.dataset.fillHandle};handle.setPointerCapture?.(e.pointerId);return true;}
function moveFillDrag(e){if(!fillDrag||e.pointerId!==fillDrag.pointerId)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-cell]");if(!el)return;const p=parseAddress(el.dataset.cell),s=fillDrag.source;if(!p||p.r>=s.startRow&&p.r<=s.endRow&&p.c>=s.startCol&&p.c<=s.endCol)return;const target={start:address(Math.min(s.startRow,p.r),Math.min(s.startCol,p.c)),end:address(Math.max(s.endRow,p.r),Math.max(s.endCol,p.c))};const b=getRangeBounds(target.start,target.end);if((b.endRow-b.startRow+1)*(b.endCol-b.startCol+1)>100000)return;fillDrag.last=el.dataset.cell;selectionRange=target;updateSelection();}
function endFillDrag(e){if(!fillDrag||e.pointerId!==fillDrag.pointerId)return;const drag=fillDrag;fillDrag=null;const p=parseAddress(drag.last),s=drag.source;if(!p)return;const target={start:address(Math.min(s.startRow,p.r),Math.min(s.startCol,p.c)),end:address(Math.max(s.endRow,p.r),Math.max(s.endCol,p.c))};if(target.start===s.start&&target.end===s.end){selectionRange={start:s.start,end:s.end};updateSelection();return;}const b=getRangeBounds(target.start,target.end);if(b.endRow>MAX_ROWS||b.endCol>MAX_COLS){selectionRange={start:s.start,end:s.end};updateSelection();calcStatus.textContent="Vùng điền vượt giới hạn lưới.";return;}try{growGridTo(b.endRow,b.endCol);snapshot();const result=fillRange(cells,cellFormats,s,target,{maxCells:100000});for(const a of expandRange(result.range.start,result.range.end))if(cells[a]!==result.cells[a])recordFormulaCellVersion(a,raw(a),result.cells[a]??"", "fill");cells=result.cells;cellFormats=result.formats;selectionRange={start:result.range.start,end:result.range.end};selected=s.start;invalidateFormulaCells(expandRange(result.range.start,result.range.end));render();save();calcStatus.textContent="Đã tự động điền "+result.changed.toLocaleString("vi-VN")+" ô. Có thể dùng Hoàn tác để quay lại.";}catch(error){selectionRange={start:s.start,end:s.end};updateSelection();calcStatus.textContent="Không thể điền dữ liệu: "+error.message;}}
window.addEventListener("pointermove",moveFillDrag,{passive:false});window.addEventListener("pointerup",endFillDrag);window.addEventListener("pointercancel",()=>{if(fillDrag){selectionRange={start:fillDrag.source.start,end:fillDrag.source.end};fillDrag=null;updateSelection();}});


function setValue(a,v){const point=parseAddress(a),before=raw(a),after=String(v??"");snapshot();if(before!==after)recordFormulaCellVersion(a,before,after,macroExecution?"macro":"edit");if(v===""){delete cells[a];if(!macroExecution)try{macroRecorder.recordClear(a);}catch(e){calcStatus.textContent=e.message;}}else{cells[a]=v;if(!macroExecution)try{macroRecorder.recordSet(a,v);}catch(e){calcStatus.textContent=e.message;}}if(point)expandTablesAfterWrite(point.r,point.r,point.c,point.c);invalidateFormulaCells([a]);render();save();calcStatus.textContent="Đã tính lại các ô phụ thuộc";}
function apply(){const value=formulaInput.value;setValue(selected,value.trim()===""?"":value);updateSelection();}
function exportCsv(){const used=Object.keys(cells).map(parseAddress).filter(Boolean);const maxR=Math.max(1,...used.map(x=>x.r)),maxC=Math.max(1,...used.map(x=>x.c));const lines=[];for(let r=1;r<=maxR;r++){const row=[];for(let c=1;c<=maxC;c++){const v=display(address(r,c));row.push('"'+v.replace(/"/g,'""')+'"');}lines.push(row.join(","));}const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=(sheetTitle||"sght").replace(/[\\/:*?"<>|]/g,"_")+".csv";link.click();URL.revokeObjectURL(url);}
function pasteRange(text,clipboardPayload=null){const start=parseAddress(selected);if(!start)return;const matrix=parseTSV(text);if(!matrix.length)return;const width=Math.max(...matrix.map(row=>row.length));const targetRow=start.r+matrix.length-1,targetColumn=start.c+width-1;if(targetRow>MAX_ROWS||targetColumn>MAX_COLS){calcStatus.textContent="Vùng dán vượt giới hạn an toàn hiện tại: "+MAX_ROWS.toLocaleString("vi-VN")+" hàng × "+MAX_COLS.toLocaleString("vi-VN")+" cột.";return;}growGridTo(targetRow,targetColumn);snapshot();const pasteAddresses=matrix.flatMap((row,ri)=>row.map((_,ci)=>address(start.r+ri,start.c+ci)));if(clipboardPayload){const next=pasteCapturedRange(cells,cellFormats,start,clipboardPayload);for(const a of pasteAddresses)if(raw(a)!==(next.cells[a]??""))recordFormulaCellVersion(a,raw(a),next.cells[a]??"", "paste");cells=next.cells;cellFormats=next.formats;}else{matrix.forEach((row,ri)=>row.forEach((v,ci)=>{const a=address(start.r+ri,start.c+ci);if(raw(a)!==v)recordFormulaCellVersion(a,raw(a),v,"paste");if(v==="")delete cells[a];else cells[a]=v;}));}selectionRange={start:selected,end:address(start.r+matrix.length-1,start.c+width-1)};expandTablesAfterWrite(start.r,start.r+matrix.length-1,start.c,start.c+width-1);invalidateFormulaCells(matrix.flatMap((row,ri)=>row.map((_,ci)=>address(start.r+ri,start.c+ci))));render();save();calcStatus.textContent="Đã dán "+matrix.length+" hàng dữ liệu"+(clipboardPayload?" kèm định dạng":"");}
function handlePaste(e){const text=e.clipboardData?.getData("text/plain");if(!text||!/[\t\n\r]/.test(text))return;e.preventDefault();pasteRange(text);}
grid.addEventListener("paste",e=>{const text=e.clipboardData?.getData("text/plain");if(text){e.preventDefault();pasteRange(text);}});
grid.addEventListener("pointerdown",e=>{if(beginFillDrag(e))return;const b=e.target.closest("[data-cell]");if(!b)return;const current=getRangeBounds(selectionRange.start,selectionRange.end),p=parseAddress(b.dataset.cell),inside=p.r>=current.startRow&&p.r<=current.endRow&&p.c>=current.startCol&&p.c<=current.endCol;if(inside&&current.start!==current.end&&e.pointerType==="mouse"){pointerSelecting=false;return;}pointerSelecting=true;choose(b.dataset.cell,e.shiftKey);});grid.addEventListener("pointerover",e=>{if(!pointerSelecting)return;const b=e.target.closest("[data-cell]");if(b)choose(b.dataset.cell,true);});window.addEventListener("pointerup",()=>{pointerSelecting=false;});let dragPayload=null;grid.addEventListener("dragstart",e=>{const b=e.target.closest("[data-cell]");if(!b)return;const x=getRangeBounds(selectionRange.start,selectionRange.end),p=parseAddress(b.dataset.cell);if(!(p.r>=x.startRow&&p.r<=x.endRow&&p.c>=x.startCol&&p.c<=x.endCol)){choose(b.dataset.cell);dragPayload={bounds:getRangeBounds(b.dataset.cell,b.dataset.cell)};}else dragPayload={bounds:x};const matrix=[];for(let rr=dragPayload.bounds.startRow;rr<=dragPayload.bounds.endRow;rr++){const row=[];for(let cc=dragPayload.bounds.startCol;cc<=dragPayload.bounds.endCol;cc++){const a=address(rr,cc);row.push({value:raw(a),format:cellFormats[a]||null});}matrix.push(row);}dragPayload.matrix=matrix;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain","SGHT_RANGE_MOVE");});grid.addEventListener("dragover",e=>{if(dragPayload){e.preventDefault();e.dataTransfer.dropEffect="move";}});grid.addEventListener("drop",e=>{const b=e.target.closest("[data-cell]");if(!b||!dragPayload)return;e.preventDefault();const dest=parseAddress(b.dataset.cell),src=dragPayload.bounds,h=dragPayload.matrix.length,w=dragPayload.matrix[0]?.length||0;if(!h||!w||dest.r+h-1>MAX_ROWS||dest.c+w-1>MAX_COLS){calcStatus.textContent="Không thể thả vùng: vượt giới hạn an toàn của lưới.";dragPayload=null;return;}growGridTo(dest.r+h-1,dest.c+w-1);const sourceSet=new Set(expandRange(src.start,src.end));const movedAddresses=[...new Set([...sourceSet,...Array.from({length:h},(_,ri)=>Array.from({length:w},(_,ci)=>address(dest.r+ri,dest.c+ci))).flat()])];const beforeMoved=new Map(movedAddresses.map(a=>[a,raw(a)]));let overwrites=false;for(let rr=dest.r;rr<dest.r+h;rr++)for(let cc=dest.c;cc<dest.c+w;cc++){const a=address(rr,cc);if(!sourceSet.has(a)&&(Object.hasOwn(cells,a)||Object.hasOwn(cellFormats,a)))overwrites=true;}if(overwrites&&!confirm("Vùng đích có dữ liệu hoặc định dạng. Ghi đè khi di chuyển vùng?")){dragPayload=null;return;}snapshot();for(let rr=src.startRow;rr<=src.endRow;rr++)for(let cc=src.startCol;cc<=src.endCol;cc++){const a=address(rr,cc);delete cells[a];delete cellFormats[a];}dragPayload.matrix.forEach((row,ri)=>row.forEach((item,ci)=>{const a=address(dest.r+ri,dest.c+ci);if(item.value!=="")cells[a]=item.value;if(item.format)cellFormats[a]=item.format;}));for(const a of movedAddresses){const before=beforeMoved.get(a)??"",after=raw(a);if(before!==after)recordFormulaCellVersion(a,before,after,"move");}invalidateFormulaCells([...expandRange(src.start,src.end),...Array.from({length:h},(_,ri)=>Array.from({length:w},(_,ci)=>address(dest.r+ri,dest.c+ci))).flat()]);selected=b.dataset.cell;selectionRange={start:selected,end:address(dest.r+h-1,dest.c+w-1)};dragPayload=null;render();save();calcStatus.textContent="Đã di chuyển vùng dữ liệu.";});grid.addEventListener("click",e=>{const b=e.target.closest("[data-cell]");if(b&&!pointerSelecting&&selected!==b.dataset.cell)choose(b.dataset.cell);});
formulaInput.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply();const p=parseAddress(selected);if(p)choose(address(p.r+1,p.c));}if(e.key==="Escape")updateSelection();});
document.querySelector("#applyFormula").addEventListener("click",apply);
grid.addEventListener("keydown",e=>{const b=e.target.closest("[data-cell]");if(!b)return;const p=parseAddress(b.dataset.cell);let r=p.r,c=p.c;if(e.key==="Enter"||e.key==="ArrowDown"){e.preventDefault();choose(address(Math.min(ROWS,r+1),c),e.shiftKey);}else if(e.key==="Tab"||e.key==="ArrowRight"){e.preventDefault();choose(address(r,Math.min(COLS,c+1)),e.shiftKey);}else if(e.key==="ArrowUp"){e.preventDefault();choose(address(Math.max(1,r-1),c),e.shiftKey);}else if(e.key==="ArrowLeft"){e.preventDefault();choose(address(r,Math.max(1,c-1)),e.shiftKey);}else if(e.key==="F2"){e.preventDefault();formulaInput.focus();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="c"){e.preventDefault();copySelection(false);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="x"){e.preventDefault();copySelection(true);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="v"){e.preventDefault();if(internalClipboard)pasteRange(internalClipboard.text,internalClipboard.payload);}});
grid.addEventListener("paste",handlePaste);formulaInput.addEventListener("paste",handlePaste);
document.querySelector("#sheetName").addEventListener("change",e=>{sheetTitle=e.target.value.trim()||"Bảng tính chưa đặt tên";save();});
document.querySelector("#newSheet").addEventListener("click",createWorkbookSheetUI);

function applyFreezeSettings(){
  const rows=Number(document.querySelector("#freezeRowsInput").value||0),columns=Number(document.querySelector("#freezeColumnsInput").value||0);
  try{const next=normalizeFreezeSettings({rows,columns});frozenRows=next.rows;frozenColumns=next.columns;document.querySelector("#freezeRowsInput").value=frozenRows;document.querySelector("#freezeColumnsInput").value=frozenColumns;render();save();calcStatus.textContent=(frozenRows||frozenColumns)?"Đã ghim "+frozenRows+" hàng đầu và "+frozenColumns+" cột đầu.":"Đã bỏ ghim hàng và cột.";}
  catch(e){calcStatus.textContent="Thiết lập ghim không hợp lệ: "+e.message;}
}
document.querySelector("#applyFreeze").addEventListener("click",applyFreezeSettings);
document.querySelector("#clearFreeze").addEventListener("click",()=>{frozenRows=0;frozenColumns=0;document.querySelector("#freezeRowsInput").value=0;document.querySelector("#freezeColumnsInput").value=0;render();save();calcStatus.textContent="Đã bỏ toàn bộ ghim.";});

document.querySelector("#downloadCsv").addEventListener("click",exportCsv);
document.querySelector("#saveAction").addEventListener("click",()=>{save();calcStatus.textContent="Đã lưu bảng tính";});
document.querySelector("#undoAction").addEventListener("click",()=>historyMove(undoStack,redoStack));
document.querySelector("#redoAction").addEventListener("click",()=>historyMove(redoStack,undoStack));
document.querySelector("#geometryUndoAction")?.addEventListener("click",undoGeometry);
document.querySelector("#geometryRedoAction")?.addEventListener("click",redoGeometry);
updateGeometryHistoryControls();
updateHistoryControls();
document.querySelector("#clearAction").addEventListener("click",()=>{const targets=expandRange(selectionRange.start,selectionRange.end);snapshot();for(const a of targets){if(Object.hasOwn(cells,a))recordFormulaCellVersion(a,raw(a),"","clear");delete cells[a];}invalidateFormulaCells(targets);render();save();calcStatus.textContent="Đã xóa nội dung "+targets.length+" ô";});
function applyFormat(patch){const targets=expandRange(selectionRange.start,selectionRange.end);snapshot();for(const a of targets)cellFormats[a]=normalizeCellFormat({...cellFormats[a],...patch});render();save();calcStatus.textContent="Đã định dạng "+targets.length+" ô";}
for(const [id,key] of [["fontFamily","fontFamily"],["fontSize","fontSize"],["fontColor","color"],["fillColor","background"],["horizontalAlign","align"],["verticalAlign","vertical"],["numberFormat","numberFormat"],["borderStyle","border"]])document.querySelector("#"+id).addEventListener("change",e=>applyFormat({[key]:e.target.value}));
document.querySelector("#boldAction").addEventListener("click",()=>applyFormat({bold:!cellFormats[selected]?.bold}));document.querySelector("#italicAction").addEventListener("click",()=>applyFormat({italic:!cellFormats[selected]?.italic}));document.querySelector("#clearFormatAction").addEventListener("click",()=>{const targets=expandRange(selectionRange.start,selectionRange.end);snapshot();for(const a of targets)delete cellFormats[a];render();save();calcStatus.textContent="Đã xóa định dạng "+targets.length+" ô";});

function copySelection(cut=false){const x=getRangeBounds(selectionRange.start,selectionRange.end),payload=captureRange(cells,cellFormats,x),matrix=payload.matrix.map(row=>row.map(item=>item.value)),text=encodeTSV(matrix);internalClipboard={text,payload,cut};navigator.clipboard?.writeText(text).catch(()=>{});if(cut){snapshot();const cutAddresses=expandRange(x.start,x.end);for(const a of cutAddresses){if(Object.hasOwn(cells,a))recordFormulaCellVersion(a,raw(a),"","cut");delete cells[a];delete cellFormats[a];}invalidateFormulaCells(cutAddresses);render();save();}calcStatus.textContent=(cut?"Đã cắt ":"Đã sao chép ")+matrix.length+" hàng, giữ định dạng trong bảng tạm SGHT";}
document.querySelector("#copyAction").addEventListener("click",()=>copySelection(false));
document.querySelector("#cutAction").addEventListener("click",()=>copySelection(true));
document.querySelector("#pasteAction").addEventListener("click",async()=>{if(internalClipboard){pasteRange(internalClipboard.text,internalClipboard.payload);return;}try{const t=await navigator.clipboard.readText();if(t)pasteRange(t);else calcStatus.textContent="Bảng tạm đang trống.";}catch{calcStatus.textContent="Hãy cấp quyền bảng tạm hoặc dùng Ctrl+V";}});
for(const [id,fn] of [["sumAction","SUM"],["averageAction","AVERAGE"],["countAction","COUNT"]])document.querySelector("#"+id).addEventListener("click",()=>{const p=parseAddress(selected),range=p?address(Math.max(1,p.r-4),p.c)+":"+address(p.r,p.c):"A1:A5";formulaInput.value="="+fn+"("+range+")";formulaInput.focus();});
document.querySelector("#zoomIn").addEventListener("click",()=>setZoom(zoom+10));document.querySelector("#zoomOut").addEventListener("click",()=>setZoom(zoom-10));document.querySelector("#zoomReset").addEventListener("click",()=>setZoom(100));
function setZoom(v){zoom=Math.max(60,Math.min(160,v));document.querySelector("#zoomValue").textContent=zoom+"%";grid.style.zoom=String(zoom/100);}
document.querySelectorAll(".ribbon-tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".ribbon-tab").forEach(x=>x.classList.toggle("active",x===tab));calcStatus.textContent="Nhóm công cụ: "+tab.textContent;}));

const dataPanel=document.querySelector("#dataToolsPanel");
const dataSortColumn=document.querySelector("#dataSortColumn"),dataSortOrder=document.querySelector("#dataSortOrder"),dataSortType=document.querySelector("#dataSortType");
const dataFilterColumn=document.querySelector("#dataFilterColumn"),dataFilterColumn2=document.querySelector("#dataFilterColumn2"),dataFilterValues=document.querySelector("#dataFilterValues"),dataFilterOp1=document.querySelector("#dataFilterOp1"),dataFilterValue1=document.querySelector("#dataFilterValue1"),dataFilterJoin=document.querySelector("#dataFilterJoin"),dataFilterOp2=document.querySelector("#dataFilterOp2"),dataFilterValue2=document.querySelector("#dataFilterValue2"),dataFilterColor=document.querySelector("#dataFilterColor"),dataFilterColorEnabled=document.querySelector("#dataFilterColorEnabled");
const dataTableName=document.querySelector("#dataTableName"),dataStatus=document.querySelector("#dataStatus");
function selectedBounds(){return getRangeBounds(selectionRange.start,selectionRange.end);}
function currentDataRules(){
 const bounds=selectedBounds(),column=parseAddress(String(dataFilterColumn.value).toUpperCase()+"1")?.c,column2=parseAddress(String(dataFilterColumn2.value).toUpperCase()+"1")?.c;
 if(!column||column<bounds.startCol||column>bounds.endCol)throw new Error("Cột lọc phải nằm trong vùng đang chọn.");
 const rules=[];
 if(dataFilterOp1.value!=="all"&&(!column||column<bounds.startCol||column>bounds.endCol))throw new Error("Cột điều kiện thứ nhất nằm ngoài vùng đang chọn.");
 if(dataFilterOp2.value!=="all"&&(!column2||column2<bounds.startCol||column2>bounds.endCol))throw new Error("Cột điều kiện thứ hai nằm ngoài vùng đang chọn.");
 if(dataFilterOp1.value!=="all"){if(!dataFilterValue1.value&&dataFilterOp1.value!=="empty"&&dataFilterOp1.value!=="notEmpty")throw new Error("Nhập giá trị cho điều kiện lọc thứ nhất.");rules.push({column,operator:dataFilterOp1.value,value:dataFilterValue1.value});}
 if(dataFilterOp2.value!=="all"){if(!dataFilterValue2.value&&dataFilterOp2.value!=="empty"&&dataFilterOp2.value!=="notEmpty")throw new Error("Nhập giá trị cho điều kiện lọc thứ hai.");rules.push({column:column2,operator:dataFilterOp2.value,value:dataFilterValue2.value});}
 const selectedValues=[...dataFilterValues.selectedOptions].map(o=>o.value);
 for(const rule of rules){if(["between","dateBetween"].includes(rule.operator)){rule.min=rule.value;rule.max=document.querySelector(rule.column===column?"#dataFilterMax1":"#dataFilterMax2").value;if(!rule.max)throw new Error("Điền cận trên cho điều kiện khoảng.");}}return {bounds,rules,join:dataFilterJoin.value,color:dataFilterColorEnabled.checked?dataFilterColor.value:null,allowedValues:dataFilterValues.options.length?{[column]:selectedValues}:{}};
}
document.querySelector("#dataSortApply").addEventListener("click",()=>{
 try{
  const bounds=selectedBounds(),keyCol=parseAddress(String(dataSortColumn.value).toUpperCase()+"1")?.c;
  if(!keyCol||keyCol<bounds.startCol||keyCol>bounds.endCol)throw new Error("Cột sắp xếp phải nằm trong vùng đang chọn.");
  const result=sortRangeRows(cells,cellFormats,bounds,{keyColumn:keyCol,direction:dataSortOrder.value,type:dataSortType.value});
  if(!result.changed){dataStatus.textContent="Vùng không có hàng cần sắp xếp.";return;}
  snapshot();const sortedAddresses=expandRange(address(bounds.startRow,bounds.startCol),address(bounds.endRow,bounds.endCol));for(const a of sortedAddresses)if(cells[a]!==result.cells[a])recordFormulaCellVersion(a,raw(a),result.cells[a]??"", "sort");cells=result.cells;cellFormats=result.formats;invalidateFormulaCells(sortedAddresses);render();save();dataStatus.textContent="Đã sắp xếp "+result.rowCount+" hàng theo cột "+dataSortColumn.value.toUpperCase()+". Có thể Hoàn tác.";
 }catch(e){dataStatus.textContent=e.message;}
});
document.querySelector("#dataFilterApply").addEventListener("click",()=>{
 try{
  const config=currentDataRules(),result=filterRangeRows(cells,cellFormats,config.bounds,{rules:config.rules,join:config.join,fillColor:config.color,allowedValues:config.allowedValues});
  filteredRows=new Set(result.hiddenRows);activeFilter={bounds:config.bounds,rules:config.rules,join:config.join,color:config.color,allowedValues:config.allowedValues};
  render();dataStatus.textContent="Đang hiển thị "+result.visibleRows+" / "+result.totalRows+" hàng dữ liệu trong vùng lọc.";
 }catch(e){dataStatus.textContent=e.message;}
});
document.querySelector("#dataFilterClear").addEventListener("click",()=>{filteredRows.clear();activeFilter=null;render();dataStatus.textContent="Đã bỏ bộ lọc; dữ liệu không bị xóa.";});

function refreshFilterValues(){
 try{const bounds=selectedBounds(),column=parseAddress(String(dataFilterColumn.value).toUpperCase()+"1")?.c;if(!column||column<bounds.startCol||column>bounds.endCol)throw new Error("Cột danh sách nằm ngoài vùng.");const values=uniqueColumnValues(cells,bounds,column);dataFilterValues.innerHTML=values.map(x=>"<option value='"+escapeHtml(x.value).replace(/'/g,"&#39;")+"' selected>"+escapeHtml(x.value||"(Ô trống)")+" · "+x.count+"</option>").join("");dataStatus.textContent="Đã nạp "+values.length+" giá trị duy nhất. Bỏ chọn giá trị không muốn hiển thị.";}catch(e){dataStatus.textContent=e.message;}
}
document.querySelector("#dataFilterValuesRefresh").addEventListener("click",refreshFilterValues);
document.querySelector("#dataSubtotalApply").addEventListener("click",()=>{
 try{const bounds=selectedBounds(),g1=parseAddress(String(document.querySelector("#dataSubtotalGroup").value).toUpperCase()+"1")?.c,g2=parseAddress(String(document.querySelector("#dataSubtotalGroup2").value).toUpperCase()+"1")?.c,v=parseAddress(String(document.querySelector("#dataSubtotalValue").value).toUpperCase()+"1")?.c,op=document.querySelector("#dataSubtotalOperation").value,groups=[g1,...(document.querySelector("#dataSubtotalGroup2").value.trim()?[g2]:[])],rows=summarizeByGroups(cells,bounds,{groupColumns:groups,valueColumn:v,operation:op});if(!rows.length)throw new Error("Không có nhóm dữ liệu để tổng hợp.");document.querySelector("#dataSubtotalOutput").innerHTML="<table><thead><tr><th>Cấp</th><th>Đường dẫn nhóm</th><th>Số mẫu</th><th>"+escapeHtml(op)+"</th></tr></thead><tbody>"+rows.map(r=>"<tr><td>"+(r.depth+1)+"</td><td>"+escapeHtml(r.path.join(" › ")||"(Trống)")+"</td><td>"+r.count+"</td><td>"+r.value+"</td></tr>").join("")+"</tbody></table>";dataStatus.textContent="Đã tổng hợp "+rows.length+" nút nhóm lồng nhau. Báo cáo xem trước, không ghi đè dữ liệu.";}catch(e){dataStatus.textContent=e.message;}
});

const pivotFieldList=document.querySelector("#pivotFieldList"),pivotRowsZone=document.querySelector("#pivotRowsZone"),pivotColumnsZone=document.querySelector("#pivotColumnsZone"),pivotValuesZone=document.querySelector("#pivotValuesZone"),pivotFiltersZone=document.querySelector("#pivotFiltersZone");
function pivotFieldLabel(column){return pivotFields.find(f=>f.column===column)?.label||("Cột "+letters(column));}
function pivotAssign(column,target){
 if(!pivotConfig)pivotConfig={bounds:selectedBounds(),rowColumns:[],columnField:null,measures:[],filterColumns:[],filters:{}};
 if(!pivotConfig.bounds)pivotConfig.bounds=selectedBounds();
 if((target==="row"&&pivotConfig.columnField===column)||(target==="column"&&pivotConfig.rowColumns.includes(column))){dataStatus.textContent="Một trường không thể đồng thời làm trường Hàng và Cột.";return;}
 if(target==="row"){if(!pivotConfig.rowColumns.includes(column)&&pivotConfig.rowColumns.length<4)pivotConfig.rowColumns.push(column);}
 else if(target==="column"){if(pivotConfig.columnField===null||pivotConfig.columnField===column)pivotConfig.columnField=column;}
 else if(target==="value"){if(pivotConfig.measures.length<4&&!pivotConfig.measures.some(m=>m.column===column))pivotConfig.measures.push({column,operation:"sum",label:pivotFieldLabel(column)});}
 else if(target==="filter"){if(!pivotConfig.filterColumns.includes(column)&&pivotConfig.filterColumns.length<4){pivotConfig.filterColumns.push(column);pivotConfig.filters[column]=uniqueColumnValues(cells,pivotConfig.bounds,column).map(x=>x.value);}}
 renderPivotBuilder();save();
}
function renderPivotBuilder(){
 if(!pivotFieldList)return;
 if(!pivotFields.length&&pivotConfig?.bounds){const b=pivotConfig.bounds;for(let c=b.startCol;c<=b.endCol;c++)pivotFields.push({column:c,label:String(cells[address(b.startRow,c)]??"").trim()||("Cột "+letters(c))});}
 pivotFieldList.innerHTML=pivotFields.map(f=>"<button type='button' draggable='true' class='pivot-field-chip' data-pivot-field='"+f.column+"'>"+escapeHtml(letters(f.column)+" · "+f.label)+"</button>").join("")||"<span>Chưa có trường. Hãy nạp trường từ vùng chọn.</span>";
 const tags=(list,kind)=>list.map(c=>"<span class='pivot-assignment'>"+escapeHtml(letters(c)+" · "+pivotFieldLabel(c))+" <button type='button' data-pivot-remove='"+kind+":"+c+"' aria-label='Bỏ trường'>×</button></span>").join("")||"Chưa có trường";
 pivotRowsZone.innerHTML=tags(pivotConfig?.rowColumns||[],"row");
 pivotColumnsZone.innerHTML=pivotConfig?.columnField?tags([pivotConfig.columnField],"column"):"Chưa có trường";
 pivotValuesZone.innerHTML=(pivotConfig?.measures||[]).map((m,i)=>"<span class='pivot-assignment'>"+escapeHtml(letters(m.column)+" · "+pivotFieldLabel(m.column))+" <select data-pivot-operation='"+i+"'><option value='sum' "+(m.operation==="sum"?"selected":"")+">Tổng</option><option value='average' "+(m.operation==="average"?"selected":"")+">Trung bình</option><option value='count' "+(m.operation==="count"?"selected":"")+">Đếm</option><option value='min' "+(m.operation==="min"?"selected":"")+">Nhỏ nhất</option><option value='max' "+(m.operation==="max"?"selected":"")+">Lớn nhất</option></select><button type='button' data-pivot-remove='value:"+i+"' aria-label='Bỏ chỉ tiêu'>×</button></span>").join("")||"Chưa có chỉ tiêu";
 pivotFiltersZone.innerHTML=(pivotConfig?.filterColumns||[]).map(c=>{const options=uniqueColumnValues(cells,pivotConfig.bounds,c),selected=pivotConfig.filters?.[c]||[];return "<div class='pivot-filter-control'><b>"+escapeHtml(pivotFieldLabel(c))+"</b><select multiple data-pivot-filter='"+c+"' aria-label='Giá trị lọc "+escapeHtml(pivotFieldLabel(c))+"'>"+options.map(x=>"<option value='"+escapeHtml(x.value).replace(/'/g,"&#39;")+"' "+(selected.includes(x.value)?"selected":"")+">"+escapeHtml(x.value||"(Trống)")+" · "+x.count+"</option>").join("")+"</select><button type='button' data-pivot-remove='filter:"+c+"'>Bỏ lọc</button></div>";}).join("")||"Không có bộ lọc trường";
}
function syncActivePivotChart(){pivotCharts=updatePivotChartSettings(pivotCharts,activePivotChartId,pivotChartSettings);}
function renderPivotChartManager(){
 const select=document.querySelector("#pivotChartManagerSelect"),count=document.querySelector("#pivotChartManagerCount");if(!select)return;
 const active=getActivePivotChart(pivotCharts,activePivotChartId);if(!active)return;
 activePivotChartId=active.id;
 select.innerHTML=pivotCharts.map((chart,i)=>"<option value='"+escapeHtml(chart.id)+"' "+(chart.id===activePivotChartId?"selected":"")+">"+(i+1)+". "+escapeHtml(chart.name)+"</option>").join("");
 count.textContent=pivotCharts.length+" / 20 biểu đồ";
 const index=pivotCharts.findIndex(x=>x.id===activePivotChartId);
 for(const [id,disabled] of [["pivotChartDuplicate",pivotCharts.length>=20],["pivotChartDelete",pivotCharts.length<=1],["pivotChartUp",index===0],["pivotChartDown",index===pivotCharts.length-1]]){const button=document.querySelector("#"+id);if(button)button.disabled=disabled;}
}
function selectPivotChart(id){syncActivePivotChart();const chart=getActivePivotChart(pivotCharts,id);activePivotChartId=chart.id;pivotChartSettings={...chart.settings};renderPivotChartManager();renderPivotReport();save();}
function createManagedPivotChart(){try{syncActivePivotChart();let n=pivotCharts.length+1,name="Biểu đồ "+n;while(pivotCharts.some(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))name="Biểu đồ "+(++n);pivotCharts=createPivotChart(pivotCharts,name,pivotChartSettings);const created=pivotCharts[pivotCharts.length-1];activePivotChartId=created.id;pivotChartSettings={...created.settings};renderPivotChartManager();renderPivotReport();save();document.querySelector("#pivotChartStatus").textContent="Đã tạo biểu đồ mới với cấu hình độc lập.";}catch(e){document.querySelector("#pivotChartStatus").textContent=e.message;}}
function duplicateManagedPivotChart(){try{syncActivePivotChart();pivotCharts=duplicatePivotChart(pivotCharts,activePivotChartId);const copy=pivotCharts[pivotCharts.length-1];activePivotChartId=copy.id;pivotChartSettings={...copy.settings};renderPivotChartManager();renderPivotReport();save();document.querySelector("#pivotChartStatus").textContent="Đã nhân bản thiết kế; biểu đồ mới có cấu hình riêng.";}catch(e){document.querySelector("#pivotChartStatus").textContent=e.message;}}
function renameManagedPivotChart(){const current=getActivePivotChart(pivotCharts,activePivotChartId);const value=prompt("Đặt tên biểu đồ:",current.name);if(value===null)return;try{syncActivePivotChart();pivotCharts=renamePivotChart(pivotCharts,activePivotChartId,value);renderPivotChartManager();save();}catch(e){document.querySelector("#pivotChartStatus").textContent=e.message;}}
function deleteManagedPivotChart(){if(pivotCharts.length<=1)return;if(!confirm("Xóa biểu đồ '"+getActivePivotChart(pivotCharts,activePivotChartId).name+"'? Không ảnh hưởng dữ liệu nguồn."))return;try{syncActivePivotChart();const oldIndex=pivotCharts.findIndex(x=>x.id===activePivotChartId);pivotCharts=removePivotChart(pivotCharts,activePivotChartId);const next=pivotCharts[Math.min(oldIndex,pivotCharts.length-1)];activePivotChartId=next.id;pivotChartSettings={...next.settings};renderPivotChartManager();renderPivotReport();save();}catch(e){document.querySelector("#pivotChartStatus").textContent=e.message;}}
function moveManagedPivotChart(direction){syncActivePivotChart();pivotCharts=movePivotChart(pivotCharts,activePivotChartId,direction);renderPivotChartManager();save();}
function renderPivotReport(){
 const output=document.querySelector("#pivotOutput"),chartOutput=document.querySelector("#pivotChartOutput");
 if(!pivotConfig||!pivotConfig.bounds||!pivotConfig.rowColumns?.length||!pivotConfig.measures?.length){if(chartOutput)chartOutput.innerHTML="<p class='pivot-chart-empty'>Thêm trường Hàng và Giá trị, rồi tạo Pivot để dựng biểu đồ liên kết.</p>";renderPivotChartManager();renderDashboard();return;}
 try{
  const p=buildPivotTable(cells,pivotConfig.bounds,{rowColumns:pivotConfig.rowColumns,columnField:pivotConfig.columnField,valueColumn:pivotConfig.measures[0].column,operation:pivotConfig.measures[0].operation,measures:pivotConfig.measures,filters:pivotConfig.filters||{}});
  const rowHeaders=pivotConfig.rowColumns.map(pivotFieldLabel),headers=[...rowHeaders,...p.columns.flatMap(col=>p.measures.map(m=>col+" · "+(m.label||pivotFieldLabel(m.column))+" ("+m.operation+")")),...p.measures.map(m=>"Tổng · "+(m.label||pivotFieldLabel(m.column)))];
  const body=p.rows.map(r=>[...r.labels,...r.metrics.flatMap(m=>p.columns.map(c=>m.values[c]??0)),...r.metrics.map(m=>m.total)]);
  const totals=p.grandTotals.flatMap(m=>p.columns.map(c=>m.columnTotals[c]??0)),totalRow=[...rowHeaders.map((_,i)=>i===0?"Tổng cộng":""),...totals,...p.grandTotals.map(m=>m.total)];
  output.innerHTML="<div class='pivot-report-meta'>"+p.includedRows+" dòng nguồn · "+p.rowCount+" nhóm · tự làm mới khi dữ liệu thay đổi</div><table><thead><tr>"+headers.map(x=>"<th>"+escapeHtml(x)+"</th>").join("")+"</tr></thead><tbody>"+body.map(row=>"<tr>"+row.map(x=>"<td>"+escapeHtml(x)+"</td>").join("")+"</tr>").join("")+"<tr class='pivot-grand-total'>"+totalRow.map(x=>"<th>"+escapeHtml(x)+"</th>").join("")+"</tr></tbody></table>";
  renderPivotChart(p);
  renderPivotChartManager();
  renderDashboard();
 }catch(e){output.textContent="Không thể làm mới Pivot: "+e.message;if(chartOutput)chartOutput.textContent="Biểu đồ chưa thể cập nhật: "+e.message;}
}
function normalizedFieldLabel(value){return String(value??"").trim().normalize("NFKC").toLocaleLowerCase().replace(/\\s+/g," ");}
function dashboardFieldKey(sourceCells,bounds,column){const raw=normalizedFieldLabel(sourceCells[address(bounds.startRow,column)]);let occurrence=0;for(let c=bounds.startCol;c<=column;c++)if(normalizedFieldLabel(sourceCells[address(bounds.startRow,c)])===raw)occurrence++;return workbookFieldKey(raw,occurrence||1);}
function dashboardFieldColumn(sourceCells,bounds,key){for(let c=bounds.startCol;c<=bounds.endCol;c++)if(dashboardFieldKey(sourceCells,bounds,c)===key)return c;return null;}
function renderDashboard(){
 const host=document.querySelector("#dashboardGrid");if(!host)return;host.replaceChildren();
 const ready=dashboard.widgets.filter(w=>w.pivotConfig),fieldChoices=new Map();for(const w of ready){const p=w.pivotConfig,sh=getWorkbookSheet(workbookSheets,p.sheetId||workbookSheets[0]?.id||activeSheetId);if(!sh)continue;for(let c=p.bounds.startCol;c<=p.bounds.endCol;c++){const key=dashboardFieldKey(sh.cells,p.bounds,c);if(!fieldChoices.has(key))fieldChoices.set(key,{key,label:String(sh.cells[address(p.bounds.startRow,c)]??"").trim()||("Cột "+letters(c))});}}
 const filterHost=document.querySelector("#dashboardSharedFilters");if(filterHost){filterHost.replaceChildren();for(const choice of fieldChoices.values()){const sources=ready.map(w=>({p:w.pivotConfig,s:getWorkbookSheet(workbookSheets,w.pivotConfig.sheetId||workbookSheets[0]?.id||activeSheetId)})).filter(x=>x.s&&dashboardFieldColumn(x.s.cells,x.p.bounds,choice.key)!==null);const values=[...new Set(sources.flatMap(x=>{const c=dashboardFieldColumn(x.s.cells,x.p.bounds,choice.key);return uniqueColumnValues(x.s.cells,x.p.bounds,c).map(v=>v.value);} ))].sort();const label=document.createElement("label");label.className="dashboard-shared-filter";label.textContent=choice.label;const select=document.createElement("select");select.multiple=true;select.setAttribute("aria-label","Bộ lọc dùng chung "+label.textContent);const selected=dashboard.sharedFilters[choice.key]||[];for(const value of values){const option=document.createElement("option");option.value=value;option.textContent=value||"(Trống)";option.selected=selected.includes(value);select.append(option);}select.addEventListener("change",()=>{dashboard={...dashboard,sharedFilters:{...dashboard.sharedFilters,[choice.key]:[...select.selectedOptions].map(o=>o.value)}};save();renderDashboard();});label.append(select);filterHost.append(label);}}
 const crossHost=document.querySelector("#dashboardCrossFilterStatus");if(crossHost){crossHost.replaceChildren();for(const [column,filter] of Object.entries(dashboard.crossFilters||{})){const item=document.createElement("span");item.textContent="Cột "+letters(Number(filter.column||String(column).split(":").pop()))+": "+filter.values.join(", ");const clear=document.createElement("button");clear.type="button";clear.textContent="Bỏ lọc";clear.addEventListener("click",()=>{dashboard=removeDashboardCrossFilter(dashboard,column);save();renderDashboard();});item.append(" ",clear);crossHost.append(item);}if(!Object.keys(dashboard.crossFilters||{}).length)crossHost.textContent="Chưa có lọc chéo.";}
 let draggedId=null;
 for(const w of dashboard.widgets){const card=document.createElement("article");card.className="dashboard-card"+(w.size==="wide"?" is-wide":"");card.dataset.widgetId=w.id;card.draggable=true;if(w.width)card.style.width=w.width+"px";if(w.height)card.style.height=w.height+"px";
 card.addEventListener("dragstart",event=>{draggedId=w.id;event.dataTransfer?.setData("text/plain",w.id);if(event.dataTransfer)event.dataTransfer.effectAllowed="move";card.classList.add("is-dragging");});card.addEventListener("dragend",()=>{draggedId=null;card.classList.remove("is-dragging");});card.addEventListener("dragover",event=>{if(draggedId&&draggedId!==w.id){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";}});card.addEventListener("drop",event=>{event.preventDefault();const id=event.dataTransfer?.getData("text/plain")||draggedId;if(!id||id===w.id)return;dashboard=moveDashboardWidgetToIndex(dashboard,id,dashboard.widgets.findIndex(x=>x.id===w.id));save();renderDashboard();});
 const head=document.createElement("header"),name=document.createElement("b"),actions=document.createElement("div");name.textContent=w.title;name.title="Kéo thẻ này để sắp xếp";actions.className="dashboard-card-actions";
 for(const [label,act] of [["↑","up"],["↓","down"],[w.size==="wide"?"Thu nhỏ":"Mở rộng","size"],["Lấy Pivot hiện hành","source"],["×","remove"]]){const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>{if(act==="up")dashboard=moveDashboardWidget(dashboard,w.id,-1);else if(act==="down")dashboard=moveDashboardWidget(dashboard,w.id,1);else if(act==="size")dashboard=resizeDashboardWidget(dashboard,w.id,w.size==="wide"?"normal":"wide");else if(act==="source"){if(!pivotConfig){document.querySelector("#dashboardStatus").textContent="Hãy cấu hình Pivot Table trước.";return;}dashboard=updateDashboardWidget(dashboard,w.id,{pivotConfig:{...JSON.parse(JSON.stringify(pivotConfig)),sheetId:activeSheetId},metricIndex:0});}else dashboard=removeDashboardWidget(dashboard,w.id);save();renderDashboard();});actions.append(b);}head.append(name,actions);card.append(head);
 const p=w.pivotConfig;if(!p){const empty=document.createElement("p");empty.className="pivot-chart-empty";empty.textContent="Chưa gán nguồn. Hãy thiết lập Pivot Table rồi bấm “Lấy Pivot hiện hành”.";card.append(empty);}else{try{const sourceSheet=getWorkbookSheet(workbookSheets,p.sheetId||activeSheetId);if(!sourceSheet)throw new Error("Không tìm thấy trang tính nguồn đã gắn với thẻ này.");const sourceCells=sourceSheet.cells,shared={...p.filters};for(const [fieldKey,values] of Object.entries(dashboard.sharedFilters||{})){const c=dashboardFieldColumn(sourceCells,p.bounds,fieldKey);if(c!==null)shared[c]=values;}for(const [key,filter] of Object.entries(dashboard.crossFilters||{})){if(filter.sourceWidgetId===w.id)continue;const fieldKey=filter.fieldKey||("column:"+filter.column),c=fieldKey.startsWith("column:")?Number(fieldKey.slice(7)):dashboardFieldColumn(sourceCells,p.bounds,fieldKey);if(Number.isInteger(c)&&c>=p.bounds.startCol&&c<=p.bounds.endCol)shared[c]=filter.values;}const result=buildPivotTable(sourceCells,p.bounds,{rowColumns:p.rowColumns,columnField:p.columnField,measures:p.measures,filters:shared});
 if(w.type==="chart"){const field=p.rowColumns[0],fieldKey=dashboardFieldKey(sourceCells,p.bounds,field),model=buildPivotChartModel(result,{measureIndex:Math.min(w.metricIndex,result.measures.length-1),limit:18}),wrap=document.createElement("div");wrap.className="dashboard-chart";const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 720 320");svg.setAttribute("role","img");svg.setAttribute("aria-label","Biểu đồ "+w.title);const vals=model.series[0]?.values||[],cats=model.categories||[],max=Math.max(1,...vals),sum=vals.reduce((a,v)=>a+Math.max(0,v),0),type=w.chartType||"column",ns=svg.namespaceURI;const color=w.theme==="midnight"?"#8ab4f8":w.theme==="forest"?"#287653":"#39866a";const addText=(x,y,t)=>{const el=document.createElementNS(ns,"text");el.setAttribute("x",String(x));el.setAttribute("y",String(y));el.setAttribute("font-size","10");el.textContent=String(t).slice(0,16);svg.append(el);};for(let i=0;i<cats.length;i++){const group=cats[i],v=Math.max(0,vals[i]||0),x=48+i*(640/Math.max(1,cats.length)),slot=640/Math.max(1,cats.length),h=220*v/max;let mark;if(type==="pie"||type==="donut"){const angle=sum?360*v/sum:0,start=vals.slice(0,i).reduce((a,n)=>a+Math.max(0,n),0)/Math.max(1,sum)*Math.PI*2,end=start+angle*Math.PI/180,r=type==="donut"?82:105,cx=360,cy=145,x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start),x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);mark=document.createElementNS(ns,"path");const large=angle>180?1:0;mark.setAttribute("d",sum?(`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`):"");mark.setAttribute("fill",["#39866a","#d49b38","#4b86b4","#a36bb5","#d16d61"][i%5]);if(type==="donut"){mark.setAttribute("fill-rule","evenodd");mark.setAttribute("d",`M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 -${r*2} 0 M ${cx} ${cy} m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0`);mark.setAttribute("fill-rule","evenodd");} }else{mark=document.createElementNS(ns,type==="line"||type==="area"?"circle":"rect");if(type==="bar"){mark.setAttribute("x","48");mark.setAttribute("y",String(22+i*250/Math.max(1,cats.length)));mark.setAttribute("width",String(600*v/max));mark.setAttribute("height",String(Math.max(4,Math.min(26,200/Math.max(1,cats.length)))));}else if(type==="line"||type==="area"){mark.setAttribute("cx",String(x+slot/2));mark.setAttribute("cy",String(260-h));mark.setAttribute("r","4");}else{mark.setAttribute("x",String(x+slot*.18));mark.setAttribute("y",String(260-h));mark.setAttribute("width",String(Math.max(5,slot*.58)));mark.setAttribute("height",String(h));mark.setAttribute("rx","3");}}mark.setAttribute("fill",type==="line"?"#fff":color);mark.setAttribute("stroke",color);mark.setAttribute("stroke-width","2");mark.setAttribute("tabindex","0");mark.setAttribute("role","button");mark.setAttribute("aria-label","Lọc theo "+group);const apply=()=>{dashboard=setDashboardCrossFilter(dashboard,field,[String(group)],w.id,fieldKey);save();renderDashboard();};mark.addEventListener("click",apply);mark.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();apply();}});svg.append(mark);if(type!=="pie"&&type!=="donut")addText(type==="bar"?55:x+slot*.12,type==="bar"?Math.min(315,42+i*250/Math.max(1,cats.length)):282,group);}if(type==="line"||type==="area"){const points=vals.map((v,i)=>[48+(i+.5)*(640/Math.max(1,cats.length)),260-220*Math.max(0,v)/max]);const path=document.createElementNS(ns,"path");path.setAttribute("d",points.map((p,i)=>(i?"L":"M")+p[0]+" "+p[1]).join(" ")+(type==="area"&&points.length?` L ${points.at(-1)[0]} 260 L ${points[0][0]} 260 Z`:""));path.setAttribute("fill",type==="area"?color+"33":"none");path.setAttribute("stroke",color);path.setAttribute("stroke-width","3");svg.insertBefore(path,svg.firstChild);}wrap.append(svg);card.append(wrap);const controls=document.createElement("label");controls.className="dashboard-widget-setting";controls.textContent="Dạng biểu đồ ";const select=document.createElement("select");for(const [v,l] of [["column","Cột"],["bar","Thanh ngang"],["line","Đường"],["area","Miền"],["pie","Tròn"],["donut","Vành khuyên"]]){const o=document.createElement("option");o.value=v;o.textContent=l;o.selected=(w.chartType||"column")===v;select.append(o);}select.addEventListener("change",()=>{dashboard=updateDashboardWidget(dashboard,w.id,{chartType:select.value});save();renderDashboard();});controls.append(select);card.append(controls);const hint=document.createElement("small");hint.className="dashboard-source-note";hint.textContent="Nhấn điểm dữ liệu để lọc chéo các thẻ liên kết.";card.append(hint);
 }else{const select=document.createElement("select");select.setAttribute("aria-label","Chỉ tiêu KPI "+w.title);result.measures.forEach((m,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=m.label||pivotFieldLabel(m.column);o.selected=i===w.metricIndex;select.append(o);});select.addEventListener("change",()=>{dashboard=updateDashboardWidget(dashboard,w.id,{metricIndex:Number(select.value)});save();renderDashboard();});const mode=document.createElement("select");mode.setAttribute("aria-label","Cách tính KPI "+w.title);for(const [v,l] of [["total","Tổng hợp Pivot"],["average","Trung bình nhóm"],["min","Nhỏ nhất"],["max","Lớn nhất"],["delta","Chênh lệch lớn nhất - nhỏ nhất"]]){const o=document.createElement("option");o.value=v;o.textContent=l;o.selected=(w.kpiMode||"total")===v;mode.append(o);}mode.addEventListener("change",()=>{dashboard=updateDashboardWidget(dashboard,w.id,{kpiMode:mode.value});save();renderDashboard();});const value=document.createElement("strong"),note=document.createElement("small"),metric=result.grandTotals[w.metricIndex]||result.grandTotals[0],groupValues=result.rows.map(r=>Number(r.metrics?.[w.metricIndex]?.total??r.total)).filter(Number.isFinite);let shown=metric?.total;if(w.kpiMode==="average"&&groupValues.length)shown=groupValues.reduce((a,v)=>a+v,0)/groupValues.length;else if(w.kpiMode==="min"&&groupValues.length)shown=Math.min(...groupValues);else if(w.kpiMode==="max"&&groupValues.length)shown=Math.max(...groupValues);else if(w.kpiMode==="delta"&&groupValues.length)shown=Math.max(...groupValues)-Math.min(...groupValues);value.className="dashboard-kpi-value";value.textContent=Number.isFinite(shown)?Number(shown).toLocaleString("vi-VN",{maximumFractionDigits:2}):"—";note.textContent=(metric?.label||"Chỉ tiêu Pivot")+" · "+result.includedRows+" dòng";card.append(select,mode,value,note);}}catch(e){const error=document.createElement("p");error.className="pivot-chart-empty";error.textContent="Nguồn Pivot lỗi: "+e.message;card.append(error);}}
 const source=document.createElement("small");source.className="dashboard-source-note";source.textContent=p?"Nguồn: "+(getWorkbookSheet(workbookSheets,p.sheetId||activeSheetId)?.name||"Trang tính")+" · "+p.rowColumns.length+" trường hàng · "+p.measures.length+" chỉ tiêu":"Chưa có nguồn Pivot";card.append(source);host.append(card);
 if(typeof ResizeObserver!=="undefined"&&w.width&&w.height){const observer=new ResizeObserver(()=>{});observer.observe(card);}
 }
 const status=document.querySelector("#dashboardStatus");if(status)status.textContent=dashboard.widgets.length+" thẻ · "+ready.length+" nguồn Pivot độc lập · "+dashboardTemplates.length+" mẫu";
}
async function exportDashboardPng(){const source=document.querySelector("#dashboardGrid");if(!source||!source.children.length)throw new Error("Dashboard chưa có thẻ để xuất.");const clone=source.cloneNode(true);clone.style.width=source.scrollWidth+"px";clone.style.background="#fff";const originals=[source,...source.querySelectorAll("*")],copies=[clone,...clone.querySelectorAll("*")];for(let i=0;i<Math.min(originals.length,copies.length);i++){const computed=getComputedStyle(originals[i]);copies[i].setAttribute("style",(copies[i].getAttribute("style")||"")+";"+[...computed].map(k=>k+":"+computed.getPropertyValue(k)).join(";"));}const width=Math.max(800,source.scrollWidth),height=Math.max(400,source.scrollHeight),markup=new XMLSerializer().serializeToString(clone),svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">'+markup+'</div></foreignObject></svg>',url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement("canvas");canvas.width=width*2;canvas.height=height*2;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas không khả dụng.");ctx.scale(2,2);ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0);const png=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));if(!png)throw new Error("Trình duyệt không tạo được PNG.");const link=document.createElement("a");link.href=URL.createObjectURL(png);link.download="SGHT-Dashboard.png";link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}finally{URL.revokeObjectURL(url);}}
document.querySelector("#dashboardExportPng").addEventListener("click",()=>exportDashboardPng().then(()=>{document.querySelector("#dashboardStatus").textContent="Đã tạo yêu cầu xuất PNG 2×.";}).catch(e=>{document.querySelector("#dashboardStatus").textContent="Xuất PNG thất bại: "+e.message;}));
document.querySelector("#dashboardExportPdf").addEventListener("click",()=>{document.body.classList.add("dashboard-print-mode");window.print();setTimeout(()=>document.body.classList.remove("dashboard-print-mode"),500);});
document.querySelector("#dashboardPresent").addEventListener("click",()=>{const panel=document.querySelector("#dashboardPanel"),active=!panel.classList.contains("is-presentation");panel.classList.toggle("is-presentation",active);dashboard=setDashboardPresentation(dashboard,active);document.querySelector("#dashboardPresent").textContent=active?"Thoát trình chiếu":"Trình chiếu";save();});
document.querySelector("#closeDashboard").addEventListener("click",()=>{const panel=document.querySelector("#dashboardPanel");panel.classList.remove("is-presentation");dashboard=setDashboardPresentation(dashboard,false);document.querySelector("#dashboardPresent").textContent="Trình chiếu";save();});

function renderPivotChart(p){
 const host=document.querySelector("#pivotChartOutput"),measureSelect=document.querySelector("#pivotChartMeasure"),typeSelect=document.querySelector("#pivotChartType"),status=document.querySelector("#pivotChartStatus");
 if(!host)return;
 const measures=p.measures||[];
 if(measureSelect){const selected=Math.min(Math.max(0,pivotChartSettings.measureIndex||0),Math.max(0,measures.length-1));pivotChartSettings.measureIndex=selected;measureSelect.innerHTML=measures.map((m,i)=>"<option value='"+i+"' "+(i===selected?"selected":"")+">"+escapeHtml(m.label||pivotFieldLabel(m.column))+"</option>").join("");}
 if(typeSelect)typeSelect.value=pivotChartSettings.type;
 const mi=pivotChartSettings.measureIndex||0,model=buildPivotChartModel(p,{measureIndex:mi,limit:24}),categories=model.categories,series=model.series;
 if(!categories.length||!series.length){host.innerHTML="<p class='pivot-chart-empty'>Không có nhóm phù hợp với bộ lọc hiện tại.</p>";status.textContent="Không có dữ liệu để vẽ.";return;}
 const cfg=normalizePivotChartStudio(pivotChartSettings);
 for(const [id,value] of Object.entries({pivotChartTitle:cfg.title,pivotChartXAxis:cfg.xAxisTitle,pivotChartYAxis:cfg.yAxisTitle,pivotChartLegend:cfg.showLegend,pivotChartLabels:cfg.showLabels,pivotChartNumberFormat:cfg.numberFormat,pivotChartColors:cfg.colors.join(", ")})){const control=document.querySelector("#"+id);if(control){if(control.type==="checkbox")control.checked=value;else control.value=value;}}
 const W=900,H=440,L=76,R=28,T=cfg.title?54:30,B=cfg.type==="donut"?32:100,plotW=W-L-R,plotH=H-T-B,all=series.flatMap(s=>s.values),min=Math.min(0,...all),max=Math.max(0,...all),span=max-min||1,y=v=>T+(max-v)/span*plotH,x=i=>L+(i+.5)*plotW/categories.length,palette=cfg.colors;
 let marks="";
 if(cfg.type!=="donut")for(let g=0;g<=4;g++){const val=min+span*g/4,yy=y(val);marks+="<line x1='"+L+"' y1='"+yy+"' x2='"+(W-R)+"' y2='"+yy+"' stroke='#dce3df'/><text x='"+(L-9)+"' y='"+(yy+4)+"' text-anchor='end' font-size='11' fill='#52615a'>"+escapeHtml(formatPivotChartNumber(val,cfg.numberFormat))+"</text>";}
 const legendItems=cfg.type==="donut"?categories.map((name,i)=>({name,color:palette[i%palette.length]})):series.map((s,i)=>({name:s.name,color:palette[i%palette.length]}));
 const legend=cfg.showLegend?"<div class='pivot-chart-legend'>"+legendItems.map(item=>"<span class='pivot-chart-legend-item'><i style='background:"+item.color+"'></i>"+escapeHtml(item.name)+"</span>").join("")+"</div>":"";
 if(cfg.type==="bar"){const groupW=plotW/categories.length,barW=Math.max(3,Math.min(34,groupW*.72/series.length));series.forEach((s,si)=>s.values.forEach((v,i)=>{const xx=L+i*groupW+groupW/2-series.length*barW/2+si*barW,zero=y(0),yy=y(v),height=Math.abs(yy-zero),color=palette[si%palette.length];marks+="<rect x='"+xx+"' y='"+Math.min(yy,zero)+"' width='"+(barW-2)+"' height='"+Math.max(1,height)+"' rx='3' fill='"+color+"'><title>"+escapeHtml(categories[i]+" · "+s.name+": "+formatPivotChartNumber(v,cfg.numberFormat))+"</title></rect>";if(cfg.showLabels)marks+="<text x='"+(xx+barW/2)+"' y='"+(v>=0?Math.min(yy,zero)-5:Math.max(yy,zero)+13)+"' text-anchor='middle' font-size='10' fill='#26352d'>"+escapeHtml(formatPivotChartNumber(v,cfg.numberFormat))+"</text>";}));}
 else if(cfg.type==="line"){series.forEach((s,si)=>{const color=palette[si%palette.length];marks+="<polyline points='"+s.values.map((v,i)=>x(i)+","+y(v)).join(" ")+"' fill='none' stroke='"+color+"' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>";s.values.forEach((v,i)=>{marks+="<circle cx='"+x(i)+"' cy='"+y(v)+"' r='4' fill='"+color+"'><title>"+escapeHtml(categories[i]+" · "+s.name+": "+formatPivotChartNumber(v,cfg.numberFormat))+"</title></circle>";if(cfg.showLabels)marks+="<text x='"+x(i)+"' y='"+(y(v)-9)+"' text-anchor='middle' font-size='10' fill='#26352d'>"+escapeHtml(formatPivotChartNumber(v,cfg.numberFormat))+"</text>";});});}
 else{
  if(series.length!==1)throw new Error("Biểu đồ vành khuyên cần một chuỗi. Hãy bỏ trường Cột hoặc chọn Cột nhóm/Đường.");
  if(all.some(v=>v<0))throw new Error("Biểu đồ vành khuyên không nhận giá trị âm.");
  const vals=series[0].values,total=vals.reduce((a,v)=>a+v,0);if(total<=0)throw new Error("Tổng giá trị phải lớn hơn 0 để vẽ vành khuyên.");
  let angle=-Math.PI/2;const cx=W/2,cy=H/2-8,outer=125,inner=72;
  vals.forEach((v,i)=>{if(v<=0)return;const next=angle+v/total*Math.PI*2,x1=cx+outer*Math.cos(angle),y1=cy+outer*Math.sin(angle),x2=cx+outer*Math.cos(next),y2=cy+outer*Math.sin(next),ix2=cx+inner*Math.cos(next),iy2=cy+inner*Math.sin(next),ix1=cx+inner*Math.cos(angle),iy1=cy+inner*Math.sin(angle),large=next-angle>Math.PI?1:0,color=palette[i%palette.length];marks+="<path d='M "+x1+" "+y1+" A "+outer+" "+outer+" 0 "+large+" 1 "+x2+" "+y2+" L "+ix2+" "+iy2+" A "+inner+" "+inner+" 0 "+large+" 0 "+ix1+" "+iy1+" Z' fill='"+color+"'><title>"+escapeHtml(categories[i]+": "+formatPivotChartNumber(v,cfg.numberFormat))+"</title></path>";if(cfg.showLabels)marks+="<text x='"+(cx+(outer+inner)/2*Math.cos((angle+next)/2))+"' y='"+(cy+(outer+inner)/2*Math.sin((angle+next)/2))+"' text-anchor='middle' font-size='10' fill='#fff'>"+escapeHtml(formatPivotChartNumber(v/total,"percent"))+"</text>";angle=next;});
  marks+="<text x='"+cx+"' y='"+(cy-2)+"' text-anchor='middle' font-size='13' fill='#52615a'>Tổng</text><text x='"+cx+"' y='"+(cy+22)+"' text-anchor='middle' font-size='20' font-weight='700' fill='#17231d'>"+escapeHtml(formatPivotChartNumber(total,cfg.numberFormat))+"</text>";
 }
 const labels=cfg.type==="donut"?"":categories.map((c,i)=>"<text x='"+x(i)+"' y='"+(H-48)+"' text-anchor='middle' font-size='11' fill='#52615a'>"+escapeHtml(c.length>20?c.slice(0,19)+"…":c)+"</text>").join("");
 const title=cfg.title?"<text x='"+(W/2)+"' y='25' text-anchor='middle' font-size='17' font-weight='700' fill='#203329'>"+escapeHtml(cfg.title)+"</text>":"";
 const axisX=cfg.type==="donut"||!cfg.xAxisTitle?"":"<text x='"+(L+plotW/2)+"' y='"+(H-8)+"' text-anchor='middle' font-size='12' fill='#344a3d'>"+escapeHtml(cfg.xAxisTitle)+"</text>";
 const axisY=cfg.type==="donut"||!cfg.yAxisTitle?"":"<text transform='translate(16 "+(T+plotH/2)+") rotate(-90)' text-anchor='middle' font-size='12' fill='#344a3d'>"+escapeHtml(cfg.yAxisTitle)+"</text>";
 host.innerHTML="<div class='pivot-chart-meta'>"+escapeHtml(measures[mi]?.label||"Chỉ tiêu")+" · "+p.includedRows+" dòng sau lọc"+(model.truncated?" · biểu đồ hiển thị 24 nhóm đầu":"")+"</div><div class='pivot-chart-scroll'><svg class='pivot-chart-svg' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+W+" "+H+"' role='img' aria-label='Biểu đồ Pivot "+escapeHtml(cfg.type)+"'>"+title+marks+labels+axisX+axisY+"</svg></div>"+legend;
 status.textContent="Biểu đồ liên kết Pivot · "+(cfg.showLabels?"đang hiện nhãn số liệu":"đã ẩn nhãn số liệu")+".";
}

document.querySelector("#pivotLoadFields").addEventListener("click",()=>{
 try{const b=selectedBounds();if(b.endRow<=b.startRow)throw new Error("Vùng cần có hàng tiêu đề và ít nhất một hàng dữ liệu.");pivotFields=[];for(let c=b.startCol;c<=b.endCol;c++){const label=String(cells[address(b.startRow,c)]??"").trim()||("Cột "+letters(c));pivotFields.push({column:c,label});}pivotConfig={bounds:b,rowColumns:[],columnField:null,measures:[],filterColumns:[],filters:{}};renderPivotBuilder();document.querySelector("#pivotOutput").innerHTML="";save();dataStatus.textContent="Đã nạp "+pivotFields.length+" trường từ hàng tiêu đề "+b.startRow+".";}catch(e){dataStatus.textContent=e.message;}
});
pivotFieldList.addEventListener("click",e=>{const chip=e.target.closest("[data-pivot-field]");if(chip)pivotAssign(Number(chip.dataset.pivotField),document.querySelector("#pivotTarget").value);});
pivotFieldList.addEventListener("dragstart",e=>{const chip=e.target.closest("[data-pivot-field]");if(chip)e.dataTransfer.setData("text/plain",chip.dataset.pivotField);});
document.querySelectorAll(".pivot-zone").forEach(zone=>{zone.addEventListener("dragover",e=>e.preventDefault());zone.addEventListener("drop",e=>{e.preventDefault();const c=Number(e.dataTransfer.getData("text/plain"));if(c)pivotAssign(c,zone.dataset.pivotTarget);});});
document.querySelector(".pivot-builder").addEventListener("click",e=>{const b=e.target.closest("[data-pivot-remove]");if(!b||!pivotConfig)return;const [kind,value]=b.dataset.pivotRemove.split(":"),n=Number(value);if(kind==="row")pivotConfig.rowColumns=pivotConfig.rowColumns.filter(c=>c!==n);if(kind==="column")pivotConfig.columnField=null;if(kind==="value")pivotConfig.measures.splice(n,1);if(kind==="filter"){pivotConfig.filterColumns=pivotConfig.filterColumns.filter(c=>c!==n);delete pivotConfig.filters[n];}renderPivotBuilder();renderPivotReport();save();});
document.querySelector(".pivot-builder").addEventListener("change",e=>{if(!pivotConfig)return;if(e.target.matches("[data-pivot-operation]")){pivotConfig.measures[Number(e.target.dataset.pivotOperation)].operation=e.target.value;renderPivotReport();save();}if(e.target.matches("[data-pivot-filter]")){const c=Number(e.target.dataset.pivotFilter);pivotConfig.filters[c]=Array.from(e.target.selectedOptions).map(o=>o.value);renderPivotReport();save();}});
function applyPivotChartSettings(){try{pivotChartSettings=normalizePivotChartStudio({...pivotChartSettings,title:document.querySelector("#pivotChartTitle").value,xAxisTitle:document.querySelector("#pivotChartXAxis").value,yAxisTitle:document.querySelector("#pivotChartYAxis").value,showLegend:document.querySelector("#pivotChartLegend").checked,showLabels:document.querySelector("#pivotChartLabels").checked,numberFormat:document.querySelector("#pivotChartNumberFormat").value,colors:parsePivotChartColors(document.querySelector("#pivotChartColors").value)});renderPivotReport();save();document.querySelector("#pivotChartStatus").textContent="Đã áp dụng và lưu thiết lập biểu đồ."; }catch(e){document.querySelector("#pivotChartStatus").textContent=e.message;}}
document.querySelector("#pivotChartType").addEventListener("change",e=>{pivotChartSettings.type=e.target.value;renderPivotReport();save();});
document.querySelector("#pivotChartMeasure").addEventListener("change",e=>{pivotChartSettings.measureIndex=Number(e.target.value);renderPivotReport();save();});
document.querySelector("#pivotChartApply").addEventListener("click",applyPivotChartSettings);
document.querySelector("#pivotChartManagerSelect").addEventListener("change",e=>selectPivotChart(e.target.value));
document.querySelector("#pivotChartCreate").addEventListener("click",createManagedPivotChart);
document.querySelector("#pivotChartDuplicate").addEventListener("click",duplicateManagedPivotChart);
document.querySelector("#pivotChartRename").addEventListener("click",renameManagedPivotChart);
document.querySelector("#pivotChartDelete").addEventListener("click",deleteManagedPivotChart);
document.querySelector("#pivotChartUp").addEventListener("click",()=>moveManagedPivotChart(-1));
document.querySelector("#pivotChartDown").addEventListener("click",()=>moveManagedPivotChart(1));
document.querySelector("#pivotChartExport").addEventListener("click",()=>{const svg=document.querySelector("#pivotChartOutput svg");if(!svg){document.querySelector("#pivotChartStatus").textContent="Hãy tạo biểu đồ trước khi xuất.";return;}const source=new XMLSerializer().serializeToString(svg),blob=new Blob([source],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="SGHT-Pivot-Chart.svg";a.click();URL.revokeObjectURL(url);});
document.querySelector("#pivotChartPng").addEventListener("click",()=>{const svg=document.querySelector("#pivotChartOutput svg");if(!svg){document.querySelector("#pivotChartStatus").textContent="Hãy tạo biểu đồ trước khi xuất.";return;}const source=new XMLSerializer().serializeToString(svg),blob=new Blob([source],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob),img=new Image();img.onload=()=>{const canvas=document.createElement("canvas"),box=svg.viewBox.baseVal;canvas.width=Math.max(1,box.width*2);canvas.height=Math.max(1,box.height*2);const ctx=canvas.getContext("2d");ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);canvas.toBlob(file=>{if(!file){document.querySelector("#pivotChartStatus").textContent="Không thể tạo PNG trên trình duyệt này.";return;}const pngUrl=URL.createObjectURL(file),link=document.createElement("a");link.href=pngUrl;link.download="SGHT-Pivot-Chart.png";link.click();URL.revokeObjectURL(pngUrl);},"image/png");};img.onerror=()=>{URL.revokeObjectURL(url);document.querySelector("#pivotChartStatus").textContent="Lỗi chuyển SVG sang PNG.";};img.src=url;});
document.querySelector("#pivotChartPdf").addEventListener("click",()=>{const svg=document.querySelector("#pivotChartOutput svg");if(!svg){document.querySelector("#pivotChartStatus").textContent="Hãy tạo biểu đồ trước khi in PDF.";return;}const source=new XMLSerializer().serializeToString(svg),blob=new Blob([source],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob),win=window.open(url,"_blank");if(!win){URL.revokeObjectURL(url);document.querySelector("#pivotChartStatus").textContent="Trình duyệt đang chặn cửa sổ mới. Hãy cho phép cửa sổ bật lên để in PDF.";return;}win.addEventListener("load",()=>{win.focus();win.print();},{once:true});setTimeout(()=>URL.revokeObjectURL(url),60000);});
document.querySelector("#pivotBuild").addEventListener("click",()=>{
 try{if(!pivotConfig||!pivotConfig.bounds)throw new Error("Hãy nạp trường dữ liệu trước.");if(!pivotConfig.rowColumns.length)throw new Error("Thêm ít nhất một trường vào vùng Hàng.");if(!pivotConfig.measures.length)throw new Error("Thêm ít nhất một trường vào vùng Giá trị.");renderPivotReport();save();dataStatus.textContent="Pivot Table đã tạo. Báo cáo tự làm mới sau mỗi lần dữ liệu nguồn thay đổi.";}catch(e){dataStatus.textContent=e.message;}
});
document.querySelector("#dataRemoveDuplicates").addEventListener("click",()=>{
 try{
  const bounds=selectedBounds(),result=removeDuplicateRows(cells,cellFormats,bounds);
  if(!result.removed){dataStatus.textContent="Không tìm thấy hàng trùng lặp trong vùng chọn.";return;}
  if(!confirm("Xóa "+result.removed+" hàng trùng lặp trong vùng chọn? Hàng giữ lại là lần xuất hiện đầu tiên. Có thể hoàn tác."))return;
  snapshot();const dedupeAddresses=expandRange(address(bounds.startRow,bounds.startCol),address(bounds.endRow,bounds.endCol));for(const a of dedupeAddresses)if(cells[a]!==result.cells[a])recordFormulaCellVersion(a,raw(a),result.cells[a]??"", "remove-duplicates");cells=result.cells;cellFormats=result.formats;invalidateFormulaCells(dedupeAddresses);filteredRows.clear();activeFilter=null;render();save();dataStatus.textContent="Đã loại "+result.removed+" hàng trùng lặp. Có thể Hoàn tác.";
 }catch(e){dataStatus.textContent=e.message;}
});
document.querySelector("#dataDefineTable").addEventListener("click",()=>{
 try{
  const bounds=selectedBounds(),name=dataTableName.value.trim();
  const table=defineStructuredRange(cells,bounds,name);
  const exists=dataTables.some(t=>t.name.toLocaleLowerCase()===table.name.toLocaleLowerCase());
  if(exists)throw new Error("Tên vùng cấu trúc đã tồn tại.");
  dataTables=[...dataTables,table];save();dataStatus.textContent="Đã tạo vùng dữ liệu "+table.name+" · "+table.columns.length+" cột. Đây là định nghĩa vùng có tiêu đề, chưa phải cú pháp tham chiếu cấu trúc trong công thức.";
  renderDataTables();
 }catch(e){dataStatus.textContent=e.message;}
});
function renderDataTables(){
 const list=document.querySelector("#dataTableList");
 list.innerHTML=dataTables.map(t=>"<li><b>"+escapeHtml(t.name)+"</b> · "+escapeHtml(t.range)+" · "+t.columns.length+" cột · tự mở rộng</li>").join("")||"<li>Chưa có vùng dữ liệu có cấu trúc.</li>";
}
document.querySelector("#dataClearTables").addEventListener("click",()=>{
 if(!dataTables.length)return;
 if(!confirm("Xóa toàn bộ định nghĩa vùng dữ liệu? Ô và nội dung bảng không bị xóa."))return;
 dataTables=[];save();renderDataTables();dataStatus.textContent="Đã xóa định nghĩa vùng; dữ liệu ô vẫn giữ nguyên.";
});
document.querySelector('[data-tab="data"]').addEventListener("click",()=>{dataPanel.hidden=false;renderDataTables();renderPivotBuilder();renderPivotReport();});
document.querySelectorAll('.ribbon-tab:not([data-tab="data"])').forEach(tab=>tab.addEventListener("click",()=>{if(tab.dataset.tab!=="data")dataPanel.hidden=true;}));

document.querySelector("#addSheet").addEventListener("click",()=>{calcStatus.textContent="Tính năng nhiều trang tính sẽ được bổ sung ở phiên bản kế tiếp.";});

const dsPanel=document.querySelector("#dataSciencePanel"),dsOutput=document.querySelector("#dataScienceOutput");
const chartPresets=new ChartPresetStore();
let dsLastReport=[];
document.querySelector("#openDataScience").addEventListener("click",()=>{dsPanel.hidden=false;document.querySelector("#dsXRange").focus();});
document.querySelector("#closeDataScience").addEventListener("click",()=>{dsPanel.hidden=true;});
function readRawRange(range){
  const m=/^([A-Z]+[1-9][0-9]*):([A-Z]+[1-9][0-9]*)$/i.exec(range.trim());
  if(!m)throw new Error("Nhập vùng theo dạng A1:A20.");
  const s=parseAddress(m[1]),e=parseAddress(m[2]);if(!s||!e||s.c!==e.c&&s.r!==e.r)throw new Error("Chỉ hỗ trợ vùng một cột hoặc một hàng.");
  const vals=[];if(s.c===e.c){for(let r=Math.min(s.r,e.r);r<=Math.max(s.r,e.r);r++)vals.push(calculate(address(r,s.c)));}else{for(let c=Math.min(s.c,e.c);c<=Math.max(s.c,e.c);c++)vals.push(calculate(address(s.r,c)));}return vals;
}
function readNumericRange(range){
  const m=/^([A-Z]+[1-9][0-9]*):([A-Z]+[1-9][0-9]*)$/i.exec(range.trim());
  if(!m)throw new Error("Nhập vùng theo dạng A1:A20.");
  const s=parseAddress(m[1]),e=parseAddress(m[2]);if(!s||!e||s.c!==e.c&&s.r!==e.r)throw new Error("Chỉ hỗ trợ vùng một cột hoặc một hàng.");
  const vals=[];if(s.c===e.c){for(let r=Math.min(s.r,e.r);r<=Math.max(s.r,e.r);r++)vals.push(calculate(address(r,s.c)));}else{for(let c=Math.min(s.c,e.c);c<=Math.max(s.c,e.c);c++)vals.push(calculate(address(s.r,c)));}
  return vals;
}
function dsShow(title,rows,notes=[]){
  dsOutput.replaceChildren();dsLastReport=[["Chỉ tiêu","Kết quả"],...rows,...notes.map((v,i)=>["Ghi chú "+(i+1),v])];const h=document.createElement("b");h.textContent=title;dsOutput.append(h);
  const table=document.createElement("div");table.className="ds-results";
  for(const [k,v] of rows){const item=document.createElement("div");const label=document.createElement("span");label.textContent=k;const value=document.createElement("strong");value.textContent=typeof v==="number"?v.toLocaleString("vi-VN",{maximumFractionDigits:6}):String(v);item.append(label,value);table.append(item);}dsOutput.append(table);
  for(const t of notes){const p=document.createElement("p");p.textContent=t;dsOutput.append(p);}
}
document.querySelector("#dsRegression").addEventListener("click",()=>{try{const x=readNumericRange(document.querySelector("#dsXRange").value),y=readNumericRange(document.querySelector("#dsYRange").value),r=simpleLinearRegression(x,y),corr=pearsonCorrelation(x,y);dsShow("Hồi quy tuyến tính đơn", [["Số cặp quan sát",r.n],["Hệ số chặn",r.intercept],["Hệ số góc",r.slope],["R²",r.rSquared],["R² hiệu chỉnh",r.adjustedRSquared],["Sai số chuẩn hệ số góc",r.standardError],["Tương quan Pearson r",corr.r]],["Mô hình: "+r.equation,"Đây là mô hình mô tả tuyến tính; không tự suy ra quan hệ nhân quả. Kiểm tra đồ thị phần dư, ngoại lệ và giả định trước khi kết luận."]);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});
document.querySelector("#dsAnova").addEventListener("click",()=>{try{const labels=readRawRange(document.querySelector("#dsGroupRange").value),values=readNumericRange(document.querySelector("#dsValueRange").value);if(labels.length!==values.length)throw new Error("Vùng mã nhóm và vùng giá trị phải cùng số ô.");const map=new Map();labels.forEach((v,i)=>{const key=String(v);if(!map.has(key))map.set(key,[]);map.get(key).push(values[i]);});const r=oneWayAnova([...map].map(([name,vals])=>({name,values:vals})));dsShow("ANOVA một nhân tố", [["Số nghiệm thức",r.k],["Tổng số quan sát",r.N],["F",r.F],["p-value",r.pValue],["Bậc tự do nghiệm thức",r.dfBetween],["Bậc tự do sai số",r.dfWithin],["MS nghiệm thức",r.msBetween],["MS sai số",r.msWithin]],r.groups.map(g=>g.name+": n="+g.n+", trung bình="+g.mean.toLocaleString("vi-VN",{maximumFractionDigits:5})+", SD="+g.sd.toLocaleString("vi-VN",{maximumFractionDigits:5})).concat([r.significantAt05?"Có bằng chứng khác biệt tổng thể ở mức 0,05.":"Chưa đủ bằng chứng khác biệt tổng thể ở mức 0,05.","ANOVA không chỉ ra cặp nghiệm thức khác nhau; chưa tính LSD hậu nghiệm. Cần kiểm tra độc lập, phân phối phần dư và đồng nhất phương sai."]));dsDrawGroupMeans(r.groups);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});


function dsRenderChart(spec){
 const prior=dsOutput.querySelector(".ds-chart-wrap");if(prior)prior.remove();
 const W=720,H=360,L=62,R=22,T=24,B=62,ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.setAttribute("role","img");svg.setAttribute("aria-label",spec.title);svg.classList.add("ds-chart");
 const add=(tag,attrs={},parent=svg)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));parent.append(n);return n;};
 const txt=(x,y,s,anchor="middle")=>{const n=add("text",{x,y,"text-anchor":anchor});n.textContent=String(s);return n;};
 const wrap=document.createElement("div");wrap.className="ds-chart-wrap";const title=document.createElement("b");title.textContent=spec.title;wrap.append(title);
 const plotW=W-L-R,plotH=H-T-B;
 add("line",{x1:L,y1:T,x2:L,y2:T+plotH,stroke:"currentColor","stroke-width":1});
 add("line",{x1:L,y1:T+plotH,x2:W-R,y2:T+plotH,stroke:"currentColor","stroke-width":1});
 let xs=[],ys=[];
 if(spec.series){xs=spec.series.flatMap(v=>v.points.map(p=>p.x));ys=spec.series.flatMap(v=>v.points.map(p=>p.y));}
 if(spec.type==="surface3d"){xs=spec.grid.flat().map(p=>p.x);ys=spec.grid.flat().map(p=>p.z);}
 if(spec.points){xs=spec.points.map(p=>p.x);ys=spec.points.map(p=>p.y);}
 if(spec.bars){xs=spec.bars.map((p,i)=>i);ys=spec.bars.map(p=>p.count);}
 if(spec.groups){xs=spec.groups.map((p,i)=>i);ys=spec.groups.flatMap(p=>[p.min,p.max]);}
 if(spec.grid){xs=spec.grid.flat().map(p=>p.x);ys=spec.grid.flat().map(p=>p.y);}
 if(spec.segments){xs=spec.segments.flatMap(s=>[s.a.x,s.b.x]);ys=spec.segments.flatMap(s=>[s.a.y,s.b.y]);}
 if(spec.type==="errorbar"){xs=spec.groups.map((p,i)=>i);ys=spec.groups.flatMap(p=>[p.lower,p.upper]);}
 if(spec.type==="regression-band"){xs=spec.points.map(p=>p.x);ys=spec.points.flatMap(p=>[p.meanLower,p.meanUpper,p.predLower,p.predUpper,p.fit]);}
 if(spec.bars){xs=[0,Math.max(1,spec.bars.length-1)];}
 let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(0,...ys),maxY=Math.max(...ys);
 const leftValues=spec.series?spec.series.filter(s=>s.axis!=="right").flatMap(s=>s.points.map(p=>p.y)):ys;
 const rightValues=spec.series?spec.series.filter(s=>s.axis==="right").flatMap(s=>s.points.map(p=>p.y)):[];
 if(spec.series&&leftValues.length){minY=Math.min(0,...leftValues);maxY=Math.max(...leftValues);}
 let minY2=rightValues.length?Math.min(0,...rightValues):0,maxY2=rightValues.length?Math.max(...rightValues):1;
 if(spec.type==="boxplot")minY=Math.min(...ys),maxY=Math.max(...ys);
 if(spec.grid){minY=Math.min(...ys);maxY=Math.max(...ys);}
 if(spec.type==="contour"||spec.type==="regression-band"){minY=Math.min(...ys);maxY=Math.max(...ys);}
 if(spec.type==="errorbar"){minY=Math.min(...ys);maxY=Math.max(...ys);}
 if(spec.type==="errorbar"||spec.type==="contour"){minX=Math.min(...xs);maxX=Math.max(...xs);}
 if(!Number.isFinite(minX)||!Number.isFinite(maxX)){minX=0;maxX=1;}if(maxX===minX)maxX=minX+1;if(maxY===minY)maxY=minY+1;
 const px=x=>L+(x-minX)/(maxX-minX)*plotW,py=(y,axis="left")=>T+plotH-(y-(axis==="right"?minY2:minY))/((axis==="right"?maxY2-minY2:maxY-minY)||1)*plotH;
 for(let i=0;i<=4;i++){const y=T+plotH-i*plotH/4,val=minY+(maxY-minY)*i/4;add("line",{x1:L,y1:y,x2:W-R,y2:y,stroke:"currentColor",opacity:.14});txt(L-8,y+4,Number(val.toPrecision(4)),"end");if(rightValues.length)txt(W-R+8,y+4,Number((minY2+(maxY2-minY2)*i/4).toPrecision(4)),"start");}
 if(rightValues.length)add("line",{x1:W-R,y1:T,x2:W-R,y2:T+plotH,stroke:"currentColor","stroke-width":1});
 if(spec.series&&(spec.type==="line"||spec.type==="scatter")){
  const palette=["#276749","#2563eb","#b45309","#9333ea","#0891b2","#be123c","#4d7c0f","#475569","#c026d3","#0f766e","#a16207","#1d4ed8"];
  spec.series.forEach((series,i)=>{const color=series.color||palette[i%palette.length],pts=series.points.slice().sort((a,b)=>a.x-b.x),axis=series.axis==="right"?"right":"left",dash=series.style==="dash"?"7 4":series.style==="dot"?"2 4":"";if(spec.type==="line"){const d=pts.map((p,j)=>(j?"L ":"M ")+px(p.x)+" "+py(p.y,axis)).join(" ");add("path",{d,fill:"none",stroke:color,"stroke-width":2.4,"stroke-dasharray":dash});}pts.forEach(p=>add("circle",{cx:px(p.x),cy:py(p.y,axis),r:3.5,fill:color}));});
 }else if(spec.type==="line"||spec.type==="scatter"||spec.type==="residual"){
  if(spec.type!=="scatter"){let d="";spec.points.slice().sort((a,b)=>a.x-b.x).forEach((p,i)=>{d+=(i?" L ":"M ")+px(p.x)+" "+py(p.y);});add("path",{d,fill:"none",stroke:"currentColor","stroke-width":2.2});}
  spec.points.forEach(p=>add("circle",{cx:px(p.x),cy:py(p.y),r:4,fill:"currentColor",opacity:.8}));
  if(spec.type==="residual"||minY<0&&maxY>0){add("line",{x1:L,y1:py(0),x2:W-R,y2:py(0),stroke:"#a45a4f","stroke-dasharray":"5 4"});}
 }else if(spec.type==="bar"||spec.type==="histogram"){
  const values=spec.type==="bar"?spec.points:spec.bars.map((b,i)=>({x:i,y:b.count,label:(Number(b.from.toPrecision(4))+"–"+Number(b.to.toPrecision(4)))}));
  const slot=plotW/values.length;values.forEach((p,i)=>{const y=py(p.y),base=py(0);add("rect",{x:L+i*slot+slot*.16,y:Math.min(y,base),width:slot*.68,height:Math.max(1,Math.abs(base-y)),rx:3,fill:"currentColor",opacity:.68});txt(L+(i+.5)*slot,T+plotH+18,(p.label||p.x).toString().slice(0,12));});
 }else if(spec.type==="boxplot"){
  const slot=plotW/spec.groups.length;spec.groups.forEach((g,i)=>{const x=L+(i+.5)*slot,bw=Math.min(54,slot*.5);add("line",{x1:x,y1:py(g.min),x2:x,y2:py(g.max),stroke:"currentColor","stroke-width":1.5});add("line",{x1:x-bw*.3,y1:py(g.min),x2:x+bw*.3,y2:py(g.min),stroke:"currentColor"});add("line",{x1:x-bw*.3,y1:py(g.max),x2:x+bw*.3,y2:py(g.max),stroke:"currentColor"});add("rect",{x:x-bw/2,y:py(g.q3),width:bw,height:Math.max(1,py(g.q1)-py(g.q3)),fill:"currentColor",opacity:.22,stroke:"currentColor"});add("line",{x1:x-bw/2,y1:py(g.median),x2:x+bw/2,y2:py(g.median),stroke:"currentColor","stroke-width":2.5});g.outliers.forEach(v=>add("circle",{cx:x,cy:py(v),r:3,fill:"#b45b50"}));txt(x,T+plotH+18,g.name.slice(0,12));}); 
 }else if(spec.type==="errorbar"){
  const slot=plotW/spec.groups.length;spec.groups.forEach((g,i)=>{const x=L+(i+.5)*slot,y=py(g.mean),top=py(g.upper),bottom=py(g.lower);add("line",{x1:x,y1:top,x2:x,y2:bottom,stroke:"currentColor","stroke-width":2});add("line",{x1:x-7,y1:top,x2:x+7,y2:top,stroke:"currentColor","stroke-width":2});add("line",{x1:x-7,y1:bottom,x2:x+7,y2:bottom,stroke:"currentColor","stroke-width":2});add("circle",{cx:x,cy:y,r:4,fill:"currentColor"});txt(x,T+plotH+18,g.name.slice(0,12));txt(x,Math.max(T+10,y-9),g.mean.toFixed(3));});
 }else if(spec.type==="contour"){
  for(const level of spec.levels){const seg=spec.segments.filter(s=>s.level===level);for(const s of seg)add("line",{x1:px(s.a.x),y1:py(s.a.y),x2:px(s.b.x),y2:py(s.b.y),stroke:"currentColor","stroke-width":1.6,opacity:.8});}
  txt(L+plotW/2,H-17,"X1 / yếu tố thứ nhất");
 }else if(spec.type==="regression-band"){
  const pts=spec.points,poly=(upper,lower)=>pts.map(p=>px(p.x)+","+py(p[upper])).concat([...pts].reverse().map(p=>px(p.x)+","+py(p[lower]))).join(" ");
  add("polygon",{points:poly("predUpper","predLower"),fill:"currentColor",opacity:.08});add("polygon",{points:poly("meanUpper","meanLower"),fill:"currentColor",opacity:.2});
  const path=pts.map((p,i)=>(i?"L ":"M ")+px(p.x)+" "+py(p.fit)).join(" ");add("path",{d:path,fill:"none",stroke:"currentColor","stroke-width":2.4});
 }else if(spec.type==="heatmap"){
  const flat=spec.grid.flat(),zmin=Math.min(...flat.map(p=>p.z)),zmax=Math.max(...flat.map(p=>p.z)),rows=spec.grid.length,cols=spec.grid[0].length,cw=plotW/cols,ch=plotH/rows;
  spec.grid.forEach((row,i)=>row.forEach((p,j)=>{const t=zmax===zmin?.5:(p.z-zmin)/(zmax-zmin);add("rect",{x:L+j*cw,y:T+plotH-(i+1)*ch,width:cw+.3,height:ch+.3,fill:"currentColor",opacity:.12+.78*t});}));
  txt(L+plotW/2,H-17,"X1 tăng → · X2 tăng theo trục dọc");
 }
 if(spec.series){const palette=["#276749","#2563eb","#b45309","#9333ea","#0891b2","#be123c","#4d7c0f","#475569","#c026d3","#0f766e","#a16207","#1d4ed8"];const legend=document.createElement("div");legend.className="chart-legend";spec.series.forEach((series,i)=>{const item=document.createElement("span"),swatch=document.createElement("i");swatch.style.background=palette[i%palette.length];item.append(swatch,document.createTextNode(series.name));legend.append(item);});wrap.append(legend);}
 if(spec.type!=="heatmap"&&spec.type!=="contour"){txt(L+plotW/2,H-17,spec.type==="boxplot"||spec.type==="errorbar"?"Nhóm":spec.type==="histogram"?"Khoảng giá trị":spec.type==="regression-band"?"X / biến giải thích":"X / thứ tự quan sát");}
 const cap=document.createElement("small");cap.textContent=spec.type==="surface3d"?spec.warning:spec.type==="boxplot"?"Hộp: Q1–Q3 · đường giữa: trung vị · râu: phạm vi không tính ngoại lệ · điểm rời: ngoại lệ Tukey.":spec.type==="histogram"?"Mỗi cột là số quan sát trong khoảng; hình dạng phụ thuộc số bin.":spec.type==="heatmap"?"Màu đậm hơn biểu thị giá trị dự báo lớn hơn; đây là bản đồ nhiệt lưới.":spec.type==="contour"?spec.warning:spec.type==="errorbar"?"Thanh sai số "+(spec.mode==="sd"?"±1 SD":spec.mode==="se"?"±1 SE":"CI 95% cho trung bình")+". CI dùng phân phối t và giả định các quan sát độc lập.":spec.type==="regression-band"?"Dải trong: CI 95% của trung bình hồi quy; dải ngoài: khoảng dự đoán 95% cho một quan sát. Không suy ra nhân quả.":"Biểu đồ mô tả dữ liệu đã chọn; không tự chứng minh quan hệ nhân quả.";
 wrap.append(svg,cap);
 let view={x:0,y:0,w:W,h:H},drag=null;
 const applyView=()=>svg.setAttribute("viewBox",view.x+" "+view.y+" "+view.w+" "+view.h);
 svg.addEventListener("wheel",e=>{e.preventDefault();const rect=svg.getBoundingClientRect(),cx=(e.clientX-rect.left)/rect.width*view.w+view.x,cy=(e.clientY-rect.top)/rect.height*view.h+view.y,f=e.deltaY<0?.88:1.14,nw=Math.max(W*.55,Math.min(W*3,view.w*f)),nh=Math.max(H*.55,Math.min(H*3,view.h*f));view={x:cx-(cx-view.x)*nw/view.w,y:cy-(cy-view.y)*nh/view.h,w:nw,h:nh};applyView();},{passive:false});
 svg.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,view:{...view}};svg.setPointerCapture?.(e.pointerId);svg.style.cursor="grabbing";});
 svg.addEventListener("pointermove",e=>{if(!drag)return;const rect=svg.getBoundingClientRect();view.x=drag.view.x-(e.clientX-drag.x)/rect.width*drag.view.w;view.y=drag.view.y-(e.clientY-drag.y)/rect.height*drag.view.h;applyView();});
 const stopDrag=()=>{drag=null;svg.style.cursor="grab";};svg.addEventListener("pointerup",stopDrag);svg.addEventListener("pointercancel",stopDrag);svg.style.cursor="grab";
 const tools=document.createElement("div");tools.className="chart-export-tools";
 const exportSvg=()=>{const clone=svg.cloneNode(true);clone.setAttribute("xmlns",ns);clone.setAttribute("width",W);clone.setAttribute("height",H);const source=new XMLSerializer().serializeToString(clone),blob=new Blob([source],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="sght-chart.svg";a.click();URL.revokeObjectURL(url);};
 const exportPng=()=>{const clone=svg.cloneNode(true);clone.setAttribute("xmlns",ns);clone.setAttribute("width",W*2);clone.setAttribute("height",H*2);const source=new XMLSerializer().serializeToString(clone),blob=new Blob([source],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob),img=new Image();img.onload=()=>{const canvas=document.createElement("canvas");canvas.width=W*2;canvas.height=H*2;const ctx=canvas.getContext("2d");ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--surface").trim()||"#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);canvas.toBlob(png=>{if(!png)return;const purl=URL.createObjectURL(png),a=document.createElement("a");a.href=purl;a.download="sght-chart.png";a.click();URL.revokeObjectURL(purl);},"image/png");};img.onerror=()=>{URL.revokeObjectURL(url);dsOutput.querySelector(".chart-export-status").textContent="Không thể dựng PNG trên trình duyệt này.";};img.src=url;};
 const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.className="quiet";b.textContent=label;b.addEventListener("click",fn);tools.append(b);};
 button("Khôi phục toàn cảnh",()=>{view={x:0,y:0,w:W,h:H};applyView();});button("Xuất SVG",exportSvg);button("Xuất PNG 2×",exportPng);button("In / lưu PDF",()=>{document.body.classList.add("chart-print-mode");window.print();document.body.classList.remove("chart-print-mode");});
 const status=document.createElement("small");status.className="chart-export-status";status.setAttribute("role","status");status.textContent="SVG giữ nét vector; PNG xuất độ phân giải 2×; PDF mở hộp thoại in của trình duyệt.";tools.append(status);wrap.append(tools);dsOutput.append(wrap);dsLastReport.push(["Biểu đồ",spec.title]);
}
function dsDrawGroupMeans(groups){
 const old=dsOutput.querySelector(".ds-chart");if(old)old.remove();
 const w=560,h=210,pad=34,max=Math.max(1,...groups.map(g=>g.mean+g.sd)),min=Math.min(0,...groups.map(g=>g.mean-g.sd)),span=max-min||1,slot=(w-pad*2)/groups.length,svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.setAttribute("role","img");svg.setAttribute("aria-label","Biểu đồ trung bình và độ lệch chuẩn theo nhóm");svg.classList.add("ds-chart");
 const line=(x1,y1,x2,y2)=>{const e=document.createElementNS(svg.namespaceURI,"line");for(const [k,v] of Object.entries({x1,y1,x2,y2,stroke:"currentColor","stroke-width":1}))e.setAttribute(k,v);svg.append(e);};
 const text=(x,y,t)=>{const e=document.createElementNS(svg.namespaceURI,"text");e.setAttribute("x",x);e.setAttribute("y",y);e.setAttribute("text-anchor","middle");e.textContent=t;svg.append(e);};
 line(pad,12,pad,h-pad);line(pad,h-pad,w-pad,h-pad);
 groups.forEach((g,i)=>{const x=pad+slot*(i+.5),y=h-pad-(g.mean-min)/span*(h-pad-24),base=h-pad-(0-min)/span*(h-pad-24),rect=document.createElementNS(svg.namespaceURI,"rect");rect.setAttribute("x",x-slot*.25);rect.setAttribute("y",Math.min(y,base));rect.setAttribute("width",slot*.5);rect.setAttribute("height",Math.max(1,Math.abs(base-y)));rect.setAttribute("rx",3);rect.setAttribute("fill","currentColor");rect.setAttribute("opacity",".65");svg.append(rect);const top=h-pad-(Math.min(max,g.mean+g.sd)-min)/span*(h-pad-24),bottom=h-pad-(Math.max(min,g.mean-g.sd)-min)/span*(h-pad-24);line(x,top,x,bottom);line(x-5,top,x+5,top);line(x-5,bottom,x+5,bottom);text(x,h-8,g.name.slice(0,10));text(x,Math.max(12,y-7),g.mean.toFixed(2));});
 const wrap=document.createElement("div");wrap.className="ds-chart-wrap";const cap=document.createElement("small");cap.textContent="Trung bình theo nhóm · thanh sai số ±1 SD (mô tả, không phải khoảng tin cậy)";wrap.append(svg,cap);dsOutput.append(wrap);dsLastReport.push(["Biểu đồ","Trung bình ±1 SD"]);groups.forEach(g=>dsLastReport.push([g.name+" · n="+g.n,"Mean="+g.mean+"; SD="+g.sd]));
}
function readMatrixRange(range){
 const m=/^([A-Z]+[1-9][0-9]*):([A-Z]+[1-9][0-9]*)$/i.exec(range.trim());if(!m)throw new Error("Nhập vùng dạng A2:C20.");
 const s=parseAddress(m[1]),e=parseAddress(m[2]);if(!s||!e||e.r<s.r||e.c<s.c)throw new Error("Vùng dữ liệu không hợp lệ.");
 const out=[];for(let r=s.r;r<=e.r;r++){const row=[];for(let c=s.c;c<=e.c;c++){const v=calculate(address(r,c));if(typeof v!=="number"||!Number.isFinite(v))throw new Error("Vùng "+address(r,c)+" phải chứa số, không được trống.");row.push(v);}out.push(row);}return out;
}
function makeGroups(labelRange,valueRange){
 const labels=readRawRange(labelRange),values=readNumericRange(valueRange);if(labels.length!==values.length)throw new Error("Vùng nhãn và vùng số phải cùng số dòng.");
 const map=new Map();labels.forEach((v,i)=>{const k=String(v).trim();if(!k)throw new Error("Có mã nghiệm thức trống.");if(!map.has(k))map.set(k,[]);map.get(k).push(values[i]);});return [...map].map(([name,values])=>({name,values}));
}
document.querySelector("#dsMultiple").addEventListener("click",()=>{try{const X=readMatrixRange(document.querySelector("#dsMultiX").value),y=readNumericRange(document.querySelector("#dsMultiY").value);if(X.length!==y.length)throw new Error("Ma trận X và Y phải cùng số dòng.");const r=multipleLinearRegression(X,y);dsShow("Hồi quy tuyến tính đa biến", [["Số quan sát",r.n],["Số biến độc lập",r.p],["R²",r.rSquared],["R² hiệu chỉnh",r.adjustedRSquared],["F mô hình",r.overallF],["p mô hình",r.overallP],...r.coefficients.map(c=>[c.name+" · hệ số",c.estimate]),...r.coefficients.map(c=>[c.name+" · p-value",c.p])],["Khoảng tin cậy 95% từng hệ số được tính trong mô-đun. Đã kiểm tra ma trận suy biến; vẫn cần xem đa cộng tuyến, phần dư và cỡ mẫu.","Hệ số hồi quy mô tả liên hệ có điều kiện, không tự chứng minh nhân quả."]);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});
document.querySelector("#dsLsd").addEventListener("click",()=>{try{const g=makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value),r=fisherLSD(g,.05);dsShow("So sánh Fisher LSD · mức 0,05", [["ANOVA tổng thể p",r.omnibusP],["ANOVA tổng thể có ý nghĩa",r.protected?"Có":"Không"],["MSE",r.mse],["Bậc tự do sai số",r.df],["Số cặp so sánh",r.pairs.length],...r.pairs.map(p=>[p.a+" – "+p.b,"Δ="+p.difference.toFixed(5)+"; p="+p.p.toFixed(6)+"; Holm="+p.pHolm.toFixed(6)+(p.significantHolm?" · Holm có ý nghĩa":"")])],[r.warning,r.protected?"Có thể diễn giải LSD theo quy trình đã định trước.":"ANOVA tổng thể chưa có ý nghĩa; không nên dùng LSD để tuyên bố khác biệt."]);dsDrawGroupMeans(oneWayAnova(g).groups);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});

function dsPairwiseReport(title,r){
 const rows=[["Phương pháp",r.method],["Số nhóm",r.k],["Alpha",r.alpha],["Số cặp",r.pairs.length],...r.pairs.map(p=>[p.a+" – "+p.b,"Chênh lệch="+p.difference.toFixed(5)+"; p="+p.p.toFixed(6)+"; CI=["+p.ciLow.toFixed(5)+", "+p.ciHigh.toFixed(5)+"]; "+(p.significant?"Có ý nghĩa":"Chưa có ý nghĩa")])];
 dsShow(title,rows,[r.calculation||"",r.warning||""]); 
}
document.querySelector("#dsTukey").addEventListener("click",()=>{try{const g=makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value),alpha=Number(document.querySelector("#dsPostAlpha").value),r=tukeyHSD(g,alpha);dsPairwiseReport("Tukey–Kramer HSD",r);dsDrawGroupMeans(oneWayAnova(g).groups);}catch(e){dsOutput.textContent="Không tính được Tukey: "+e.message;}});
document.querySelector("#dsGamesHowell").addEventListener("click",()=>{try{const g=makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value),alpha=Number(document.querySelector("#dsPostAlpha").value),r=gamesHowell(g,alpha);dsPairwiseReport("Games–Howell",r);}catch(e){dsOutput.textContent="Không tính được Games–Howell: "+e.message;}});
document.querySelector("#dsVif").addEventListener("click",()=>{try{const X=readMatrixRange(document.querySelector("#dsVifRange").value),r=varianceInflationFactors(X);dsShow("Chẩn đoán đa cộng tuyến · VIF", [["Số quan sát",r.n],["Số biến độc lập",r.p],["Chỉ số điều kiện",r.conditionIndex],...r.variables.map(v=>[v.name,"VIF="+(Number.isFinite(v.vif)?v.vif.toFixed(5):"∞")+"; R² phụ="+v.rSquared.toFixed(5)]),...r.interpretation.map(v=>[v.name,v.level])],[r.warning,"VIF từ 5 trở lên cần xem xét; từ 10 trở lên thường được xem là cao theo quy ước tham khảo."]);}catch(e){dsOutput.textContent="Không tính được VIF: "+e.message;}});

function dsReadGroupedCovariate(){
 const labels=readRawRange(document.querySelector("#dsGroupRange").value),ys=readNumericRange(document.querySelector("#dsValueRange").value),xs=readNumericRange(document.querySelector("#dsCovariateRange").value);
 if(labels.length!==ys.length||labels.length!==xs.length)throw new Error("Mã nhóm, Y và hiệp biến phải có cùng số dòng.");
 const map=new Map();labels.forEach((label,i)=>{const name=String(label);if(!map.has(name))map.set(name,{name,values:[],covariate:[]});map.get(name).values.push(ys[i]);map.get(name).covariate.push(xs[i]);});return [...map.values()];
}
document.querySelector("#dsAncova").addEventListener("click",()=>{try{const r=ancova(dsReadGroupedCovariate(),Number(document.querySelector("#dsPostAlpha").value));dsShow("ANCOVA · hiệu chỉnh theo hiệp biến", [["Số quan sát",r.n],["Trung bình hiệp biến",r.covariateMean],["F hiệu ứng nhóm",r.groupEffect.F],["p hiệu ứng nhóm",r.groupEffect.p],["Partial eta² nhóm",r.groupEffect.partialEtaSquared],["F tương tác nhóm × hiệp biến",r.slopeHomogeneity.F],["p kiểm tra đồng nhất độ dốc",r.slopeHomogeneity.p],...r.adjustedMeans.map(m=>[m.name,"TB hiệu chỉnh="+m.adjustedMean.toFixed(5)+"; CI=["+m.ciLow.toFixed(5)+", "+m.ciHigh.toFixed(5)+"]"])],[r.warning,"Nếu tương tác nhóm×hiệp biến có ý nghĩa, không diễn giải mô hình độ dốc chung."]);}catch(e){dsOutput.textContent="Không tính được ANCOVA: "+e.message;}});
document.querySelector("#dsKruskal").addEventListener("click",()=>{try{const g=makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value),r=kruskalWallis(g,Number(document.querySelector("#dsPostAlpha").value));dsShow("Kruskal–Wallis", [["H hiệu chỉnh đồng hạng",r.H],["df",r.df],["p-value",r.p],["Epsilon²",r.epsilonSquared],["Có ý nghĩa",r.significant?"Có":"Chưa"],...r.groups.map(x=>[x.name,"n="+x.n+"; hạng trung bình="+x.meanRank.toFixed(4)+"; trung vị="+x.median])],[r.warning,"Kiểm định này làm việc trên thứ hạng, không phải kiểm định trung bình."]);}catch(e){dsOutput.textContent="Không tính được Kruskal–Wallis: "+e.message;}});
document.querySelector("#dsDunn").addEventListener("click",()=>{try{const r=dunnPostHoc(makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value),Number(document.querySelector("#dsPostAlpha").value));dsShow("Dunn hậu nghiệm · hiệu chỉnh Holm", [["p ANOVA hạng tổng thể",r.omnibusP],["Đủ điều kiện diễn giải hậu nghiệm",r.protected?"Có":"Chưa"],...r.pairs.map(p=>[p.a+" – "+p.b,"Δ hạng="+p.meanRankDifference.toFixed(4)+"; z="+p.z.toFixed(4)+"; p="+p.p.toFixed(6)+"; Holm="+p.pHolm.toFixed(6)+(p.significant?" · có ý nghĩa":"")])],[r.warning,r.protected?"Đọc p Holm cho từng cặp.":"Kruskal–Wallis tổng thể chưa có ý nghĩa; không nên kết luận từ các cặp hậu nghiệm."]);}catch(e){dsOutput.textContent="Không tính được Dunn: "+e.message;}});
document.querySelector("#dsEffectSizes").addEventListener("click",()=>{try{const r=oneWayEffectSizes(makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value),Number(document.querySelector("#dsPostAlpha").value));dsShow("Kích thước hiệu ứng và khoảng tin cậy", [["η²",r.etaSquared],["ω²",r.omegaSquared],["Cohen f",r.cohensF],...r.means.map(m=>[m.name,"TB="+m.mean.toFixed(5)+"; CI=["+m.ciLow.toFixed(5)+", "+m.ciHigh.toFixed(5)+"]"]),...r.pairs.map(p=>[p.a+" – "+p.b,"Δ="+p.difference.toFixed(5)+"; CI=["+p.ciLow.toFixed(5)+", "+p.ciHigh.toFixed(5)+"]"])],[r.warning]);}catch(e){dsOutput.textContent="Không tính được kích thước hiệu ứng: "+e.message;}});
document.querySelector("#dsPower").addEventListener("click",()=>{try{const f=Number(document.querySelector("#dsPowerF").value),k=Number(document.querySelector("#dsPowerGroups").value),n=Number(document.querySelector("#dsPowerN").value),alpha=Number(document.querySelector("#dsPostAlpha").value),r=anovaPower(f,k,n,alpha);dsShow("Phân tích công suất ANOVA", [["Cohen f",f],["Số nhóm",k],["Số quan sát/nhóm",n],["Tổng N",r.N],["Lambda",r.lambda],["Công suất",r.power],["Alpha",alpha],["F tới hạn",r.criticalF]],[r.warning]);}catch(e){dsOutput.textContent="Không tính được công suất: "+e.message;}});
document.querySelector("#dsSampleSize").addEventListener("click",()=>{try{const f=Number(document.querySelector("#dsPowerF").value),k=Number(document.querySelector("#dsPowerGroups").value),target=Number(document.querySelector("#dsTargetPower").value),alpha=Number(document.querySelector("#dsPostAlpha").value),r=requiredAnovaSampleSize(f,k,target,alpha,500);dsShow("Cỡ mẫu tối thiểu · ANOVA cân bằng", [["Cohen f",f],["Số nhóm",k],["Công suất mục tiêu",target],["Số quan sát tối thiểu/nhóm",r.nPerGroup],["Tổng N",r.N],["Công suất đạt được",r.power]],[r.warning]);}catch(e){dsOutput.textContent="Không tính được cỡ mẫu: "+e.message;}});
document.querySelector("#dsLevene").addEventListener("click",()=>{try{const r=leveneTest(makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value));dsShow("Kiểm tra đồng nhất phương sai · Levene", [["F",r.F],["p-value",r.p],["df1",r.df1],["df2",r.df2],["Đánh giá mức 0,05",r.equalVarianceAt05?"Chưa phát hiện bằng chứng phương sai khác nhau":"Có dấu hiệu phương sai khác nhau"],[ "Phương pháp",r.method]],["Không bác bỏ giả thuyết không không đồng nghĩa chứng minh phương sai bằng nhau."]);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});
document.querySelector("#dsBrownForsythe").addEventListener("click",()=>{try{const r=brownForsytheTest(makeGroups(document.querySelector("#dsGroupRange").value,document.querySelector("#dsValueRange").value));dsShow("Kiểm tra Brown–Forsythe", [["F",r.F],["p-value",r.p],["df1",r.df1],["df2",r.df2],["Đánh giá mức 0,05",r.equalVarianceAt05?"Chưa phát hiện bằng chứng phương sai khác nhau":"Có dấu hiệu phương sai khác nhau"],["Phương pháp",r.method]],["Đây là kiểm tra hỗ trợ; không bác bỏ giả thuyết không không đồng nghĩa chứng minh phương sai hoàn toàn bằng nhau."]);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});
document.querySelector("#dsBuildChart").addEventListener("click",()=>{try{const type=document.querySelector("#dsChartType").value;let spec;const xr=document.querySelector("#dsChartX").value,yr=document.querySelector("#dsChartY").value,multi=document.querySelector("#dsChartMultiY").value.trim();if(type==="surface3d"){if(!dsLastSurface)throw new Error("Hãy khớp mặt đáp ứng hai yếu tố trước.");spec=buildSurface3DData(dsLastSurface.contourGrid,{title:document.querySelector("#dsChartTitle").value||"Mặt đáp ứng 3D"});}else if(multi&&(type==="line"||type==="scatter")){const ranges=multi.split(",").map(v=>v.trim()).filter(Boolean),names=document.querySelector("#dsChartSeriesNames").value.split(",").map(v=>v.trim()),rightIndex=Math.max(0,Number(document.querySelector("#dsChartSecondarySeries").value||0)-1),colors=document.querySelector("#dsChartSeriesColors").value.split(",").map(v=>v.trim()),styles=document.querySelector("#dsChartSeriesStyles").value.split(",").map(v=>v.trim());if(ranges.length<2)throw new Error("Nhập ít nhất hai vùng Y, cách nhau bằng dấu phẩy.");const xs=readNumericRange(xr);spec=buildMultiSeriesChart({x:xs,type,title:document.querySelector("#dsChartTitle").value||"Biểu đồ nhiều chuỗi",series:ranges.map((range,i)=>({name:names[i]||("Chuỗi "+(i+1)),values:readNumericRange(range),axis:i===rightIndex&&rightIndex>0?"right":"left",color:/^#[0-9a-f]{6}$/i.test(colors[i]||"")?colors[i]:undefined,style:["solid","dash","dot"].includes(styles[i])?styles[i]:"solid"}))});}else if(type==="histogram")spec=buildChartData(type,{y:readNumericRange(yr),bins:Number(document.querySelector("#dsChartBins").value)});else if(type==="boxplot")spec=buildChartData(type,{groups:makeGroups(document.querySelector("#dsChartGroups").value,yr)});else if(type==="errorbar")spec=summarizeErrorBars(makeGroups(document.querySelector("#dsChartGroups").value,yr),document.querySelector("#dsChartErrorMode").value);else if(type==="regression-band")spec=regressionUncertainty(readNumericRange(xr),readNumericRange(yr),60,.95);else if(type==="contour"){if(!dsLastSurface)throw new Error("Hãy khớp mặt đáp ứng ở Giai đoạn 10 trước.");spec=buildContourData(dsLastSurface.contourGrid,Number(document.querySelector("#dsContourLevels").value));}else if(type==="heatmap"){if(!dsLastSurface)throw new Error("Hãy khớp mặt đáp ứng ở Giai đoạn 10 trước.");spec=buildChartData(type,{surface:dsLastSurface.contourGrid});}else if(type==="bar"){const y=readNumericRange(yr),xRange=xr.trim();spec=buildChartData(type,{y,labels:xRange?readRawRange(xRange):[]});}else spec=buildChartData(type,{x:readNumericRange(xr),y:readNumericRange(yr)});if(document.querySelector("#dsChartTitle").value.trim())spec.title=document.querySelector("#dsChartTitle").value.trim();dsRenderChart(spec);}catch(e){dsOutput.textContent="Không dựng được biểu đồ: "+e.message;}});

function chartFormConfig(){return {type:document.querySelector("#dsChartType").value,title:document.querySelector("#dsChartTitle").value,x:document.querySelector("#dsChartX").value,y:document.querySelector("#dsChartY").value,multiY:document.querySelector("#dsChartMultiY").value,seriesNames:document.querySelector("#dsChartSeriesNames").value,secondarySeries:document.querySelector("#dsChartSecondarySeries").value,seriesColors:document.querySelector("#dsChartSeriesColors").value,seriesStyles:document.querySelector("#dsChartSeriesStyles").value,bins:document.querySelector("#dsChartBins").value,errorMode:document.querySelector("#dsChartErrorMode").value,contourLevels:document.querySelector("#dsContourLevels").value};}
function applyChartConfig(c){for(const [key,id] of Object.entries({type:"dsChartType",title:"dsChartTitle",x:"dsChartX",y:"dsChartY",multiY:"dsChartMultiY",seriesNames:"dsChartSeriesNames",secondarySeries:"dsChartSecondarySeries",seriesColors:"dsChartSeriesColors",seriesStyles:"dsChartSeriesStyles",bins:"dsChartBins",errorMode:"dsChartErrorMode",contourLevels:"dsContourLevels"})){if(c[key]!==undefined)document.querySelector("#"+id).value=c[key];}}
function refreshChartPresets(){const sel=document.querySelector("#dsChartPresetList"),keep=sel.value;sel.replaceChildren(new Option("Chọn mẫu đã lưu",""));chartPresets.list().forEach(p=>sel.add(new Option(p.name,p.name)));if(chartPresets.get(keep))sel.value=keep;}
document.querySelector("#dsSaveChartPreset").addEventListener("click",()=>{try{const name=document.querySelector("#dsChartPresetName").value.trim();chartPresets.save({name,config:chartFormConfig()});refreshChartPresets();document.querySelector("#dsChartPresetList").value=name;document.querySelector("#dsChartPresetStatus").textContent="Đã lưu mẫu trên thiết bị này.";}catch(e){document.querySelector("#dsChartPresetStatus").textContent=e.message;}});
document.querySelector("#dsLoadChartPreset").addEventListener("click",()=>{const p=chartPresets.get(document.querySelector("#dsChartPresetList").value);if(!p)return;applyChartConfig(p.config);document.querySelector("#dsChartPresetName").value=p.name;document.querySelector("#dsChartPresetStatus").textContent="Đã nạp cấu hình mẫu; vùng dữ liệu vẫn cần được kiểm tra." ;});
document.querySelector("#dsDeleteChartPreset").addEventListener("click",()=>{const name=document.querySelector("#dsChartPresetList").value;if(!name)return;chartPresets.delete(name);refreshChartPresets();document.querySelector("#dsChartPresetStatus").textContent="Đã xóa mẫu khỏi thiết bị.";});
document.querySelector("#dsPrintResearchReport").addEventListener("click",()=>{if(!dsLastReport.length){document.querySelector("#dsChartPresetStatus").textContent="Chưa có kết quả để lập báo cáo.";return;}document.body.classList.add("chart-report-print-mode");window.print();document.body.classList.remove("chart-report-print-mode");});
refreshChartPresets();

document.querySelector("#dsExportReport").addEventListener("click",()=>{if(!dsLastReport.length){dsOutput.textContent="Chưa có kết quả để xuất.";return;}const csv=dsLastReport.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="SGHT_DataScience_Report.csv";link.click();URL.revokeObjectURL(url);});

document.querySelector("#dsTwoWay").addEventListener("click",()=>{try{const A=readRawRange(document.querySelector("#dsFactorA").value),B=readRawRange(document.querySelector("#dsFactorB").value),Y=readNumericRange(document.querySelector("#dsFactorY").value);if(A.length!==B.length||A.length!==Y.length)throw new Error("Ba vùng nhân tố A, B và kết quả phải cùng số dòng.");const r=twoWayAnovaBalanced(Y.map((y,i)=>({a:A[i],b:B[i],y})));dsShow("ANOVA hai nhân tố có lặp", [["Số lặp mỗi tổ hợp",r.nPerCell],["Mức nhân tố A",r.levelsA.join(", ")],["Mức nhân tố B",r.levelsB.join(", ")],...r.effects.map(e=>[e.name,"F="+e.F.toFixed(5)+"; p="+e.p.toFixed(6)])], [r.warning]);}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});
function dsDoseInput(){return {x:readNumericRange(document.querySelector("#dsDoseRange").value),y:readNumericRange(document.querySelector("#dsDoseYieldRange").value)};}
function dsDoseReport(title,r){
 const rows=[["Mô hình",r.description],["Số quan sát",r.n],["R²",r.rSquared],["R² hiệu chỉnh",r.adjustedRSquared],["RMSE",r.rmse],["SSE",r.sse],["AICc",r.aicc],["Liều tối ưu/điểm gãy",r.optimumDose],["Năng suất dự báo tại điểm đó",r.optimumYield],["Diễn giải",r.optimumType],["Điểm gãy",r.breakpoint],...r.parameters.map((v,i)=>["Hệ số "+(i+1),v])];
 dsShow(title,rows,[r.warning,"Đơn vị liều lượng và năng suất phải thống nhất với dữ liệu nhập. Kết quả là ước lượng mô hình, không phải khuyến cáo bón phân độc lập."]);
}
document.querySelector("#dsDoseQuadratic").addEventListener("click",()=>{try{const {x,y}=dsDoseInput();dsDoseReport("Đáp ứng liều lượng · mô hình bậc hai",fitDoseResponse(x,y,"quadratic"));}catch(e){dsOutput.textContent="Không khớp được mô hình liều lượng: "+e.message;}});
document.querySelector("#dsDoseLinearPlateau").addEventListener("click",()=>{try{const {x,y}=dsDoseInput();dsDoseReport("Đáp ứng liều lượng · tuyến tính–bão hòa",fitDoseResponse(x,y,"linear-plateau"));}catch(e){dsOutput.textContent="Không khớp được mô hình: "+e.message;}});
document.querySelector("#dsDoseQuadraticPlateau").addEventListener("click",()=>{try{const {x,y}=dsDoseInput();dsDoseReport("Đáp ứng liều lượng · bậc hai–bão hòa",fitDoseResponse(x,y,"quadratic-plateau"));}catch(e){dsOutput.textContent="Không khớp được mô hình: "+e.message;}});
document.querySelector("#dsDoseCompare").addEventListener("click",()=>{try{const {x,y}=dsDoseInput(),r=compareDoseResponse(x,y);dsShow("So sánh mô hình đáp ứng liều lượng · xếp theo AICc",r.models.map((m,i)=>["#"+(i+1)+" "+m.model,"AICc="+(m.aicc??"không xác định")+"; R²="+m.rSquared+"; RMSE="+m.rmse+"; liều tối ưu/điểm gãy="+m.optimumDose+"; năng suất="+m.optimumYield]),[r.selection,r.warning,...r.models.map(m=>m.warning)]);}catch(e){dsOutput.textContent="Không so sánh được mô hình: "+e.message;}});
document.querySelector("#dsDoseMitscherlich").addEventListener("click",()=>{try{const {x,y}=dsDoseInput(),r=fitMitscherlichDoseResponse(x,y);dsShow("Mitscherlich · đáp ứng tăng dần và tiệm cận", [["Tiệm cận A",r.asymptote],["Năng suất nền tại D=0",r.zeroDoseYield],["Biên độ đáp ứng B",r.parameters[1]],["Hệ số hiệu lực k",r.parameters[2]],["Liều đạt 50% biên độ",r.halfResponseDose],["Đáp ứng biên tại D=0",r.marginalResponseAtZero],["RMSE",r.rmse],["R²",r.rSquared],["AICc",r.aicc],...r.parameterStandardErrors.map((v,i)=>["SE hệ số "+(i+1),v])],[r.optimumType,r.warning,r.diagnostics.warning]);}catch(e){dsOutput.textContent="Không khớp được Mitscherlich: "+e.message;}});
let dsLastSurface=null;
document.querySelector("#dsResponseSurface").addEventListener("click",()=>{try{const x1=readNumericRange(document.querySelector("#dsSurfaceX1").value),x2=readNumericRange(document.querySelector("#dsSurfaceX2").value),y=readNumericRange(document.querySelector("#dsSurfaceY").value),r=fitResponseSurface(x1,x2,y);dsLastSurface=r;dsShow("Mặt đáp ứng bậc hai · hai yếu tố", [["Số quan sát",r.n],["R²",r.rSquared],["R² hiệu chỉnh",r.adjustedRSquared],["RMSE",r.rmse],["SSE",r.sse],["AICc",r.aicc],...r.coefficients.map((v,i)=>[r.coefficientNames[i],v]),["Điểm dừng",r.stationaryPoint?("X1="+r.stationaryPoint.x1+"; X2="+r.stationaryPoint.x2+"; "+r.stationaryPoint.type+"; "+(r.stationaryPoint.insideObservedDomain?"trong miền khảo sát":"ngoài miền khảo sát")):"Không xác định"],["Tối đa dự báo có chặn","X1="+r.boundedMaximum.x1+"; X2="+r.boundedMaximum.x2+"; Y="+r.boundedMaximum.predicted]],[r.warning,"Các hệ số được ước lượng trên biến mã hóa; xem tâm và tỷ lệ mã hóa trong mã nguồn. Lưới 21×21 được trả về cho bản đồ đường đồng mức."]);}catch(e){dsOutput.textContent="Không khớp được mặt đáp ứng: "+e.message;}});
document.querySelector("#dsDoseDiagnostics").addEventListener("click",()=>{try{const {x,y}=dsDoseInput(),model=document.querySelector("#dsDoseDiagnosticModel").value,fit=model==="mitscherlich"?fitMitscherlichDoseResponse(x,y):fitDoseResponse(x,y,model),d=doseResponseDiagnostics(x,y,fit);dsShow("Chẩn đoán mô hình đáp ứng liều lượng", [["Mô hình",fit.description],["Số mức liều có lặp",d.replicatedDoseLevels],["SSE sai số thuần",d.pureErrorSSE],["df sai số thuần",d.dfPureError],["SSE thiếu phù hợp",d.lackOfFitSSE],["df thiếu phù hợp",d.dfLackOfFit],["F lack-of-fit (chưa có p-value)",d.lackOfFitF],["Durbin–Watson",d.diagnostics.durbinWatson],["Độ lệch phần dư",d.diagnostics.residualSkewness],["Độ nhọn dư thừa",d.diagnostics.residualExcessKurtosis]],[d.warning,d.diagnostics.warning]);}catch(e){dsOutput.textContent="Không chẩn đoán được: "+e.message;}});
document.querySelector("#dsForecast").addEventListener("click",()=>{try{const y=readNumericRange(document.querySelector("#dsTrendRange").value),n=Number(document.querySelector("#dsPeriods").value),r=linearTrendForecast(y,n);dsShow("Dự báo xu thế tuyến tính", [["Số kỳ lịch sử",r.n],["Hệ số xu thế",r.slope],["R²",r.rSquared],...r.forecast.map(v=>["Kỳ "+v.period,v.value])],[r.warning]);}catch(e){dsOutput.textContent="Không dự báo được: "+e.message;}});
document.querySelector("#dsDescriptive").addEventListener("click",()=>{try{const r=descriptiveStatistics(readNumericRange(document.querySelector("#dsDescRange").value));dsShow("Thống kê mô tả",Object.entries(r));}catch(e){dsOutput.textContent="Không tính được: "+e.message;}});

const aiPanel=document.querySelector("#aiPanel"),aiPrompt=document.querySelector("#aiPrompt"),aiOutput=document.querySelector("#aiOutput");
document.querySelector("#openAI").addEventListener("click",()=>{aiPanel.hidden=false;aiPrompt.focus();});
document.querySelector("#closeAI").addEventListener("click",()=>{aiPanel.hidden=true;});
function aiValue(a){return calculate(a);}
function showAIAnalysis(){const r=analyzeWorkbook(cells,aiValue);aiOutput.replaceChildren();const summary=document.createElement("div");summary.className="ai-summary";summary.textContent="Đã dùng "+r.cellCount+" ô có dữ liệu: "+r.numericCount+" giá trị số, "+r.textCount+" giá trị chữ, "+r.formulaCount+" công thức, "+r.errorCount+" lỗi tính toán.";aiOutput.append(summary);if(r.statistics){const stats=document.createElement("div");stats.className="ai-stats";for(const [label,value] of [["Tổng",r.statistics.sum],["Trung bình",r.statistics.mean],["Trung vị",r.statistics.median],["Nhỏ nhất",r.statistics.min],["Lớn nhất",r.statistics.max]]){const item=document.createElement("div");const b=document.createElement("b");b.textContent=label;const span=document.createElement("span");span.textContent=Number(value).toLocaleString("vi-VN",{maximumFractionDigits:4});item.append(b,span);stats.append(item);}aiOutput.append(stats);}const note=document.createElement("p");note.className="ai-note";note.textContent=r.outliers.length?"Có "+r.outliers.length+" giá trị ngoại lệ theo quy tắc IQR (1,5 × khoảng tứ phân vị): "+r.outliers.map(x=>x.cell+" = "+x.value).join(", ")+". Đây là dấu hiệu cần kiểm tra, không phải kết luận dữ liệu sai.":"Không phát hiện ngoại lệ theo quy tắc IQR trong các giá trị số.";aiOutput.append(note);if(r.errors.length){const err=document.createElement("p");err.className="ai-note";err.textContent="Ô có lỗi: "+r.errors.map(x=>x.cell+" ("+x.error+")").join(", ");aiOutput.append(err);}const disclaimer=document.createElement("small");disclaimer.textContent="Phân tích chạy cục bộ bằng thống kê xác định; không gửi dữ liệu ra ngoài.";aiOutput.append(disclaimer);}
document.querySelector("#aiAnalyze").addEventListener("click",()=>{try{showAIAnalysis();}catch(e){aiOutput.textContent="Chưa phân tích được: "+e.message;}});
document.querySelector("#aiSuggestFormula").addEventListener("click",()=>{const list=suggestFormulas(cells,selected,aiValue);aiOutput.replaceChildren();const title=document.createElement("p");title.textContent="Gợi ý cho ô "+selected+". Chọn một công thức để đưa lên thanh công thức; công thức chưa được áp dụng.";aiOutput.append(title);for(const item of list){const row=document.createElement("div");row.className="ai-suggestion";const text=document.createElement("code");text.textContent=item.formula;const reason=document.createElement("small");reason.textContent=item.reason;const use=document.createElement("button");use.type="button";use.className="quiet";use.textContent="Dùng công thức";use.addEventListener("click",()=>{formulaInput.value=item.formula;formulaInput.focus();formulaInput.select();calcStatus.textContent="Đã đưa gợi ý vào thanh công thức. Nhấn Áp dụng để ghi vào ô.";});row.append(text,reason,use);aiOutput.append(row);}});
document.querySelector("#aiDraftMacro").addEventListener("click",()=>{try{const draft=draftMacroFromVietnamese(aiPrompt.value);planMacro(draft.source);macroSource.value=draft.source;macroPanel.hidden=false;aiOutput.textContent="Đã tạo bản nháp an toàn: "+draft.explanation+" Mã đã được kiểm tra cú pháp và chuyển sang Macro Studio. Chưa thực thi; hãy xem lại, rồi tự phê duyệt nếu muốn chạy.";}catch(e){aiOutput.textContent=e.message;}});
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
const securityStatus=document.querySelector("#securityStatus"),securityPolicyInput=document.querySelector("#securityAllowed"),securityMaxCommands=document.querySelector("#securityMaxCommands"),securityMaxCells=document.querySelector("#securityMaxCells"),securityAudit=document.querySelector("#securityAudit");
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
function macroAdapter(){return {get:a=>raw(a),set:(a,v)=>{const before=raw(a),after=String(v??"");if(before!==after)recordFormulaCellVersion(a,before,after,"macro");cells[a]=v;invalidateFormulaCells([a]);},clear:a=>{const before=raw(a);if(before!=="")recordFormulaCellVersion(a,before,"","macro-clear");delete cells[a];invalidateFormulaCells([a]);}};}
function applyDebugConfiguration(){
 if(!activeMacroDebugger)return;
 try{activeMacroDebugger.setBreakpoints(parseNumberList(breakpointInput.value));activeMacroDebugger.setWatches(parseWatchList(watchInput.value));paintDebug(activeMacroDebugger.state());macroResult.textContent="Đã cập nhật breakpoint và danh sách ô theo dõi.";}
 catch(e){macroResult.textContent="Cấu hình debugger chưa hợp lệ: "+e.message;}
}
document.querySelector("#applyDebugConfig").addEventListener("click",applyDebugConfiguration);
function renderSecurity(){const p=macroSecurity.getPolicy();securityPolicyInput.value=p.allowedTypes.join(", ");securityMaxCommands.value=p.maxCommands;securityMaxCells.value=p.maxCells;const s=macroSecurity.status();securityStatus.textContent=(s.emergencyStopped?"ĐÃ KHÓA KHẨN CẤP":"Bảo vệ đang bật")+" · "+(s.active?"Phiên "+s.active.executed+" lệnh":"Không có phiên chạy");securityAudit.replaceChildren();for(const item of macroSecurity.listAudit(12)){const line=document.createElement("div");line.className="security-audit-row";line.textContent=new Date(item.at).toLocaleString()+" · "+item.event+" · "+JSON.stringify(item.details);securityAudit.append(line);}}
function renderSecurityPreview(plan){const r=macroSecurity.preview(plan);const total=r.commands.reduce((n,x)=>n+x.cells,0);macroPreview.textContent="Kiểm tra an toàn: "+r.commandCount+" lệnh · "+r.uniqueCells+" ô duy nhất · "+total+" lượt ô tác động. Nhóm bị khóa: "+(r.blockedTypes.join(", ")||"không có")+". Giới hạn: "+(r.withinLimits?"đạt":"vượt")+"\n"+r.commands.map(x=>"Dòng "+x.line+" · "+x.type+" · "+x.cells+" ô"+(x.addresses.length?" · "+x.addresses.join(", "):"")).join("\n");return r;}
function runSecuredUntilPause(){while(activeMacroDebugger.state().status==="paused"){const next=activeMacroDebugger.plan[activeMacroDebugger.index];if(!next)break;if(activeMacroDebugger.breakpoints.has(next.line)&&activeMacroDebugger.skipBreakpointIndex!==activeMacroDebugger.index){activeMacroDebugger.breakpointHit={line:next.line,step:activeMacroDebugger.index+1};activeMacroDebugger.skipBreakpointIndex=activeMacroDebugger.index;return activeMacroDebugger.state();}macroSecurity.beforeCommand(next);const state=activeMacroDebugger.step();macroSecurity.afterCommand(next);if(state.status==="completed")return state;}return activeMacroDebugger.state();}
function finishMacroRun(state){if(["completed","stopped","error","rolled_back"].includes(state.status)){macroExecution=false;macroSecurity.finish(state.status);render();save();renderSecurity();}paintDebug(state);if(state.status==="completed")macroResult.textContent="Hoàn tất "+state.totalSteps+" lệnh. Có thể dùng Hoàn tác để phục hồi toàn phiên.";else if(state.status==="stopped")macroResult.textContent="Đã dừng tại bước "+state.currentStep+". Có thể hoàn tác toàn phiên ngay.";else if(state.status==="rolled_back"){macroResult.textContent="Đã hoàn tác toàn bộ thay đổi của phiên gỡ lỗi.";if(macroSnapshotOpen){undoStack.pop();macroSnapshotOpen=false;updateHistoryControls();}}else if(state.status==="error")macroResult.textContent="Lỗi khi thực thi. Có thể hoàn tác các bước trước đó.";}
function startDebugSession(){const plan=planMacro(macroSource.value);const report=renderSecurityPreview(plan);if(!report.withinLimits||report.blockedTypes.length){macroResult.textContent="Không thể chạy: chính sách bảo mật đang chặn macro hoặc giới hạn bị vượt.";return false;}if(!confirm("Phê duyệt phiên Macro gồm "+plan.length+" lệnh, dự kiến tác động "+report.uniqueCells+" ô? Hãy xem kỹ phạm vi trước khi đồng ý."))return false;const debuggerSession=new MacroDebugger(macroSource.value,macroAdapter());debuggerSession.setBreakpoints(parseNumberList(breakpointInput.value));debuggerSession.setWatches(parseWatchList(watchInput.value));macroSecurity.begin(plan,{approved:true});snapshot();macroSnapshotOpen=true;activeMacroDebugger=debuggerSession;activeMacroDebugger.start({approved:true});macroExecution=true;paintDebug(activeMacroDebugger.state());macroResult.textContent="Đã phê duyệt. Chạy từng bước hoặc tiếp tục đến breakpoint.";return true;}
document.querySelector("#previewMacro").addEventListener("click",()=>{try{const plan=planMacro(macroSource.value);macroPreview.textContent=plan.map((x,i)=>(i+1)+". Dòng "+x.line+" · "+(x.type==="SET"?"Ghi "+x.cell+" = "+String(x.value):x.type==="COPY"?"Chép "+x.source+" → "+x.target:x.type==="CLEAR"?"Xóa "+x.range:"Tính tổng "+x.range+" → "+x.target)).join("\n");macroResult.textContent="Đã kiểm tra "+plan.length+" lệnh. Chưa thay đổi dữ liệu.";}catch(e){macroPreview.textContent="";macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
document.querySelector("#runMacro").addEventListener("click",()=>{try{if(!activeMacroDebugger||activeMacroDebugger.state().status!=="paused"){if(!startDebugSession())return;}finishMacroRun(runSecuredUntilPause());}catch(e){macroExecution=false;const state=activeMacroDebugger?.state();if(state?.status==="paused")finishMacroRun(activeMacroDebugger.stop());else if(state)finishMacroRun(state);macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
document.querySelector("#debugStart").addEventListener("click",()=>{try{activeMacroDebugger=null;if(startDebugSession())macroResult.textContent="Phiên đã sẵn sàng. Nhấn “Chạy 1 bước” hoặc “Tiếp tục”.";}catch(e){macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
debugStepButton.addEventListener("click",()=>{try{const next=activeMacroDebugger.plan[activeMacroDebugger.index];macroSecurity.beforeCommand(next);const state=activeMacroDebugger.step();macroSecurity.afterCommand(next);render();save();renderSecurity();if(state.status==="completed")finishMacroRun(state);else paintDebug(state);}catch(e){const state=activeMacroDebugger.state();if(state.status==="paused")finishMacroRun(activeMacroDebugger.stop());else finishMacroRun(state);macroResult.textContent=(e.code||"LỖI")+" · "+e.message+(e.line?" (dòng "+e.line+")":"");}});
debugContinueButton.addEventListener("click",()=>{try{const state=runSecuredUntilPause();if(state.breakpointHit)macroResult.textContent="Đã chạm breakpoint ở dòng "+state.breakpointHit.line+". Kiểm tra giá trị Watch, rồi bấm Tiếp tục để đi qua điểm dừng.";finishMacroRun(state);}catch(e){const state=activeMacroDebugger?.state();if(state?.status==="paused")finishMacroRun(activeMacroDebugger.stop());else if(state)finishMacroRun(state);macroResult.textContent=(e.code||"LỖI")+" · "+e.message;}});
debugStopButton.addEventListener("click",()=>finishMacroRun(activeMacroDebugger.stop()));
debugRollbackButton.addEventListener("click",()=>{if(!activeMacroDebugger||!confirm("Hoàn tác toàn bộ thay đổi do phiên gỡ lỗi này tạo ra?"))return;finishMacroRun(activeMacroDebugger.rollback());activeMacroDebugger=null;});
document.querySelector("#saveSecurityPolicy").addEventListener("click",()=>{try{const policy=macroSecurity.setPolicy({allowedTypes:securityPolicyInput.value.split(/[;,\s]+/).filter(Boolean),maxCommands:Number(securityMaxCommands.value),maxCells:Number(securityMaxCells.value)});macroResult.textContent="Đã lưu chính sách quyền: "+policy.allowedTypes.join(", ")+".";renderSecurity();}catch(e){macroResult.textContent="Chính sách không hợp lệ: "+e.message;}});
document.querySelector("#emergencyStop").addEventListener("click",()=>{macroSecurity.emergencyStop();if(activeMacroDebugger&&activeMacroDebugger.state().status==="paused")finishMacroRun(activeMacroDebugger.stop());else renderSecurity();macroResult.textContent="Đã kích hoạt dừng khẩn cấp. Phiên mới bị khóa cho tới khi đặt lại.";});
document.querySelector("#resetEmergency").addEventListener("click",()=>{try{macroSecurity.resetEmergencyStop();renderSecurity();macroResult.textContent="Đã đặt lại khóa khẩn cấp. Phiên mới vẫn cần phê duyệt.";}catch(e){macroResult.textContent=e.message;}});
document.querySelector("#refreshSecurityAudit").addEventListener("click",renderSecurity);
paintDebug({status:"ready",currentStep:0,totalSteps:0,changedCells:0,trace:[],watches:[]});

function renderSheetTabs(){const host=document.querySelector("#sheetTabs");if(!host)return;host.replaceChildren();for(const sheet of workbookSheets){const group=document.createElement("span");group.className="sheet-tab-group"+(sheet.id===activeSheetId?" active":"");const tab=document.createElement("button");tab.type="button";tab.className="sheet-tab";tab.textContent=sheet.name;tab.setAttribute("aria-pressed",String(sheet.id===activeSheetId));tab.addEventListener("click",()=>switchWorkbookSheet(sheet.id));group.append(tab);if(workbookSheets.length>1){const close=document.createElement("button");close.type="button";close.className="sheet-tab-close";close.textContent="×";close.setAttribute("aria-label","Xóa trang tính "+sheet.name);close.addEventListener("click",()=>deleteWorkbookSheetUI(sheet.id));group.append(close);}host.append(group);}const add=document.createElement("button");add.type="button";add.className="sheet-tab sheet-tab-add";add.textContent="+";add.setAttribute("aria-label","Thêm trang tính");add.addEventListener("click",createWorkbookSheetUI);host.append(add);}
function switchWorkbookSheet(id){if(id===activeSheetId)return;storeActiveSheet();const target=getWorkbookSheet(workbookSheets,id);if(!target)return;applySheetState(target);selected="A1";selectionRange={start:"A1",end:"A1"};sheetScroll.scrollTop=0;sheetScroll.scrollLeft=0;render();renderPivotBuilder();renderPivotReport();renderDashboard();save();}
function createWorkbookSheetUI(){try{storeActiveSheet();workbookSheets=addWorkbookSheet(workbookSheets,"Trang tính "+(workbookSheets.length+1));rebuildDependencyEngine();const sheet=workbookSheets[workbookSheets.length-1];applySheetState(sheet);selected="A1";selectionRange={start:"A1",end:"A1"};render();renderPivotBuilder();renderPivotReport();renderDashboard();save();}catch(e){calcStatus.textContent=e.message;}}
function deleteWorkbookSheetUI(id){if(workbookSheets.length<=1){calcStatus.textContent="Workbook phải còn ít nhất một trang tính.";return;}const sheet=getWorkbookSheet(workbookSheets,id);if(!sheet||!confirm("Xóa trang tính “"+sheet.name+"”? Thao tác này không thể hoàn tác."))return;storeActiveSheet();workbookSheets=removeWorkbookSheet(workbookSheets,id);rebuildDependencyEngine();if(id===activeSheetId){applySheetState(workbookSheets[0]);render();renderPivotBuilder();renderPivotReport();}dashboard=normalizeDashboard({...dashboard,widgets:dashboard.widgets.map(w=>w.pivotConfig?.sheetId===id?{...w,pivotConfig:null}:w)});renderDashboard();save();}
document.querySelector("#sheetName").addEventListener("change",e=>{try{const previousName=sheetTitle,nextName=e.target.value.trim()||"Bảng tính chưa đặt tên";storeActiveSheet();workbookSheets=renameWorkbookSheet(workbookSheets,activeSheetId,nextName);workbookSheets=rewriteWorkbookSheetReferences(workbookSheets,previousName,nextName);sheetTitle=nextName;cells=getWorkbookSheet(workbookSheets,activeSheetId).cells;rebuildDependencyEngine();e.target.value=sheetTitle;renderSheetTabs();save();}catch(err){e.target.value=sheetTitle;calcStatus.textContent=err.message;}});

load();loadRepairAudit();rebuildDependencyEngine();render();renderDataTables();renderSecurity();
// SGHT 18.27: explicit, non-invasive formula diagnostics.
const diagnosticsButton=document.querySelector("#runFormulaDiagnostics"),diagnosticsSize=document.querySelector("#diagnosticsSize"),diagnosticsOutput=document.querySelector("#formulaDiagnosticsOutput");
if(diagnosticsButton&&diagnosticsOutput){diagnosticsButton.addEventListener("click",async()=>{
 diagnosticsButton.disabled=true;diagnosticsOutput.textContent="Đang dựng workbook mô phỏng và đo các giai đoạn…";
 try{const size=Math.max(50,Math.min(2000,Number(diagnosticsSize?.value)||1000));const report=await runFormulaBenchmark({size,chunkSize:64});const live=collectFormulaDiagnostics({sheets:workbookSheets,graph:dependencyGraph,plan:lastRecalculationPlan,scheduler:calculationScheduler,cache:formulaValueCache});diagnosticsOutput.textContent=formatFormulaDiagnostics(report,live);calcStatus.textContent="Benchmark mô phỏng hoàn tất · "+report.formulaCount.toLocaleString("vi-VN")+" công thức · "+report.totalElapsedMs+" ms";}
 catch(error){diagnosticsOutput.textContent="Không thể hoàn tất benchmark: "+(error?.message||String(error));calcStatus.textContent="Benchmark gặp lỗi";}
 finally{diagnosticsButton.disabled=false;}
});}

// SGHT 18.28: user-triggered diagnosis; cell contents are never modified.
const errorAnalyzeButton=document.querySelector("#analyzeFormulaError"),errorScanButton=document.querySelector("#scanFormulaErrors"),errorOutput=document.querySelector("#formulaErrorOutput");
const repairPreviewButton=document.querySelector("#previewFormulaRepair"),repairApplyButton=document.querySelector("#applyFormulaRepair"),repairOutput=document.querySelector("#formulaRepairOutput");
const repairAuditOutput=document.querySelector("#formulaRepairAuditOutput"),repairAuditExportButton=document.querySelector("#exportFormulaRepairAudit"),repairAuditCount=document.querySelector("#formulaRepairAuditCount");
let formulaVersionHistory=[];
let activeFormulaTransactionId=null;
function createFormulaTransactionId(){return "tx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9);}
const formulaIntegrityOutput=document.querySelector("#formulaIntegrityOutput"),formulaIntegrityRun=document.querySelector("#runFormulaIntegrityAudit"),formulaIntegrityExport=document.querySelector("#exportFormulaIntegrityReport");
const formulaVersionOutput=document.querySelector("#formulaVersionOutput"),formulaVersionCount=document.querySelector("#formulaVersionCount"),formulaVersionA=document.querySelector("#formulaVersionA"),formulaVersionB=document.querySelector("#formulaVersionB"),formulaVersionCompare=document.querySelector("#compareFormulaVersions"),formulaVersionRestore=document.querySelector("#restoreFormulaVersion"),formulaVersionLoad=document.querySelector("#loadFormulaVersions"),formulaVersionExport=document.querySelector("#exportFormulaVersions");
function saveFormulaVersions(){try{localStorage.setItem(FORMULA_VERSION_KEY,JSON.stringify({version:1,versions:formulaVersionHistory}));return true;}catch(error){if(formulaVersionOutput)formulaVersionOutput.textContent="Không ghi được lịch sử phiên bản do giới hạn bộ nhớ. Hãy xuất bản sao JSON.";return false;}}
function recordFormulaCellVersion(cell,before,after,source="edit",sheetId=activeSheetId){
 if(!String(before??"").trimStart().startsWith("=")&&!String(after??"").trimStart().startsWith("="))return;
 const sheet=getWorkbookSheet(workbookSheets,sheetId);
 const next=recordFormulaVersion(formulaVersionHistory,{sheetId,sheetName:sheet?.name||sheetTitle,address:cell,beforeFormula:before,afterFormula:after,source,transactionId:activeFormulaTransactionId||createFormulaTransactionId()});
 if(next.length!==formulaVersionHistory.length||next[0]?.id!==formulaVersionHistory[0]?.id){formulaVersionHistory=next;saveFormulaVersions();}
}
function loadFormulaVersions(){try{const saved=JSON.parse(localStorage.getItem(FORMULA_VERSION_KEY)||"null");formulaVersionHistory=normalizeFormulaVersions(saved);}catch{formulaVersionHistory=[];}renderFormulaVersions();}
function getFormulaVersionWorkbookCells(sheetId){const sheet=getWorkbookSheet(workbookSheets,sheetId);return sheet?.cells||{};}
function refreshFormulaTransactionChoices(){
 const select=document.querySelector("#formulaTransactionSelect");if(!select)return;
 const prior=select.value;select.replaceChildren();
 const groups=groupFormulaVersionTransactions(formulaVersionHistory);
 for(const group of groups){const option=document.createElement("option");option.value=group.id;option.textContent=new Date(group.timestamp).toLocaleString("vi-VN")+" · "+group.source+" · "+group.cellCount+" ô · "+(group.sheetName||group.sheetId);select.append(option);}
 if(groups.some(g=>g.id===prior))select.value=prior;
 const preview=document.querySelector("#previewFormulaTransaction"),apply=document.querySelector("#restoreFormulaTransaction");
 if(preview)preview.disabled=!groups.length;if(apply)apply.disabled=true;
}
function previewFormulaTransactionRestore(){
 const output=document.querySelector("#formulaTransactionRestoreOutput"),select=document.querySelector("#formulaTransactionSelect"),applyButton=document.querySelector("#restoreFormulaTransaction");
 if(!output||!select?.value)return;
 try{
  const group=groupFormulaVersionTransactions(formulaVersionHistory).find(x=>x.id===select.value);
  if(!group)throw new Error("Giao dịch không còn trong lịch sử.");
  const sheet=getWorkbookSheet(workbookSheets,group.sheetId);
  if(!sheet)throw new Error("Trang tính nguồn không còn tồn tại.");
  const plan=buildFormulaTransactionRestorePlan(formulaVersionHistory,group.id,sheet.cells);
  window.sghtPendingFormulaRestore=plan;
  const lines=["GIAO DỊCH: "+plan.transactionId,"TRANG TÍNH: "+(sheet.name||plan.sheetId),"THỜI ĐIỂM: "+plan.createdAt,"SỐ Ô SẼ ĐỔI: "+plan.changes.length,"Ô không cần đổi: "+plan.unchanged,"XUNG ĐỘT: "+plan.conflicts.length,""];
  for(const c of plan.changes)lines.push(c.address+": "+(c.before||"∅")+"  →  "+(c.after||"∅"));
  for(const c of plan.conflicts)lines.push("⚠ "+c.address+": "+c.reason+(c.expected!==undefined?" (mong đợi: "+(c.expected||"∅")+"; hiện tại: "+(c.current||"∅")+")":""));
  lines.push("",plan.canRestore?"Bản xem trước hợp lệ. Chưa có dữ liệu nào bị thay đổi.":"Không thể khôi phục an toàn. Giao dịch không được áp dụng.");
  output.textContent=lines.join("\n");if(applyButton)applyButton.disabled=!plan.canRestore;
 }catch(error){output.textContent=error.message;if(applyButton)applyButton.disabled=true;window.sghtPendingFormulaRestore=null;}
}
function applyFormulaTransactionRestore(){
 const plan=window.sghtPendingFormulaRestore,output=document.querySelector("#formulaTransactionRestoreOutput"),applyButton=document.querySelector("#restoreFormulaTransaction");
 if(!plan?.canRestore||!output)return;
 const sheet=getWorkbookSheet(workbookSheets,plan.sheetId);
 if(!sheet){output.textContent="Trang tính nguồn không còn tồn tại. Hủy khôi phục.";return;}
 const fresh=buildFormulaTransactionRestorePlan(formulaVersionHistory,plan.transactionId,sheet.cells);
 if(!fresh.canRestore||fresh.changes.length!==plan.changes.length){output.textContent="Dữ liệu đã đổi sau bản xem trước. Hãy tạo bản xem trước mới; chưa ô nào bị thay đổi.";if(applyButton)applyButton.disabled=true;window.sghtPendingFormulaRestore=null;return;}
 if(!confirm("Khôi phục toàn bộ "+fresh.changes.length+" ô của giao dịch này? SGHT sẽ tạo một mốc Undo duy nhất."))return;
 if(sheet.id!==activeSheetId){output.textContent="Hãy chuyển sang trang tính "+sheet.name+" rồi xem trước lại.";return;}
 snapshot();
 const changed=[];
 for(const c of fresh.changes){const prior=String(cells[c.address]??"");if(c.after==="")delete cells[c.address];else cells[c.address]=c.after;recordFormulaCellVersion(c.address,prior,c.after,"transaction-rollback",activeSheetId);changed.push(c.address);}
 rebuildDependencyEngine();reconcileStructuredTables();searchDirty=true;updateHistoryControls();render();save();renderFormulaVersions();
 output.textContent="Đã khôi phục trọn giao dịch "+fresh.transactionId+" · "+changed.length+" ô. Một mốc Undo đã được tạo; có thể hoàn tác toàn bộ lần khôi phục.";
 window.sghtPendingFormulaRestore=null;if(applyButton)applyButton.disabled=true;refreshFormulaTransactionChoices();
}
document.querySelector("#previewFormulaTransaction")?.addEventListener("click",previewFormulaTransactionRestore);
document.querySelector("#restoreFormulaTransaction")?.addEventListener("click",applyFormulaTransactionRestore);
document.querySelector("#formulaTransactionSelect")?.addEventListener("change",()=>{window.sghtPendingFormulaRestore=null;const out=document.querySelector("#formulaTransactionRestoreOutput");if(out)out.textContent="Chọn giao dịch rồi bấm “Xem trước khôi phục”.";const b=document.querySelector("#restoreFormulaTransaction");if(b)b.disabled=true;});
function renderFormulaVersions(){
 if(!formulaVersionOutput)return;
 const items=getFormulaCellVersions(formulaVersionHistory,activeSheetId,selected);
 const transactions=groupFormulaVersionTransactions(items);
 if(formulaVersionCount)formulaVersionCount.textContent=formulaVersionHistory.length.toLocaleString("vi-VN")+" phiên bản · "+groupFormulaVersionTransactions(formulaVersionHistory).length.toLocaleString("vi-VN")+" giao dịch · "+items.length+" tại "+selected;
 for(const select of [formulaVersionA,formulaVersionB]){if(!select)continue;const prior=select.value;select.replaceChildren();for(const item of items){const option=document.createElement("option");option.value=item.id;option.textContent=new Date(item.timestamp).toLocaleString("vi-VN")+" · "+(item.afterFormula||"(ô không còn là công thức)")+" · "+item.source;select.append(option);}if(items.some(x=>x.id===prior))select.value=prior;}
 formulaVersionOutput.textContent=items.length?transactions.map((g,i)=>(i+1)+". GIAO DỊCH "+g.id+" · "+new Date(g.timestamp).toLocaleString("vi-VN")+" · "+g.source+" · "+g.cellCount+" ô\n"+g.changes.map(x=>x.address+": "+(x.beforeFormula||"—")+" → "+(x.afterFormula||"—")).join("\n")).join("\n\n"):"Ô "+selected+" chưa có phiên bản công thức được ghi nhận.";
 if(formulaVersionCompare)formulaVersionCompare.disabled=items.length<2;
 refreshFormulaTransactionChoices();
 if(formulaVersionRestore)formulaVersionRestore.disabled=!items.some(x=>x.id===formulaVersionA?.value&&x.afterFormula);
}
if(formulaVersionLoad)formulaVersionLoad.addEventListener("click",renderFormulaVersions);
function runFormulaIntegrityAudit(){
 const output=document.querySelector("#formulaIntegrityOutput");
 if(!output)return null;
 let raw;
 try{raw=JSON.parse(localStorage.getItem(FORMULA_VERSION_KEY)||"null");}
 catch(error){const report=auditFormulaVersionIntegrity(null);output.textContent="Không đọc được JSON lịch sử: "+error.message;window.sghtFormulaIntegrityReport=report;return report;}
 const report=auditFormulaVersionIntegrity(raw);
 window.sghtFormulaIntegrityReport=report;
 const s=report.summary;
 output.textContent=["KẾT QUẢ: "+report.status.toUpperCase(),"Kiểm tra lúc: "+report.checkedAt,"Bản ghi: "+s.records+" · hợp lệ: "+s.validRecords,"Giao dịch: "+(s.transactions??0)+" · ô: "+(s.cells??0),"Lỗi: "+s.errors+" · Cảnh báo: "+s.warnings+" · Bản ghi cũ thiếu giá trị thô: "+s.legacyRecords,"",...report.findings.slice(0,250).map((f,i)=>(i+1)+". ["+f.severity.toUpperCase()+"] "+f.code+" — "+f.message+(f.id?" · "+f.id:"")+(f.address?" · "+f.address:"")+(f.cell?" · "+f.cell:"")),...(report.findings.length>250?["… còn "+(report.findings.length-250)+" phát hiện trong báo cáo JSON."]:[])].join("\\n");
 return report;
}
if(formulaIntegrityRun)formulaIntegrityRun.addEventListener("click",runFormulaIntegrityAudit);
const archiveStatus=document.querySelector("#formulaArchiveStatus"),archiveCreate=document.querySelector("#createFormulaAuditArchive"),archiveVerify=document.querySelector("#verifyFormulaAuditArchive"),archiveExport=document.querySelector("#exportFormulaAuditArchive"),archiveImport=document.querySelector("#importFormulaAuditArchive"),archiveFile=document.querySelector("#formulaAuditArchiveFile");
const signingPassword=document.querySelector("#formulaSigningPassword"),generateSigningKeyButton=document.querySelector("#generateFormulaSigningKey"),loadSigningKeyButton=document.querySelector("#loadFormulaSigningKey"),signArchiveButton=document.querySelector("#signFormulaAuditArchive"),exportSignedButton=document.querySelector("#exportSignedFormulaAudit"),verifySignedButton=document.querySelector("#verifySignedFormulaAudit"),signedFile=document.querySelector("#signedFormulaAuditFile"),trustedFingerprintInput=document.querySelector("#trustedFormulaFingerprint"),signatureStatus=document.querySelector("#formulaSignatureStatus");
let activeFormulaSigningKeys=null,activeFormulaSignaturePackage=null;
const IDENTITY_REGISTRY_KEY="haidat-sght-identity-registry-v1";
const accountActionAtLoad=consumeAccountAction(window.location,window.history);
const authEmail=document.querySelector("#sghtAuthEmail"),authName=document.querySelector("#sghtAuthName"),authPassword=document.querySelector("#sghtAuthPassword"),authRole=document.querySelector("#sghtAuthRole"),authCreate=document.querySelector("#sghtAuthCreate"),authLogin=document.querySelector("#sghtAuthLogin"),authLogout=document.querySelector("#sghtAuthLogout"),authUserSelect=document.querySelector("#sghtAuthUserSelect"),authAssign=document.querySelector("#sghtAuthAssign"),authStatusSelect=document.querySelector("#sghtAuthStatusSelect"),authSetStatus=document.querySelector("#sghtAuthSetStatus"),authAuditExport=document.querySelector("#sghtAuthAuditExport"),authOutput=document.querySelector("#sghtAuthOutput");
const accountPanel=document.querySelector("#accountLifecyclePanel"),accountNotice=document.querySelector("#accountLifecycleNotice"),accountActionForm=document.querySelector("#accountActionForm"),accountActionTitle=document.querySelector("#accountActionTitle"),accountActionPassword=document.querySelector("#accountActionPassword"),accountActionConfirm=document.querySelector("#accountActionConfirm"),accountActionSubmit=document.querySelector("#accountActionSubmit"),accountVerificationRequest=document.querySelector("#requestEmailVerification"),accountResetRequest=document.querySelector("#requestPasswordReset"),accountSessionsRefresh=document.querySelector("#refreshAuthSessions"),accountSessions=document.querySelector("#authSessionsList");
const authApiMeta=document.querySelector('meta[name="sght-auth-api"]'),authApiUrl=authApiMeta?.content?.trim()||"";
const passkeyReauthPassword=document.querySelector("#passkeyReauthPassword"),passkeyReauthCode=document.querySelector("#passkeyReauthCode"),passkeyRegister=document.querySelector("#passkeyRegister"),passkeyRefresh=document.querySelector("#passkeyRefresh"),passkeyStatus=document.querySelector("#passkeyStatus"),passkeyList=document.querySelector("#passkeyList"),mfaLoginPasskey=document.querySelector("#mfaLoginPasskey");
const mfaStatusLabel=document.querySelector("#mfaStatusLabel"),mfaEnrollButton=document.querySelector("#mfaEnroll"),mfaSetupBox=document.querySelector("#mfaSetupBox"),mfaSetupSecret=document.querySelector("#mfaSetupSecret"),mfaOtpAuthUri=document.querySelector("#mfaOtpAuthUri"),mfaSetupCode=document.querySelector("#mfaSetupCode"),mfaEnableButton=document.querySelector("#mfaEnable"),mfaRecoveryBox=document.querySelector("#mfaRecoveryBox"),mfaRecoveryCodes=document.querySelector("#mfaRecoveryCodes"),mfaLoginBox=document.querySelector("#mfaLoginBox"),mfaLoginCode=document.querySelector("#mfaLoginCode"),mfaLoginVerify=document.querySelector("#mfaLoginVerify"),mfaLoginCancel=document.querySelector("#mfaLoginCancel"),mfaDisableBox=document.querySelector("#mfaDisableBox"),mfaDisablePassword=document.querySelector("#mfaDisablePassword"),mfaDisableCode=document.querySelector("#mfaDisableCode"),mfaDisableButton=document.querySelector("#mfaDisable");
let authApi=null,authSession=null,authUsers=[],pendingAccountAction=null,pendingMfaChallenge=null,authMfaStatus=null;
function authMessage(s){if(authOutput)authOutput.textContent=s;}
function accountMessage(s){if(accountNotice)accountNotice.textContent=s;}
try{if(authApiUrl)authApi=new SghtAuthApiClient({baseUrl:authApiUrl});}catch(e){authMessage(e.message);}
function renderAuthPanel(){if(!authOutput)return;const configured=!!authApi;authMessage([configured?"Đã cấu hình máy chủ xác thực: "+authApi.baseUrl:"CHƯA CÓ MÁY CHỦ XÁC THỰC. Đăng nhập và quản trị tài khoản đang khóa an toàn.",authSession?"Phiên máy chủ: "+authSession.displayName+" ("+authSession.role+")":"Chưa có phiên máy chủ", "Không dùng localStorage để lưu tài khoản, mật khẩu, token hoặc vai trò.","Chỉ máy chủ mới được quyền xác minh phiên và quyết định quyền truy cập."].join("\n"));for(const button of [authCreate,authLogin,accountVerificationRequest,accountResetRequest])if(button)button.disabled=!configured;if(authLogout)authLogout.disabled=!configured||!authSession;if(authAssign)authAssign.disabled=!configured||authSession?.role!=="admin";if(authSetStatus)authSetStatus.disabled=!configured||authSession?.role!=="admin";if(authAuditExport)authAuditExport.disabled=!configured||authSession?.role!=="admin";if(accountSessionsRefresh)accountSessionsRefresh.disabled=!configured||!authSession;if(mfaEnrollButton)mfaEnrollButton.disabled=!configured||!authSession||!!authMfaStatus?.enabled;if(passkeyRegister)passkeyRegister.disabled=!configured||!authSession||!authMfaStatus?.enabled;if(passkeyRefresh)passkeyRefresh.disabled=!configured||!authSession;if(mfaDisableBox)mfaDisableBox.hidden=!authSession||!authMfaStatus?.enabled;if(mfaStatusLabel)mfaStatusLabel.textContent=authMfaStatus?(authMfaStatus.enabled?"MFA đang bật · còn "+authMfaStatus.recoveryCodesRemaining+" mã khôi phục":"MFA chưa bật"):"Trạng thái MFA chưa nạp được.";}
function renderAuthSessions(rows=[]){if(!accountSessions)return;accountSessions.replaceChildren();if(!rows.length){const p=document.createElement("p");p.className="account-empty";p.textContent="Chưa có phiên đăng nhập đang hoạt động.";accountSessions.append(p);return;}for(const session of rows){const item=document.createElement("div");item.className="account-session";const info=document.createElement("div"),name=document.createElement("b"),meta=document.createElement("small"),button=document.createElement("button");name.textContent=(session.current?"Thiết bị hiện tại":"Thiết bị khác")+(session.deviceChanged?" · CẦN KIỂM TRA":"");const last=session.lastSeenAt?new Date(session.lastSeenAt).toLocaleString("vi-VN"):"Không rõ thời điểm";const expiry=session.expiresAt?new Date(session.expiresAt).toLocaleString("vi-VN"):"Không rõ hạn";meta.textContent=(session.device||"Thiết bị chưa rõ")+" · Hoạt động gần nhất: "+last+" · Hết hạn: "+expiry+(session.deviceChanged?" · Trình duyệt/thiết bị khác với lúc đăng nhập; nên thu hồi nếu không phải thay đổi của bạn.":"");info.append(name,meta);button.type="button";button.className="quiet";button.textContent="Thu hồi phiên";button.addEventListener("click",async()=>{if(!authApi)return;if(session.current&&!window.confirm("Thu hồi phiên hiện tại sẽ đăng xuất tài khoản này. Tiếp tục?"))return;button.disabled=true;try{await authApi.revokeSession(session.id);if(session.current){authSession=null;authUsers=[];renderAuthPanel();}await refreshAuthSessions();accountMessage("Đã gửi yêu cầu thu hồi phiên đến máy chủ.");}catch(e){accountMessage(e.message);button.disabled=false;}});item.append(info,button);accountSessions.append(item);}}
async function refreshAuthSessions(){if(!authApi||!authSession){renderAuthSessions([]);return;}try{const data=await authApi.listSessions();renderAuthSessions(Array.isArray(data.sessions)?data.sessions:[]);}catch(e){renderAuthSessions([]);accountMessage("Không nạp được danh sách phiên: "+e.message);}}
async function refreshAuthSession(){if(!authApi){renderAuthPanel();renderAuthSessions([]);return;}try{authSession=await authApi.me();try{authMfaStatus=await authApi.mfaStatus();}catch{authMfaStatus=null;}if(authSession.role==="admin")authUsers=(await authApi.listUsers()).users||[];await refreshAuthSessions();}catch(e){authSession=null;authUsers=[];authMfaStatus=null;renderAuthSessions([]);}renderAuthPanel();}
function showAccountAction(type,token){pendingAccountAction={type,token};if(accountPanel)accountPanel.hidden=false;if(accountActionForm)accountActionForm.hidden=type==="verify";if(accountActionTitle)accountActionTitle.textContent=type==="invite"?"Hoàn tất lời mời tạo tài khoản": "Đặt lại mật khẩu";if(accountActionPassword)accountActionPassword.value="";if(accountActionConfirm)accountActionConfirm.value="";accountMessage(type==="invite"?"Liên kết mời đã được nhận. Hãy tạo mật khẩu mới tối thiểu 12 ký tự để kích hoạt tài khoản.":"Liên kết đặt lại mật khẩu đã được nhận. Hãy nhập mật khẩu mới tối thiểu 12 ký tự.");}
async function processAccountAction(action){if(!action)return;if(accountPanel)accountPanel.hidden=false;if(!authApi){accountMessage("Liên kết đã được bảo vệ khỏi URL, nhưng máy chủ xác thực chưa được cấu hình. Hãy triển khai API HTTPS và khai báo meta sght-auth-api trước khi gửi liên kết thật.");return;}if(action.type==="invite"||action.type==="reset"){showAccountAction(action.type,action.token);return;}accountMessage("Đang xác minh địa chỉ email với máy chủ…");try{await authApi.completeEmailVerification(action.token);accountMessage("Đã xác minh email thành công. Bây giờ có thể đăng nhập bằng email này.");}catch(e){accountMessage("Không thể xác minh email: "+e.message+" Liên kết có thể đã hết hạn hoặc đã được sử dụng.");}}
if(accountVerificationRequest)accountVerificationRequest.addEventListener("click",async()=>{if(!authApi)return;const email=authEmail?.value?.trim();if(!email){accountMessage("Hãy nhập email tài khoản ở ô Email phía trên.");return;}accountVerificationRequest.disabled=true;try{await authApi.requestEmailVerification(email);accountMessage("Nếu tài khoản hợp lệ và chưa xác minh, hướng dẫn xác minh sẽ được gửi đến email. Hãy kiểm tra cả thư rác.");}catch(e){accountMessage(e.message);}finally{accountVerificationRequest.disabled=false;}});
if(accountResetRequest)accountResetRequest.addEventListener("click",async()=>{if(!authApi)return;const email=authEmail?.value?.trim();if(!email){accountMessage("Hãy nhập email tài khoản ở ô Email phía trên.");return;}accountResetRequest.disabled=true;try{await authApi.requestPasswordReset(email);accountMessage("Nếu tài khoản đủ điều kiện, hướng dẫn đặt lại mật khẩu sẽ được gửi đến email. Hãy kiểm tra cả thư rác.");}catch(e){accountMessage(e.message);}finally{accountResetRequest.disabled=false;}});
if(accountActionForm)accountActionForm.addEventListener("submit",async event=>{event.preventDefault();if(!authApi||!pendingAccountAction)return;const password=accountActionPassword?.value||"",confirm=accountActionConfirm?.value||"";if(!validateNewPassword(password)){accountMessage("Mật khẩu phải dài từ 12 đến 256 ký tự.");return;}if(password!==confirm){accountMessage("Hai lần nhập mật khẩu chưa trùng khớp.");return;}accountActionSubmit.disabled=true;try{if(pendingAccountAction.type==="invite"){await authApi.acceptInvitation(pendingAccountAction.token,password);accountMessage("Đã hoàn tất lời mời và tạo tài khoản. Hãy đăng nhập bằng email cùng mật khẩu vừa thiết lập.");}else{await authApi.completePasswordReset(pendingAccountAction.token,password);accountMessage("Đã đặt lại mật khẩu. Các phiên cũ đã bị máy chủ thu hồi; hãy đăng nhập lại.");}pendingAccountAction=null;accountActionPassword.value="";accountActionConfirm.value="";accountActionForm.hidden=true;}catch(e){accountMessage("Không hoàn tất được thao tác: "+e.message+" Liên kết có thể đã hết hạn hoặc đã được dùng.");}finally{accountActionSubmit.disabled=false;}});
if(accountSessionsRefresh)accountSessionsRefresh.addEventListener("click",refreshAuthSessions);
if(mfaEnrollButton)mfaEnrollButton.addEventListener("click",async()=>{if(!authApi||!authSession)return;mfaEnrollButton.disabled=true;try{const setup=await authApi.enrollMfa();mfaSetupSecret.value=setup.secret;mfaOtpAuthUri.textContent=setup.otpauthUri;mfaSetupCode.value="";mfaSetupBox.hidden=false;mfaRecoveryBox.hidden=true;accountMessage("Đã tạo cấu hình MFA tạm thời. Hãy thêm khóa vào ứng dụng xác thực rồi nhập mã 6 chữ số để bật.");}catch(e){accountMessage(e.message);}finally{mfaEnrollButton.disabled=false;}});
const mfaCopyButton=document.querySelector("#mfaCopySecret");if(mfaCopyButton)mfaCopyButton.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(mfaSetupSecret.value);accountMessage("Đã sao chép khóa TOTP. Hãy giữ bí mật khóa này.");}catch{accountMessage("Không sao chép tự động được; hãy chọn và sao chép khóa thủ công.");}});
if(mfaEnableButton)mfaEnableButton.addEventListener("click",async()=>{if(!authApi||!authSession)return;const code=mfaSetupCode?.value?.trim()||"";if(!/^[0-9]{6}$/.test(code)){accountMessage("Mã TOTP phải gồm đúng 6 chữ số.");return;}mfaEnableButton.disabled=true;try{const result=await authApi.enableMfa(code);try{authMfaStatus=await authApi.mfaStatus();}catch{authMfaStatus=null;}renderAuthPanel();mfaSetupBox.hidden=true;mfaRecoveryBox.hidden=false;mfaRecoveryCodes.textContent=result.recoveryCodes.join(String.fromCharCode(10));mfaSetupSecret.value="";mfaOtpAuthUri.textContent="";mfaSetupCode.value="";accountMessage("Đã bật MFA. Hãy lưu đủ 10 mã khôi phục ngay; chúng chỉ được hiển thị lần này.");}catch(e){accountMessage(e.message);}finally{mfaEnableButton.disabled=false;}});
async function refreshPasskeys(){if(!authApi||!authSession)return;try{const result=await authApi.listPasskeys();const rows=result.passkeys||[];if(passkeyStatus)passkeyStatus.textContent=rows.length+" Passkey đã đăng ký.";if(passkeyList){passkeyList.replaceChildren();for(const p of rows){const item=document.createElement("div");item.className="account-session";const heading=document.createElement("p");heading.className="account-empty";heading.textContent=(p.displayName||"Passkey")+" · "+p.deviceType+" · "+(p.backedUp?"đã sao lưu/đồng bộ":"chưa xác nhận sao lưu")+" · "+new Date(p.createdAt).toLocaleString("vi-VN");const name=document.createElement("input");name.type="text";name.maxLength=48;name.value=p.displayName||"Passkey";name.setAttribute("aria-label","Tên Passkey");const save=document.createElement("button");save.type="button";save.className="quiet";save.textContent="Lưu tên";save.addEventListener("click",async()=>{save.disabled=true;try{await authApi.renamePasskey(p.credentialId,name.value);accountMessage("Đã đổi tên Passkey.");await refreshPasskeys();}catch(e){accountMessage("Không đổi được tên Passkey: "+e.message);}finally{save.disabled=false;}});const remove=document.createElement("button");remove.type="button";remove.className="quiet";remove.textContent="Thu hồi Passkey";remove.addEventListener("click",async()=>{const password=passkeyReauthPassword?.value||"",code=passkeyReauthCode?.value||"";if(!password||!code){accountMessage("Hãy nhập mật khẩu và mã TOTP mới ở phần xác minh lại trước khi thu hồi Passkey.");return;}if(!globalThis.confirm("Thu hồi Passkey này? Thiết bị đó sẽ không còn đăng nhập được bằng khóa này."))return;if(passkeyReauthPassword)passkeyReauthPassword.value="";if(passkeyReauthCode)passkeyReauthCode.value="";remove.disabled=true;try{await authApi.deletePasskey(p.credentialId,password,code);accountMessage("Đã thu hồi Passkey. TOTP vẫn dùng được để xác thực.");await refreshPasskeys();}catch(e){accountMessage("Không thu hồi được Passkey: "+e.message);}finally{remove.disabled=false;}});item.append(heading,name,save,remove);passkeyList.append(item);}}}catch(e){if(passkeyStatus)passkeyStatus.textContent=e.message;}}
if(passkeyRegister)passkeyRegister.addEventListener("click",async()=>{if(!authApi||!authSession)return;passkeyRegister.disabled=true;try{const password=passkeyReauthPassword?.value||"",code=passkeyReauthCode?.value||"";if(passkeyReauthPassword)passkeyReauthPassword.value="";if(passkeyReauthCode)passkeyReauthCode.value="";const result=await registerBrowserPasskey(authApi,password,code);accountMessage("Đã đăng ký Passkey. Mã định danh: "+result.credentialId);await refreshPasskeys();}catch(e){accountMessage("Không đăng ký được Passkey: "+e.message);}finally{passkeyRegister.disabled=false;}});
if(passkeyRefresh)passkeyRefresh.addEventListener("click",refreshPasskeys);
if(mfaLoginPasskey)mfaLoginPasskey.addEventListener("click",async()=>{if(!authApi||!pendingMfaChallenge)return;mfaLoginPasskey.disabled=true;try{authSession=await authenticateBrowserPasskey(authApi,pendingMfaChallenge);pendingMfaChallenge=null;if(mfaLoginBox)mfaLoginBox.hidden=true;if(authSession.role==="admin")authUsers=(await authApi.listUsers()).users||[];renderAuthPanel();await refreshAuthSessions();await refreshPasskeys();authMessage("Passkey hợp lệ. Đăng nhập thành công: "+authSession.displayName+" · "+authSession.role);}catch(e){authMessage("Passkey không xác thực được: "+e.message);}finally{mfaLoginPasskey.disabled=false;}});
if(mfaLoginVerify)mfaLoginVerify.addEventListener("click",async()=>{if(!authApi||!pendingMfaChallenge)return;const code=mfaLoginCode?.value?.trim()||"";if(!code){authMessage("Hãy nhập mã TOTP hoặc mã khôi phục.");return;}mfaLoginVerify.disabled=true;try{authSession=await authApi.completeMfaLogin(pendingMfaChallenge,code);pendingMfaChallenge=null;try{authMfaStatus=await authApi.mfaStatus();}catch{authMfaStatus=null;}mfaLoginBox.hidden=true;mfaLoginCode.value="";if(authSession.role==="admin")authUsers=(await authApi.listUsers()).users||[];renderAuthPanel();await refreshAuthSessions();authMessage("MFA hợp lệ. Đăng nhập thành công: "+authSession.displayName+" · "+authSession.role);}catch(e){authMessage(e.message);}finally{mfaLoginVerify.disabled=false;}});
if(mfaLoginCancel)mfaLoginCancel.addEventListener("click",()=>{pendingMfaChallenge=null;if(mfaLoginBox)mfaLoginBox.hidden=true;if(mfaLoginCode)mfaLoginCode.value="";authMessage("Đã hủy bước xác thực MFA. Chưa tạo phiên đăng nhập.");});
if(mfaDisableButton)mfaDisableButton.addEventListener("click",async()=>{if(!authApi||!authSession)return;try{await authApi.disableMfa(mfaDisablePassword?.value||"",mfaDisableCode?.value||"");try{authMfaStatus=await authApi.mfaStatus();}catch{authMfaStatus=null;}renderAuthPanel();mfaDisablePassword.value="";mfaDisableCode.value="";mfaRecoveryBox.hidden=true;mfaSetupBox.hidden=true;accountMessage("Đã tắt MFA sau khi xác minh lại mật khẩu và mã.");}catch(e){accountMessage(e.message);}});

if(authCreate)authCreate.addEventListener("click",async()=>{if(!authApi)return;try{await authApi.createUser({email:authEmail?.value,displayName:authName?.value,role:authRole?.value||"viewer"});authMessage("Máy chủ đã tiếp nhận yêu cầu tạo tài khoản. Người dùng cần thiết lập mật khẩu qua quy trình mời an toàn của máy chủ.");}catch(e){authMessage(e.message);} });
if(authLogin)authLogin.addEventListener("click",async()=>{if(!authApi)return;try{const result=await authApi.login({email:authEmail?.value,password:authPassword?.value});if(authPassword)authPassword.value="";if(result.mfaRequired){pendingMfaChallenge=result.challengeToken;if(mfaLoginBox)mfaLoginBox.hidden=false;if(mfaLoginCode)mfaLoginCode.value="";authMessage("Mật khẩu đúng. Hãy nhập mã TOTP hoặc một mã khôi phục để hoàn tất đăng nhập.");return;}authSession=result;try{authMfaStatus=await authApi.mfaStatus();}catch{authMfaStatus=null;}if(authSession.role==="admin")authUsers=(await authApi.listUsers()).users||[];renderAuthPanel();await refreshAuthSessions();authMessage("Đăng nhập qua máy chủ thành công: "+authSession.displayName+" · "+authSession.role);}catch(e){authMessage(e.message);} });
if(authLogout)authLogout.addEventListener("click",async()=>{if(!authApi)return;try{await authApi.logout();authSession=null;authUsers=[];authMfaStatus=null;renderAuthPanel();renderAuthSessions([]);accountMessage("Đã đăng xuất khỏi máy chủ.");}catch(e){authMessage(e.message);} });
if(authAssign)authAssign.addEventListener("click",async()=>{if(!authApi||authSession?.role!=="admin")return;try{await authApi.updateUser(authUserSelect?.value,{role:authRole?.value});authUsers=(await authApi.listUsers()).users||[];authMessage("Vai trò đã được máy chủ cập nhật.");}catch(e){authMessage(e.message);} });
if(authSetStatus)authSetStatus.addEventListener("click",async()=>{if(!authApi||authSession?.role!=="admin")return;try{await authApi.updateUser(authUserSelect?.value,{status:authStatusSelect?.value});authUsers=(await authApi.listUsers()).users||[];authMessage("Trạng thái đã được máy chủ cập nhật.");}catch(e){authMessage(e.message);} });
if(authAuditExport)authAuditExport.addEventListener("click",async()=>{if(!authApi||authSession?.role!=="admin")return;try{downloadFormulaJson("SGHT-Auth-Audit.json",await authApi.audit());}catch(e){authMessage(e.message);} });
if(authUserSelect)authUserSelect.addEventListener("focus",()=>{authUserSelect.replaceChildren(new Option("Chọn tài khoản",""));for(const u of authUsers)authUserSelect.add(new Option((u.displayName||u.email)+" · "+u.role+" · "+u.status,u.id));});
renderAuthPanel();refreshAuthSession();if(accountActionAtLoad)processAccountAction(accountActionAtLoad);

const identityName=document.querySelector("#identityDisplayName"),identityOrg=document.querySelector("#identityOrganization"),identityNote=document.querySelector("#identityVerificationNote"),identityActor=document.querySelector("#identityActorId"),identitySelect=document.querySelector("#identitySelect"),identityApprove=document.querySelector("#approveIdentity"),identityRegister=document.querySelector("#registerIdentity"),identityKeyLabel=document.querySelector("#identityKeyLabel"),identityKeyExpiry=document.querySelector("#identityKeyExpiry"),identityAddKey=document.querySelector("#registerIdentityKey"),identityKeySelect=document.querySelector("#identityKeySelect"),identityReplacementKeySelect=document.querySelector("#identityReplacementKeySelect"),identityReason=document.querySelector("#identityKeyReason"),identityRevoke=document.querySelector("#revokeIdentityKey"),identityRotate=document.querySelector("#rotateIdentityKey"),identityFingerprint=document.querySelector("#identityFingerprintCheck"),identityCheck=document.querySelector("#checkIdentityFingerprint"),identityImport=document.querySelector("#importIdentityRegistry"),identityExport=document.querySelector("#exportIdentityRegistry"),identityFile=document.querySelector("#identityRegistryFile"),identityOutput=document.querySelector("#identityRegistryOutput");
let identityRegistryLoadError=null;function loadIdentityRegistry(){try{const stored=localStorage.getItem(IDENTITY_REGISTRY_KEY);if(!stored)return createEmptyIdentityRegistry();const raw=JSON.parse(stored),check=validateIdentityRegistry(raw);if(check.valid)return raw;identityRegistryLoadError="Dữ liệu sổ danh tính hiện có không hợp lệ; SGHT khóa thao tác ghi để tránh ghi đè. Hãy nhập bản sao lưu hợp lệ. "+check.errors.join(" ");return createEmptyIdentityRegistry();}catch(error){identityRegistryLoadError="Không đọc được sổ danh tính; SGHT khóa thao tác ghi để tránh ghi đè. "+error.message;return createEmptyIdentityRegistry();}}
let identityRegistry=loadIdentityRegistry();
function saveIdentityRegistry(){if(identityRegistryLoadError)throw new Error(identityRegistryLoadError);const check=validateIdentityRegistry(identityRegistry);if(!check.valid)throw new Error(check.errors.join(" "));localStorage.setItem(IDENTITY_REGISTRY_KEY,JSON.stringify(identityRegistry));renderIdentityRegistry();}
function identityStatus(message){if(identityOutput)identityOutput.textContent=message;}
function renderIdentityRegistry(){const people=identityRegistry.identities||[],keys=identityRegistry.keys||[];if(identitySelect){const old=identitySelect.value;identitySelect.replaceChildren(new Option("Chọn danh tính",""));for(const p of people)identitySelect.add(new Option(p.displayName+" · "+p.status,p.id));if(people.some(p=>p.id===old))identitySelect.value=old;}for(const select of [identityKeySelect,identityReplacementKeySelect])if(select){const old=select.value;select.replaceChildren(new Option("Chọn khóa",""));for(const k of keys)select.add(new Option(k.label+" · "+k.fingerprint.slice(0,12)+" · "+k.status,k.id));if(keys.some(k=>k.id===old))select.value=old;}const v=validateIdentityRegistry(identityRegistry);identityStatus([identityRegistryLoadError||"", "Sổ danh tính: "+(v.valid?"hợp lệ":"có lỗi"),"Danh tính: "+people.length+" · Khóa: "+keys.length+" · Sự kiện: "+(identityRegistry.events||[]).length,...v.errors,...v.warnings,...people.map(p=>p.displayName+" ["+p.status+"]"),...keys.map(k=>k.label+" ["+k.status+"] "+k.fingerprint)].join("\\n"));}
if(identityRegister)identityRegister.addEventListener("click",()=>{try{const p=registerFormulaIdentity(identityRegistry,{displayName:identityName?.value||"",organization:identityOrg?.value||"",actorId:identityActor?.value||null});saveIdentityRegistry();identitySelect.value=p.id;}catch(e){identityStatus(e.message);}});
if(identityApprove)identityApprove.addEventListener("click",()=>{try{const p=approveFormulaIdentity(identityRegistry,identitySelect?.value,{actorId:identityActor?.value,verificationNote:identityNote?.value});saveIdentityRegistry();identityStatus("Đã phê duyệt "+p.displayName+". Ghi chú xác minh đã được lưu.");}catch(e){identityStatus(e.message);}});
if(identityAddKey)identityAddKey.addEventListener("click",async()=>{try{if(!activeFormulaSigningKeys)throw new Error("Hãy nạp khóa ký tương ứng trước.");const k=await registerFormulaIdentityKey(identityRegistry,identitySelect?.value,activeFormulaSigningKeys.publicKey,{actorId:identityActor?.value,expiresAt:identityKeyExpiry?.value?new Date(identityKeyExpiry.value).toISOString():null,label:identityKeyLabel?.value||"Signing key"});saveIdentityRegistry();identityKeySelect.value=k.id;identityStatus("Đã đăng ký fingerprint "+k.fingerprint);}catch(e){identityStatus(e.message);}});
if(identityRevoke)identityRevoke.addEventListener("click",()=>{try{const k=revokeFormulaIdentityKey(identityRegistry,identityKeySelect?.value,{actorId:identityActor?.value,reason:identityReason?.value});saveIdentityRegistry();identityStatus("Đã thu hồi khóa "+k.fingerprint+". Lịch sử được giữ nguyên.");}catch(e){identityStatus(e.message);}});
if(identityRotate)identityRotate.addEventListener("click",()=>{try{const k=rotateFormulaIdentityKey(identityRegistry,identityKeySelect?.value,identityReplacementKeySelect?.value,{actorId:identityActor?.value,reason:identityReason?.value});saveIdentityRegistry();identityStatus("Đã thay thế khóa "+k.fingerprint);}catch(e){identityStatus(e.message);}});
if(identityCheck)identityCheck.addEventListener("click",()=>{const result=evaluateFormulaIdentityKey(identityRegistry,identityFingerprint?.value?.trim());identityStatus("KẾT QUẢ: "+(result.valid?"KHÓA ĐANG HIỆU LỰC":"KHÔNG ĐƯỢC CHẤP NHẬN")+" · "+result.reason+(result.identity?" · "+result.identity.displayName:""));});
if(identityExport)identityExport.addEventListener("click",()=>downloadFormulaJson("SGHT-Identity-Registry.json",JSON.parse(exportFormulaIdentityRegistry(identityRegistry))));
if(identityImport)identityImport.addEventListener("click",()=>identityFile?.click());
if(identityFile)identityFile.addEventListener("change",async()=>{try{const file=identityFile.files?.[0];if(!file)return;identityRegistry=importFormulaIdentityRegistry(await file.text());identityRegistryLoadError=null;saveIdentityRegistry();identityStatus("Đã nhập sổ danh tính hợp lệ. Lưu ý: tệp JSON không có chữ ký quản trị độc lập.");}catch(e){identityStatus("Từ chối nhập sổ: "+e.message);}finally{identityFile.value="";}});
expireFormulaIdentityKeys(identityRegistry);renderIdentityRegistry();

function showFormulaSignatureStatus(lines){if(signatureStatus)signatureStatus.textContent=lines.join("\\n");}
function downloadFormulaJson(name,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=name;link.click();URL.revokeObjectURL(url);}
if(generateSigningKeyButton)generateSigningKeyButton.addEventListener("click",async()=>{generateSigningKeyButton.disabled=true;try{const password=signingPassword?.value||"";if(password.length<12)throw new Error("Nhập mật khẩu ít nhất 12 ký tự trước khi tạo khóa.");const keys=await generateFormulaAuditSigningKeys();const bundle=await exportEncryptedFormulaAuditPrivateKey(keys.privateKey,keys.publicKey,password);activeFormulaSigningKeys=keys;if(signingPassword)signingPassword.value="";downloadFormulaJson("SGHT-Encrypted-Signing-Key.json",bundle);showFormulaSignatureStatus(["Đã tạo cặp khóa ECDSA P-256.","Fingerprint công khai: "+bundle.keyFingerprint,"Khóa riêng đã mã hóa AES-256-GCM/PBKDF2 và tải xuống. Hãy giữ tệp khóa cùng mật khẩu ở nơi an toàn."]);}catch(error){showFormulaSignatureStatus(["Không tạo được khóa: "+error.message]);}finally{generateSigningKeyButton.disabled=false;}});
if(loadSigningKeyButton)loadSigningKeyButton.addEventListener("click",()=>{const picker=document.createElement("input");picker.type="file";picker.accept="application/json,.json";picker.onchange=async()=>{try{const file=picker.files?.[0];if(!file)return;const bundle=JSON.parse(await file.text());activeFormulaSigningKeys=await importEncryptedFormulaAuditPrivateKey(bundle,signingPassword?.value||"");if(signingPassword)signingPassword.value="";showFormulaSignatureStatus(["Đã nạp khóa ký vào phiên làm việc hiện tại.","Fingerprint: "+activeFormulaSigningKeys.keyFingerprint,"Khóa riêng không được lưu vào localStorage."]);}catch(error){activeFormulaSigningKeys=null;showFormulaSignatureStatus(["Không nạp được khóa: "+error.message]);}};picker.click();});
if(signArchiveButton)signArchiveButton.addEventListener("click",async()=>{signArchiveButton.disabled=true;try{if(!activeFormulaSigningKeys)throw new Error("Hãy tạo hoặc nạp khóa ký trước.");const chain=loadFormulaAuditArchive();activeFormulaSignaturePackage=await signFormulaAuditArchive(chain,activeFormulaSigningKeys.privateKey,activeFormulaSigningKeys.publicKey);const result=await verifyFormulaAuditSignature(activeFormulaSignaturePackage);showFormulaSignatureStatus(["Đã ký và tự xác minh chữ ký: "+(result.valid?"HỢP LỆ":"KHÔNG HỢP LỆ"),"Fingerprint: "+result.keyFingerprint,"Hash kho: "+result.headHash,"Số checkpoint: "+result.archiveCount,"Gói ký sẵn sàng xuất."]);}catch(error){showFormulaSignatureStatus(["Không ký được kho: "+error.message]);}finally{signArchiveButton.disabled=false;}});
if(exportSignedButton)exportSignedButton.addEventListener("click",()=>{if(!activeFormulaSignaturePackage){showFormulaSignatureStatus(["Chưa có gói chữ ký. Hãy ký kho trước."]);return;}downloadFormulaJson("SGHT-Signed-Audit-Archive.json",JSON.parse(exportFormulaAuditSignaturePackage(activeFormulaSignaturePackage)));});
if(verifySignedButton)verifySignedButton.addEventListener("click",()=>signedFile?.click());
if(signedFile)signedFile.addEventListener("change",async()=>{try{const file=signedFile.files?.[0];if(!file)return;const pkg=parseFormulaAuditSignaturePackage(await file.text()),result=await verifyFormulaAuditSignature(pkg,{trustedFingerprint:trustedFingerprintInput?.value||""});activeFormulaSignaturePackage=pkg;showFormulaSignatureStatus(["KẾT QUẢ: "+result.status.toUpperCase(),"Chữ ký và chuỗi archive: "+(result.valid?"HỢP LỆ":"KHÔNG HỢP LỆ"),"Fingerprint: "+(result.keyFingerprint||"không xác định"),"Hash kho: "+(result.headHash||"không xác định"),result.trusted?"Fingerprint trùng khóa tin cậy đã nhập.":"Chưa xác lập danh tính người ký. Hãy đối chiếu fingerprint qua kênh độc lập.",...result.findings.map(x=>"["+x.code+"] "+x.message)]);}catch(error){showFormulaSignatureStatus(["Không xác minh được gói: "+error.message]);}finally{signedFile.value="";}});

function loadFormulaAuditArchive(){try{const parsed=JSON.parse(localStorage.getItem(FORMULA_AUDIT_ARCHIVE_KEY)||"[]");return Array.isArray(parsed)?parsed:[];}catch{return [];}}
function saveFormulaAuditArchive(chain){localStorage.setItem(FORMULA_AUDIT_ARCHIVE_KEY,JSON.stringify(chain));}
function showFormulaArchiveStatus(lines){if(archiveStatus)archiveStatus.textContent=lines.join("\\n");}
async function verifyLocalFormulaArchive(){const chain=loadFormulaAuditArchive(),result=await verifyFormulaAuditArchiveChain(chain);showFormulaArchiveStatus(["KHO LƯU TRỮ: "+(result.valid?"TOÀN VẸN":"CÓ VẤN ĐỀ"),"Số bản lưu: "+result.checked,"SHA-256 cuối: "+(result.lastHash||"chưa có"),...result.findings.map(x=>"["+x.code+"] "+x.message)]);return {chain,result};}
if(archiveCreate)archiveCreate.addEventListener("click",async()=>{archiveCreate.disabled=true;try{const chain=loadFormulaAuditArchive(),check=await verifyFormulaAuditArchiveChain(chain);if(!check.valid)throw new Error("Kho lưu trữ đang có lỗi. Hãy xuất bản sao để kiểm tra, không ghi nối.");const raw=JSON.parse(localStorage.getItem(FORMULA_VERSION_KEY)||"null"),history=Array.isArray(raw)?raw:Array.isArray(raw?.versions)?raw.versions:[];const report=auditFormulaVersionIntegrity(raw);const item=await createFormulaAuditArchive(history,chain,{metadata:{integrityReport:report}});chain.push(item);saveFormulaAuditArchive(chain);await verifyLocalFormulaArchive();}catch(error){showFormulaArchiveStatus(["Không tạo được bản lưu: "+error.message]);}finally{archiveCreate.disabled=false;}});if(archiveVerify)archiveVerify.addEventListener("click",()=>verifyLocalFormulaArchive().catch(e=>showFormulaArchiveStatus(["Lỗi kiểm tra: "+e.message])));
if(archiveExport)archiveExport.addEventListener("click",()=>{const chain=loadFormulaAuditArchive(),blob=new Blob([exportFormulaAuditArchive(chain)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="SGHT-Audit-Archive-"+new Date().toISOString().slice(0,10)+".json";link.click();URL.revokeObjectURL(url);});
if(archiveImport&&archiveFile)archiveImport.addEventListener("click",()=>archiveFile.click());
if(archiveFile)archiveFile.addEventListener("change",async()=>{const file=archiveFile.files?.[0];if(!file)return;try{const incoming=parseFormulaAuditArchiveBundle(await file.text()),current=loadFormulaAuditArchive(),result=await verifyAndAppendFormulaAuditArchive(current,incoming);if(!result.accepted)throw new Error(result.reason);saveFormulaAuditArchive(result.chain);showFormulaArchiveStatus(["Đã nhập và xác minh thành công.",result.reason,"Số bản lưu: "+result.chain.length,"SHA-256 cuối: "+(result.verification.lastHash||"chưa có")]);}catch(error){showFormulaArchiveStatus(["Từ chối nhập kho: "+error.message,"Dữ liệu kho hiện tại không bị thay đổi."]);}finally{archiveFile.value="";}});

if(formulaIntegrityExport)formulaIntegrityExport.addEventListener("click",()=>{const report=window.sghtFormulaIntegrityReport||runFormulaIntegrityAudit();if(!report)return;const blob=new Blob([exportFormulaVersionIntegrityReport(report)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="SGHT-Formula-History-Integrity-"+new Date().toISOString().slice(0,10)+".json";link.click();URL.revokeObjectURL(url);});

if(formulaVersionCompare)formulaVersionCompare.addEventListener("click",()=>{try{const diff=compareFormulaVersions(formulaVersionHistory,formulaVersionA.value,formulaVersionB.value);formulaVersionOutput.textContent="SO SÁNH "+diff.address+"\n\nBẢN A · "+diff.versionA.timestamp+"\n"+(diff.from||"(không còn công thức)")+"\n\nBẢN B · "+diff.versionB.timestamp+"\n"+(diff.to||"(không còn công thức)")+"\n\n"+(diff.equal?"Hai phiên bản giống nhau.":"Hai phiên bản khác nhau.");}catch(error){formulaVersionOutput.textContent=error.message;}});
if(formulaVersionRestore)formulaVersionRestore.addEventListener("click",()=>{const item=formulaVersionHistory.find(x=>x.id===formulaVersionA.value);if(!item||!item.afterFormula)return;if(item.sheetId!==activeSheetId||item.address!==selected){formulaVersionOutput.textContent="Phiên bản không thuộc ô đang chọn.";return;}if(!confirm("Khôi phục công thức cũ vào "+selected+"? Thao tác sẽ tạo một phiên bản mới và một mốc Undo."))return;setValue(selected,item.afterFormula);formulaInput.value=item.afterFormula;renderFormulaVersions();formulaVersionOutput.textContent="Đã khôi phục phiên bản đã chọn vào "+selected+". Lịch sử cũ vẫn được giữ; có thể Undo thao tác vừa rồi.";});
if(formulaVersionExport)formulaVersionExport.addEventListener("click",()=>{const blob=new Blob([exportFormulaVersions(formulaVersionHistory)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="SGHT-Formula-Versions-"+new Date().toISOString().slice(0,10)+".json";link.click();URL.revokeObjectURL(url);});
loadFormulaVersions();
let repairAuditEvents=[];
function renderRepairAudit(){
 if(!repairAuditOutput)return;
 if(repairAuditCount)repairAuditCount.textContent=repairAuditEvents.length.toLocaleString("vi-VN")+" / 1.000 sự kiện";
 if(!repairAuditEvents.length){repairAuditOutput.textContent="Chưa có lịch sử sửa công thức.";return;}
 const names={suggestion:"Đề xuất",no_safe_suggestion:"Không có đề xuất an toàn",preview_success:"Thử thành công",preview_failed:"Thử thất bại",applied:"Đã áp dụng",declined:"Đã từ chối",stale:"Đề xuất hết hiệu lực",undo:"Hoàn tác",redo:"Làm lại"};
 repairAuditOutput.textContent=repairAuditEvents.slice(0,30).map(event=>"["+new Date(event.timestamp).toLocaleString("vi-VN")+"] "+(names[event.action]||event.action)+" · "+(event.sheetName||event.sheetId||"")+"/"+(event.address||"—")+"\nTrước: "+(event.before||"—")+"\nSau: "+(event.after||"—")+"\nKết quả: "+(event.result||"—")+(event.note?"\nGhi chú: "+event.note:"")).join("\n\n")+(repairAuditEvents.length>30?"\n\n… còn "+(repairAuditEvents.length-30)+" sự kiện trong tệp xuất.":"");
}
function recordRepairAudit(action,details={}){
 const sheet=workbookSheets.find(item=>item.id===details.sheetId);
 const event={id:"repair-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),timestamp:new Date().toISOString(),action,sheetId:details.sheetId||activeSheetId,sheetName:details.sheetName||sheet?.name||"",address:details.address||"",before:details.before||"",after:details.after||"",result:details.result||"",note:details.note||""};
 repairAuditEvents=appendRepairAudit(repairAuditEvents,event,1000);
 try{localStorage.setItem(REPAIR_AUDIT_KEY,JSON.stringify({version:1,events:repairAuditEvents}));}catch(error){if(repairOutput)repairOutput.textContent+="\n\nCảnh báo: không ghi được nhật ký vào bộ nhớ trình duyệt. Hãy xuất lịch sử hiện có.";}
 renderRepairAudit();return event;
}
function loadRepairAudit(){try{const saved=JSON.parse(localStorage.getItem(REPAIR_AUDIT_KEY)||"null");repairAuditEvents=Array.isArray(saved?.events)?saved.events.slice(0,1000):[];}catch{repairAuditEvents=[];}renderRepairAudit();}
if(repairAuditExportButton)repairAuditExportButton.addEventListener("click",()=>{
 const blob=new Blob([exportRepairAudit(repairAuditEvents)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="SGHT-Formula-Repair-Audit-"+new Date().toISOString().slice(0,10)+".json";link.click();URL.revokeObjectURL(url);
});

let pendingFormulaRepair=null,formulaRepairPreview=null;
function clearFormulaRepair(){pendingFormulaRepair=null;formulaRepairPreview=null;if(repairOutput)repairOutput.textContent="Chưa có đề xuất sửa công thức.";if(repairApplyButton)repairApplyButton.disabled=true;if(repairPreviewButton)repairPreviewButton.disabled=true;}
function showFormulaRepair(report){
 clearFormulaRepair();
 if(!report?.found||!report.selectedError||!repairOutput)return;
 const result=suggestFormulaRepairs({formula:report.formula,errorCode:report.selectedError.code,availableFunctions:listFormulaFunctions()});
 if(!result.available){recordRepairAudit("no_safe_suggestion",{address:selected,before:report.formula||"",result:report.selectedError.code,note:result.reason});repairOutput.textContent="Chưa có cách sửa tự động đủ an toàn cho lỗi "+report.selectedError.code+". "+(result.reason==="ambiguous-function-name"?"Có nhiều tên hàm gần giống; cần người dùng tự đối chiếu.":"Hãy kiểm tra các bước chẩn đoán phía trên; SGHT không đoán công thức thay thế.");return;}
 pendingFormulaRepair={sheetId:activeSheetId,address:selected,original:report.formula,candidate:result.suggestions[0].formula,explanation:result.suggestions[0].explanation};
 recordRepairAudit("suggestion",{address:selected,before:pendingFormulaRepair.original,after:pendingFormulaRepair.candidate,result:report.selectedError.code,note:pendingFormulaRepair.explanation});
 repairOutput.textContent="CÔNG THỨC HIỆN TẠI\n"+pendingFormulaRepair.original+"\n\nĐỀ XUẤT (chưa áp dụng)\n"+pendingFormulaRepair.candidate+"\n\n"+pendingFormulaRepair.explanation+"\nBấm “Thử công thức” để tính thử trước khi chấp thuận.";
 repairPreviewButton.disabled=false;
}
function previewFormulaRepair(){
 if(!pendingFormulaRepair||pendingFormulaRepair.sheetId!==activeSheetId||raw(pendingFormulaRepair.address)!==pendingFormulaRepair.original){if(pendingFormulaRepair)recordRepairAudit("stale",{address:pendingFormulaRepair.address,before:pendingFormulaRepair.original,after:pendingFormulaRepair.candidate,note:"Ô hoặc trang tính đã thay đổi trước khi thử."});clearFormulaRepair();if(repairOutput)repairOutput.textContent="Đề xuất đã cũ vì ô hoặc trang tính vừa thay đổi. Hãy phân tích lại.";return;}
 try{
  const sourceSheetId=activeSheetId;
  const readRange=(ref,readCell)=>{const [start,end]=ref.toUpperCase().split(":").map(parseAddress);if(!start||!end)throw new FormulaError("#REF!","Vùng ô không hợp lệ.");const area=(Math.abs(end.r-start.r)+1)*(Math.abs(end.c-start.c)+1);if(!Number.isSafeInteger(area)||area>100000)throw new FormulaError("#REF!","Vùng vượt giới hạn 100.000 ô.");const values=[];for(let r=Math.min(start.r,end.r);r<=Math.max(start.r,end.r);r++)for(let c=Math.min(start.c,end.c);c<=Math.max(start.c,end.c);c++)values.push(readCell(address(r,c)));return values;};
  const findSheet=name=>workbookSheets.find(sheet=>String(sheet.name).normalize("NFKC").toLocaleLowerCase()===String(name).normalize("NFKC").toLocaleLowerCase());
  const context={getCell:ref=>calculate(ref.toUpperCase(),new Set(),sourceSheetId),getRange:ref=>readRange(ref,cell=>calculate(cell,new Set(),sourceSheetId)),getSheetCell:(name,ref)=>{const sheet=findSheet(name);if(!sheet)throw new FormulaError("#REF!","Không tìm thấy trang tính "+name);return calculate(ref.toUpperCase(),new Set(),sheet.id);},getSheetRange:(name,ref)=>{const sheet=findSheet(name);if(!sheet)throw new FormulaError("#REF!","Không tìm thấy trang tính "+name);return readRange(ref,cell=>calculate(cell,new Set(),sheet.id));}};
  const value=evaluateFormula(expandStructuredFormula(pendingFormulaRepair.candidate),context);
  formulaRepairPreview={value,display:typeof value==="object"?JSON.stringify(value):String(value)};
  repairOutput.textContent="CÔNG THỨC HIỆN TẠI\n"+pendingFormulaRepair.original+"\n\nĐỀ XUẤT\n"+pendingFormulaRepair.candidate+"\n\nKẾT QUẢ THỬ\n"+formulaRepairPreview.display+"\n\nKết quả thử thành công. Công thức gốc vẫn chưa bị thay đổi. Chỉ nút “Chấp thuận & áp dụng” mới ghi công thức mới.";
  repairApplyButton.disabled=false;
  recordRepairAudit("preview_success",{address:pendingFormulaRepair.address,before:pendingFormulaRepair.original,after:pendingFormulaRepair.candidate,result:formulaRepairPreview.display});
 }catch(error){formulaRepairPreview=null;repairApplyButton.disabled=true;recordRepairAudit("preview_failed",{address:pendingFormulaRepair?.address,before:pendingFormulaRepair?.original||"",after:pendingFormulaRepair?.candidate||"",result:error?.code||"#CALC!",note:error?.message||String(error)});repairOutput.textContent="KHÔNG QUA ĐƯỢC BƯỚC THỬ\n"+pendingFormulaRepair.candidate+"\n"+(error?.code||"#CALC!")+" · "+(error?.message||String(error))+"\n\nCông thức gốc được giữ nguyên; không thể chấp thuận đề xuất này.";}
}
if(repairPreviewButton)repairPreviewButton.addEventListener("click",previewFormulaRepair);
if(repairApplyButton)repairApplyButton.addEventListener("click",()=>{
 if(!pendingFormulaRepair||!formulaRepairPreview)return;
 const approval=validateRepairApproval({currentFormula:raw(pendingFormulaRepair.address),expectedFormula:pendingFormulaRepair.original,candidateFormula:pendingFormulaRepair.candidate,previewSucceeded:true});
 if(!approval||pendingFormulaRepair.sheetId!==activeSheetId||pendingFormulaRepair.address!==selected){recordRepairAudit("stale",{address:pendingFormulaRepair.address,before:pendingFormulaRepair.original,after:pendingFormulaRepair.candidate,note:"Công thức gốc không còn khớp tại thời điểm chấp thuận."});repairOutput.textContent="Không áp dụng: ô đã đổi hoặc đề xuất không còn khớp. Hãy phân tích lại.";clearFormulaRepair();return;}
 if(!confirm("Áp dụng công thức đã thử vào ô "+selected+"? Thao tác này tạo một mốc Undo.")){recordRepairAudit("declined",{address:pendingFormulaRepair.address,before:pendingFormulaRepair.original,after:pendingFormulaRepair.candidate,result:formulaRepairPreview.display});return;}
 const accepted={...pendingFormulaRepair},formula=accepted.candidate;setValue(selected,formula);formulaInput.value=formula;recordRepairAudit("applied",{sheetId:accepted.sheetId,address:accepted.address,before:accepted.original,after:formula,result:formulaRepairPreview.display,note:"Đã được người dùng xác nhận; ghi qua setValue và có thể Undo."});clearFormulaRepair();repairOutput.textContent="Đã áp dụng công thức vào "+selected+". Có thể dùng Hoàn tác (Ctrl+Z) để quay lại công thức cũ.";calcStatus.textContent="Đã áp dụng sửa công thức tại "+selected;
});

const evaluateFormulaNode=key=>{const split=key.indexOf("!");if(split<1)throw new Error("Khóa ô không hợp lệ: "+key);return calculate(key.slice(split+1),new Set(),key.slice(0,split));};
if(errorAnalyzeButton&&errorOutput)errorAnalyzeButton.addEventListener("click",()=>{try{const report=analyzeFormulaError({cellKey:activeSheetId+"!"+selected,graph:dependencyGraph,sheets:workbookSheets,evaluateNode:evaluateFormulaNode});errorOutput.textContent=report.found?formatFormulaErrorReport(report):"Ô "+selected+" hiện không có lỗi công thức. Nếu ô chứa công thức, hãy kiểm tra lại sau khi cập nhật dữ liệu.";showFormulaRepair(report);calcStatus.textContent=report.found?"Đã truy vết lỗi tại "+selected:"Không phát hiện lỗi tại "+selected;}catch(error){errorOutput.textContent="Không thể phân tích: "+(error?.message||String(error));}});
if(errorScanButton&&errorOutput)errorScanButton.addEventListener("click",()=>{errorScanButton.disabled=true;errorOutput.textContent="Đang quét tối đa 5.000 công thức…";try{const report=scanWorkbookFormulaErrors({graph:dependencyGraph,sheets:workbookSheets,evaluateNode:evaluateFormulaNode,maxFormulas:5000});const lines=["KẾT QUẢ QUÉT LỖI WORKBOOK","Đã kiểm tra "+report.checked.toLocaleString("vi-VN")+"/"+report.totalFormulas.toLocaleString("vi-VN")+" công thức","Số công thức lỗi: "+report.errors.length,...Object.entries(report.byCode).map(([code,count])=>code+": "+count),"",...report.errors.slice(0,200).map(item=>item.cellKey+" · "+item.code+" · "+item.title+" · "+item.message)];if(report.errors.length>200)lines.push("… còn "+(report.errors.length-200)+" lỗi không hiển thị trong danh sách.");if(report.truncated)lines.push("Đã dừng ở giới hạn 5.000 công thức; cần chia nhỏ workbook để quét tiếp.");lines.push("","Không có công thức hay dữ liệu nào bị tự động sửa.");errorOutput.textContent=lines.join("\n");calcStatus.textContent="Quét hoàn tất · "+report.errors.length+" công thức lỗi";}catch(error){errorOutput.textContent="Không thể quét workbook: "+(error?.message||String(error));}finally{errorScanButton.disabled=false;}});


// SGHT B5.2 — điều hướng Ribbon theo không gian công cụ thực có.
(()=>{
 const tabs=[...document.querySelectorAll('.ribbon-tab')];
 const panels={data:document.querySelector('#dataToolsPanel'),dashboard:document.querySelector('#dashboardPanel'),'data-science':document.querySelector('#dataSciencePanel'),ai:document.querySelector('#aiPanel'),macro:document.querySelector('#macroPanel')};
 const homeOnly=new Set(['home','insert','formulas','view','file']);
 function activate(tab){
  const key=tab.dataset.tab || (tab.id==='openDashboard'?'dashboard':'');
  const panelKey=panels[key]?key:'';
  Object.entries(panels).forEach(([name,panel])=>{if(panel)panel.hidden=name!==panelKey;});
  tabs.forEach(item=>item.classList.toggle('active',item===tab));
  if(key==='data'){renderDataTables();renderPivotBuilder();renderPivotReport();calcStatus.textContent='Dữ liệu · công cụ thao tác vùng và Pivot';}
  else if(key==='dashboard')calcStatus.textContent='Dashboard Studio · bố cục báo cáo';
  else if(key==='data-science')calcStatus.textContent='Data Science · phân tích thống kê';
  else if(key==='ai')calcStatus.textContent='AI Intelligence · trợ lý phân tích workbook';
  else if(key==='macro')calcStatus.textContent='Macro Studio · tự động hóa';
  else if(homeOnly.has(key))calcStatus.textContent=key==='home'?'Trang chủ · công cụ ô và định dạng':'Nhóm '+tab.textContent+' · chưa có bảng lệnh riêng';
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>activate(tab)));
 ['closeDashboard','closeDataScience','closeAI','closeMacro'].forEach(id=>document.querySelector('#'+id)?.addEventListener('click',()=>{Object.values(panels).forEach(panel=>{if(panel)panel.hidden=true;});const home=tabs.find(tab=>tab.dataset.tab==='home');if(home)activate(home);}));
 const initial=tabs.find(tab=>tab.dataset.tab==='home');if(initial)activate(initial);
})();


// SGHT B5.4 — thao tác chọn vùng đa phương thức và điều hướng bàn phím.
(()=>{
 document.addEventListener("pointermove",event=>{
  if(!pointerSelecting||event.pointerType==="mouse")return;
  const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-cell]");
  if(!cell)return;
  const pane=cell.closest(".sheet-scroll");
  choose(cell.dataset.cell,true,pane||sheetScroll);
 },{passive:true});
 document.addEventListener("pointercancel",()=>{pointerSelecting=false;});
 document.addEventListener("keydown",event=>{
  const cell=event.target.closest?.("[data-cell]");
  if(!cell)return;
  const point=parseAddress(cell.dataset.cell);if(!point)return;
  let target=null;
  if((event.ctrlKey||event.metaKey)&&event.key==="Home")target="A1";
  else if((event.ctrlKey||event.metaKey)&&event.key==="End"){
   const used=[...Object.keys(cells),...Object.keys(cellFormats)].map(parseAddress).filter(Boolean);
   const row=Math.max(point.r,...used.map(item=>item.r));
   const col=Math.max(point.c,...used.filter(item=>item.r===row).map(item=>item.c));
   target=address(row,col);
  }else if(event.key==="Home")target=address(point.r,1);
  else if(event.key==="End")target=address(point.r,COLS);
  else if(event.key==="PageDown")target=address(findAxisIndexAtOffset(gridGeometry,"row",getAxisOffset(gridGeometry,"row",point.r)+Math.max(1,sheetScroll.clientHeight)),point.c);
  else if(event.key==="PageUp")target=address(findAxisIndexAtOffset(gridGeometry,"row",Math.max(0,getAxisOffset(gridGeometry,"row",point.r)-Math.max(1,sheetScroll.clientHeight))),point.c);
  if(!target)return;
  event.preventDefault();choose(target,event.shiftKey);
 });
})();
