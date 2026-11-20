import { evaluateFormula, FormulaError } from "./engine/core.js";
import { normalizeCellFormat, cellFormatStyle, getRangeBounds, expandRange, encodeTSV, parseTSV } from "./engine/cell-format.js";
import { captureRange, pasteCapturedRange } from "./engine/range-clipboard.js";
import { fillRange } from "./engine/fill-series.js";
import { serializeWorkbook, restoreWorkbook, pushHistoryEntry, moveHistory } from "./engine/history.js";
import { searchCells, replaceCells } from "./engine/search.js";
import { sortRangeRows, filterRangeRows, removeDuplicateRows, defineStructuredRange, uniqueColumnValues, summarizeByGroup, summarizeByGroups, buildPivotTable, expandStructuredRange, structuredColumnRange, expandStructuredReferences } from "./engine/data-tools.js";
import { getVirtualWindow } from "./engine/sparse-grid.js";
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
import { normalizeWorkbookSheets, addWorkbookSheet, renameWorkbookSheet, removeWorkbookSheet, updateWorkbookSheet, getWorkbookSheet, workbookFieldKey } from "./engine/workbook-sheets.js";
import { normalizeDashboard, createDashboardWidget, removeDashboardWidget, moveDashboardWidget, resizeDashboardWidget, updateDashboardWidget, setDashboardSharedFilter, setDashboardCrossFilter, clearDashboardCrossFilters, removeDashboardCrossFilter, setDashboardPresentation, moveDashboardWidgetToIndex, saveDashboardTemplate, loadDashboardTemplate } from "./ai/dashboard-layout.js";
import { ChartPresetStore } from "./ai/chart-presets.js";
import { buildSurface3DData, projectSurface3D } from "./ai/chart-surface-3d.js";
import { buildContourData, summarizeErrorBars, regressionUncertainty } from "./ai/chart-uncertainty.js";
import { pearsonCorrelation, simpleLinearRegression, oneWayAnova, multipleLinearRegression, fisherLSD, twoWayAnovaBalanced, leveneTest, brownForsytheTest, linearTrendForecast, tukeyHSD, gamesHowell, varianceInflationFactors, descriptiveStatistics, ancova, kruskalWallis, dunnPostHoc, oneWayEffectSizes, anovaPower, requiredAnovaSampleSize } from "./ai/data-science.js";

let COLS = 100, ROWS = 1000;
const MAX_COLS = 16384, MAX_ROWS = 100000, STORAGE_KEY = "haidat-sght-workbook-v1";
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
function applySheetState(sheet){if(!sheet)return;activeSheetId=sheet.id;cells=sheet.cells;cellFormats=sheet.formats;sheetTitle=sheet.name;const freeze=normalizeFreezeSettings(sheet.freeze||{});frozenRows=freeze.rows;frozenColumns=freeze.columns;const split=normalizeSplitSettings(sheet.split);splitMode=split.mode;splitRatio=split.ratio;splitPositions=split.positions;quadrantPositions=normalizeQuadrantPositions(sheet.split?.quadrants);dataTables=sheet.dataTables||[];pivotConfig=sheet.pivotConfig||null;pivotCharts=normalizePivotCharts(sheet.pivotCharts,sheet.pivotChart||{});activePivotChartId=pivotCharts.some(x=>x.id===sheet.activePivotChartId)?sheet.activePivotChartId:pivotCharts[0].id;pivotChartSettings={...getActivePivotChart(pivotCharts,activePivotChartId).settings};filteredRows=new Set();activeFilter=null;undoStack=[];redoStack=[];document.querySelector("#sheetName").value=sheetTitle;document.querySelector("#freezeRowsInput").value=frozenRows;document.querySelector("#freezeColumnsInput").value=frozenColumns;document.querySelector("#splitMode").value=splitMode;applySplitMode(false);updateHistoryControls();renderSheetTabs();}
function storeActiveSheet(){if(!activeSheetId)return;syncActivePivotChart();workbookSheets=updateWorkbookSheet(workbookSheets,activeSheetId,{name:sheetTitle,cells,formats:cellFormats,freeze:{rows:frozenRows,columns:frozenColumns},split:{mode:splitMode,ratio:splitRatio,positions:readSplitPositions(),quadrants:readQuadrantPositions()},dataTables,pivotConfig,pivotCharts,activePivotChartId,pivotChart:pivotChartSettings});}
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved){dashboard=normalizeDashboard(saved.dashboard);dashboardTemplates=Array.isArray(saved.dashboardTemplates)?saved.dashboardTemplates:[];if(Array.isArray(saved.sheets)){workbookSheets=normalizeWorkbookSheets(saved.sheets);activeSheetId=workbookSheets.some(x=>x.id===saved.activeSheetId)?saved.activeSheetId:workbookSheets[0].id;}else{const legacy={id:"sheet-1",name:String(saved.title||"Bảng tính chưa đặt tên"),cells:saved.cells||{},formats:saved.formats||{},freeze:saved.freeze,split:saved.split,dataTables:saved.dataTables,pivotConfig:saved.pivotConfig,pivotCharts:saved.pivotCharts,activePivotChartId:saved.activePivotChartId,pivotChart:saved.pivotChart};workbookSheets=normalizeWorkbookSheets([legacy]);activeSheetId="sheet-1";}const active=getWorkbookSheet(workbookSheets,activeSheetId);applySheetState(active);if(saved.history&&Array.isArray(saved.history.undo)&&Array.isArray(saved.history.redo)){undoStack=saved.history.undo.filter(x=>typeof x==="string").slice(-40);redoStack=saved.history.redo.filter(x=>typeof x==="string").slice(-40);}}else{workbookSheets=normalizeWorkbookSheets([]);applySheetState(workbookSheets[0]);}}catch{workbookSheets=normalizeWorkbookSheets([]);applySheetState(workbookSheets[0]);}renderSheetTabs();}function save(){try{storeActiveSheet();localStorage.setItem(STORAGE_KEY,JSON.stringify({version:2,sheets:workbookSheets,activeSheetId,dashboard,dashboardTemplates,updatedAt:new Date().toISOString()}));saveStatus.textContent="Đã lưu trên thiết bị";}catch{saveStatus.textContent="Không đủ dung lượng lưu · lịch sử có thể chưa được ghi";}}function renderSheetTabs(){const host=document.querySelector("#sheetTabs");if(!host)return;host.replaceChildren();for(const sheet of workbookSheets){const tab=document.createElement("button");tab.type="button";tab.className="sheet-tab"+(sheet.id===activeSheetId?" active":"");tab.textContent=sheet.name;tab.setAttribute("aria-pressed",String(sheet.id===activeSheetId));tab.addEventListener("click",()=>switchWorkbookSheet(sheet.id));host.append(tab);}const add=document.createElement("button");add.type="button";add.className="sheet-tab sheet-tab-add";add.textContent="+";add.setAttribute("aria-label","Thêm trang tính");add.addEventListener("click",createWorkbookSheetUI);host.append(add);}
function switchWorkbookSheet(id){if(id===activeSheetId)return;storeActiveSheet();const target=getWorkbookSheet(workbookSheets,id);if(!target)return;applySheetState(target);selected="A1";selectionRange={start:"A1",end:"A1"};sheetScroll.scrollTop=0;sheetScroll.scrollLeft=0;render();renderPivotBuilder();renderPivotReport();renderDashboard();save();}
function createWorkbookSheetUI(){try{storeActiveSheet();workbookSheets=addWorkbookSheet(workbookSheets,"Trang tính "+(workbookSheets.length+1));const sheet=workbookSheets[workbookSheets.length-1];applySheetState(sheet);selected="A1";selectionRange={start:"A1",end:"A1"};render();renderPivotBuilder();renderPivotReport();renderDashboard();save();}catch(e){calcStatus.textContent=e.message;}}
function deleteWorkbookSheetUI(id){if(workbookSheets.length<=1){calcStatus.textContent="Workbook phải còn ít nhất một trang tính.";return;}const sheet=getWorkbookSheet(workbookSheets,id);if(!sheet||!confirm("Xóa trang tính “"+sheet.name+"”? Thao tác này không thể hoàn tác."))return;storeActiveSheet();workbookSheets=removeWorkbookSheet(workbookSheets,id);if(id===activeSheetId){const next=workbookSheets[0];applySheetState(next);render();renderPivotBuilder();renderPivotReport();}dashboard=normalizeDashboard({...dashboard,widgets:dashboard.widgets.map(w=>w.pivotConfig?.sheetId===id?{...w,pivotConfig:null}:w)});renderDashboard();save();}
document.querySelector("#sheetName").addEventListener("change",e=>{try{sheetTitle=e.target.value.trim()||"Bảng tính chưa đặt tên";workbookSheets=renameWorkbookSheet(workbookSheets,activeSheetId,sheetTitle);e.target.value=sheetTitle;renderSheetTabs();save();}catch(err){e.target.value=sheetTitle;calcStatus.textContent=err.message;}});
;