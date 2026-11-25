/**
 * HAI ĐẤT CALC — Pure Keyboard Shortcut Helpers & Shortcut Catalog
 * Standard Excel / Google Sheets keyboard ergonomics (zero DOM dependency, fully unit-testable).
 */

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

function addr(r, c) {
  return numToCol(c) + r;
}

function hasValue(cells, r, c) {
  const k = addr(r, c);
  return Object.hasOwn(cells, k) && String(cells[k] ?? "") !== "";
}

function isNumericCell(cells, r, c) {
  const k = addr(r, c);
  if (!Object.hasOwn(cells, k)) return false;
  const v = String(cells[k] ?? "").trim();
  if (!v) return false;
  if (v.startsWith("=")) return true;
  return Number.isFinite(Number(v));
}

/**
 * Cycle a single cell token through Excel's 4 lock states:
 * A1 -> $A$1 -> A$1 -> $A1 -> A1
 */
export function cycleSingleRef(token) {
  const m = String(token).match(/^(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)$/i);
  if (!m) return token;
  const colLock = m[1] === "$";
  const col = m[2].toUpperCase();
  const rowLock = m[3] === "$";
  const row = m[4];
  if (!colLock && !rowLock) return `$${col}$${row}`;
  if (colLock && rowLock) return `${col}$${row}`;
  if (!colLock && rowLock) return `$${col}${row}`;
  return `${col}${row}`;
}

/**
 * F4 helper: cycle absolute/relative $ reference at cursor inside a formula string.
 * Supports both single cells (A1) and ranges (A1:B5).
 */
export function cycleReferenceAtCursor(formula, cursorPos) {
  const src = String(formula ?? "");
  if (!src.startsWith("=")) return null;
  const pos = Math.max(0, Math.min(src.length, Number(cursorPos) || 0));
  const rx = /\$?[A-Z]{1,3}\$?[1-9][0-9]*(?::\$?[A-Z]{1,3}\$?[1-9][0-9]*)?/gi;
  let match;
  while ((match = rx.exec(src)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const prev = src[start - 1] || "";
    const next = src[end] || "";
    if (next === "(" || /[A-Z0-9_]/i.test(prev) || /[A-Z0-9_]/i.test(next)) continue;
    if (pos >= start && pos <= end) {
      const replacement = match[0].includes(":")
        ? match[0].split(":").map(cycleSingleRef).join(":")
        : cycleSingleRef(match[0]);
      return {
        value: src.slice(0, start) + replacement + src.slice(end),
        selectionStart: start,
        selectionEnd: start + replacement.length,
      };
    }
  }
  return null;
}

/**
 * Ctrl+Arrow helper: jump to edge of contiguous data block (Excel / Google Sheets rule).
 */
export function findDataEdge(cells, startPoint, dr, dc, maxRows, maxCols) {
  const clampR = r => Math.max(1, Math.min(maxRows, r));
  const clampC = c => Math.max(1, Math.min(maxCols, c));
  const r0 = startPoint.r, c0 = startPoint.c;
  const r1 = clampR(r0 + dr), c1 = clampC(c0 + dc);
  if (r1 === r0 && c1 === c0) return { r: r0, c: c0 };

  const curFilled = hasValue(cells, r0, c0);
  const nextFilled = hasValue(cells, r1, c1);

  if (curFilled && nextFilled) {
    // Walk forward until the last filled cell before a blank or grid boundary
    let r = r1, c = c1;
    while (true) {
      const nr = r + dr, nc = c + dc;
      if (nr < 1 || nr > maxRows || nc < 1 || nc > maxCols) return { r, c };
      if (!hasValue(cells, nr, nc)) return { r, c };
      r = nr; c = nc;
    }
  }

  // Otherwise scan existing populated cells along the ray (fast on sparse sheets!)
  let best = null;
  for (const key of Object.keys(cells)) {
    if (String(cells[key] ?? "") === "") continue;
    const m = key.match(/^([A-Z]{1,3})([1-9][0-9]*)$/);
    if (!m) continue;
    const r = Number(m[2]), c = colToNum(m[1]);
    if (dr !== 0 && c === c0) {
      if (dr > 0 && r > r0 && (best === null || r < best.r)) best = { r, c };
      if (dr < 0 && r < r0 && (best === null || r > best.r)) best = { r, c };
    } else if (dc !== 0 && r === r0) {
      if (dc > 0 && c > c0 && (best === null || c < best.c)) best = { r, c };
      if (dc < 0 && c < c0 && (best === null || c > best.c)) best = { r, c };
    }
  }
  if (best) return best;
  // Jump to edge of grid if nothing further in that direction
  return {
    r: dr > 0 ? maxRows : (dr < 0 ? 1 : r0),
    c: dc > 0 ? maxCols : (dc < 0 ? 1 : c0),
  };
}

/**
 * Ctrl+A helper: find bounding box of contiguous filled cells around startPoint.
 * Returns null if startPoint and its 4 neighbors are empty.
 */
export function findContiguousRegion(cells, startPoint, maxRows, maxCols) {
  const r0 = startPoint.r, c0 = startPoint.c;
  const seeds = [[r0, c0], [r0 - 1, c0], [r0 + 1, c0], [r0, c0 - 1], [r0, c0 + 1]]
    .filter(([r, c]) => r >= 1 && r <= maxRows && c >= 1 && c <= maxCols && hasValue(cells, r, c));
  if (!seeds.length) return null;

  let minR = seeds[0][0], maxR = seeds[0][0], minC = seeds[0][1], maxC = seeds[0][1];
  for (const [r, c] of seeds) {
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (c < minC) minC = c; if (c > maxC) maxC = c;
  }

  // Expand bounding box whenever any adjacent border cell is populated (fast rectangular region expansion)
  let expanded = true;
  let guard = 0;
  while (expanded && guard++ < 500) {
    expanded = false;
    if (minR > 1) {
      for (let c = Math.max(1, minC - 1); c <= Math.min(maxCols, maxC + 1); c++) {
        if (hasValue(cells, minR - 1, c)) { minR--; expanded = true; break; }
      }
    }
    if (maxR < maxRows) {
      for (let c = Math.max(1, minC - 1); c <= Math.min(maxCols, maxC + 1); c++) {
        if (hasValue(cells, maxR + 1, c)) { maxR++; expanded = true; break; }
      }
    }
    if (minC > 1) {
      for (let r = Math.max(1, minR - 1); r <= Math.min(maxRows, maxR + 1); r++) {
        if (hasValue(cells, r, minC - 1)) { minC--; expanded = true; break; }
      }
    }
    if (maxC < maxCols) {
      for (let r = Math.max(1, minR - 1); r <= Math.min(maxRows, maxR + 1); r++) {
        if (hasValue(cells, r, maxC + 1)) { maxC++; expanded = true; break; }
      }
    }
  }
  return { start: addr(minR, minC), end: addr(maxR, maxC), startRow: minR, endRow: maxR, startCol: minC, endCol: maxC };
}

/**
 * Alt+= helper: smart AutoSum formula detecting contiguous numbers above, else to the left.
 */
export function computeAutoSumFormula(cells, startPoint) {
  const r0 = startPoint.r, c0 = startPoint.c;
  // 1) Look immediately above
  if (r0 > 1 && isNumericCell(cells, r0 - 1, c0)) {
    let top = r0 - 1;
    while (top > 1 && isNumericCell(cells, top - 1, c0)) top--;
    return `=SUM(${addr(top, c0)}:${addr(r0 - 1, c0)})`;
  }
  // 2) Look immediately left
  if (c0 > 1 && isNumericCell(cells, r0, c0 - 1)) {
    let left = c0 - 1;
    while (left > 1 && isNumericCell(cells, r0, left - 1)) left--;
    return `=SUM(${addr(r0, left)}:${addr(r0, c0 - 1)})`;
  }
  // 3) Fallback empty SUM ready for user range
  return "=SUM()";
}

export const CALC_SHORTCUT_GROUPS = Object.freeze([
  {
    title: "Nhập & sửa công thức",
    items: [
      ["Gõ trực tiếp", "Nhập ngay vào ô đang chọn (gõ = để bật gợi ý hàm)"],
      ["F2 / Nhấp đúp", "Sửa nội dung đang có của ô"],
      ["F4 (khi nhập =)", "Xoay vòng khóa tham chiếu A1 → $A$1 → A$1 → $A1"],
      ["Alt + =", "AutoSum — tự tính tổng dãy số phía trên / bên trái"],
      ["Enter / Shift+Enter", "Xác nhận và xuống dòng / lên dòng"],
      ["Tab / Shift+Tab", "Xác nhận và sang phải / sang trái"],
      ["Esc", "Hủy sửa ô hoặc đóng bảng đang mở"],
      ["Delete / Backspace", "Xóa nhanh nội dung vùng đang chọn"],
      ["Ctrl + ;", "Chèn ngày hôm nay (YYYY-MM-DD)"],
      ["Ctrl + Shift + ;", "Chèn giờ hiện tại (HH:MM:SS)"],
    ],
  },
  {
    title: "Điều hướng & chọn vùng",
    items: [
      ["↑ ↓ ← →", "Di chuyển ô (giữ Shift để mở rộng vùng chọn)"],
      ["Ctrl + ↑ ↓ ← →", "Nhảy nhanh đến biên vùng dữ liệu"],
      ["Ctrl + Shift + Mũi tên", "Chọn nhanh toàn bộ dãy dữ liệu theo hướng"],
      ["Ctrl + A", "Chọn khối dữ liệu hiện tại (bấm lần 2 chọn cả bảng)"],
      ["Ctrl + Space / Shift + Space", "Chọn cả cột / chọn cả hàng đang dùng"],
      ["Ctrl + Home / End", "Về ô A1 / tới ô cuối cùng có dữ liệu"],
      ["PageUp / PageDown", "Cuộn lên / xuống 1 màn hình"],
      ["Ctrl + G", "Đi tới ô theo địa chỉ (vd D25)"],
    ],
  },
  {
    title: "Điền nhanh, định dạng & tệp",
    items: [
      ["Ctrl + D / Ctrl + R", "Điền nhanh xuống dưới (Fill Down) / sang phải (Fill Right)"],
      ["Ctrl + C / X / V", "Sao chép / Cắt / Dán kèm định dạng"],
      ["Ctrl + Shift + V", "Dán chỉ giá trị (giữ nguyên định dạng ô đích)"],
      ["Ctrl + B / Ctrl + I", "Bật / tắt In đậm / In nghiêng"],
      ["Ctrl + Shift + 1 / 4 / 5", "Định dạng nhanh #,##0 / Tiền VNĐ / Phần trăm %"],
      ["Ctrl + \\", "Xóa định dạng vùng đang chọn"],
      ["Chuột phải trên lưới", "Chèn/xóa hàng–cột, gộp ô, kẻ viền, tự căn vừa"],
      ["Nhấp đúp góc xanh (Fill)", "Tự động điền xuống hết cột liền kề"],
      ["Ctrl + Z / Ctrl + Y", "Hoàn tác / Làm lại"],
      ["Ctrl + F / Ctrl + H", "Tìm kiếm / Tìm và thay thế"],
      ["Ctrl + S / Ctrl + P", "Lưu bảng tính / In & Lưu PDF (A4)"],
      ["Shift + F3", "Mở nhanh fx Thư viện 149+ hàm"],
      ["Ctrl + /", "Mở bảng phím tắt này"],
    ],
  },
]);
