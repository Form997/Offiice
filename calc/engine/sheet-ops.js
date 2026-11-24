/**
 * HAI ĐẤT CALC — Pure Sheet Operations Engine
 * - Insert / Delete Rows & Columns (with accurate cell, format, merge, geometry & formula-reference shifting)
 * - Merge / Unmerge Cells (with anchor preservation and selection expansion)
 * - Smart Double-Click Fill Target detection
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

function parseAddr(a) {
  const m = /^([A-Z]{1,3})([1-9][0-9]*)$/i.exec(String(a || ""));
  if (!m) return null;
  return { r: Number(m[2]), c: colToNum(m[1]) };
}

function makeAddr(r, c) {
  return numToCol(c) + r;
}

function hasValue(cells, r, c) {
  const k = makeAddr(r, c);
  return Object.hasOwn(cells, k) && String(cells[k] ?? "") !== "";
}

function shiftSingleIndex(idx, atIndex, delta) {
  if (delta > 0) return idx >= atIndex ? idx + delta : idx;
  const delEnd = atIndex + (-delta) - 1;
  if (idx >= atIndex && idx <= delEnd) return null; // deleted -> #REF!
  if (idx > delEnd) return idx + delta;
  return idx;
}

function shiftRangeIndices(a, b, atIndex, delta) {
  const swapped = a > b;
  const start = swapped ? b : a;
  const end = swapped ? a : b;
  let nextStart, nextEnd;
  if (delta > 0) {
    nextStart = start >= atIndex ? start + delta : start;
    nextEnd = end >= atIndex ? end + delta : end;
  } else {
    const delEnd = atIndex + (-delta) - 1;
    if (start >= atIndex && end <= delEnd) return null; // entire range deleted -> #REF!
    nextStart = start > delEnd ? start + delta : (start >= atIndex ? atIndex : start);
    nextEnd = end > delEnd ? end + delta : (end >= atIndex ? atIndex - 1 : end);
    if (nextStart > nextEnd || nextStart < 1) return null;
  }
  return swapped ? [nextEnd, nextStart] : [nextStart, nextEnd];
}

function parseRefToken(tok) {
  const m = /^(\$?)([A-Z]{1,3})(\$?)([1-9][0-9]*)$/i.exec(tok);
  if (!m) return null;
  return { cLock: m[1], c: colToNum(m[2]), rLock: m[3], r: Number(m[4]) };
}

function formatRefToken(ref) {
  return ref.cLock + numToCol(ref.c) + ref.rLock + ref.r;
}

/**
 * Shift A1 / A1:B5 references inside a formula when rows or columns are inserted (delta > 0) or deleted (delta < 0).
 * Leaves string literals and cross-sheet references ('Other'!A1) untouched.
 */
export function shiftFormulaReferences(formula, axis, atIndex, delta) {
  if (typeof formula !== "string" || !formula.startsWith("=") || !delta) return formula;
  const isRow = axis === "row";
  let out = "";
  let inString = false;
  let inSheetQuote = false;

  for (let i = 0; i < formula.length; ) {
    const ch = formula[i];
    if (inString) {
      out += ch;
      if (ch === '"') {
        if (formula[i + 1] === '"') { out += '"'; i += 2; continue; }
        inString = false;
      }
      i++;
      continue;
    }
    if (inSheetQuote) {
      out += ch;
      if (ch === "'") {
        if (formula[i + 1] === "'") { out += "'"; i += 2; continue; }
        inSheetQuote = false;
      }
      i++;
      continue;
    }
    if (ch === '"') { inString = true; out += ch; i++; continue; }
    if (ch === "'") { inSheetQuote = true; out += ch; i++; continue; }

    const slice = formula.slice(i);
    const m = /^(\$?[A-Z]{1,3}\$?[1-9][0-9]*)(?::(\$?[A-Z]{1,3}\$?[1-9][0-9]*))?/i.exec(slice);
    if (m) {
      const prev = i > 0 ? formula[i - 1] : "";
      const next = formula[i + m[0].length] || "";
      const isCrossSheet = prev === "!";
      const isFunctionCall = /^\s*\(/.test(formula.slice(i + m[0].length));
      if (!isCrossSheet && !isFunctionCall && !/[A-Z0-9_.]/i.test(prev) && !/[A-Z0-9_]/i.test(next)) {
        const ref1 = parseRefToken(m[1]);
        const ref2 = m[2] ? parseRefToken(m[2]) : null;
        if (ref1 && ref2) {
          if (isRow) {
            const shifted = shiftRangeIndices(ref1.r, ref2.r, atIndex, delta);
            if (!shifted) { out += "#REF!"; i += m[0].length; continue; }
            ref1.r = shifted[0];
            ref2.r = shifted[1];
          } else {
            const shifted = shiftRangeIndices(ref1.c, ref2.c, atIndex, delta);
            if (!shifted) { out += "#REF!"; i += m[0].length; continue; }
            ref1.c = shifted[0];
            ref2.c = shifted[1];
          }
          out += formatRefToken(ref1) + ":" + formatRefToken(ref2);
          i += m[0].length;
          continue;
        }
        if (ref1 && !ref2) {
          if (isRow) {
            const nr = shiftSingleIndex(ref1.r, atIndex, delta);
            if (nr === null) { out += "#REF!"; i += m[0].length; continue; }
            ref1.r = nr;
          } else {
            const nc = shiftSingleIndex(ref1.c, atIndex, delta);
            if (nc === null) { out += "#REF!"; i += m[0].length; continue; }
            ref1.c = nc;
          }
          out += formatRefToken(ref1);
          i += m[0].length;
          continue;
        }
      }
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * Normalize & validate an array of merge rectangles: { startRow, endRow, startCol, endCol }
 * Guarantees non-overlapping regions with area >= 2 cells.
 */
export function normalizeMerges(merges = []) {
  if (!Array.isArray(merges)) return [];
  const clean = [];
  for (const m of merges) {
    if (!m || typeof m !== "object") continue;
    const sr = Number(m.startRow), er = Number(m.endRow), sc = Number(m.startCol), ec = Number(m.endCol);
    if (![sr, er, sc, ec].every(Number.isSafeInteger)) continue;
    const startRow = Math.min(sr, er), endRow = Math.max(sr, er);
    const startCol = Math.min(sc, ec), endCol = Math.max(sc, ec);
    if (startRow < 1 || startCol < 1) continue;
    if (startRow === endRow && startCol === endCol) continue;
    const overlaps = clean.some(
      x => !(endRow < x.startRow || startRow > x.endRow || endCol < x.startCol || startCol > x.endCol)
    );
    if (!overlaps) clean.push({ startRow, endRow, startCol, endCol });
  }
  return clean;
}

export function findMergeAt(merges = [], r, c) {
  for (const m of merges) {
    if (r >= m.startRow && r <= m.endRow && c >= m.startCol && c <= m.endCol) return m;
  }
  return null;
}

export function getOverlappingMerges(merges = [], bounds) {
  if (!bounds) return [];
  return merges.filter(
    m => !(m.endRow < bounds.startRow || m.startRow > bounds.endRow || m.endCol < bounds.startCol || m.startCol > bounds.endCol)
  );
}

/**
 * Expand selection bounds so it never partially slices through a merged cell.
 */
export function expandBoundsForMerges(merges = [], bounds) {
  if (!merges.length || !bounds) return bounds;
  let { startRow, endRow, startCol, endCol } = bounds;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    for (const m of merges) {
      const overlaps = !(m.endRow < startRow || m.startRow > endRow || m.endCol < startCol || m.startCol > endCol);
      if (overlaps) {
        if (m.startRow < startRow) { startRow = m.startRow; changed = true; }
        if (m.endRow > endRow) { endRow = m.endRow; changed = true; }
        if (m.startCol < startCol) { startCol = m.startCol; changed = true; }
        if (m.endCol > endCol) { endCol = m.endCol; changed = true; }
      }
    }
  }
  return {
    start: makeAddr(startRow, startCol),
    end: makeAddr(endRow, endCol),
    startRow,
    endRow,
    startCol,
    endCol,
  };
}

/**
 * Merge all cells in `bounds` into one merged region anchored at (startRow, startCol).
 * Keeps top-left value (or first non-empty cell value if top-left is empty), clears covered cells.
 */
export function mergeRange(cells = {}, formats = {}, merges = [], bounds) {
  const expanded = expandBoundsForMerges(merges, bounds);
  const { startRow, endRow, startCol, endCol } = expanded;
  const area = (endRow - startRow + 1) * (endCol - startCol + 1);
  if (area < 2) {
    return { cells, formats, merges: normalizeMerges(merges), changed: false, reason: "single" };
  }
  if (area > 5000) {
    throw new RangeError("Vùng gộp vượt giới hạn an toàn 5.000 ô.");
  }

  const nextCells = Object.assign(Object.create(null), cells);
  const nextFormats = Object.assign(Object.create(null), formats);
  const anchor = makeAddr(startRow, startCol);

  let keptValue = Object.hasOwn(nextCells, anchor) ? String(nextCells[anchor] ?? "") : "";
  let clearedCount = 0;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const a = makeAddr(r, c);
      if (a === anchor) continue;
      if (Object.hasOwn(nextCells, a) && String(nextCells[a] ?? "") !== "") {
        if (keptValue === "") keptValue = String(nextCells[a]);
        else clearedCount++;
      }
      delete nextCells[a];
    }
  }
  if (keptValue === "") delete nextCells[anchor];
  else nextCells[anchor] = keptValue;

  const remaining = normalizeMerges(merges).filter(
    m => m.endRow < startRow || m.startRow > endRow || m.endCol < startCol || m.startCol > endCol
  );
  remaining.push({ startRow, endRow, startCol, endCol });

  return {
    cells: nextCells,
    formats: nextFormats,
    merges: remaining,
    anchor,
    bounds: expanded,
    keptValue,
    clearedCount,
    changed: true,
  };
}

export function unmergeRange(merges = [], bounds) {
  const norm = normalizeMerges(merges);
  const remaining = norm.filter(
    m => m.endRow < bounds.startRow || m.startRow > bounds.endRow || m.endCol < bounds.startCol || m.startCol > bounds.endCol
  );
  const removedCount = norm.length - remaining.length;
  return { merges: remaining, removedCount, changed: removedCount > 0 };
}

/**
 * Insert (delta > 0) or Delete (delta < 0) rows/columns starting at 1-based `atIndex`.
 * Shifts cells, cellFormats, merges, custom geometry sizes, and rewrites formula references.
 */
export function insertOrDeleteAxis(
  { cells = {}, formats = {}, merges = [], geometry = {} },
  axis,
  atIndex,
  delta,
  { maxRows = 100000, maxCols = 16384 } = {}
) {
  if (axis !== "row" && axis !== "col") throw new TypeError("Trục thao tác phải là 'row' hoặc 'col'.");
  if (!Number.isSafeInteger(atIndex) || atIndex < 1) throw new RangeError("Vị trí hàng/cột không hợp lệ.");
  if (!Number.isSafeInteger(delta) || delta === 0) {
    return { cells, formats, merges: normalizeMerges(merges), geometry, changed: false };
  }

  const isRow = axis === "row";
  const maxIdx = isRow ? maxRows : maxCols;
  const nextCells = Object.create(null);
  const nextFormats = Object.create(null);

  for (const [key, rawVal] of Object.entries(cells)) {
    const p = parseAddr(key);
    if (!p) continue;
    const idx = isRow ? p.r : p.c;
    const nextIdx = shiftSingleIndex(idx, atIndex, delta);
    if (nextIdx === null || nextIdx < 1 || nextIdx > maxIdx) continue;
    const nr = isRow ? nextIdx : p.r;
    const nc = isRow ? p.c : nextIdx;
    const val = typeof rawVal === "string" && rawVal.startsWith("=")
      ? shiftFormulaReferences(rawVal, axis, atIndex, delta)
      : rawVal;
    nextCells[makeAddr(nr, nc)] = val;
  }

  for (const [key, fmt] of Object.entries(formats)) {
    const p = parseAddr(key);
    if (!p) continue;
    const idx = isRow ? p.r : p.c;
    const nextIdx = shiftSingleIndex(idx, atIndex, delta);
    if (nextIdx === null || nextIdx < 1 || nextIdx > maxIdx) continue;
    const nr = isRow ? nextIdx : p.r;
    const nc = isRow ? p.c : nextIdx;
    nextFormats[makeAddr(nr, nc)] = fmt && typeof fmt === "object" ? { ...fmt } : fmt;
  }

  // Shift merged regions
  const nextMerges = [];
  for (const m of normalizeMerges(merges)) {
    const pair = isRow
      ? shiftRangeIndices(m.startRow, m.endRow, atIndex, delta)
      : shiftRangeIndices(m.startCol, m.endCol, atIndex, delta);
    if (!pair) continue;
    const sr = isRow ? pair[0] : m.startRow;
    const er = isRow ? Math.min(maxRows, pair[1]) : m.endRow;
    const sc = isRow ? m.startCol : pair[0];
    const ec = isRow ? m.endCol : Math.min(maxCols, pair[1]);
    if (sr <= er && sc <= ec && !(sr === er && sc === ec)) {
      nextMerges.push({ startRow: sr, endRow: er, startCol: sc, endCol: ec });
    }
  }

  // Shift serialized geometry maps (rowHeights / columnWidths)
  const nextGeometry = {
    ...(geometry && typeof geometry === "object" ? geometry : {}),
    rowHeights: { ...(geometry?.rowHeights || {}) },
    columnWidths: { ...(geometry?.columnWidths || {}) },
  };
  const geoKey = isRow ? "rowHeights" : "columnWidths";
  const shiftedMap = {};
  for (const [k, size] of Object.entries(nextGeometry[geoKey])) {
    const idx = Number(k);
    if (!Number.isSafeInteger(idx) || idx < 1) continue;
    const nextIdx = shiftSingleIndex(idx, atIndex, delta);
    if (nextIdx !== null && nextIdx >= 1 && nextIdx <= maxIdx) {
      shiftedMap[nextIdx] = size;
    }
  }
  nextGeometry[geoKey] = shiftedMap;

  return {
    cells: nextCells,
    formats: nextFormats,
    merges: normalizeMerges(nextMerges),
    geometry: nextGeometry,
    changed: true,
  };
}

/**
 * Double-click Fill Handle helper:
 * Looks at the adjacent column (left first, then right) to find the contiguous filled run downward,
 * returning the target bottom row, or null if no adjacent column extends below sourceBounds.endRow.
 */
export function computeDoubleClickFillTarget(cells = {}, sourceBounds, maxRows = 100000) {
  if (!sourceBounds) return null;
  const { startRow, endRow, startCol, endCol } = sourceBounds;
  const candidateCols = [];
  if (startCol > 1) candidateCols.push(startCol - 1);
  candidateCols.push(endCol + 1);

  for (const adjCol of candidateCols) {
    if (!hasValue(cells, endRow, adjCol) && !hasValue(cells, endRow + 1, adjCol)) continue;
    let bottom = endRow;
    while (bottom < maxRows && hasValue(cells, bottom + 1, adjCol)) {
      bottom++;
    }
    if (bottom > endRow) {
      return {
        start: makeAddr(startRow, startCol),
        end: makeAddr(bottom, endCol),
        startRow,
        endRow: bottom,
        startCol,
        endCol,
      };
    }
  }
  return null;
}
