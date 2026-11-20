/** SGHT dynamic grid capacity policy — Stage 18.3. */
export function expandGridCapacity(current = {}, target = {}, limits = {}) {
  const maxRows = Number.isSafeInteger(limits.maxRows) && limits.maxRows > 0 ? limits.maxRows : 100000;
  const maxColumns = Number.isSafeInteger(limits.maxColumns) && limits.maxColumns > 0 ? limits.maxColumns : 16384;
  const rows = Number.isSafeInteger(current.rows) && current.rows > 0 ? current.rows : 1000;
  const columns = Number.isSafeInteger(current.columns) && current.columns > 0 ? current.columns : 100;
  if (target.row !== undefined && (!Number.isSafeInteger(target.row) || target.row < 1)) throw new RangeError("Chỉ số hàng đích phải là số nguyên dương an toàn.");
  if (target.column !== undefined && (!Number.isSafeInteger(target.column) || target.column < 1)) throw new RangeError("Chỉ số cột đích phải là số nguyên dương an toàn.");
  const row = target.row ?? 1;
  const column = target.column ?? 1;
  if (row > maxRows || column > maxColumns) throw new RangeError("Vị trí yêu cầu vượt giới hạn an toàn của lưới.");
  const grow = (size, needed, ceiling, chunk) => { if (needed <= size) return size; let next = size; while (next < needed && next < ceiling) next = Math.min(ceiling, next + Math.max(chunk, Math.ceil(next * 0.5))); return next; };
  return { rows: grow(rows, row, maxRows, 1000), columns: grow(columns, column, maxColumns, 100) };
}
