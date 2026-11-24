/**
 * SGHT Macro Engine — declarative, sandboxed command language.
 * No JavaScript evaluation, filesystem, network, or ambient browser access.
 * Commands: SET, COPY, CLEAR, SUM. All writes require explicit approval.
 */
export class MacroError extends Error {
  constructor(code, message, line = 0) { super(message); this.name = "MacroError"; this.code = code; this.line = line; }
}
const fail = (code, message, line) => { throw new MacroError(code, message, line); };
const MAX_COMMANDS = 2000;
const MAX_CELLS_PER_COMMAND = 10000;
export function columnNumber(label) {
  let n = 0;
  for (const ch of label.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
  return n;
}
export function parseCellAddress(value) {
  const m = /^([A-Z]+)([1-9][0-9]*)$/i.exec(value);
  if (!m) return null;
  return { row: Number(m[2]), col: columnNumber(m[1]) };
}
function parseRange(value, line) {
  const parts = value.toUpperCase().split(":");
  if (parts.length > 2) fail("#MACRO_REF!", "Vùng ô không hợp lệ: " + value, line);
  const start = parseCellAddress(parts[0]), end = parseCellAddress(parts[1] || parts[0]);
  if (!start || !end) fail("#MACRO_REF!", "Địa chỉ ô không hợp lệ: " + value, line);
  const top = Math.min(start.row, end.row), bottom = Math.max(start.row, end.row);
  const left = Math.min(start.col, end.col), right = Math.max(start.col, end.col);
  const count = (bottom - top + 1) * (right - left + 1);
  if (!Number.isSafeInteger(count) || count > MAX_CELLS_PER_COMMAND) fail("#MACRO_LIMIT!", "Một lệnh không được tác động quá 10.000 ô.", line);
  return { top, bottom, left, right, count };
}
const colLabel = n => { let s=""; while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s; };
const addr = (r,c) => colLabel(c)+r;
function parseValue(raw, line) {
  if (raw.startsWith('"')) {
    try { const value = JSON.parse(raw); if (typeof value !== "string") throw new Error(); return value; }
    catch { fail("#MACRO_VALUE!", "Chuỗi phải dùng cú pháp JSON, ví dụ \"xin chào\".", line); }
  }
  if (/^(TRUE|FALSE)$/i.test(raw)) return raw.toUpperCase() === "TRUE";
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
    const n = Number(raw); if (Number.isFinite(n)) return String(n);
  }
  fail("#MACRO_VALUE!", "Giá trị không hợp lệ. Dùng số, TRUE/FALSE hoặc chuỗi trong dấu ngoặc kép.", line);
}
export function planMacro(source) {
  if (typeof source !== "string" || !source.trim()) fail("#MACRO_EMPTY!", "Macro đang trống.");
  const commands = [];
  source.split(/\r?\n/).forEach((original, index) => {
    const line = index + 1, text = original.trim();
    if (!text || text.startsWith("#")) return;
    let m;
    if ((m = /^SET\s+([A-Z]+[1-9]\d*)\s+(.+)$/i.exec(text))) {
      if (!parseCellAddress(m[1])) fail("#MACRO_REF!", "Địa chỉ ô không hợp lệ.", line);
      commands.push({ type:"SET", cell:m[1].toUpperCase(), value:parseValue(m[2].trim(),line), line });
    } else if ((m = /^COPY\s+([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)\s+([A-Z]+[1-9]\d*)$/i.exec(text))) {
      const from=parseRange(m[1],line), to=parseCellAddress(m[2]);
      if (!to) fail("#MACRO_REF!", "Ô đích không hợp lệ.", line);
      if (from.count > MAX_CELLS_PER_COMMAND) fail("#MACRO_LIMIT!", "Vùng sao chép quá lớn.", line);
      commands.push({type:"COPY",source:m[1].toUpperCase(),target:m[2].toUpperCase(),from,to,line});
    } else if ((m = /^CLEAR\s+([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)$/i.exec(text))) {
      commands.push({type:"CLEAR",range:m[1].toUpperCase(),bounds:parseRange(m[1],line),line});
    } else if ((m = /^SUM\s+([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)\s+([A-Z]+[1-9]\d*)$/i.exec(text))) {
      const target=parseCellAddress(m[2]); if(!target) fail("#MACRO_REF!","Ô nhận tổng không hợp lệ.",line);
      commands.push({type:"SUM",range:m[1].toUpperCase(),bounds:parseRange(m[1],line),target:m[2].toUpperCase(),line});
    } else fail("#MACRO_SYNTAX!", "Không hiểu lệnh ở dòng "+line+". Các lệnh hiện hỗ trợ: SET, COPY, CLEAR, SUM.", line);
  });
  if (!commands.length) fail("#MACRO_EMPTY!", "Không tìm thấy lệnh hợp lệ.");
  if (commands.length > MAX_COMMANDS) fail("#MACRO_LIMIT!", "Macro vượt quá 2.000 lệnh.");
  return Object.freeze(commands.map(Object.freeze));
}
function each(bounds, fn) {
  for(let r=bounds.top;r<=bounds.bottom;r++) for(let c=bounds.left;c<=bounds.right;c++) fn(addr(r,c),r,c);
}
export function executeMacro(sourceOrPlan, adapter, { approved = false } = {}) {
  if (!approved) fail("#MACRO_PERMISSION!", "Cần người dùng phê duyệt trước khi thực thi macro.");
  if (!adapter || typeof adapter.get !== "function" || typeof adapter.set !== "function" || typeof adapter.clear !== "function")
    fail("#MACRO_ADAPTER!", "Bộ kết nối bảng tính không hợp lệ.");
  const commands = Array.isArray(sourceOrPlan) ? sourceOrPlan : planMacro(sourceOrPlan);
  let changed = 0;
  for (const cmd of commands) {
    if (cmd.type === "SET") { adapter.set(cmd.cell, String(cmd.value)); changed++; }
    if (cmd.type === "CLEAR") each(cmd.bounds, a => { adapter.clear(a); changed++; });
    if (cmd.type === "COPY") {
      const values = [];
      each(cmd.from, (a,r,c) => values.push([r,c,adapter.get(a)]));
      for (const [r,c,value] of values) {
        const target=addr(cmd.to.row+(r-cmd.from.top),cmd.to.col+(c-cmd.from.left));
        if (value === "" || value == null) adapter.clear(target); else adapter.set(target,String(value));
        changed++;
      }
    }
    if (cmd.type === "SUM") {
      let total=0;
      each(cmd.bounds, a => { const n=Number(adapter.get(a)); if(adapter.get(a)!=="" && Number.isFinite(n)) total+=n; });
      adapter.set(cmd.target,String(total)); changed++;
    }
  }
  return { commandCount:commands.length, changedCells:changed };
}
