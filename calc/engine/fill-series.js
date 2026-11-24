import { getRangeBounds } from "./cell-format.js";

const colNum = s => { let n = 0; for (const c of s.toUpperCase()) n = n * 26 + c.charCodeAt(0) - 64; return n; };
const colName = n => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
const addr = (r, c) => colName(c) + r;

const CYCLES = [
  ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"],
  ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
  ["Quý 1", "Quý 2", "Quý 3", "Quý 4"],
  ["Q1", "Q2", "Q3", "Q4"],
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
];

function isStrictNumber(str) {
  const s = String(str ?? "").trim();
  return s !== "" && Number.isFinite(Number(s));
}

function parseDateToken(str) {
  const s = String(str ?? "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    const d = new Date(ms);
    if (d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]) {
      return { ms, style: "iso" };
    }
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const ms = Date.UTC(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(ms);
    if (d.getUTCFullYear() === +m[3] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[1]) {
      return { ms, style: "vn" };
    }
  }
  return null;
}

function formatDateToken(ms, style) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return style === "vn" ? `${day}/${m}/${y}` : `${y}-${m}-${day}`;
}

function matchCycle(str) {
  const norm = String(str ?? "").trim().toLocaleLowerCase("vi-VN");
  if (!norm) return null;
  for (const list of CYCLES) {
    const idx = list.findIndex(item => item.toLocaleLowerCase("vi-VN") === norm);
    if (idx !== -1) return { list, idx };
  }
  return null;
}

function parseTextNumber(str) {
  const m = /^(.*?)(\d+)(\s*)$/.exec(String(str ?? ""));
  if (!m || !m[1].trim()) return null;
  return { prefix: m[1], num: Number(m[2]), pad: m[2].length, suffix: m[3] };
}

/**
 * Build a smart series generator for a 1D slice of source values (length >= 1).
 * offset is signed step from the LAST source item when > 0, or from the FIRST source item when < 0.
 * Returns null if no smart series applies (falls back to cyclic copy).
 */
function detectSmartSeries(values) {
  if (!values.length || values.some(v => String(v ?? "").startsWith("="))) return null;

  // 1) Pure numeric series (requires >= 2 cells so single price/number copies rather than auto-incrementing)
  if (values.length >= 2 && values.every(isStrictNumber)) {
    const nums = values.map(v => Number(String(v).trim()));
    const step = nums[nums.length - 1] - nums[nums.length - 2];
    const headStep = nums[1] - nums[0];
    return offset => {
      const val = offset > 0 ? nums[nums.length - 1] + step * offset : nums[0] + headStep * offset;
      return String(Number(val.toPrecision(12)));
    };
  }

  // 2) Date series (works for 1 cell = +1 day, or >= 2 cells = exact day step)
  const dates = values.map(parseDateToken);
  if (dates.every(Boolean)) {
    const DAY = 86400000;
    const style = dates[dates.length - 1].style;
    const step = dates.length >= 2 ? Math.round((dates[dates.length - 1].ms - dates[dates.length - 2].ms) / DAY) : 1;
    const headStep = dates.length >= 2 ? Math.round((dates[1].ms - dates[0].ms) / DAY) : 1;
    return offset => {
      const base = offset > 0 ? dates[dates.length - 1].ms : dates[0].ms;
      const d = offset > 0 ? step : headStep;
      return formatDateToken(base + d * offset * DAY, style);
    };
  }

  // 3) Named cycles (Thứ 2..Chủ nhật, Tháng 1..12, Quý 1..4, Mon..Sun, Jan..Dec)
  const cyc = values.map(matchCycle);
  if (cyc.every(Boolean) && cyc.every(c => c.list === cyc[0].list)) {
    const list = cyc[0].list;
    const len = list.length;
    const step = cyc.length >= 2 ? ((cyc[cyc.length - 1].idx - cyc[cyc.length - 2].idx) % len + len) % len || 1 : 1;
    return offset => {
      const baseIdx = offset > 0 ? cyc[cyc.length - 1].idx : cyc[0].idx;
      const nextIdx = ((baseIdx + step * offset) % len + len) % len;
      return list[nextIdx];
    };
  }

  // 4) Text + trailing integer (e.g. SP01 -> SP02, Tuần 1 -> Tuần 2)
  const tnums = values.map(parseTextNumber);
  if (tnums.every(Boolean) && tnums.every(t => t.prefix === tnums[0].prefix && t.suffix === tnums[0].suffix)) {
    const { prefix, pad, suffix } = tnums[0];
    const step = tnums.length >= 2 ? tnums[tnums.length - 1].num - tnums[tnums.length - 2].num : 1;
    const headStep = tnums.length >= 2 ? tnums[1].num - tnums[0].num : 1;
    return offset => {
      const base = offset > 0 ? tnums[tnums.length - 1].num : tnums[0].num;
      const val = Math.max(0, base + (offset > 0 ? step : headStep) * offset);
      const formatted = pad > 1 ? String(val).padStart(pad, "0") : String(val);
      return prefix + formatted + suffix;
    };
  }

  return null;
}

export function translateFormulaReferences(formula, rowDelta = 0, colDelta = 0) {
  if (typeof formula !== "string" || !formula.startsWith("=")) return formula;
  let out = "", quoted = false;
  for (let i = 0; i < formula.length; ) {
    const ch = formula[i];
    if (ch === '"') {
      out += ch;
      if (quoted && formula[i + 1] === '"') { out += '"'; i += 2; continue; }
      quoted = !quoted; i++; continue;
    }
    if (quoted) { out += ch; i++; continue; }
    const m = /^(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)/i.exec(formula.slice(i));
    if (m) {
      const before = i ? formula[i - 1] : "", after = formula[i + m[0].length] || "";
      if (!/[A-Z0-9_.]/i.test(before) && !/[A-Z0-9_]/i.test(after) && !(/^\s*\(/.test(formula.slice(i + m[0].length)))) {
        const c = colNum(m[2]) + (m[1] ? 0 : colDelta), r = Number(m[4]) + (m[3] ? 0 : rowDelta);
        out += c < 1 || r < 1 ? "#REF!" : m[1] + colName(c) + m[3] + r;
        i += m[0].length;
        continue;
      }
    }
    out += ch; i++;
  }
  return out;
}

export function fillRange(cells = {}, formats = {}, sourceBounds, targetBounds, options = {}) {
  const s = getRangeBounds(sourceBounds.start, sourceBounds.end);
  const t = getRangeBounds(targetBounds.start, targetBounds.end);
  const limit = Number.isInteger(options.maxCells) ? options.maxCells : 100000;
  const count = (t.endRow - t.startRow + 1) * (t.endCol - t.startCol + 1);
  if (count > limit) throw new Error("Vùng điền vượt giới hạn " + limit + " ô.");
  if (t.startRow > s.startRow || t.startCol > s.startCol || t.endRow < s.endRow || t.endCol < s.endCol) {
    throw new Error("Vùng đích phải bao trùm toàn bộ vùng nguồn.");
  }

  const h = s.endRow - s.startRow + 1, w = s.endCol - s.startCol + 1;
  const vertical = (t.startRow !== s.startRow || t.endRow !== s.endRow) && t.startCol === s.startCol && t.endCol === s.endCol;
  const horizontal = (t.startCol !== s.startCol || t.endCol !== s.endCol) && t.startRow === s.startRow && t.endRow === s.endRow;

  // Detect smart series per column (vertical fill) or per row (horizontal fill)
  const colGenerators = new Map();
  if (vertical) {
    for (let c = s.startCol; c <= s.endCol; c++) {
      const vals = Array.from({ length: h }, (_, i) => (Object.hasOwn(cells, addr(s.startRow + i, c)) ? String(cells[addr(s.startRow + i, c)]) : ""));
      const gen = detectSmartSeries(vals);
      if (gen) colGenerators.set(c, gen);
    }
  }
  const rowGenerators = new Map();
  if (horizontal) {
    for (let r = s.startRow; r <= s.endRow; r++) {
      const vals = Array.from({ length: w }, (_, i) => (Object.hasOwn(cells, addr(r, s.startCol + i)) ? String(cells[addr(r, s.startCol + i)]) : ""));
      const gen = detectSmartSeries(vals);
      if (gen) rowGenerators.set(r, gen);
    }
  }

  const nextCells = { ...cells }, nextFormats = { ...formats };
  let changed = 0;
  for (let r = t.startRow; r <= t.endRow; r++) {
    for (let c = t.startCol; c <= t.endCol; c++) {
      if (r >= s.startRow && r <= s.endRow && c >= s.startCol && c <= s.endCol) continue;
      const sr = s.startRow + (((r - s.startRow) % h) + h) % h;
      const sc = s.startCol + (((c - s.startCol) % w) + w) % w;
      const src = addr(sr, sc), dst = addr(r, c);
      let value = Object.hasOwn(cells, src) ? String(cells[src]) : "";

      if (value.startsWith("=")) {
        value = translateFormulaReferences(value, r - sr, c - sc);
      } else if (vertical && colGenerators.has(c)) {
        const offset = r > s.endRow ? r - s.endRow : r - s.startRow;
        value = colGenerators.get(c)(offset);
      } else if (horizontal && rowGenerators.has(r)) {
        const offset = c > s.endCol ? c - s.endCol : c - s.startCol;
        value = rowGenerators.get(r)(offset);
      }

      if (value === "") delete nextCells[dst];
      else nextCells[dst] = value;
      if (formats[src] && typeof formats[src] === "object") nextFormats[dst] = { ...formats[src] };
      else delete nextFormats[dst];
      changed++;
    }
  }
  return { cells: nextCells, formats: nextFormats, changed, range: { start: addr(t.startRow, t.startCol), end: addr(t.endRow, t.endCol) } };
}
