const FONTS = new Set(["Arial", "Calibri", "Georgia", "Times New Roman", "Courier New"]);
const SIZES = new Set(["11px", "12px", "14px", "16px", "18px", "24px"]);
const ALIGNS = new Set(["left", "center", "right"]);
const VERT = new Set(["top", "middle", "bottom"]);
const NUMS = new Set(["general", "thousands", "number2", "integer", "percent", "currency", "usd", "date"]);
const BORDERS = new Set(["none", "thin", "medium", "bottom", "outer"]);
const EDGE_STYLES = new Set(["", "thin", "medium", "double"]);
const COLOR = /^#[0-9a-f]{6}$/i;

function edgeCss(style) {
  if (style === "thin") return "1px solid #52685c";
  if (style === "medium") return "2px solid #2b4236";
  if (style === "double") return "3px double #2b4236";
  return "";
}

function normalizeDecimals(d) {
  if (d === null || d === undefined || d === "") return null;
  const n = Number(d);
  if (!Number.isInteger(n)) return null;
  return Math.max(0, Math.min(6, n));
}

export function normalizeCellFormat(x = {}) {
  x = x && typeof x === "object" ? x : {};
  const borderTop = EDGE_STYLES.has(x.borderTop) ? x.borderTop : "";
  const borderRight = EDGE_STYLES.has(x.borderRight) ? x.borderRight : "";
  const borderBottom = EDGE_STYLES.has(x.borderBottom) ? x.borderBottom : "";
  const borderLeft = EDGE_STYLES.has(x.borderLeft) ? x.borderLeft : "";
  return {
    fontFamily: FONTS.has(x.fontFamily) ? x.fontFamily : "Arial",
    fontSize: SIZES.has(x.fontSize) ? x.fontSize : "12px",
    bold: x.bold === true,
    italic: x.italic === true,
    color: COLOR.test(x.color || "") ? x.color : "#1c2d25",
    background: COLOR.test(x.background || "") ? x.background : "#ffffff",
    align: ALIGNS.has(x.align) ? x.align : "left",
    vertical: VERT.has(x.vertical) ? x.vertical : "middle",
    numberFormat: NUMS.has(x.numberFormat) ? x.numberFormat : "general",
    decimals: normalizeDecimals(x.decimals),
    wrap: x.wrap === true,
    border: BORDERS.has(x.border) ? x.border : "none",
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
  };
}

export function cellFormatStyle(x = {}) {
  const raw = x && typeof x === "object" ? x : {};
  const f = normalizeCellFormat(raw);
  const s = {
    fontFamily: f.fontFamily,
    fontSize: f.fontSize,
    fontWeight: f.bold ? "700" : "400",
    fontStyle: f.italic ? "italic" : "normal",
    textAlign: f.align,
    verticalAlign: f.vertical,
  };
  if (COLOR.test(raw.color || "")) s.color = f.color;
  if (COLOR.test(raw.background || "")) s.backgroundColor = f.background;
  if (f.wrap) {
    s.whiteSpace = "normal";
    s.wordBreak = "break-word";
    s.lineHeight = "1.3";
  }

  const hasPerEdge = !!(f.borderTop || f.borderRight || f.borderBottom || f.borderLeft);
  if (hasPerEdge) {
    if (f.borderTop) s.borderTop = edgeCss(f.borderTop);
    if (f.borderRight) s.borderRight = edgeCss(f.borderRight);
    if (f.borderBottom) s.borderBottom = edgeCss(f.borderBottom);
    if (f.borderLeft) s.borderLeft = edgeCss(f.borderLeft);
  } else {
    if (f.border === "thin") s.border = "1px solid #52685c";
    if (f.border === "medium") s.border = "2px solid #2b4236";
    if (f.border === "bottom") s.borderBottom = "2px solid #2b4236";
    if (f.border === "outer") s.outline = "2px solid #2b4236";
  }
  return s;
}

function colLetters(n) {
  let s = "";
  while (n) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Apply range-aware border presets across a rectangular selection.
 * Correctly draws outer borders ONLY on outer edges of the selection,
 * inner borders ONLY on interior dividers, and double-bottom on the bottom row.
 */
export function applyBorderToRange(formats = {}, bounds, preset = "all") {
  const next = Object.assign(Object.create(null), formats);
  const { startRow, endRow, startCol, endCol } = bounds;
  const p = preset === "thin" ? "all" : preset === "medium" ? "outer-medium" : preset;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const a = colLetters(c) + r;
      const cur = normalizeCellFormat(next[a] || {});
      cur.border = "none";
      if (p === "none") {
        cur.borderTop = "";
        cur.borderRight = "";
        cur.borderBottom = "";
        cur.borderLeft = "";
      } else if (p === "all") {
        cur.borderTop = "thin";
        cur.borderRight = "thin";
        cur.borderBottom = "thin";
        cur.borderLeft = "thin";
      } else if (p === "outer" || p === "outer-medium") {
        const edge = p === "outer-medium" ? "medium" : "thin";
        if (r === startRow) cur.borderTop = edge;
        if (r === endRow) cur.borderBottom = edge;
        if (c === startCol) cur.borderLeft = edge;
        if (c === endCol) cur.borderRight = edge;
      } else if (p === "inner") {
        if (r > startRow) cur.borderTop = "thin";
        if (r < endRow) cur.borderBottom = "thin";
        if (c > startCol) cur.borderLeft = "thin";
        if (c < endCol) cur.borderRight = "thin";
      } else if (p === "top") {
        if (r === startRow) cur.borderTop = "thin";
      } else if (p === "bottom") {
        if (r === endRow) cur.borderBottom = "medium";
      } else if (p === "double-bottom") {
        if (r === endRow) cur.borderBottom = "double";
      } else if (p === "left") {
        if (c === startCol) cur.borderLeft = "thin";
      } else if (p === "right") {
        if (c === endCol) cur.borderRight = "thin";
      }
      next[a] = cur;
    }
  }
  return next;
}

function formatDateDisplay(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1 && value < 2958466) {
    // Spreadsheet serial date (1899-12-30 epoch)
    const ms = Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000;
    const d = new Date(ms);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getUTCFullYear()}`;
  }
  const s = String(value ?? "").trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
  return s;
}

export function formatCellDisplayValue(v, formatObj = {}) {
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  const f = normalizeCellFormat(formatObj || {});
  if (f.numberFormat === "date") {
    if (v === "" || v === null || v === undefined) return "";
    return formatDateDisplay(v);
  }
  if (typeof v !== "number") return String(v ?? "");
  const dec = f.decimals;
  if (f.numberFormat === "integer") {
    const d = dec ?? 0;
    return new Intl.NumberFormat("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  if (f.numberFormat === "thousands") {
    const d = dec ?? 0;
    return new Intl.NumberFormat("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  if (f.numberFormat === "number2") {
    const d = dec ?? 2;
    return new Intl.NumberFormat("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  if (f.numberFormat === "percent") {
    if (dec !== null) {
      return new Intl.NumberFormat("vi-VN", { style: "percent", minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
    }
    return new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 2 }).format(v);
  }
  if (f.numberFormat === "currency") {
    const d = dec ?? 0;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  if (f.numberFormat === "usd") {
    const d = dec ?? 2;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  if (dec !== null) {
    return new Intl.NumberFormat("vi-VN", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  }
  return String(Number(v.toPrecision(12)));
}

export function getRangeBounds(a, b) {
  const p = String(a || "").match(/^([A-Z]+)([1-9][0-9]*)$/i);
  const q = String(b || "").match(/^([A-Z]+)([1-9][0-9]*)$/i);
  if (!p || !q) throw new Error("Địa chỉ vùng không hợp lệ");
  const col = s => [...s.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const r1 = +p[2], r2 = +q[2], c1 = col(p[1]), c2 = col(q[1]);
  const startRow = Math.min(r1, r2), endRow = Math.max(r1, r2), startCol = Math.min(c1, c2), endCol = Math.max(c1, c2);
  return { start: colLetters(startCol) + startRow, end: colLetters(endCol) + endRow, startRow, endRow, startCol, endCol };
}

export function expandRange(a, b, limit = 10000) {
  const x = getRangeBounds(a, b);
  const n = (x.endRow - x.startRow + 1) * (x.endCol - x.startCol + 1);
  if (!Number.isSafeInteger(n) || n > limit) throw new Error("Vùng chọn vượt giới hạn thao tác " + limit + " ô");
  const out = [];
  for (let r = x.startRow; r <= x.endRow; r++) {
    for (let c = x.startCol; c <= x.endCol; c++) out.push(colLetters(c) + r);
  }
  return out;
}

export function encodeTSV(m) {
  return m.map(r => r.map(v => String(v ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ")).join("\t")).join("\n");
}

export function parseTSV(t) {
  return String(t ?? "").replace(/\r/g, "").split("\n").filter((s, i, a) => s !== "" || i < a.length - 1).map(s => s.split("\t"));
}
