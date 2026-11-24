/**
 * HAI ĐẤT CALC — SGHT Formula Engine (V2 Standard Functions)
 * Safe tokenizer, recursive-descent parser, lazy evaluator & standardized function registry.
 * No eval(), Function(), or third-party calculation engine is used.
 */
import { registerStandardFunctions } from "./functions-standard.js";

export class FormulaError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FormulaError";
    this.code = code;
  }
}

export const FUNCTION_CATEGORIES = Object.freeze({
  math: { id: "math", label: "Toán học" },
  logic: { id: "logic", label: "Logic & Điều kiện" },
  stats: { id: "stats", label: "Thống kê" },
  lookup: { id: "lookup", label: "Tra cứu" },
  text: { id: "text", label: "Văn bản" },
  date: { id: "date", label: "Ngày & Giờ" },
  finance: { id: "finance", label: "Tài chính" },
  info: { id: "info", label: "Kiểm tra" },
});

export const FUNCTION_NAME_PATTERN = /^[A-Z][A-Z0-9_]*(\.[A-Z0-9_]+)*$/;

const fail = (code, message) => { throw new FormulaError(code, message); };
const isRange = v => Boolean(v && typeof v === "object" && v.__range === true);
const isNumeric = v => typeof v === "number" && Number.isFinite(v);
const flatten = values => values.flatMap(v => (isRange(v) ? v.values : [v]));

function colToNum(letters) {
  let n = 0;
  for (const ch of String(letters).toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
  return n;
}

function parseCellAddress(ref) {
  const m = String(ref || "").trim().match(/^\$?([A-Z]{1,3})\$?([1-9][0-9]*)$/i);
  if (!m) return null;
  return { r: Number(m[2]), c: colToNum(m[1]) };
}

function parseRangeShape(ref, count) {
  const parts = String(ref || "").split(":");
  const a = parseCellAddress(parts[0]);
  const b = parseCellAddress(parts[1] || parts[0]);
  if (!a || !b) return { rows: 1, cols: Math.max(1, count || 1) };
  return { rows: Math.abs(b.r - a.r) + 1, cols: Math.abs(b.c - a.c) + 1 };
}

function asMatrix(val, fnName) {
  if (!isRange(val)) return { rows: 1, cols: 1, grid: [[val]] };
  const rows = val.rows || 1;
  const cols = val.cols || Math.max(1, Math.ceil(val.values.length / rows));
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(val.values[r * cols + c] ?? "");
    grid.push(row);
  }
  if (!rows || !cols) fail("#REF!", `${fnName} cần vùng dữ liệu hợp lệ.`);
  return { rows, cols, grid };
}

function toNumber(v, name) {
  if (isNumeric(v)) return v;
  if (v === "" || v === null || v === undefined) return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return 0;
    const pct = trimmed.endsWith("%");
    const parsed = Number(pct ? trimmed.slice(0, -1) : trimmed);
    if (Number.isFinite(parsed)) return pct ? parsed / 100 : parsed;
  }
  fail("#VALUE!", `${name} cần giá trị số.`);
}

function toInt(v, name) {
  return Math.trunc(toNumber(v, name));
}

function toStringVal(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (isRange(v)) return v.values.length ? toStringVal(v.values[0]) : "";
  return String(v);
}

function toBoolean(v, name) {
  if (typeof v === "boolean") return v;
  if (isNumeric(v)) return v !== 0;
  if (v === "" || v === null || v === undefined) return false;
  if (typeof v === "string") {
    const up = v.trim().toUpperCase();
    if (up === "TRUE") return true;
    if (up === "FALSE" || up === "") return false;
  }
  fail("#VALUE!", `${name} cần giá trị logic TRUE/FALSE.`);
}

function wildcardToRegex(pattern) {
  const escaped = String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

function matchCriteria(cellValue, criteria) {
  if (criteria === null || criteria === undefined || criteria === "") {
    return cellValue === "" || cellValue === null || cellValue === undefined;
  }
  if (typeof criteria === "number" || typeof criteria === "boolean") {
    return cellValue === criteria;
  }
  const str = String(criteria);
  const opMatch = str.match(/^(<=|>=|<>|=|<|>)(.*)$/);
  if (opMatch) {
    const op = opMatch[1];
    const rhsRaw = opMatch[2];
    const rhsNum = rhsRaw.trim() !== "" && Number.isFinite(Number(rhsRaw)) ? Number(rhsRaw) : null;
    if (op === "=") {
      if (rhsRaw === "") return cellValue === "" || cellValue === null || cellValue === undefined;
      if (rhsNum !== null && isNumeric(cellValue)) return cellValue === rhsNum;
      return wildcardToRegex(rhsRaw).test(toStringVal(cellValue));
    }
    if (op === "<>") {
      if (rhsRaw === "") return cellValue !== "" && cellValue !== null && cellValue !== undefined;
      if (rhsNum !== null && isNumeric(cellValue)) return cellValue !== rhsNum;
      return !wildcardToRegex(rhsRaw).test(toStringVal(cellValue));
    }
    if (rhsNum !== null) {
      if (!isNumeric(cellValue)) return false;
      if (op === "<") return cellValue < rhsNum;
      if (op === "<=") return cellValue <= rhsNum;
      if (op === ">") return cellValue > rhsNum;
      if (op === ">=") return cellValue >= rhsNum;
    }
    const a = toStringVal(cellValue).toLocaleLowerCase();
    const b = rhsRaw.toLocaleLowerCase();
    if (op === "<") return a < b;
    if (op === "<=") return a <= b;
    if (op === ">") return a > b;
    if (op === ">=") return a >= b;
  }
  if (/[*?]/.test(str)) return wildcardToRegex(str).test(toStringVal(cellValue));
  if (str.trim() !== "" && Number.isFinite(Number(str)) && isNumeric(cellValue)) return cellValue === Number(str);
  return toStringVal(cellValue).toLocaleLowerCase() === str.toLocaleLowerCase();
}

function parseExcelDate(val) {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  if (isNumeric(val)) {
    const ms = Date.UTC(1899, 11, 30) + Math.trunc(val) * 86400000;
    const d = new Date(ms);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const s = String(val ?? "").trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (iso) {
    const y = Number(iso[1]), m = Number(iso[2]), d = Number(iso[3]);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null;
  }
  const vn = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s.*)?$/);
  if (vn) {
    const d = Number(vn[1]), m = Number(vn[2]), y = Number(vn[3]);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null;
  }
  return null;
}

function formatIsoDate(d) {
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatIsoDateTime(d) {
  const pad = n => String(n).padStart(2, "0");
  return `${formatIsoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function daysBetween(start, end) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b - a) / 86400000);
}

// =========================================================================
// TOKENIZER & PARSER
// =========================================================================
function tokenize(source) {
  const out = [];
  let i = 0;
  const addr = String.raw`\$?[A-Z]{1,3}\$?[1-9][0-9]*`;
  const quotedSheetRx = new RegExp(`^'((?:[^']|'')+)'!(${addr}(?::${addr})?)`, "i");
  const plainSheetRx = new RegExp(`^([\\p{L}_][\\p{L}\\p{N}_.]*)!(${addr}(?::${addr})?)`, "iu");
  const rangeRx = new RegExp(`^${addr}:${addr}`, "i");
  const cellRx = new RegExp(`^${addr}`, "i");

  while (i < source.length) {
    const rest = source.slice(i);
    if (/^\s+/.test(rest)) { i += rest.match(/^\s+/)[0].length; continue; }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) { out.push({ type: "number", value: Number(number[0]) }); i += number[0].length; continue; }
    const string = rest.match(/^"(?:""|[^"])*"/);
    if (string) { out.push({ type: "string", value: string[0].slice(1, -1).replace(/""/g, '"') }); i += string[0].length; continue; }
    const quotedSheet = rest.match(quotedSheetRx);
    if (quotedSheet) {
      const ref = quotedSheet[2].toUpperCase().replace(/\$/g, "");
      out.push({ type: ref.includes(":") ? "sheetRange" : "sheetCell", value: { sheet: quotedSheet[1].replace(/''/g, "'"), ref } });
      i += quotedSheet[0].length; continue;
    }
    const plainSheet = rest.match(plainSheetRx);
    if (plainSheet) {
      const ref = plainSheet[2].toUpperCase().replace(/\$/g, "");
      out.push({ type: ref.includes(":") ? "sheetRange" : "sheetCell", value: { sheet: plainSheet[1], ref } });
      i += plainSheet[0].length; continue;
    }
    const range = rest.match(rangeRx);
    if (range) {
      out.push({ type: "range", value: range[0].toUpperCase().replace(/\$/g, "") });
      i += range[0].length; continue;
    }
    const cell = rest.match(cellRx);
    if (cell && rest[cell[0].length] !== "(" && !/[A-Z0-9_.]/i.test(rest[cell[0].length] || "")) {
      out.push({ type: "cell", value: cell[0].toUpperCase().replace(/\$/g, "") });
      i += cell[0].length; continue;
    }
    const ident = rest.match(/^[A-Z_][A-Z0-9_.]*/i);
    if (ident) { out.push({ type: "ident", value: ident[0].toUpperCase() }); i += ident[0].length; continue; }
    const op = rest.match(/^(<=|>=|<>|[+\-*/^%&(),;=<>])/);
    if (op) { out.push({ type: "op", value: op[0] }); i += op[0].length; continue; }
    fail("#PARSE!", `Ký tự không hợp lệ tại vị trí ${i + 1}.`);
  }
  out.push({ type: "eof", value: "" });
  return out;
}

const PRECEDENCE = { "=": 1, "<>": 1, "<": 1, ">": 1, "<=": 1, ">=": 1, "&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "%": 5, "^": 6 };
const STARTS_VALUE = new Set(["number", "string", "cell", "range", "sheetCell", "sheetRange", "ident"]);

class Parser {
  constructor(tokens) { this.t = tokens; this.i = 0; }
  peek(offset = 0) { return this.t[this.i + offset] || { type: "eof", value: "" }; }
  take() { return this.t[this.i++]; }
  expect(v) { const t = this.take(); if (!t || t.value !== v) fail("#PARSE!", `Thiếu ký hiệu '${v}'.`); return t; }
  parse() { const node = this.expression(0); if (this.peek().type !== "eof") fail("#PARSE!", "Còn dữ liệu chưa được phân tích."); return node; }

  atom() {
    const t = this.take();
    let node;
    if (t.type === "number" || t.type === "string") node = { kind: "literal", value: t.value };
    else if (t.type === "cell") node = { kind: "cell", ref: t.value };
    else if (t.type === "range") node = { kind: "range", ref: t.value };
    else if (t.type === "sheetCell") node = { kind: "sheetCell", sheet: t.value.sheet, ref: t.value.ref };
    else if (t.type === "sheetRange") node = { kind: "sheetRange", sheet: t.value.sheet, ref: t.value.ref };
    else if (t.type === "ident") {
      if (this.peek().value === "(") {
        this.take();
        const args = [];
        if (this.peek().value !== ")") {
          do {
            args.push(this.expression(0));
            const sep = this.peek().value;
            if (sep !== "," && sep !== ";") break;
            this.take();
          } while (true);
        }
        this.expect(")");
        node = { kind: "call", name: t.value, args };
      } else if (t.value === "TRUE" || t.value === "FALSE") {
        node = { kind: "literal", value: t.value === "TRUE" };
      } else {
        fail("#NAME?", `Không nhận diện được tên '${t.value}'.`);
      }
    } else if (t.value === "(") {
      node = this.expression(0);
      this.expect(")");
    } else if (t.value === "+" || t.value === "-") {
      node = { kind: "unary", op: t.value, arg: this.expression(6) };
    } else {
      fail("#PARSE!", "Thiếu toán hạng hoặc dấu ngoặc không hợp lệ.");
    }

    // Postfix % percentage operator (e.g. 50%, 8%/12, (A1+B1)%), while preserving binary a % b
    while (this.peek().value === "%") {
      const after = this.peek(1);
      const nextStartsValue = STARTS_VALUE.has(after.type) || after.value === "(" || after.value === "+" || after.value === "-";
      if (nextStartsValue) break;
      this.take();
      node = { kind: "percent", arg: node };
    }
    return node;
  }

  expression(min) {
    let left = this.atom();
    while (true) {
      const op = this.peek().value;
      const p = PRECEDENCE[op];
      if (p === undefined || p < min) break;
      this.take();
      const right = this.expression(p + (op === "^" ? 0 : 1));
      left = { kind: "binary", op, left, right };
    }
    return left;
  }
}

// =========================================================================
// STANDARDIZED FUNCTION REGISTRY
// =========================================================================
const registry = new Map();

export function registerFormulaFunction(name, spec) {
  const key = String(name || "").trim().toUpperCase();
  if (!FUNCTION_NAME_PATTERN.test(key) || registry.has(key)) {
    throw new Error("Tên hàm không đúng quy tắc hoặc đã tồn tại: " + key);
  }
  if (typeof spec?.run !== "function") throw new TypeError("Hàm phải có run().");
  const category = FUNCTION_CATEGORIES[spec.category] ? spec.category : "math";
  registry.set(key, Object.freeze({
    name: key,
    category,
    min: Number.isInteger(spec.min) && spec.min >= 0 ? spec.min : 0,
    max: spec.max === Infinity || (Number.isInteger(spec.max) && spec.max >= 0) ? spec.max : Infinity,
    syntax: String(spec.syntax || `${key}(...)`),
    example: String(spec.example || `=${key}()`),
    description: String(spec.description || ""),
    lazy: Boolean(spec.lazy),
    aliasOf: null,
    run: spec.run,
  }));
}

export function registerFormulaAlias(aliasName, targetName) {
  const key = String(aliasName || "").trim().toUpperCase();
  const target = registry.get(String(targetName || "").trim().toUpperCase());
  if (!FUNCTION_NAME_PATTERN.test(key) || registry.has(key) || !target) {
    throw new Error(`Không thể đăng ký alias ${key} -> ${targetName}`);
  }
  registry.set(key, Object.freeze({
    ...target,
    name: key,
    syntax: target.syntax.replace(target.name, key),
    example: target.example.replace(target.name, key),
    aliasOf: target.name,
  }));
}

const helpers = {
  fail, flatten, isNumeric, toNumber, toInt, toStringVal, toBoolean,
  matchCriteria, asMatrix, parseExcelDate, formatIsoDate, formatIsoDateTime,
  daysBetween, isRange, parseCellAddress,
};

registerStandardFunctions({
  add(name, category, min, max, run, syntax, example, description, lazy = false) {
    registerFormulaFunction(name, { category, min, max, run, syntax, example, description, lazy });
  },
  alias: registerFormulaAlias,
  h: helpers,
});

// =========================================================================
// EVALUATOR
// =========================================================================
function compareValues(a, b, op) {
  if (typeof a === "string" && typeof b === "string") {
    const la = a.toLocaleLowerCase(), lb = b.toLocaleLowerCase();
    if (op === "=") return la === lb;
    if (op === "<>") return la !== lb;
    if (op === "<") return la < lb;
    if (op === "<=") return la <= lb;
    if (op === ">") return la > lb;
    return la >= lb;
  }
  const na = a === "" ? 0 : a, nb = b === "" ? 0 : b;
  if (typeof na === "number" && typeof nb === "number") {
    if (op === "=") return na === nb;
    if (op === "<>") return na !== nb;
    if (op === "<") return na < nb;
    if (op === "<=") return na <= nb;
    if (op === ">") return na > nb;
    return na >= nb;
  }
  if (op === "=") return a === b;
  if (op === "<>") return a !== b;
  const sa = toStringVal(a).toLocaleLowerCase(), sb = toStringVal(b).toLocaleLowerCase();
  if (op === "<") return sa < sb;
  if (op === "<=") return sa <= sb;
  if (op === ">") return sa > sb;
  return sa >= sb;
}

function evaluate(node, context) {
  switch (node.kind) {
    case "literal": return node.value;
    case "cell":
      if (typeof context.getCell !== "function") fail("#REF!", "Chưa có bảng dữ liệu để đọc ô " + node.ref + ".");
      return context.getCell(node.ref);
    case "range": {
      if (typeof context.getRange !== "function") fail("#REF!", "Chưa có bảng dữ liệu để đọc vùng " + node.ref + ".");
      const values = context.getRange(node.ref);
      const shape = parseRangeShape(node.ref, values.length);
      return { __range: true, ref: node.ref, values, rows: shape.rows, cols: shape.cols };
    }
    case "sheetCell":
      if (typeof context.getSheetCell !== "function") fail("#REF!", "Chưa có bộ đọc trang tính để đọc " + node.sheet + "!" + node.ref + ".");
      return context.getSheetCell(node.sheet, node.ref);
    case "sheetRange": {
      if (typeof context.getSheetRange !== "function") fail("#REF!", "Chưa có bộ đọc trang tính để đọc vùng " + node.sheet + "!" + node.ref + ".");
      const values = context.getSheetRange(node.sheet, node.ref);
      const shape = parseRangeShape(node.ref, values.length);
      return { __range: true, ref: node.ref, values, rows: shape.rows, cols: shape.cols };
    }
    case "unary": {
      const n = toNumber(evaluate(node.arg, context), "Toán tử");
      return node.op === "-" ? -n : n;
    }
    case "percent": {
      const n = toNumber(evaluate(node.arg, context), "Phần trăm");
      return n / 100;
    }
    case "binary": {
      const a = evaluate(node.left, context);
      const b = evaluate(node.right, context);
      if (node.op === "&") return toStringVal(a) + toStringVal(b);
      if (["=", "<>", "<", ">", "<=", ">="].includes(node.op)) return compareValues(a, b, node.op);
      const x = toNumber(a, "Phép toán");
      const y = toNumber(b, "Phép toán");
      let result;
      switch (node.op) {
        case "+": result = x + y; break;
        case "-": result = x - y; break;
        case "*": result = x * y; break;
        case "/": if (y === 0) fail("#DIV/0!", "Không thể chia cho 0."); result = x / y; break;
        case "%": if (y === 0) fail("#DIV/0!", "Không thể chia cho 0."); result = x % y; break;
        case "^": result = x ** y; break;
        default: fail("#OP!", "Toán tử chưa được hỗ trợ.");
      }
      if (!Number.isFinite(result)) fail("#NUM!", "Kết quả phép toán vượt miền số hữu hạn.");
      return result;
    }
    case "call": {
      const spec = registry.get(node.name);
      if (!spec) fail("#NAME?", `Hàm ${node.name} chưa được đăng ký.`);
      if (node.args.length < spec.min || node.args.length > spec.max) {
        fail("#ARGS!", `${node.name} nhận ${spec.min === spec.max ? spec.min : `từ ${spec.min} đến ${spec.max === Infinity ? "nhiều" : spec.max}`} tham số.`);
      }
      const args = spec.lazy
        ? node.args.map(arg => () => evaluate(arg, context))
        : node.args.map(arg => evaluate(arg, context));
      const result = spec.run(args, context);
      if (typeof result === "number" && !Number.isFinite(result)) fail("#NUM!", "Kết quả vượt miền số hợp lệ.");
      return result;
    }
  }
  fail("#PARSE!", "Cấu trúc công thức không hợp lệ.");
}

export function evaluateFormula(formula, context = {}) {
  if (typeof formula !== "string" || !formula.trim().startsWith("=")) fail("#PARSE!", "Công thức phải bắt đầu bằng dấu =.");
  try {
    return evaluate(new Parser(tokenize(formula.trim().slice(1))).parse(), context);
  } catch (error) {
    if (error instanceof FormulaError) throw error;
    throw new FormulaError("#CALC!", error?.message || "Lỗi tính toán.");
  }
}

export function getFormulaFunction(name) {
  const spec = registry.get(String(name || "").trim().toUpperCase());
  if (!spec) return null;
  const { name: n, category, min, max, syntax, example, description, aliasOf } = spec;
  return { name: n, category, min, max, syntax, example, description, aliasOf };
}

export function listFormulaFunctions({ includeAliases = false } = {}) {
  return [...registry.values()]
    .filter(spec => includeAliases || !spec.aliasOf)
    .map(({ name, category, min, max, syntax, example, description, aliasOf }) => ({
      name, category, min, max, syntax, example, description, aliasOf,
    }));
}
