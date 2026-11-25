/**
 * HAI ĐẤT CALC — Pure Client-Side XLSX (ISO/IEC 29500 OOXML), CSV (RFC 4180), & Print Table Engine
 * Zero external dependencies, zero CDN, 100% compatible with both Browser & Node.js 22.
 */

import { normalizeCellFormat, cellFormatStyle } from "./cell-format.js";
import { normalizeMerges, findMergeAt } from "./sheet-ops.js";

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8");

// ---------- Coordinate & XML Helpers ----------
function colToNum(letters) {
  let n = 0;
  for (const ch of String(letters).toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
  return n;
}

function numToCol(n) {
  let s = "";
  while (n > 0) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function parseAddr(a) {
  const m = /^([A-Z]{1,3})([1-9][0-9]*)$/i.exec(String(a || "").trim());
  if (!m) return null;
  return { r: Number(m[2]), c: colToNum(m[1]) };
}

function makeAddr(r, c) {
  return numToCol(c) + r;
}

export function escapeXml(str) {
  return String(str ?? "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function unescapeXml(str) {
  return String(str ?? "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decNum) => String.fromCodePoint(Number(decNum)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// ---------- RFC 4180 CSV Import & Export ----------
function detectCsvDelimiter(text) {
  const sample = text.split(/\r?\n/).filter(l => l.trim() !== "").slice(0, 8);
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestScore = -1;
  for (const delim of candidates) {
    let counts = [];
    for (const line of sample) {
      let inQ = false, c = 0;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (!inQ && ch === delim) c++;
      }
      counts.push(c);
    }
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) continue;
    const consistent = counts.every(c => c === counts[0]) ? 1.5 : 1;
    const score = total * consistent;
    if (score > bestScore) { bestScore = score; best = delim; }
  }
  return best;
}

export function parseCsv(rawText, options = {}) {
  const text = String(rawText ?? "").replace(/^\uFEFF/, "");
  const delimiter = options.delimiter || detectCsvDelimiter(text);
  const maxCells = Number.isInteger(options.maxCells) ? options.maxCells : 100000;

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length > 0 && rows[rows.length - 1].every(v => v === "")) rows.pop();

  const cells = Object.create(null);
  let maxCols = 0, cellCount = 0;
  for (let r = 0; r < rows.length; r++) {
    const cols = rows[r];
    if (cols.length > maxCols) maxCols = cols.length;
    for (let c = 0; c < cols.length; c++) {
      const val = cols[c];
      if (val === "") continue;
      if (++cellCount > maxCells) throw new RangeError("Tệp CSV vượt giới hạn an toàn " + maxCells.toLocaleString("vi-VN") + " ô.");
      cells[makeAddr(r + 1, c + 1)] = val;
    }
  }
  return { cells, rows: rows.length, cols: maxCols, delimiter };
}

export function serializeCsv(cells = {}, displayFn = null, options = {}) {
  const delimiter = options.delimiter || ",";
  const used = Object.keys(cells).map(parseAddr).filter(Boolean);
  const maxR = Math.max(1, ...used.map(x => x.r));
  const maxC = Math.max(1, ...used.map(x => x.c));
  const lines = [];
  for (let r = 1; r <= maxR; r++) {
    const row = [];
    for (let c = 1; c <= maxC; c++) {
      const a = makeAddr(r, c);
      const v = displayFn ? String(displayFn(a) ?? "") : String(cells[a] ?? "");
      row.push('"' + v.replace(/"/g, '""') + '"');
    }
    lines.push(row.join(delimiter));
  }
  return "\ufeff" + lines.join("\r\n");
}

// ---------- Pure-JS ZIP Store Writer & Deflate-Capable Reader ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(v) { return [v & 0xff, (v >>> 8) & 0xff]; }
function u32(v) { return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]; }

export function buildZipStore(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const { name, data } of files) {
    const nameBytes = enc.encode(name);
    const dataBytes = typeof data === "string" ? enc.encode(data) : new Uint8Array(data);
    const crc = crc32(dataBytes);
    const flags = 0x0800; // UTF-8 filename flag

    const local = new Uint8Array(30 + nameBytes.length + dataBytes.length);
    local.set([
      ...u32(0x04034b50), ...u16(20), ...u16(flags), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length),
      ...u16(nameBytes.length), ...u16(0),
    ], 0);
    local.set(nameBytes, 30);
    local.set(dataBytes, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    central.set([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(flags), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length),
      ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(offset),
    ], 0);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array(22);
  eocd.set([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ], 0);

  const out = new Uint8Array(offset + centralSize + eocd.length);
  let pos = 0;
  for (const p of localParts) { out.set(p, pos); pos += p.length; }
  for (const p of centralParts) { out.set(p, pos); pos += p.length; }
  out.set(eocd, pos);
  return out;
}

async function inflateRawBytes(bytes) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Trình duyệt chưa hỗ trợ giải nén DEFLATE (DecompressionStream).");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipEntries(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Locate EOCD signature 0x06054b50 from end
  const minPos = Math.max(0, bytes.length - 65557);
  let eocdPos = -1;
  for (let i = bytes.length - 22; i >= minPos; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocdPos = i; break; }
  }
  if (eocdPos === -1) throw new Error("Tệp không phải định dạng ZIP / XLSX hợp lệ.");

  const entryCount = view.getUint16(eocdPos + 10, true);
  const cdOffset = view.getUint32(eocdPos + 16, true);
  if (entryCount > 250) throw new RangeError("Tệp XLSX chứa quá nhiều thành phần (vượt giới hạn an toàn 250).");

  const entries = new Map();
  let ptr = cdOffset;
  let totalUncompressed = 0;

  for (let i = 0; i < entryCount; i++) {
    if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) {
      throw new Error("Cấu trúc thư mục trung tâm ZIP không hợp lệ.");
    }
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const uncompSize = view.getUint32(ptr + 24, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOff = view.getUint32(ptr + 42, true);

    const rawName = dec.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen)).replace(/\\/g, "/").replace(/^\/+/, "");
    ptr += 46 + nameLen + extraLen + commentLen;

    if (rawName.includes("..")) continue;
    totalUncompressed += uncompSize;
    if (totalUncompressed > 64 * 1024 * 1024) throw new RangeError("Dung lượng giải nén tệp XLSX vượt giới hạn an toàn 64 MB.");

    if (localOff + 30 > bytes.length || view.getUint32(localOff, true) !== 0x04034b50) continue;
    const lNameLen = view.getUint16(localOff + 26, true);
    const lExtraLen = view.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const slice = bytes.subarray(dataStart, dataStart + compSize);

    let payload;
    if (method === 0) payload = slice;
    else if (method === 8) payload = await inflateRawBytes(slice);
    else continue;

    entries.set(rawName, payload);
  }
  return entries;
}

// ---------- XLSX Exporter (Multi-Sheet OOXML with Formulas, Formats, Borders, Merges, Freeze) ----------
function sanitizeSheetName(name, fallback, usedSet) {
  let clean = String(name ?? "").replace(/[:\\/?*\[\]]/g, " ").trim().slice(0, 31) || fallback;
  let candidate = clean, n = 2;
  while (usedSet.has(candidate.toLocaleLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = clean.slice(0, 31 - suffix.length) + suffix;
  }
  usedSet.add(candidate.toLocaleLowerCase());
  return candidate;
}

function toArgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));
  return m ? "FF" + m[1].toUpperCase() : null;
}

function createStyleCollector() {
  const numFmts = []; // custom ids starting at 164
  const numFmtMap = new Map();
  const fonts = ['<font><sz val="11"/><name val="Arial"/><color rgb="FF1C2D25"/></font>'];
  const fontMap = new Map([["default", 0]]);
  // Mandatory OOXML fills: index 0 = none, index 1 = gray125
  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ];
  const fillMap = new Map([["default", 0]]);
  const borders = ["<border><left/><right/><top/><bottom/><diagonal/></border>"];
  const borderMap = new Map([["default", 0]]);
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  const xfMap = new Map([["default", 0]]);

  function getNumFmtId(f) {
    const decs = f.decimals;
    const decPart = d => (d > 0 ? "." + "0".repeat(d) : "");
    let code = null;
    if (f.numberFormat === "general" && decs === null) return 0;
    if (f.numberFormat === "general" && decs !== null) code = `#,##0${decPart(decs)}`;
    else if (f.numberFormat === "integer" || f.numberFormat === "thousands") {
      if (decs === null || decs === 0) return 3; // built-in #,##0
      code = `#,##0${decPart(decs)}`;
    } else if (f.numberFormat === "number2") {
      if (decs === null || decs === 2) return 4; // built-in #,##0.00
      code = `#,##0${decPart(decs)}`;
    } else if (f.numberFormat === "percent") {
      if (decs === 0) return 9; // 0%
      if (decs === null || decs === 2) return 10; // 0.00%
      code = `0${decPart(decs)}%`;
    } else if (f.numberFormat === "currency") {
      code = `#,##0${decPart(decs ?? 0)}" ₫"`;
    } else if (f.numberFormat === "usd") {
      code = `"$"#,##0${decPart(decs ?? 2)}`;
    } else if (f.numberFormat === "date") {
      code = "dd/mm/yyyy";
    }
    if (!code) return 0;
    if (numFmtMap.has(code)) return numFmtMap.get(code);
    const id = 164 + numFmts.length;
    numFmtMap.set(code, id);
    numFmts.push(`<numFmt numFmtId="${id}" formatCode="${escapeXml(code)}"/>`);
    return id;
  }

  function styleIndex(rawFmt) {
    if (!rawFmt || typeof rawFmt !== "object") return 0;
    const f = normalizeCellFormat(rawFmt);
    const numFmtId = getNumFmtId(f);

    const pt = Math.max(8, Math.round(parseFloat(f.fontSize) * 0.85) || 11);
    const rgb = toArgb(rawFmt.color) || "FF1C2D25";
    const fontKey = `${f.fontFamily}|${pt}|${f.bold}|${f.italic}|${rgb}`;
    let fontId = fontMap.get(fontKey);
    if (fontId === undefined) {
      fontId = fonts.length;
      fontMap.set(fontKey, fontId);
      fonts.push(`<font>${f.bold ? "<b/>" : ""}${f.italic ? "<i/>" : ""}<sz val="${pt}"/><color rgb="${rgb}"/><name val="${escapeXml(f.fontFamily)}"/></font>`);
    }

    const bgRgb = toArgb(rawFmt.background);
    let fillId = 0;
    if (bgRgb && bgRgb !== "FFFFFFFF") {
      fillId = fillMap.get(bgRgb);
      if (fillId === undefined) {
        fillId = fills.length;
        fillMap.set(bgRgb, fillId);
        fills.push(`<fill><patternFill patternType="solid"><fgColor rgb="${bgRgb}"/><bgColor indexed="64"/></patternFill></fill>`);
      }
    }

    const bTop = f.borderTop || (f.border === "thin" ? "thin" : f.border === "medium" ? "medium" : "");
    const bRight = f.borderRight || (f.border === "thin" ? "thin" : f.border === "medium" ? "medium" : "");
    const bBottom = f.borderBottom || (f.border === "thin" ? "thin" : (f.border === "medium" || f.border === "bottom") ? "medium" : "");
    const bLeft = f.borderLeft || (f.border === "thin" ? "thin" : f.border === "medium" ? "medium" : "");
    const bKey = `${bTop}|${bRight}|${bBottom}|${bLeft}`;
    let borderId = 0;
    if (bTop || bRight || bBottom || bLeft) {
      borderId = borderMap.get(bKey);
      if (borderId === undefined) {
        borderId = borders.length;
        borderMap.set(bKey, borderId);
        const side = (tag, st) => st ? `<${tag} style="${st}"><color rgb="FF40564A"/></${tag}>` : `<${tag}/>`;
        borders.push(`<border>${side("left", bLeft)}${side("right", bRight)}${side("top", bTop)}${side("bottom", bBottom)}<diagonal/></border>`);
      }
    }

    const hAlign = f.align;
    const vAlign = f.vertical === "middle" ? "center" : f.vertical;
    const xfKey = `${numFmtId}|${fontId}|${fillId}|${borderId}|${hAlign}|${vAlign}|${f.wrap}`;
    let xfId = xfMap.get(xfKey);
    if (xfId === undefined) {
      xfId = xfs.length;
      xfMap.set(xfKey, xfId);
      const applyAlign = hAlign !== "left" || vAlign !== "center" || f.wrap;
      const alignXml = applyAlign
        ? `<alignment horizontal="${hAlign}" vertical="${vAlign}"${f.wrap ? ' wrapText="1"' : ""}/>`
        : "";
      xfs.push(`<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"${numFmtId ? ' applyNumberFormat="1"' : ""}${fontId ? ' applyFont="1"' : ""}${fillId ? ' applyFill="1"' : ""}${borderId ? ' applyBorder="1"' : ""}${applyAlign ? ' applyAlignment="1"' : ""}>${alignXml}</xf>`);
    }
    return xfId;
  }

  function toXml() {
    const numFmtsXml = numFmts.length ? `<numFmts count="${numFmts.length}">${numFmts.join("")}</numFmts>` : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${numFmtsXml}
<fonts count="${fonts.length}">${fonts.join("")}</fonts>
<fills count="${fills.length}">${fills.join("")}</fills>
<borders count="${borders.length}">${borders.join("")}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs>
</styleSheet>`;
  }

  return { styleIndex, toXml };
}

function buildWorksheetXml(sheet, sheetIndex, styles, evaluateCellFn) {
  const cells = sheet.cells || {};
  const formats = sheet.formats || {};
  const merges = normalizeMerges(sheet.merges || []);
  const rowMap = new Map();

  const keys = new Set([...Object.keys(cells), ...Object.keys(formats)]);
  for (const key of keys) {
    const p = parseAddr(key);
    if (!p) continue;
    const hasVal = Object.hasOwn(cells, key) && String(cells[key] ?? "") !== "";
    const hasFmt = Object.hasOwn(formats, key) && formats[key] && typeof formats[key] === "object";
    if (!hasVal && !hasFmt) continue;
    if (!rowMap.has(p.r)) rowMap.set(p.r, []);
    rowMap.get(p.r).push({ c: p.c, addr: key.toUpperCase(), raw: hasVal ? String(cells[key]) : "", fmt: hasFmt ? formats[key] : null });
  }

  const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);
  const rowHeights = sheet.geometry?.rowHeights || {};
  const colWidths = sheet.geometry?.columnWidths || {};

  // Freeze pane XML
  const fRows = Math.max(0, Number(sheet.freeze?.rows || 0));
  const fCols = Math.max(0, Number(sheet.freeze?.columns || 0));
  const paneXml = (fRows > 0 || fCols > 0)
    ? `<pane${fCols ? ` xSplit="${fCols}"` : ""}${fRows ? ` ySplit="${fRows}"` : ""} topLeftCell="${makeAddr(fRows + 1, fCols + 1)}" activePane="${fRows && fCols ? "bottomRight" : fRows ? "bottomLeft" : "topRight"}" state="frozen"/>`
    : "";

  // Columns width XML
  const colEntries = Object.entries(colWidths)
    .map(([k, px]) => [Number(k), Number(px)])
    .filter(([c, px]) => Number.isSafeInteger(c) && c >= 1 && Number.isFinite(px))
    .sort((a, b) => a[0] - b[0]);
  const colsXml = colEntries.length
    ? `<cols>${colEntries.map(([c, px]) => `<col min="${c}" max="${c}" width="${Math.max(4, +(px / 7.5).toFixed(2))}" customWidth="1"/>`).join("")}</cols>`
    : "";

  // Sheet data rows XML
  const rowsXml = sortedRows.map(r => {
    const items = rowMap.get(r).sort((a, b) => a.c - b.c);
    const customH = Number(rowHeights[r]);
    const htAttr = Number.isFinite(customH) && customH > 0 ? ` ht="${+(customH * 0.75).toFixed(2)}" customHeight="1"` : "";
    const cellsXml = items.map(item => {
      const sIdx = styles.styleIndex(item.fmt);
      const sAttr = sIdx > 0 ? ` s="${sIdx}"` : "";
      const raw = item.raw;
      if (raw === "") return `<c r="${item.addr}"${sAttr}/>`;

      if (raw.startsWith("=")) {
        const formulaBody = escapeXml(raw.slice(1));
        let cachedXml = "";
        let typeAttr = "";
        if (typeof evaluateCellFn === "function") {
          try {
            const val = evaluateCellFn(sheet.id, item.addr);
            if (typeof val === "number" && Number.isFinite(val)) cachedXml = `<v>${val}</v>`;
            else if (typeof val === "boolean") { typeAttr = ' t="b"'; cachedXml = `<v>${val ? 1 : 0}</v>`; }
            else if (typeof val === "string" && val !== "") { typeAttr = ' t="str"'; cachedXml = `<v>${escapeXml(val)}</v>`; }
          } catch {}
        }
        return `<c r="${item.addr}"${sAttr}${typeAttr}><f>${formulaBody}</f>${cachedXml}</c>`;
      }

      if (/^(TRUE|FALSE)$/i.test(raw.trim())) {
        return `<c r="${item.addr}"${sAttr} t="b"><v>${raw.trim().toUpperCase() === "TRUE" ? 1 : 0}</v></c>`;
      }
      if (raw.trim() !== "" && Number.isFinite(Number(raw)) && !/^0\d+/.test(raw.trim())) {
        return `<c r="${item.addr}"${sAttr}><v>${Number(raw)}</v></c>`;
      }
      return `<c r="${item.addr}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(raw)}</t></is></c>`;
    }).join("");
    return `<row r="${r}"${htAttr}>${cellsXml}</row>`;
  }).join("");

  const mergesXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${makeAddr(m.startRow, m.startCol)}:${makeAddr(m.endRow, m.endCol)}"/>`).join("")}</mergeCells>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView${sheetIndex === 0 ? ' tabSelected="1"' : ""} workbookViewId="0">${paneXml}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="24"/>
${colsXml}
<sheetData>${rowsXml}</sheetData>
${mergesXml}
</worksheet>`;
}

export function exportWorkbookToXlsx(sheets = [], evaluateCellFn = null) {
  const list = Array.isArray(sheets) && sheets.length ? sheets : [{ id: "sheet-1", name: "Trang tính 1", cells: {}, formats: {}, merges: [] }];
  const styles = createStyleCollector();
  const usedNames = new Set();
  const safeNames = list.map((s, i) => sanitizeSheetName(s.name, `Trang tính ${i + 1}`, usedNames));

  const files = [];
  const overrides = [
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
  ];
  const wbSheetsXml = [];
  const wbRelsXml = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
  ];

  list.forEach((sheet, idx) => {
    const n = idx + 1;
    const xml = buildWorksheetXml(sheet, idx, styles, evaluateCellFn);
    files.push({ name: `xl/worksheets/sheet${n}.xml`, data: xml });
    overrides.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    wbSheetsXml.push(`<sheet name="${escapeXml(safeNames[idx])}" sheetId="${n}" r:id="rId${n}"/>`);
    wbRelsXml.push(`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`);
  });

  files.unshift(
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${overrides.join("")}</Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${wbSheetsXml.join("")}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wbRelsXml.join("")}</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      data: styles.toXml(),
    }
  );

  return buildZipStore(files);
}

// ---------- XLSX Importer (Zero-DOM XML parsing — works in Browser & Node 22) ----------
function getAttr(attrStr, name) {
  const rx = new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`, "i");
  const m = rx.exec(attrStr || "");
  return m ? unescapeXml(m[1]) : "";
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const out = [];
  const siRx = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let m;
  while ((m = siRx.exec(xml)) !== null) {
    const inner = m[1];
    let text = "";
    const tRx = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
    let tm;
    while ((tm = tRx.exec(inner)) !== null) text += unescapeXml(tm[1]);
    out.push(text);
  }
  return out;
}

function parseStylesXml(xml) {
  if (!xml) return [];
  const customNumFmts = new Map();
  for (const m of xml.matchAll(/<numFmt\b([^>]*)\/>/gi)) {
    const id = Number(getAttr(m[1], "numFmtId"));
    const code = getAttr(m[1], "formatCode");
    if (Number.isFinite(id)) customNumFmts.set(id, code);
  }

  const fonts = [];
  const fontsBlock = /<fonts\b[^>]*>([\s\S]*?)<\/fonts>/i.exec(xml)?.[1] || "";
  for (const m of fontsBlock.matchAll(/<font\b[^>]*>([\s\S]*?)<\/font>/gi)) {
    const b = m[1];
    const bold = /<b\b(?:\s+val="(?!0|false)[^"]*"|\s*\/)>/i.test(b);
    const italic = /<i\b(?:\s+val="(?!0|false)[^"]*"|\s*\/)>/i.test(b);
    const rgb = /<color\b[^>]*rgb="([0-9A-F]{6,8})"/i.exec(b)?.[1];
    const color = rgb ? "#" + rgb.slice(-6).toLowerCase() : undefined;
    fonts.push({ bold, italic, color });
  }

  const fills = [];
  const fillsBlock = /<fills\b[^>]*>([\s\S]*?)<\/fills>/i.exec(xml)?.[1] || "";
  for (const m of fillsBlock.matchAll(/<fill\b[^>]*>([\s\S]*?)<\/fill>/gi)) {
    const b = m[1];
    const isSolid = /patternType="solid"/i.test(b);
    const rgb = isSolid ? /<fgColor\b[^>]*rgb="([0-9A-F]{6,8})"/i.exec(b)?.[1] : null;
    fills.push(rgb ? "#" + rgb.slice(-6).toLowerCase() : undefined);
  }

  const borders = [];
  const bordersBlock = /<borders\b[^>]*>([\s\S]*?)<\/borders>/i.exec(xml)?.[1] || "";
  const parseSide = (b, tag) => {
    const st = new RegExp(`<${tag}\\b[^>]*style="([^"]+)"`, "i").exec(b)?.[1]?.toLowerCase() || "";
    if (!st || st === "none") return "";
    if (st === "double") return "double";
    if (st === "medium" || st === "thick") return "medium";
    return "thin";
  };
  for (const m of bordersBlock.matchAll(/<border\b[^>]*>([\s\S]*?)<\/border>/gi)) {
    const b = m[1];
    borders.push({
      borderLeft: parseSide(b, "left"),
      borderRight: parseSide(b, "right"),
      borderTop: parseSide(b, "top"),
      borderBottom: parseSide(b, "bottom"),
    });
  }

  const xfs = [];
  const xfsBlock = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/i.exec(xml)?.[1] || "";
  const xfRx = /<xf\b([^>]*?)(?:\/>|>([\s\S]*?)<\/xf>)/gi;
  let xm;
  while ((xm = xfRx.exec(xfsBlock)) !== null) {
    const attrs = xm[1], inner = xm[2] || "";
    const numFmtId = Number(getAttr(attrs, "numFmtId") || 0);
    const fontId = Number(getAttr(attrs, "fontId") || 0);
    const fillId = Number(getAttr(attrs, "fillId") || 0);
    const borderId = Number(getAttr(attrs, "borderId") || 0);
    const fmt = {};

    const fn = fonts[fontId];
    if (fn?.bold) fmt.bold = true;
    if (fn?.italic) fmt.italic = true;
    if (fn?.color && fn.color !== "#000000") fmt.color = fn.color;
    if (fills[fillId]) fmt.background = fills[fillId];
    const bd = borders[borderId];
    if (bd && (bd.borderTop || bd.borderRight || bd.borderBottom || bd.borderLeft)) Object.assign(fmt, bd);

    const alignMatch = /<alignment\b([^>]*)\/?>/i.exec(inner);
    if (alignMatch) {
      const h = getAttr(alignMatch[1], "horizontal");
      const v = getAttr(alignMatch[1], "vertical");
      if (["left", "center", "right"].includes(h)) fmt.align = h;
      if (v === "top" || v === "bottom") fmt.vertical = v;
      else if (v === "center") fmt.vertical = "middle";
      if (getAttr(alignMatch[1], "wrapText") === "1") fmt.wrap = true;
    }

    const code = customNumFmts.get(numFmtId) || "";
    if (numFmtId === 3) fmt.numberFormat = "thousands";
    else if (numFmtId === 4) fmt.numberFormat = "number2";
    else if (numFmtId === 9 || numFmtId === 10 || /%/.test(code)) fmt.numberFormat = "percent";
    else if ((numFmtId >= 14 && numFmtId <= 22) || /[dy]{2,4}[\/\-]m/i.test(code)) fmt.numberFormat = "date";
    else if (/₫|VND/i.test(code)) fmt.numberFormat = "currency";
    else if (/\$|USD/i.test(code)) fmt.numberFormat = "usd";
    else if (/#,##0\.00/.test(code)) fmt.numberFormat = "number2";
    else if (/#,##0/.test(code)) fmt.numberFormat = "thousands";

    xfs.push(Object.keys(fmt).length ? fmt : null);
  }
  return xfs;
}

function parseWorksheetXml(xml, sharedStrings, xfs, maxCells = 100000) {
  const cells = Object.create(null);
  const formats = Object.create(null);
  const merges = [];
  const columnWidths = {};
  const rowHeights = {};
  let freeze = { rows: 0, columns: 0 };

  // Freeze pane
  const paneM = /<pane\b([^>]*)\/?>/i.exec(xml);
  if (paneM && /state="frozen/i.test(paneM[1])) {
    freeze.rows = Math.max(0, Math.min(20, Number(getAttr(paneM[1], "ySplit") || 0)));
    freeze.columns = Math.max(0, Math.min(10, Number(getAttr(paneM[1], "xSplit") || 0)));
  }

  // Column widths
  for (const m of xml.matchAll(/<col\b([^>]*)\/?>/gi)) {
    const min = Number(getAttr(m[1], "min")), max = Number(getAttr(m[1], "max")), w = Number(getAttr(m[1], "width"));
    if (Number.isSafeInteger(min) && Number.isSafeInteger(max) && Number.isFinite(w) && max - min < 500) {
      const px = Math.max(40, Math.min(500, Math.round(w * 7.5)));
      for (let c = min; c <= max; c++) columnWidths[c] = px;
    }
  }

  // Row heights
  for (const m of xml.matchAll(/<row\b([^>]*)>/gi)) {
    const r = Number(getAttr(m[1], "r")), ht = Number(getAttr(m[1], "ht"));
    if (Number.isSafeInteger(r) && Number.isFinite(ht) && ht > 0) {
      rowHeights[r] = Math.max(20, Math.min(240, Math.round(ht / 0.75)));
    }
  }

  // Merged cells
  for (const m of xml.matchAll(/<mergeCell\b[^>]*ref="([A-Z]+[1-9][0-9]*):([A-Z]+[1-9][0-9]*)"/gi)) {
    const a = parseAddr(m[1]), b = parseAddr(m[2]);
    if (a && b) merges.push({ startRow: Math.min(a.r, b.r), endRow: Math.max(a.r, b.r), startCol: Math.min(a.c, b.c), endCol: Math.max(a.c, b.c) });
  }

  // Cells
  const cellRx = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi;
  let cm, count = 0;
  while ((cm = cellRx.exec(xml)) !== null) {
    const attrs = cm[1], body = cm[2] || "";
    const addr = getAttr(attrs, "r").toUpperCase();
    if (!parseAddr(addr)) continue;

    const sIdx = Number(getAttr(attrs, "s") || 0);
    if (sIdx > 0 && xfs[sIdx]) formats[addr] = normalizeCellFormat(xfs[sIdx]);

    const t = getAttr(attrs, "t");
    const fMatch = /<f\b[^>]*>([\s\S]*?)<\/f>/i.exec(body);
    const vMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/i.exec(body);

    let val = "";
    if (fMatch && fMatch[1].trim() !== "") {
      val = "=" + unescapeXml(fMatch[1].trim());
    } else if (t === "s" && vMatch) {
      val = sharedStrings[Number(vMatch[1])] ?? "";
    } else if (t === "inlineStr") {
      let txt = "";
      for (const tm of body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)) txt += unescapeXml(tm[1]);
      val = txt;
    } else if (t === "b" && vMatch) {
      val = vMatch[1].trim() === "1" ? "TRUE" : "FALSE";
    } else if (vMatch) {
      val = unescapeXml(vMatch[1]);
    }

    if (val !== "") {
      if (++count > maxCells) throw new RangeError("Trang tính vượt giới hạn an toàn " + maxCells.toLocaleString("vi-VN") + " ô.");
      cells[addr] = val;
    }
  }

  return {
    cells,
    formats,
    merges: normalizeMerges(merges),
    freeze,
    geometry: { rowHeights, columnWidths },
  };
}

export async function importXlsxToWorkbook(buffer) {
  const entries = await readZipEntries(buffer);
  const readText = path => {
    const bytes = entries.get(path) || entries.get(path.replace(/^xl\//, ""));
    return bytes ? dec.decode(bytes) : "";
  };

  const wbXml = readText("xl/workbook.xml");
  if (!wbXml) throw new Error("Không tìm thấy xl/workbook.xml trong tệp XLSX.");
  const relsXml = readText("xl/_rels/workbook.xml.rels");
  const relMap = new Map();
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/gi)) {
    const id = getAttr(m[1], "Id");
    const target = getAttr(m[1], "Target").replace(/^\/+/, "");
    if (id && target) relMap.set(id, target.startsWith("xl/") ? target : "xl/" + target.replace(/^xl\//, ""));
  }

  const sharedStrings = parseSharedStrings(readText("xl/sharedStrings.xml"));
  const xfs = parseStylesXml(readText("xl/styles.xml"));

  const sheets = [];
  let idx = 0;
  for (const m of wbXml.matchAll(/<sheet\b([^>]*)\/?>/gi)) {
    const name = getAttr(m[1], "name") || `Trang tính ${idx + 1}`;
    const rId = getAttr(m[1], "r:id") || getAttr(m[1], "id");
    const targetPath = relMap.get(rId) || `xl/worksheets/sheet${idx + 1}.xml`;
    const sheetXml = readText(targetPath);
    if (!sheetXml) continue;
    const parsed = parseWorksheetXml(sheetXml, sharedStrings, xfs);
    sheets.push({
      id: `sheet-${idx + 1}`,
      name,
      ...parsed,
    });
    idx++;
    if (idx >= 50) break;
  }

  if (!sheets.length) throw new Error("Không đọc được trang tính nào từ tệp XLSX.");
  return { sheets };
}

// ---------- Spreadsheet Print / Save PDF HTML Table Builder ----------
export function computeUsedBounds(cells = {}, formats = {}, merges = []) {
  let maxR = 1, maxC = 1;
  for (const key of Object.keys(cells)) {
    if (String(cells[key] ?? "") === "") continue;
    const p = parseAddr(key);
    if (p) { if (p.r > maxR) maxR = p.r; if (p.c > maxC) maxC = p.c; }
  }
  for (const m of merges) {
    if (m.endRow > maxR) maxR = m.endRow;
    if (m.endCol > maxC) maxC = m.endCol;
  }
  return { startRow: 1, endRow: maxR, startCol: 1, endCol: maxC, start: "A1", end: makeAddr(maxR, maxC) };
}

export function buildPrintTableHtml({
  sheetName = "Trang tính",
  cells = {},
  formats = {},
  merges = [],
  bounds = null,
  displayFn = null,
  repeatHeaderRow = true,
  showGridlines = true,
  showHeaders = false,
} = {}) {
  const normMerges = normalizeMerges(merges);
  const b = bounds || computeUsedBounds(cells, formats, normMerges);
  const rowCount = b.endRow - b.startRow + 1;
  const colCount = b.endCol - b.startCol + 1;
  if (rowCount * colCount > 25000) {
    throw new RangeError("Vùng in vượt quá 25.000 ô. Hãy chọn phạm vi nhỏ hơn trước khi in.");
  }

  const styleString = fmt => {
    const s = cellFormatStyle(fmt || {});
    const css = [];
    if (s.fontFamily) css.push(`font-family:${s.fontFamily}`);
    if (s.fontSize) css.push(`font-size:${s.fontSize}`);
    if (s.fontWeight && s.fontWeight !== "400") css.push(`font-weight:${s.fontWeight}`);
    if (s.fontStyle && s.fontStyle !== "normal") css.push(`font-style:${s.fontStyle}`);
    if (s.color) css.push(`color:${s.color}`);
    if (s.backgroundColor) css.push(`background:${s.backgroundColor}`);
    if (s.textAlign) css.push(`text-align:${s.textAlign}`);
    if (s.verticalAlign) css.push(`vertical-align:${s.verticalAlign}`);
    if (s.whiteSpace) css.push(`white-space:${s.whiteSpace}`);
    if (s.border) css.push(`border:${s.border}`);
    if (s.borderTop) css.push(`border-top:${s.borderTop}`);
    if (s.borderRight) css.push(`border-right:${s.borderRight}`);
    if (s.borderBottom) css.push(`border-bottom:${s.borderBottom}`);
    if (s.borderLeft) css.push(`border-left:${s.borderLeft}`);
    return css.join(";");
  };

  const renderRow = (r, isHead) => {
    const tag = isHead ? "th" : "td";
    let html = showHeaders ? `<th class="print-rh">${r}</th>` : "";
    for (let c = b.startCol; c <= b.endCol; c++) {
      const m = normMerges.length ? findMergeAt(normMerges, r, c) : null;
      let addr = makeAddr(r, c), cs = 1, rs = 1;
      if (m) {
        const sr = Math.max(m.startRow, b.startRow), sc = Math.max(m.startCol, b.startCol);
        if (r !== sr || c !== sc) continue;
        rs = Math.min(m.endRow, b.endRow) - sr + 1;
        cs = Math.min(m.endCol, b.endCol) - sc + 1;
        addr = makeAddr(m.startRow, m.startCol);
      }
      const val = displayFn ? String(displayFn(addr) ?? "") : String(cells[addr] ?? "");
      const st = styleString(formats[addr]);
      const span = (cs > 1 ? ` colspan="${cs}"` : "") + (rs > 1 ? ` rowspan="${rs}"` : "");
      html += `<${tag}${span}${st ? ` style="${escapeHtml(st)}"` : ""}>${escapeHtml(val)}</${tag}>`;
    }
    return `<tr>${html}</tr>`;
  };

  let theadRows = "";
  if (showHeaders) {
    let ch = `<th class="print-corner"></th>`;
    for (let c = b.startCol; c <= b.endCol; c++) ch += `<th class="print-ch">${numToCol(c)}</th>`;
    theadRows += `<tr>${ch}</tr>`;
  }

  // Only put first data row in <thead> when repeatHeaderRow is checked AND no merge spans past first row!
  const firstRowCanRepeat = repeatHeaderRow && rowCount > 1 && !normMerges.some(m => m.startRow <= b.startRow && m.endRow > b.startRow);
  if (firstRowCanRepeat) theadRows += renderRow(b.startRow, true);

  const bodyStart = firstRowCanRepeat ? b.startRow + 1 : b.startRow;
  let tbodyRows = "";
  for (let r = bodyStart; r <= b.endRow; r++) tbodyRows += renderRow(r, false);

  return `<div class="calc-print-header"><strong>${escapeHtml(sheetName)}</strong><span>${b.start}:${b.end} (${rowCount} hàng × ${colCount} cột)</span></div>
<table class="calc-print-table${showGridlines ? " with-grid" : ""}">${theadRows ? `<thead>${theadRows}</thead>` : ""}<tbody>${tbodyRows}</tbody></table>`;
}
