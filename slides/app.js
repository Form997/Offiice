import {
  SLIDE_WIDTH,
  SLIDE_HEIGHT,
  getTheme,
  clamp,
  createTextElement,
  createShapeElement,
  createImageElement,
  createTableElement,
  createDefaultDeck,
  migrateLegacyV1Slides,
  normalizeDeck,
  cloneDeck,
  addSlideAfter,
  duplicateSlideAt,
  deleteSlideAt,
  moveSlide,
  duplicateElementInSlide,
  reorderElementInSlide,
  snapElementPosition,
  pushDeckHistory,
  moveDeckHistory,
  getSlideLabel,
  renderElementMarkup,
  exportStandaloneHtml,
} from "./engine/deck.js";

const STORAGE_KEY = "haidat-slides-v2";
const LEGACY_KEY = "haidat-slides";
const CHROME_THEME_KEY = "haidat-slides-chrome-theme-v1";

const $ = sel => document.querySelector(sel);

const deckTitleEl = $("#deckTitle");
const saveStatusEl = $("#saveStatus");
const undoBtn = $("#undoBtn");
const redoBtn = $("#redoBtn");
const presentBtn = $("#presentBtn");
const exportMenuBtn = $("#exportMenuBtn");
const exportMenu = $("#exportMenu");
const chromeThemeBtn = $("#chromeThemeBtn");
const installBtn = $("#install");

const addSlideBtn = $("#addSlideBtn");
const slideLayoutSelect = $("#slideLayoutSelect");
const dupSlideBtn = $("#dupSlideBtn");
const delSlideBtn = $("#delSlideBtn");
const addTextBtn = $("#addTextBtn");
const addShapeSelect = $("#addShapeSelect");
const addImageBtn = $("#addImageBtn");
const addTableBtn = $("#addTableBtn");

const elFontSize = $("#elFontSize");
const elBoldBtn = $("#elBoldBtn");
const elItalicBtn = $("#elItalicBtn");
const elAlign = $("#elAlign");
const elTextColor = $("#elTextColor");
const elBgColor = $("#elBgColor");
const elBringUpBtn = $("#elBringUpBtn");
const elSendDownBtn = $("#elSendDownBtn");
const elDeleteBtn = $("#elDeleteBtn");

const deckThemeSelect = $("#deckTheme");
const deckTransitionSelect = $("#deckTransition");

const thumbList = $("#thumbList");
const slideCountBadge = $("#slideCountBadge");
const stageViewport = $("#stageViewport");
const stageFrame = $("#stageFrame");
const stageScaler = $("#stageScaler");
const slideCanvas = $("#slideCanvas");
const snapGuideV = $("#snapGuideV");
const snapGuideH = $("#snapGuideH");

const tableQuickBar = $("#tableQuickBar");
const notesDrawer = $("#notesDrawer");
const speakerNotes = $("#speakerNotes");
const toggleNotesBtn = $("#toggleNotesBtn");
const closeNotesBtn = $("#closeNotesBtn");

const slidePositionLabel = $("#slidePositionLabel");
const selectionStatus = $("#selectionStatus");
const stageScaleLabel = $("#stageScaleLabel");

const imageUpload = $("#imageUpload");
const deckImportFile = $("#deckImportFile");
const ctxMenu = $("#slidesContextMenu");
const printDeck = $("#printDeck");

const presentOverlay = $("#presentOverlay");
const presentStageHost = $("#presentStageHost");
const presentScreenCover = $("#presentScreenCover");
const presentNotesBox = $("#presentNotesBox");
const presentNotesText = $("#presentNotesText");
const presentHud = $("#presentHud");
const presentCounter = $("#presentCounter");

const shortcutsDialog = $("#slidesShortcutsDialog");

let deck = loadInitialDeck();
let activeSlideIndex = 0;
let selectedElementId = null;
let editingElementId = null;
let undoStack = [];
let redoStack = [];
let stageScale = 1;
let interaction = null;
let presentActive = false;
let presentIndex = 0;
let presentCoverMode = "none";
let presentShowNotes = false;
let hudIdleTimer = null;

function loadInitialDeck() {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) return normalizeDeck(JSON.parse(rawV2));
    const rawV1 = localStorage.getItem(LEGACY_KEY);
    if (rawV1) {
      const migrated = migrateLegacyV1Slides(JSON.parse(rawV1));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return createDefaultDeck();
}

function saveDeck(statusText = "Đã lưu cục bộ") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    saveStatusEl.textContent = statusText;
  } catch {
    saveStatusEl.textContent = "Đầy bộ nhớ trình duyệt — hãy giảm bớt ảnh hoặc xuất dự án";
  }
}

function snapshot() {
  pushDeckHistory(undoStack, deck);
  redoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function activeSlide() {
  activeSlideIndex = clamp(activeSlideIndex, 0, Math.max(0, deck.slides.length - 1));
  return deck.slides[activeSlideIndex];
}

function selectedElement() {
  if (!selectedElementId) return null;
  return activeSlide().elements.find(e => e.id === selectedElementId) || null;
}

function setStatus(msg) {
  selectionStatus.textContent = msg;
}

// ---------- Chrome Theme (Light / Dark) ----------
function applyChromeTheme(mode) {
  const dark = mode === "dark";
  document.documentElement.dataset.slidesTheme = dark ? "dark" : "light";
  chromeThemeBtn.textContent = dark ? "☀️ Sáng" : "🌙 Tối";
  try { localStorage.setItem(CHROME_THEME_KEY, dark ? "dark" : "light"); } catch {}
}
applyChromeTheme(localStorage.getItem(CHROME_THEME_KEY) === "dark" ? "dark" : "light");
chromeThemeBtn.addEventListener("click", () => {
  applyChromeTheme(document.documentElement.dataset.slidesTheme === "dark" ? "light" : "dark");
});

// ---------- Stage Responsive Scaling ----------
function updateStageScale() {
  const rect = stageViewport.getBoundingClientRect();
  const pad = window.innerWidth <= 600 ? 16 : 36;
  const availW = Math.max(180, rect.width - pad);
  const availH = Math.max(120, rect.height - pad);
  stageScale = Math.min(availW / SLIDE_WIDTH, availH / SLIDE_HEIGHT, 1.35);
  if (stageFrame) {
    stageFrame.style.width = Math.round(SLIDE_WIDTH * stageScale) + "px";
    stageFrame.style.height = Math.round(SLIDE_HEIGHT * stageScale) + "px";
  }
  stageScaler.style.transform = `scale(${stageScale})`;
  stageScaleLabel.textContent = `16:9 · ${Math.round(stageScale * 100)}%`;
}
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(updateStageScale).observe(stageViewport);
}
window.addEventListener("resize", () => {
  updateStageScale();
  if (presentActive) fitPresentStage();
  hideContextMenu();
});

// ---------- Element Toolbar Sync ----------
function syncElementToolbar() {
  const el = selectedElement();
  const isTextLike = el && (el.type === "text" || el.type === "shape");
  const isTable = el && el.type === "table";
  const hasEl = Boolean(el);

  elFontSize.disabled = !(isTextLike || isTable);
  elBoldBtn.disabled = !isTextLike;
  elItalicBtn.disabled = !isTextLike;
  elAlign.disabled = !isTextLike;
  elTextColor.disabled = !isTextLike;
  elBgColor.disabled = !(isTextLike && el.shape !== "line");
  elBringUpBtn.disabled = !hasEl;
  elSendDownBtn.disabled = !hasEl;
  elDeleteBtn.disabled = !hasEl;
  tableQuickBar.hidden = !isTable;

  if (el) {
    const theme = getTheme(deck.theme);
    if (isTextLike || isTable) {
      const sz = String(el.fontSize || 24);
      if (![...elFontSize.options].some(o => o.value === sz)) {
        const opt = document.createElement("option");
        opt.value = sz; opt.textContent = sz;
        elFontSize.append(opt);
      }
      elFontSize.value = sz;
    }
    if (isTextLike) {
      elBoldBtn.classList.toggle("active", Boolean(el.bold));
      elItalicBtn.classList.toggle("active", Boolean(el.italic));
      elAlign.value = el.align || "left";
      const tc = el.color || (el.role === "title" ? theme.titleColor : theme.textColor);
      if (/^#[0-9a-f]{6}$/i.test(tc)) elTextColor.value = tc;
      if (/^#[0-9a-f]{6}$/i.test(el.bg || "")) elBgColor.value = el.bg;
    } else {
      elBoldBtn.classList.remove("active");
      elItalicBtn.classList.remove("active");
    }
  } else {
    elBoldBtn.classList.remove("active");
    elItalicBtn.classList.remove("active");
  }
}

// ---------- Rendering Filmstrip & Canvas ----------
function renderFilmstrip() {
  const theme = getTheme(deck.theme);
  slideCountBadge.textContent = String(deck.slides.length);
  thumbList.replaceChildren();
  const frag = document.createDocumentFragment();

  deck.slides.forEach((slide, idx) => {
    const card = document.createElement("div");
    card.className = "thumb-card" + (idx === activeSlideIndex ? " active" : "");
    card.setAttribute("role", "option");
    card.setAttribute("aria-selected", String(idx === activeSlideIndex));
    card.dataset.slideIndex = String(idx);

    const num = document.createElement("span");
    num.className = "thumb-num";
    num.textContent = String(idx + 1);

    const frame = document.createElement("div");
    frame.className = "thumb-frame";
    const inner = document.createElement("div");
    inner.className = "thumb-inner";
    inner.style.background = slide.bg || theme.bgGradient;
    inner.innerHTML = slide.elements.map(el => renderElementMarkup(el, theme)).join("");
    frame.append(inner);

    const title = document.createElement("span");
    title.className = "thumb-title";
    title.textContent = getSlideLabel(slide, idx);

    const actions = document.createElement("div");
    actions.className = "thumb-actions";
    const mkBtn = (txt, tip, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = txt;
      b.title = tip;
      b.addEventListener("click", e => { e.stopPropagation(); fn(); });
      return b;
    };
    actions.append(
      mkBtn("↑", "Chuyển slide lên", () => reorderSlideAction(idx, idx - 1)),
      mkBtn("↓", "Chuyển slide xuống", () => reorderSlideAction(idx, idx + 1)),
      mkBtn("⧉", "Nhân bản slide", () => duplicateSlideAction(idx)),
      mkBtn("✕", "Xóa slide", () => deleteSlideAction(idx))
    );

    card.append(num, frame, title, actions);
    card.addEventListener("click", () => {
      if (idx === activeSlideIndex) return;
      finishInlineEdit();
      activeSlideIndex = idx;
      selectedElementId = null;
      renderAll();
    });
    card.addEventListener("contextmenu", e => openThumbnailContextMenu(e, idx));
    frag.append(card);
  });

  thumbList.append(frag);
}

function buildElementNode(el, theme) {
  const wrap = document.createElement("div");
  wrap.className = "slide-el" + (el.id === selectedElementId ? " selected" : "") + (el.id === editingElementId ? " editing" : "");
  wrap.dataset.elId = el.id;
  wrap.style.left = el.x + "px";
  wrap.style.top = el.y + "px";
  wrap.style.width = el.w + "px";
  wrap.style.height = el.h + "px";

  if (el.type === "text") {
    const inner = document.createElement("div");
    inner.className = "slide-el-text";
    inner.style.color = el.color || (el.role === "title" ? theme.titleColor : theme.textColor);
    inner.style.fontSize = el.fontSize + "px";
    inner.style.fontWeight = el.bold ? "700" : "400";
    inner.style.fontStyle = el.italic ? "italic" : "normal";
    inner.style.textAlign = el.align || "left";
    if (el.bg && el.bg !== "transparent") {
      inner.style.background = el.bg;
      inner.style.borderRadius = "8px";
    }
    inner.textContent = el.text;
    if (el.id === editingElementId) {
      inner.contentEditable = "true";
      attachEditableHandlers(inner, el);
    }
    wrap.append(inner);
  } else if (el.type === "shape") {
    const box = document.createElement("div");
    box.className = "slide-el-shape";
    const isLine = el.shape === "line";
    box.style.background = el.bg || (isLine ? theme.accent : theme.shapeBg);
    box.style.border = isLine ? "none" : `2px solid ${el.borderColor || theme.shapeBorder}`;
    box.style.borderRadius = el.shape === "circle" ? "50%" : el.shape === "pill" ? "999px" : el.shape === "rounded" ? "14px" : isLine ? "999px" : "2px";
    box.style.padding = isLine ? "0" : "10px 14px";
    box.style.justifyContent = el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center";

    if (!isLine) {
      const inner = document.createElement("div");
      inner.className = "slide-el-shape-inner";
      inner.style.color = el.color || theme.titleColor;
      inner.style.fontSize = el.fontSize + "px";
      inner.style.fontWeight = el.bold ? "700" : "600";
      inner.style.fontStyle = el.italic ? "italic" : "normal";
      inner.style.textAlign = el.align || "center";
      inner.textContent = el.text;
      if (el.id === editingElementId) {
        inner.contentEditable = "true";
        attachEditableHandlers(inner, el);
      }
      box.append(inner);
    }
    wrap.append(box);
  } else if (el.type === "image") {
    const img = document.createElement("img");
    img.className = "slide-el-img";
    img.src = el.src;
    img.alt = el.alt || "Hình ảnh";
    img.style.borderRadius = (el.radius || 0) + "px";
    wrap.append(img);
  } else if (el.type === "table") {
    const holder = document.createElement("div");
    holder.className = "slide-el-table-wrap";
    const table = document.createElement("table");
    table.className = "slide-el-table";
    table.style.fontSize = (el.fontSize || 16) + "px";

    el.data.forEach((row, ri) => {
      const tr = document.createElement("tr");
      row.forEach((val, ci) => {
        const cell = document.createElement(ri === 0 ? "th" : "td");
        cell.style.border = `1px solid ${theme.tableBorder}`;
        cell.style.background = ri === 0 ? theme.tableHeadBg : theme.tableBg;
        cell.style.color = ri === 0 ? theme.titleColor : theme.textColor;
        cell.style.fontWeight = ri === 0 ? "700" : "400";
        cell.textContent = val;
        cell.contentEditable = "true";
        cell.addEventListener("pointerdown", e => {
          selectedElementId = el.id;
          syncElementToolbar();
          e.stopPropagation();
        });
        cell.addEventListener("focus", () => {
          if (selectedElementId !== el.id) {
            selectedElementId = el.id;
            renderCanvas();
          }
        });
        cell.addEventListener("blur", () => {
          const nextVal = cell.textContent || "";
          if (el.data[ri] && el.data[ri][ci] !== nextVal) {
            snapshot();
            el.data[ri][ci] = nextVal;
            saveDeck();
            renderFilmstrip();
          }
        });
        cell.addEventListener("paste", plainTextPaste);
        tr.append(cell);
      });
      table.append(tr);
    });
    holder.append(table);
    wrap.append(holder);
  }

  if (el.id === selectedElementId && el.id !== editingElementId) {
    for (const dir of ["nw", "n", "ne", "e", "se", "s", "sw", "w"]) {
      const handle = document.createElement("span");
      handle.className = "rh";
      handle.dataset.dir = dir;
      wrap.append(handle);
    }
  }
  return wrap;
}

function plainTextPaste(e) {
  e.preventDefault();
  const txt = e.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, txt);
}

function attachEditableHandlers(node, el) {
  let initialText = el.text;
  node.addEventListener("paste", plainTextPaste);
  node.addEventListener("pointerdown", e => e.stopPropagation());
  node.addEventListener("input", () => {
    el.text = node.innerText.replace(/\r/g, "");
  });
  node.addEventListener("blur", () => {
    const finalText = node.innerText.replace(/\r/g, "");
    editingElementId = null;
    if (finalText !== initialText) {
      el.text = initialText;
      snapshot();
      el.text = finalText;
      saveDeck();
    }
    renderAll();
  });
  node.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      node.blur();
    }
  });
}

function startInlineEdit(elId) {
  const slide = activeSlide();
  const el = slide.elements.find(e => e.id === elId);
  if (!el || (el.type !== "text" && el.type !== "shape") || el.shape === "line") return;
  selectedElementId = el.id;
  editingElementId = el.id;
  renderCanvas();
  const node = slideCanvas.querySelector(`[data-el-id="${el.id}"] [contenteditable="true"]`);
  if (node) {
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

function finishInlineEdit() {
  if (!editingElementId) return;
  const active = slideCanvas.querySelector(`[data-el-id="${editingElementId}"] [contenteditable="true"]`);
  if (active) active.blur();
  editingElementId = null;
}

function renderCanvas() {
  const slide = activeSlide();
  const theme = getTheme(deck.theme);
  slideCanvas.style.background = slide.bg || theme.bgGradient;

  // Keep snap guides, replace slide element nodes
  for (const child of [...slideCanvas.children]) {
    if (child !== snapGuideV && child !== snapGuideH) child.remove();
  }
  const frag = document.createDocumentFragment();
  for (const el of slide.elements) {
    frag.append(buildElementNode(el, theme));
  }
  slideCanvas.append(frag);

  deckTitleEl.value = deck.title;
  deckThemeSelect.value = deck.theme;
  deckTransitionSelect.value = deck.transition;
  speakerNotes.value = slide.notes || "";
  slidePositionLabel.textContent = `Slide ${activeSlideIndex + 1} / ${deck.slides.length}`;
  delSlideBtn.disabled = deck.slides.length <= 1;
  syncElementToolbar();
}

function renderAll() {
  renderCanvas();
  renderFilmstrip();
  updateHistoryButtons();
}

// ---------- Canvas Drag & 8-Handle Resize ----------
slideCanvas.addEventListener("pointerdown", e => {
  hideContextMenu();
  if (e.button !== 0) return;

  const handle = e.target.closest(".rh");
  const elNode = e.target.closest(".slide-el");
  if (!elNode) {
    finishInlineEdit();
    if (selectedElementId !== null) {
      selectedElementId = null;
      renderCanvas();
      setStatus("Nhấp đúp vào chữ để sửa · Chuột phải để mở menu");
    }
    return;
  }

  const id = elNode.dataset.elId;
  const el = activeSlide().elements.find(item => item.id === id);
  if (!el) return;
  if (editingElementId === id) return;
  if (editingElementId && editingElementId !== id) finishInlineEdit();

  if (selectedElementId !== id) {
    selectedElementId = id;
    renderCanvas();
  }

  const mode = handle ? "resize" : "move";
  const dir = handle?.dataset.dir || "";
  interaction = {
    mode,
    dir,
    pointerId: e.pointerId,
    elId: id,
    startX: e.clientX,
    startY: e.clientY,
    orig: { x: el.x, y: el.y, w: el.w, h: el.h },
    moved: false,
    beforeDeck: cloneDeck(deck),
  };
  e.preventDefault();
  try { slideCanvas.setPointerCapture(e.pointerId); } catch {}
});

slideCanvas.addEventListener("pointermove", e => {
  if (!interaction || e.pointerId !== interaction.pointerId) return;
  const el = activeSlide().elements.find(item => item.id === interaction.elId);
  if (!el) return;

  const dx = (e.clientX - interaction.startX) / stageScale;
  const dy = (e.clientY - interaction.startY) / stageScale;
  if (!interaction.moved && Math.hypot(dx, dy) < 2) return;
  interaction.moved = true;

  const o = interaction.orig;
  if (interaction.mode === "move") {
    const snapped = snapElementPosition(o.x + dx, o.y + dy, el.w, el.h, e.altKey ? 0 : 8);
    el.x = snapped.x;
    el.y = snapped.y;
    snapGuideV.hidden = !snapped.snapX;
    snapGuideH.hidden = !snapped.snapY;
  } else {
    const dir = interaction.dir;
    const minW = el.type === "table" ? 160 : 40;
    const minH = el.shape === "line" ? 4 : el.type === "table" ? 72 : 28;
    let nx = o.x, ny = o.y, nw = o.w, nh = o.h;
    if (dir.includes("e")) nw = clamp(Math.round(o.w + dx), minW, SLIDE_WIDTH - o.x);
    if (dir.includes("s")) nh = clamp(Math.round(o.h + dy), minH, SLIDE_HEIGHT - o.y);
    if (dir.includes("w")) {
      const right = o.x + o.w;
      nx = clamp(Math.round(o.x + dx), 0, right - minW);
      nw = right - nx;
    }
    if (dir.includes("n")) {
      const bottom = o.y + o.h;
      ny = clamp(Math.round(o.y + dy), 0, bottom - minH);
      nh = bottom - ny;
    }
    el.x = nx; el.y = ny; el.w = nw; el.h = nh;
  }

  const domEl = slideCanvas.querySelector(`[data-el-id="${el.id}"]`);
  if (domEl) {
    domEl.style.left = el.x + "px";
    domEl.style.top = el.y + "px";
    domEl.style.width = el.w + "px";
    domEl.style.height = el.h + "px";
  }
  setStatus(`${Math.round(el.x)}, ${Math.round(el.y)} · ${Math.round(el.w)}×${Math.round(el.h)} px`);
});

function finishPointerInteraction(e) {
  if (!interaction || (e.pointerId !== undefined && e.pointerId !== interaction.pointerId)) return;
  const done = interaction;
  interaction = null;
  snapGuideV.hidden = true;
  snapGuideH.hidden = true;
  if (done.moved) {
    pushDeckHistory(undoStack, done.beforeDeck);
    redoStack = [];
    updateHistoryButtons();
    saveDeck();
    renderFilmstrip();
  }
}
slideCanvas.addEventListener("pointerup", finishPointerInteraction);
slideCanvas.addEventListener("pointercancel", finishPointerInteraction);

slideCanvas.addEventListener("dblclick", e => {
  const elNode = e.target.closest(".slide-el");
  if (!elNode) return;
  startInlineEdit(elNode.dataset.elId);
});

slideCanvas.addEventListener("contextmenu", e => openCanvasContextMenu(e));

// ---------- Slide & Element Actions ----------
function addSlideAction(layout = "content") {
  finishInlineEdit();
  snapshot();
  const res = addSlideAfter(deck, activeSlideIndex, layout);
  deck = res.deck;
  activeSlideIndex = res.activeIndex;
  selectedElementId = null;
  saveDeck();
  renderAll();
  setStatus(`Đã thêm slide ${activeSlideIndex + 1}`);
}

function duplicateSlideAction(idx = activeSlideIndex) {
  finishInlineEdit();
  snapshot();
  const res = duplicateSlideAt(deck, idx);
  deck = res.deck;
  activeSlideIndex = res.activeIndex;
  selectedElementId = null;
  saveDeck();
  renderAll();
  setStatus(`Đã nhân bản slide ${idx + 1}`);
}

function deleteSlideAction(idx = activeSlideIndex) {
  if (deck.slides.length <= 1) { setStatus("Bài trình chiếu cần ít nhất 1 slide."); return; }
  finishInlineEdit();
  snapshot();
  const res = deleteSlideAt(deck, idx);
  deck = res.deck;
  activeSlideIndex = res.activeIndex;
  selectedElementId = null;
  saveDeck();
  renderAll();
  setStatus("Đã xóa slide (Ctrl+Z để hoàn tác)");
}

function reorderSlideAction(fromIdx, toIdx) {
  if (toIdx < 0 || toIdx >= deck.slides.length) return;
  finishInlineEdit();
  snapshot();
  const res = moveSlide(deck, fromIdx, toIdx);
  if (!res.moved) return;
  deck = res.deck;
  activeSlideIndex = res.activeIndex;
  saveDeck();
  renderAll();
}

function insertElement(el, autoEdit = false) {
  finishInlineEdit();
  snapshot();
  activeSlide().elements.push(el);
  selectedElementId = el.id;
  saveDeck();
  renderAll();
  if (autoEdit) startInlineEdit(el.id);
}

function updateSelectedElement(patch) {
  const el = selectedElement();
  if (!el) return;
  snapshot();
  Object.assign(el, patch);
  saveDeck();
  renderAll();
}

function deleteSelectedElement() {
  const el = selectedElement();
  if (!el) return;
  finishInlineEdit();
  snapshot();
  const s = activeSlide();
  s.elements = s.elements.filter(item => item.id !== el.id);
  selectedElementId = null;
  saveDeck();
  renderAll();
  setStatus("Đã xóa khối (Ctrl+Z để hoàn tác)");
}

function duplicateSelectedElement() {
  const el = selectedElement();
  if (!el) return duplicateSlideAction(activeSlideIndex);
  finishInlineEdit();
  snapshot();
  const copy = duplicateElementInSlide(activeSlide(), el.id);
  if (copy) selectedElementId = copy.id;
  saveDeck();
  renderAll();
  setStatus("Đã nhân bản khối");
}

function reorderSelectedElement(dir) {
  const el = selectedElement();
  if (!el) return;
  snapshot();
  if (reorderElementInSlide(activeSlide(), el.id, dir)) {
    saveDeck();
    renderAll();
  }
}

// ---------- Image Compression (keeps localStorage fast & crisp) ----------
function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được tệp ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Tệp ảnh không hợp lệ."));
      img.onload = () => {
        const maxDim = 1280;
        let w = img.naturalWidth || 640, h = img.naturalHeight || 360;
        const ratio = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const keepPng = file.type === "image/png" || file.type === "image/webp" || file.type === "image/svg+xml";
        const dataUrl = keepPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
        resolve({ src: dataUrl, w, h });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// ---------- Toolbar Listeners ----------
deckTitleEl.addEventListener("input", () => {
  deck.title = deckTitleEl.value.trim() || "Bài trình chiếu chưa đặt tên";
  saveDeck();
});

undoBtn.addEventListener("click", () => {
  finishInlineEdit();
  const prev = moveDeckHistory(undoStack, redoStack, deck);
  if (!prev) return;
  deck = prev;
  selectedElementId = null;
  saveDeck("Đã hoàn tác");
  renderAll();
});

redoBtn.addEventListener("click", () => {
  finishInlineEdit();
  const next = moveDeckHistory(redoStack, undoStack, deck);
  if (!next) return;
  deck = next;
  selectedElementId = null;
  saveDeck("Đã làm lại");
  renderAll();
});

addSlideBtn.addEventListener("click", () => addSlideAction("content"));
slideLayoutSelect.addEventListener("change", () => {
  if (!slideLayoutSelect.value) return;
  addSlideAction(slideLayoutSelect.value);
  slideLayoutSelect.value = "";
});
dupSlideBtn.addEventListener("click", () => duplicateSlideAction(activeSlideIndex));
delSlideBtn.addEventListener("click", () => deleteSlideAction(activeSlideIndex));

addTextBtn.addEventListener("click", () => {
  insertElement(createTextElement({ x: 240, y: 200, w: 480, h: 96, text: "Khung chữ mới" }), true);
});
addShapeSelect.addEventListener("change", () => {
  const shape = addShapeSelect.value;
  if (!shape) return;
  const el = shape === "line"
    ? createShapeElement({ shape: "line", x: 260, y: 267, w: 440, h: 6 })
    : createShapeElement({ shape, x: 330, y: 195, w: 300, h: 140, text: shape === "pill" ? "Điểm nhấn" : "" });
  insertElement(el, false);
  addShapeSelect.value = "";
});
addImageBtn.addEventListener("click", () => imageUpload.click());
imageUpload.addEventListener("change", async () => {
  const file = imageUpload.files?.[0];
  imageUpload.value = "";
  if (!file) return;
  try {
    const { src, w, h } = await readAndCompressImage(file);
    const scale = Math.min(480 / w, 340 / h, 1);
    const dw = Math.max(80, Math.round(w * scale));
    const dh = Math.max(60, Math.round(h * scale));
    insertElement(createImageElement(src, {
      alt: file.name,
      x: Math.round((SLIDE_WIDTH - dw) / 2),
      y: Math.round((SLIDE_HEIGHT - dh) / 2),
      w: dw,
      h: dh,
    }));
    setStatus("Đã chèn ảnh cục bộ");
  } catch (err) {
    setStatus(err.message || "Không thể chèn ảnh.");
  }
});
addTableBtn.addEventListener("click", () => {
  insertElement(createTableElement({ rows: 3, cols: 3 }), false);
  setStatus("Đã chèn bảng 3×3 — bấm vào từng ô để nhập nội dung");
});

elFontSize.addEventListener("change", () => updateSelectedElement({ fontSize: Number(elFontSize.value) }));
elBoldBtn.addEventListener("click", () => {
  const el = selectedElement();
  if (el) updateSelectedElement({ bold: !el.bold });
});
elItalicBtn.addEventListener("click", () => {
  const el = selectedElement();
  if (el) updateSelectedElement({ italic: !el.italic });
});
elAlign.addEventListener("change", () => updateSelectedElement({ align: elAlign.value }));
elTextColor.addEventListener("input", () => updateSelectedElement({ color: elTextColor.value }));
elBgColor.addEventListener("input", () => updateSelectedElement({ bg: elBgColor.value }));
elBringUpBtn.addEventListener("click", () => reorderSelectedElement("up"));
elSendDownBtn.addEventListener("click", () => reorderSelectedElement("down"));
elDeleteBtn.addEventListener("click", deleteSelectedElement);

// Table row/col adjustments
$("#tblAddRowBtn").addEventListener("click", () => {
  const el = selectedElement();
  if (!el || el.type !== "table" || el.data.length >= 10) return;
  snapshot();
  el.data.push(Array.from({ length: el.data[0]?.length || 3 }, () => ""));
  el.h = clamp(el.h + 36, 72, SLIDE_HEIGHT - el.y);
  saveDeck(); renderAll();
});
$("#tblDelRowBtn").addEventListener("click", () => {
  const el = selectedElement();
  if (!el || el.type !== "table" || el.data.length <= 1) return;
  snapshot();
  el.data.pop();
  saveDeck(); renderAll();
});
$("#tblAddColBtn").addEventListener("click", () => {
  const el = selectedElement();
  if (!el || el.type !== "table" || (el.data[0]?.length || 0) >= 8) return;
  snapshot();
  el.data.forEach((row, ri) => row.push(ri === 0 ? `Cột ${row.length + 1}` : ""));
  saveDeck(); renderAll();
});
$("#tblDelColBtn").addEventListener("click", () => {
  const el = selectedElement();
  if (!el || el.type !== "table" || (el.data[0]?.length || 0) <= 1) return;
  snapshot();
  el.data.forEach(row => row.pop());
  saveDeck(); renderAll();
});

deckThemeSelect.addEventListener("change", () => {
  snapshot();
  deck.theme = deckThemeSelect.value;
  saveDeck();
  renderAll();
});
deckTransitionSelect.addEventListener("change", () => {
  deck.transition = deckTransitionSelect.value;
  saveDeck();
});

// Speaker notes drawer toggle
function setNotesOpen(open) {
  notesDrawer.hidden = !open;
  toggleNotesBtn.classList.toggle("active", open);
  toggleNotesBtn.setAttribute("aria-expanded", String(open));
  requestAnimationFrame(updateStageScale);
}
toggleNotesBtn.addEventListener("click", () => setNotesOpen(notesDrawer.hidden));
closeNotesBtn.addEventListener("click", () => setNotesOpen(false));
speakerNotes.addEventListener("input", () => {
  activeSlide().notes = speakerNotes.value;
  saveDeck();
});

// ---------- Export & File Popover ----------
function closeExportMenu() {
  exportMenu.hidden = true;
  exportMenuBtn.setAttribute("aria-expanded", "false");
}
exportMenuBtn.addEventListener("click", e => {
  e.stopPropagation();
  const next = exportMenu.hidden;
  exportMenu.hidden = !next;
  exportMenuBtn.setAttribute("aria-expanded", String(next));
  if (next) {
    const r = exportMenuBtn.getBoundingClientRect();
    const mw = exportMenu.offsetWidth || 252;
    const left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
    exportMenu.style.left = left + "px";
    exportMenu.style.top = (r.bottom + 6) + "px";
  }
});

// Touch long-press context menu on Slides canvas (for phones without right-click)
let slidesLongPress = null, slidesLongOrigin = null;
function cancelSlidesLongPress() {
  if (slidesLongPress) { clearTimeout(slidesLongPress); slidesLongPress = null; }
  slidesLongOrigin = null;
}
slideCanvas.addEventListener("pointerdown", e => {
  if (e.pointerType !== "touch" || editingElementId) return;
  cancelSlidesLongPress();
  const target = e.target, cx = e.clientX, cy = e.clientY;
  slidesLongOrigin = { x: cx, y: cy };
  slidesLongPress = setTimeout(() => {
    slidesLongPress = null;
    interaction = null;
    openCanvasContextMenu({ target, clientX: cx, clientY: cy, shiftKey: false, preventDefault() {} });
  }, 540);
});
slideCanvas.addEventListener("pointermove", e => {
  if (!slidesLongPress || !slidesLongOrigin) return;
  if (Math.hypot(e.clientX - slidesLongOrigin.x, e.clientY - slidesLongOrigin.y) > 10) cancelSlidesLongPress();
});
slideCanvas.addEventListener("pointerup", cancelSlidesLongPress);
slideCanvas.addEventListener("pointercancel", cancelSlidesLongPress);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileSlug() {
  return (deck.title || "hai-dat-slides").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
}

function printDeckToPdf() {
  finishInlineEdit();
  const theme = getTheme(deck.theme);
  printDeck.innerHTML = deck.slides.map(slide => {
    const bg = slide.bg || theme.bgGradient;
    return `<section class="print-slide" style="background:${bg}">${slide.elements.map(el => renderElementMarkup(el, theme)).join("")}</section>`;
  }).join("");
  window.print();
}

exportMenu.addEventListener("click", e => {
  const btn = e.target.closest("[data-export]");
  if (!btn) return;
  closeExportMenu();
  finishInlineEdit();
  const action = btn.dataset.export;
  if (action === "html") {
    const html = exportStandaloneHtml(deck);
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), safeFileSlug() + ".html");
    setStatus("Đã xuất tệp HTML trình chiếu độc lập (.html)");
  } else if (action === "pdf") {
    printDeckToPdf();
  } else if (action === "save-json") {
    downloadBlob(new Blob([JSON.stringify(deck, null, 2)], { type: "application/json;charset=utf-8" }), safeFileSlug() + ".hdslides.json");
    setStatus("Đã tải tệp dự án (.hdslides.json)");
  } else if (action === "open-json") {
    deckImportFile.click();
  } else if (action === "new-deck") {
    if (!confirm("Tạo bài trình chiếu mới trống? Bạn vẫn có thể bấm Hoàn tác (Ctrl+Z) nếu lỡ tay.")) return;
    snapshot();
    deck = createDefaultDeck();
    activeSlideIndex = 0;
    selectedElementId = null;
    saveDeck("Đã tạo bài trình chiếu mới");
    renderAll();
  }
});

deckImportFile.addEventListener("change", async () => {
  const file = deckImportFile.files?.[0];
  deckImportFile.value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    snapshot();
    deck = normalizeDeck(parsed);
    activeSlideIndex = 0;
    selectedElementId = null;
    saveDeck("Đã mở dự án: " + file.name);
    renderAll();
  } catch {
    setStatus("Tệp dự án không đúng định dạng JSON của HAI ĐẤT SLIDES.");
  }
});

// ---------- Right-Click Context Menu ----------
function hideContextMenu() {
  ctxMenu.hidden = true;
  ctxMenu.replaceChildren();
}

function showContextMenu(clientX, clientY, entries) {
  ctxMenu.replaceChildren();
  for (const item of entries) {
    if (item.sep) {
      const sep = document.createElement("div");
      sep.className = "menu-sep";
      ctxMenu.append(sep);
      continue;
    }
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "menuitem");
    b.className = "ctx-btn" + (item.danger ? " danger" : "");
    const lbl = document.createElement("span");
    lbl.textContent = item.label;
    b.append(lbl);
    if (item.shortcut) {
      const sc = document.createElement("small");
      sc.textContent = item.shortcut;
      b.append(sc);
    }
    b.addEventListener("click", () => { hideContextMenu(); item.action(); });
    ctxMenu.append(b);
  }
  ctxMenu.hidden = false;
  const mw = ctxMenu.offsetWidth || 220, mh = ctxMenu.offsetHeight || 260;
  ctxMenu.style.left = Math.max(8, Math.min(clientX, window.innerWidth - mw - 8)) + "px";
  ctxMenu.style.top = Math.max(8, Math.min(clientY, window.innerHeight - mh - 8)) + "px";
}

function openCanvasContextMenu(e) {
  if (e.shiftKey) return;
  e.preventDefault();
  const elNode = e.target.closest(".slide-el");
  if (elNode) {
    const id = elNode.dataset.elId;
    selectedElementId = id;
    renderCanvas();
    const el = selectedElement();
    const items = [];
    if (el && (el.type === "text" || (el.type === "shape" && el.shape !== "line"))) {
      items.push({ label: "✎ Sửa nội dung chữ", shortcut: "Enter", action: () => startInlineEdit(el.id) });
    }
    items.push(
      { label: "⧉ Nhân bản khối", shortcut: "Ctrl+D", action: duplicateSelectedElement },
      { sep: true },
      { label: "⬆ Đưa lên trên cùng", action: () => reorderSelectedElement("front") },
      { label: "⬇ Đưa xuống dưới cùng", action: () => reorderSelectedElement("back") },
      { label: "↔ Căn giữa ngang", action: () => el && updateSelectedElement({ x: Math.round((SLIDE_WIDTH - el.w) / 2) }) },
      { label: "↕ Căn giữa dọc", action: () => el && updateSelectedElement({ y: Math.round((SLIDE_HEIGHT - el.h) / 2) }) },
      { sep: true },
      { label: "✕ Xóa khối", shortcut: "Del", danger: true, action: deleteSelectedElement }
    );
    showContextMenu(e.clientX, e.clientY, items);
  } else {
    showContextMenu(e.clientX, e.clientY, [
      { label: "T Chèn khung chữ", action: () => addTextBtn.click() },
      { label: "▢ Chèn khung bo góc", action: () => insertElement(createShapeElement({ shape: "rounded" })) },
      { label: "🖼 Chèn ảnh từ máy", action: () => imageUpload.click() },
      { label: "▦ Chèn bảng 3×3", action: () => addTableBtn.click() },
      { sep: true },
      { label: "＋ Thêm slide mới", shortcut: "Ctrl+M", action: () => addSlideAction("content") },
      { label: "▶ Trình chiếu từ slide này", shortcut: "Shift+F5", action: () => startPresentation(activeSlideIndex) },
    ]);
  }
}

function openThumbnailContextMenu(e, idx) {
  if (e.shiftKey) return;
  e.preventDefault();
  activeSlideIndex = idx;
  selectedElementId = null;
  renderAll();
  showContextMenu(e.clientX, e.clientY, [
    { label: "＋ Thêm slide mới sau đây", action: () => addSlideAction("content") },
    { label: "⧉ Nhân bản slide này", action: () => duplicateSlideAction(idx) },
    { sep: true },
    { label: "↑ Di chuyển lên", action: () => reorderSlideAction(idx, idx - 1) },
    { label: "↓ Di chuyển xuống", action: () => reorderSlideAction(idx, idx + 1) },
    { sep: true },
    { label: "▶ Trình chiếu từ đây", action: () => startPresentation(idx) },
    { label: "🗑 Xóa slide này", danger: true, action: () => deleteSlideAction(idx) },
  ]);
}

document.addEventListener("pointerdown", e => {
  if (!ctxMenu.hidden && !ctxMenu.contains(e.target)) hideContextMenu();
  if (!exportMenu.hidden && !exportMenu.contains(e.target) && e.target !== exportMenuBtn) closeExportMenu();
});

// ---------- In-Page Fullscreen Presentation Mode ----------
function fitPresentStage() {
  const s = Math.min(window.innerWidth / SLIDE_WIDTH, window.innerHeight / SLIDE_HEIGHT);
  presentStageHost.style.transform = `scale(${s})`;
}

function renderPresentSlide() {
  const slide = deck.slides[presentIndex];
  const theme = getTheme(deck.theme);
  presentStageHost.className = "present-stage-host";
  presentStageHost.style.background = slide.bg || theme.bgGradient;
  presentStageHost.innerHTML = slide.elements.map(el => renderElementMarkup(el, theme)).join("");
  if (deck.transition !== "none") {
    void presentStageHost.offsetWidth;
    presentStageHost.classList.add("anim-" + deck.transition);
  }
  presentCounter.textContent = `${presentIndex + 1} / ${deck.slides.length}`;
  presentNotesText.textContent = slide.notes?.trim() || "(Slide này chưa có ghi chú diễn giả.)";
  presentNotesBox.hidden = !presentShowNotes;
  fitPresentStage();
}

function setPresentCover(mode) {
  presentCoverMode = presentCoverMode === mode ? "none" : mode;
  presentScreenCover.hidden = presentCoverMode === "none";
  presentScreenCover.classList.toggle("white", presentCoverMode === "white");
}

function bumpHudActivity() {
  presentHud.classList.remove("idle");
  clearTimeout(hudIdleTimer);
  hudIdleTimer = setTimeout(() => presentHud.classList.add("idle"), 2400);
}

function startPresentation(startIdx = 0) {
  finishInlineEdit();
  hideContextMenu();
  closeExportMenu();
  presentActive = true;
  presentIndex = clamp(startIdx, 0, deck.slides.length - 1);
  presentCoverMode = "none";
  presentScreenCover.hidden = true;
  presentOverlay.hidden = false;
  renderPresentSlide();
  bumpHudActivity();
  if (presentOverlay.requestFullscreen) {
    presentOverlay.requestFullscreen().catch(() => {});
  }
}

function exitPresentation() {
  if (!presentActive) return;
  presentActive = false;
  presentOverlay.hidden = true;
  presentScreenCover.hidden = true;
  presentCoverMode = "none";
  clearTimeout(hudIdleTimer);
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

function movePresent(delta) {
  const next = clamp(presentIndex + delta, 0, deck.slides.length - 1);
  if (next !== presentIndex) {
    presentIndex = next;
    renderPresentSlide();
  }
  bumpHudActivity();
}

presentBtn.addEventListener("click", () => startPresentation(0));
$("#presentPrevBtn").addEventListener("click", e => { e.stopPropagation(); movePresent(-1); });
$("#presentNextBtn").addEventListener("click", e => { e.stopPropagation(); movePresent(1); });
$("#presentNotesBtn").addEventListener("click", e => { e.stopPropagation(); presentShowNotes = !presentShowNotes; presentNotesBox.hidden = !presentShowNotes; });
$("#presentBlackBtn").addEventListener("click", e => { e.stopPropagation(); setPresentCover("black"); });
$("#presentExitBtn").addEventListener("click", e => { e.stopPropagation(); exitPresentation(); });
presentOverlay.addEventListener("mousemove", bumpHudActivity);
presentOverlay.addEventListener("click", e => {
  if (e.target.closest("#presentHud") || e.target.closest("#presentNotesBox")) return;
  if (presentCoverMode !== "none") { setPresentCover("none"); return; }
  movePresent(1);
});
document.addEventListener("fullscreenchange", () => {
  if (presentActive) fitPresentStage();
});

// ---------- Shortcuts Dialog ----------
$("#openShortcutsBtn").addEventListener("click", () => {
  if (typeof shortcutsDialog.showModal === "function") shortcutsDialog.showModal();
  else shortcutsDialog.setAttribute("open", "");
});
$("#closeShortcutsBtn").addEventListener("click", () => {
  if (typeof shortcutsDialog.close === "function") shortcutsDialog.close();
  else shortcutsDialog.removeAttribute("open");
});
shortcutsDialog.addEventListener("click", e => {
  if (e.target === shortcutsDialog) shortcutsDialog.close?.();
});

// ---------- Global Keyboard Shortcuts ----------
window.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;

  if (presentActive) {
    if (e.key === "Escape") { e.preventDefault(); exitPresentation(); return; }
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter" || e.key === "PageDown") {
      e.preventDefault(); movePresent(1); return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "Backspace" || e.key === "PageUp") {
      e.preventDefault(); movePresent(-1); return;
    }
    if (e.key === "Home") { e.preventDefault(); presentIndex = 0; renderPresentSlide(); return; }
    if (e.key === "End") { e.preventDefault(); presentIndex = deck.slides.length - 1; renderPresentSlide(); return; }
    if (key === "b") { e.preventDefault(); setPresentCover("black"); return; }
    if (key === "w") { e.preventDefault(); setPresentCover("white"); return; }
    if (key === "n") { e.preventDefault(); presentShowNotes = !presentShowNotes; presentNotesBox.hidden = !presentShowNotes; return; }
    return;
  }

  if (e.key === "F5") {
    e.preventDefault();
    startPresentation(e.shiftKey ? activeSlideIndex : 0);
    return;
  }
  if (mod && key === "s") { e.preventDefault(); saveDeck("Đã lưu ngay (Ctrl+S)"); return; }
  if (mod && key === "/") { e.preventDefault(); $("#openShortcutsBtn").click(); return; }

  const target = e.target;
  const inInput = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

  if (e.key === "Escape") {
    if (!ctxMenu.hidden) { hideContextMenu(); return; }
    if (!exportMenu.hidden) { closeExportMenu(); return; }
    if (shortcutsDialog.open) { shortcutsDialog.close(); return; }
    if (editingElementId) { finishInlineEdit(); return; }
    if (selectedElementId) { selectedElementId = null; renderCanvas(); return; }
  }

  if (inInput) return;

  if (mod && !e.altKey) {
    if (key === "z" && e.shiftKey) { e.preventDefault(); redoBtn.click(); return; }
    if (key === "z") { e.preventDefault(); undoBtn.click(); return; }
    if (key === "y") { e.preventDefault(); redoBtn.click(); return; }
    if (key === "m") { e.preventDefault(); addSlideAction("content"); return; }
    if (key === "d") { e.preventDefault(); duplicateSelectedElement(); return; }
    if (key === "b") { e.preventDefault(); elBoldBtn.click(); return; }
    if (key === "i") { e.preventDefault(); elItalicBtn.click(); return; }
  }

  if (e.key === "PageDown") {
    e.preventDefault();
    if (activeSlideIndex < deck.slides.length - 1) { activeSlideIndex++; selectedElementId = null; renderAll(); }
    return;
  }
  if (e.key === "PageUp") {
    e.preventDefault();
    if (activeSlideIndex > 0) { activeSlideIndex--; selectedElementId = null; renderAll(); }
    return;
  }

  const el = selectedElement();
  if (!el) return;

  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    deleteSelectedElement();
    return;
  }
  if (e.key === "Enter" && (el.type === "text" || (el.type === "shape" && el.shape !== "line"))) {
    e.preventDefault();
    startInlineEdit(el.id);
    return;
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 2;
    snapshot();
    if (e.key === "ArrowUp") el.y = clamp(el.y - step, 0, SLIDE_HEIGHT - el.h);
    if (e.key === "ArrowDown") el.y = clamp(el.y + step, 0, SLIDE_HEIGHT - el.h);
    if (e.key === "ArrowLeft") el.x = clamp(el.x - step, 0, SLIDE_WIDTH - el.w);
    if (e.key === "ArrowRight") el.x = clamp(el.x + step, 0, SLIDE_WIDTH - el.w);
    saveDeck();
    renderAll();
  }
});

// ---------- PWA Offline Registration ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", () => deferredPrompt?.prompt());

// Initial render
renderAll();
requestAnimationFrame(updateStageScale);