import { getRangeBounds } from "./cell-format.js";

const address = (row, col) => {
  let letters = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    col = Math.floor((col - 1) / 26);
  }
  return letters + row;
};

export function captureRange(cells = {}, formats = {}, bounds) {
  const range = getRangeBounds(bounds.start, bounds.end);
  const matrix = [];
  for (let row = range.startRow; row <= range.endRow; row++) {
    const line = [];
    for (let col = range.startCol; col <= range.endCol; col++) {
      const key = address(row, col);
      line.push({
        value: Object.hasOwn(cells, key) ? String(cells[key]) : "",
        format: Object.hasOwn(formats, key) ? { ...formats[key] } : null
      });
    }
    matrix.push(line);
  }
  return { version: 1, rows: matrix.length, columns: matrix[0]?.length || 0, matrix };
}

export function pasteCapturedRange(cells = {}, formats = {}, start, payload) {
  if (!start || !Number.isInteger(start.r) || !Number.isInteger(start.c) ||
      start.r < 1 || start.c < 1 || !payload || payload.version !== 1 ||
      !Array.isArray(payload.matrix) || payload.matrix.length !== payload.rows ||
      !Number.isInteger(payload.columns) || payload.columns < 1 ||
      payload.rows < 1 || payload.rows > 1000 || payload.columns > 100) {
    throw new Error("Dữ liệu bảng tạm SGHT không hợp lệ.");
  }
  if (start.r + payload.rows - 1 > 1000 || start.c + payload.columns - 1 > 100) {
    throw new Error("Vùng dán vượt giới hạn 1.000 hàng × 100 cột.");
  }
  const nextCells = { ...cells };
  const nextFormats = { ...formats };
  for (let r = 0; r < payload.rows; r++) {
    const line = payload.matrix[r];
    if (!Array.isArray(line) || line.length !== payload.columns) {
      throw new Error("Cấu trúc vùng trong bảng tạm không đồng nhất.");
    }
    for (let c = 0; c < payload.columns; c++) {
      const item = line[c];
      if (!item || typeof item.value !== "string") {
        throw new Error("Ô trong bảng tạm không hợp lệ.");
      }
      const key = address(start.r + r, start.c + c);
      if (item.value === "") delete nextCells[key];
      else nextCells[key] = item.value;
      if (item.format && typeof item.format === "object") nextFormats[key] = { ...item.format };
      else delete nextFormats[key];
    }
  }
  return { cells: nextCells, formats: nextFormats };
}
